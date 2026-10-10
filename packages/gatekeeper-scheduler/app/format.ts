import type { ManagementSchedule } from "../src/management-types";
import type { ScheduleCadence, Weekday } from "../src/types";
import type { Messages } from "./locale";

const WEEKDAYS: Record<Weekday, string> = {
  SU: "Sun",
  MO: "Mon",
  TU: "Tue",
  WE: "Wed",
  TH: "Thu",
  FR: "Fri",
  SA: "Sat",
};

export type ScheduleTiming = {
  relative: string;
  absolute?: string;
  diagnostic?: string;
};

export function formatCadence(cadence: ScheduleCadence, locale = "en-US", t?: Messages): string {
  if (cadence.kind === "interval") return formatInterval(cadence.everyMs);
  if (cadence.kind === "once") {
    const date = new Intl.DateTimeFormat(locale, {
      timeZone: cadence.timeZone,
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(cadence.fireAt);
    const time = new Intl.DateTimeFormat(locale, {
      timeZone: cadence.timeZone,
      hour: "numeric",
      minute: "2-digit",
    }).format(cadence.fireAt);
    return t ? t.onceOn(date, time) : `Once on ${date} at ${time}`;
  }

  const { rule } = cadence;
  if (rule.freq === "hourly") {
    const prefix = t ? (rule.interval === 1 ? t.hourly : t.everyNHours(rule.interval)) : (rule.interval === 1 ? "Hourly" : `Every ${rule.interval} hours`);
    return `${prefix} at :${rule.minute.toString().padStart(2, "0")}`;
  }
  const time = formatClock(rule.hour, rule.minute, locale);
  if (rule.freq === "daily") {
    return t ? (rule.interval === 1 ? t.dailyAt(time) : t.everyNDaysAt(rule.interval, time)) : (rule.interval === 1 ? `Daily at ${time}` : `Every ${rule.interval} days at ${time}`);
  }
  if (rule.interval === 1 && rule.byDay.join(",") === "MO,TU,WE,TH,FR") {
    return t ? t.weekdaysAt(time) : `Weekdays at ${time}`;
  }
  const days = new Intl.ListFormat(locale, { style: "short", type: "conjunction" }).format(
    rule.byDay.map((day) => WEEKDAYS[day]),
  );
  const prefix = t ? (rule.interval === 1 ? t.weekly : t.everyNWeeks(rule.interval)) : (rule.interval === 1 ? "Weekly" : `Every ${rule.interval} weeks`);
  return `${prefix} on ${days} at ${time}`;
}

/** Describes a finite recurrence bound and, for a counted bound, progress toward it. */
export function formatOccurrences(
  schedule: ManagementSchedule,
  locale = "en-US",
  t?: Messages,
): string | undefined {
  const bound = schedule.occurrences;
  if (!bound) return undefined;
  if ("count" in bound) {
    const noun = bound.count === 1 ? (t ? "회" : "occurrence") : (t ? "회" : "occurrences");
    return t
      ? `${schedule.occurrenceCount ?? 0} / ${bound.count}${t.times}`
      : `${schedule.occurrenceCount ?? 0} of ${bound.count} ${noun}`;
  }
  const when = formatAbsolute(bound.until, scheduleTimeZone(schedule), locale);
  return t ? t.until(when) : `until ${when}`;
}

export function formatTiming(
  schedule: ManagementSchedule,
  now = Date.now(),
  t?: Messages,
  locale = "en-US",
): ScheduleTiming {
  const timestamp = scheduleTimestamp(schedule);
  if (timestamp === undefined) {
    return { relative: t ? t.nextRunPending : "Next run pending" };
  }
  const absolute = formatAbsolute(timestamp, scheduleTimeZone(schedule), locale);
  if (schedule.status === "active") {
    return {
      relative: `Next run ${formatRelative(timestamp - now, locale)}${schedule.retrying ? " (retry)" : ""}`,
      absolute,
    };
  }
  if (schedule.status === "dead") {
    const ago = formatRelative(schedule.failedAt - now, locale);
    return {
      relative: t ? t.failedAgo(ago) : `Failed ${ago}`,
      absolute,
      diagnostic:
        schedule.failureCode === "authorization_failed"
          ? "Authorization failed after retries."
          : "Task callback failed after retries.",
    };
  }
  if (schedule.status === "completed") {
    const ago = formatRelative(schedule.completedAt - now, locale);
    return {
      relative: t ? t.completedAgo(ago) : `Completed ${ago}`,
      absolute,
      diagnostic: schedule.occurrences
        ? (t ? t.lastOccurrence : "This recurring task used its last scheduled occurrence.")
        : "This one-time task completed.",
    };
  }
  return {
    relative: `Expired ${formatRelative(schedule.expiredAt - now, locale)}`,
    absolute,
    diagnostic: schedule.cadence.kind === "once"
      ? "This one-time task passed without delivery."
      : (t ? t.cutoffPassed : "This recurring task's cutoff passed before its first occurrence."),
  };
}

function formatInterval(milliseconds: number): string {
  const units = [
    [7 * 24 * 60 * 60_000, "week"],
    [24 * 60 * 60_000, "day"],
    [60 * 60_000, "hour"],
    [60_000, "minute"],
    [1_000, "second"],
  ] as const;
  const [unitMs, unit] = units.find(([size]) => milliseconds % size === 0) ?? [1, "millisecond"];
  const count = milliseconds / unitMs;
  return `Every ${count === 1 ? unit : `${count} ${unit}s`}`;
}

function formatClock(hour: number, minute: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  }).format(Date.UTC(2020, 0, 1, hour, minute));
}

function formatRelative(milliseconds: number, locale: string): string {
  const absolute = Math.abs(milliseconds);
  const [size, unit] =
    absolute >= 24 * 60 * 60_000
      ? ([24 * 60 * 60_000, "day"] as const)
      : absolute >= 60 * 60_000
        ? ([60 * 60_000, "hour"] as const)
        : absolute >= 60_000
          ? ([60_000, "minute"] as const)
          : ([1_000, "second"] as const);
  const value = Math.round(milliseconds / size);
  return new Intl.RelativeTimeFormat(locale, { numeric: "always" }).format(value, unit);
}

function formatAbsolute(timestamp: number, timeZone: string | undefined, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(timestamp);
}

function scheduleTimestamp(schedule: ManagementSchedule): number | undefined {
  if (schedule.status === "active") return schedule.nextFire;
  if (schedule.status === "dead") return schedule.failedAt;
  if (schedule.status === "completed") return schedule.completedAt;
  return schedule.expiredAt;
}

function scheduleTimeZone(schedule: ManagementSchedule): string | undefined {
  return schedule.cadence.kind === "interval" ? undefined : schedule.cadence.timeZone;
}
