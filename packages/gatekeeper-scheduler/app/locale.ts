import { useMemo, useState, useSyncExternalStore } from "react";

/** Shared with workshop-frontend's LocaleContext so one choice covers both UIs. */
export type Locale = "en" | "vi" | "ko";

const STORAGE_KEY = "tcg-office-locale";

export type Messages = {
  scheduledTasks: string;
  subtitle: string;
  createSchedule: string;
  searchPlaceholder: string;
  searchLabel: string;
  scheduleStatus: string;
  loading: string;
  loadError: string;
  tryAgain: string;
  noMatches: string;
  loadMore: string;
  loadingMore: string;
  getStarted: string;
  unavailableWorkspace: string;
  hideWhy: (title: string) => string;
  showWhy: (title: string) => string;
  needsAttention: string;
  // Filters
  all: string;
  active: string;
  dead: string;
  finished: string;
  // Timing
  nextRunPending: string;
  failedAgo: (ago: string) => string;
  completedAgo: (ago: string) => string;
  lastOccurrence: string;
  cutoffPassed: string;
  // Cadence
  onceOn: (date: string, time: string) => string;
  hourly: string;
  everyNHours: (n: number) => string;
  dailyAt: (time: string) => string;
  everyNDaysAt: (n: number, time: string) => string;
  weekdaysAt: (time: string) => string;
  weekly: string;
  everyNWeeks: (n: number) => string;
  everyN: (n: number, unit: string) => string;
  times: string;
  until: (when: string) => string;
  weekdaysShort: Record<string, string>;
  // Starters
  starterDailyTitle: string;
  starterDailyCadence: string;
  starterDailyDesc: string;
  starterWeeklyTitle: string;
  starterWeeklyCadence: string;
  starterWeeklyDesc: string;
  starterFollowTitle: string;
  starterFollowCadence: string;
  starterFollowDesc: string;
  starterMetricsTitle: string;
  starterMetricsCadence: string;
  starterMetricsDesc: string;
};

const messages: Record<Locale, Messages> = {
  en: {
    scheduledTasks: "Scheduled tasks",
    subtitle: "Wake a workspace and run its code on a schedule you choose.",
    createSchedule: "Create schedule",
    searchPlaceholder: "Search scheduled tasks…",
    searchLabel: "Search scheduled tasks",
    scheduleStatus: "Schedule status",
    loading: "Loading scheduled tasks…",
    loadError: "Couldn’t load scheduled tasks.",
    tryAgain: "Try again",
    noMatches: "No scheduled tasks match these filters.",
    loadMore: "Load more",
    loadingMore: "Loading…",
    getStarted: "Get started",
    unavailableWorkspace: "Unavailable workspace",
    hideWhy: (t) => `Hide why ${t} needs attention`,
    showWhy: (t) => `Show why ${t} needs attention`,
    needsAttention: "Needs attention",
    all: "All",
    active: "Active",
    dead: "Needs attention",
    finished: "Finished",
    nextRunPending: "Next run pending",
    failedAgo: (ago) => `Failed ${ago}`,
    completedAgo: (ago) => `Completed ${ago}`,
    lastOccurrence: "This recurring task used its last scheduled occurrence.",
    cutoffPassed: "This recurring task's cutoff passed before its first occurrence.",
    onceOn: (date, time) => `Once on ${date} at ${time}`,
    hourly: "Hourly",
    everyNHours: (n) => `Every ${n} hours`,
    dailyAt: (time) => `Daily at ${time}`,
    everyNDaysAt: (n, time) => `Every ${n} days at ${time}`,
    weekdaysAt: (time) => `Weekdays at ${time}`,
    weekly: "Weekly",
    everyNWeeks: (n) => `Every ${n} weeks`,
    everyN: (n, unit) => `Every ${n === 1 ? unit : `${unit}s`}`,
    times: "times",
    until: (when) => `until ${when}`,
    weekdaysShort: { SU: "Sun", MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu", FR: "Fri", SA: "Sat" },
    starterDailyTitle: "Daily brief",
    starterDailyCadence: "Weekdays at 8:00 AM",
    starterDailyDesc: "Your calendar for the day plus the unread mail that needs a reply",
    starterWeeklyTitle: "Weekly roundup",
    starterWeeklyCadence: "Fridays at 4:00 PM",
    starterWeeklyDesc: "Turn the week’s Linear issues and GitHub pull requests into a status update",
    starterFollowTitle: "Follow-up monitor",
    starterFollowCadence: "Weekdays at 9:00 AM",
    starterFollowDesc: "Flag the Gmail threads that are waiting on your reply",
    starterMetricsTitle: "Metrics snapshot",
    starterMetricsCadence: "Mondays at 8:00 AM",
    starterMetricsDesc: "Refresh a spreadsheet or query and call out what moved",
  },
  vi: {
    scheduledTasks: "Tác vụ theo lịch",
    subtitle: "Đánh thức không gian làm việc và chạy mã theo lịch bạn chọn.",
    createSchedule: "Tạo lịch",
    searchPlaceholder: "Tìm tác vụ theo lịch…",
    searchLabel: "Tìm tác vụ theo lịch",
    scheduleStatus: "Trạng thái lịch",
    loading: "Đang tải tác vụ theo lịch…",
    loadError: "Không thể tải tác vụ theo lịch.",
    tryAgain: "Thử lại",
    noMatches: "Không có tác vụ nào khớp với bộ lọc này.",
    loadMore: "Tải thêm",
    loadingMore: "Đang tải…",
    getStarted: "Bắt đầu",
    unavailableWorkspace: "Không gian làm việc không khả dụng",
    hideWhy: (t) => `Ẩn lý do ${t} cần chú ý`,
    showWhy: (t) => `Hiện lý do ${t} cần chú ý`,
    needsAttention: "Cần chú ý",
    all: "Tất cả",
    active: "Đang chạy",
    dead: "Cần chú ý",
    finished: "Hoàn tất",
    nextRunPending: "Chờ lần chạy tiếp theo",
    failedAgo: (ago) => `Thất bại ${ago}`,
    completedAgo: (ago) => `Hoàn tất ${ago}`,
    lastOccurrence: "Tác vụ định kỳ này đã dùng lần chạy theo lịch cuối cùng.",
    cutoffPassed: "Thời hạn của tác vụ định kỳ này đã qua trước lần chạy đầu tiên.",
    onceOn: (date, time) => `Một lần vào ${date} lúc ${time}`,
    hourly: "Hàng giờ",
    everyNHours: (n) => `Mỗi ${n} giờ`,
    dailyAt: (time) => `Hàng ngày lúc ${time}`,
    everyNDaysAt: (n, time) => `Mỗi ${n} ngày lúc ${time}`,
    weekdaysAt: (time) => `Ngày trong tuần lúc ${time}`,
    weekly: "Hàng tuần",
    everyNWeeks: (n) => `Mỗi ${n} tuần`,
    everyN: (n, unit) => `Mỗi ${n} ${unit}`,
    times: "lần",
    until: (when) => `cho đến ${when}`,
    weekdaysShort: { SU: "CN", MO: "T2", TU: "T3", WE: "T4", TH: "T5", FR: "T6", SA: "T7" },
    starterDailyTitle: "Bản tin hằng ngày",
    starterDailyCadence: "Ngày trong tuần lúc 8:00 sáng",
    starterDailyDesc: "Lịch của bạn trong ngày cùng email chưa đọc cần trả lời",
    starterWeeklyTitle: "Tổng kết tuần",
    starterWeeklyCadence: "Thứ Sáu lúc 4:00 chiều",
    starterWeeklyDesc: "Chuyển issue Linear và pull request GitHub trong tuần thành bản cập nhật",
    starterFollowTitle: "Theo dõi hồi âm",
    starterFollowCadence: "Ngày trong tuần lúc 9:00 sáng",
    starterFollowDesc: "Đánh dấu các chuỗi Gmail đang chờ bạn trả lời",
    starterMetricsTitle: "Ảnh chụp chỉ số",
    starterMetricsCadence: "Thứ Hai lúc 8:00 sáng",
    starterMetricsDesc: "Làm mới bảng tính hoặc truy vấn và chỉ ra những gì thay đổi",
  },
  ko: {
    scheduledTasks: "예약 작업",
    subtitle: "워크스페이스를 깨워 원하는 일정으로 코드를 실행합니다.",
    createSchedule: "일정 만들기",
    searchPlaceholder: "예약 작업 검색…",
    searchLabel: "예약 작업 검색",
    scheduleStatus: "일정 상태",
    loading: "예약 작업을 불러오는 중…",
    loadError: "예약 작업을 불러오지 못했습니다.",
    tryAgain: "다시 시도",
    noMatches: "이 필터에 해당하는 예약 작업이 없습니다.",
    loadMore: "더 보기",
    loadingMore: "불러오는 중…",
    getStarted: "시작하기",
    unavailableWorkspace: "사용할 수 없는 워크스페이스",
    hideWhy: (t) => `${t}이(가) 주의가 필요한 이유 숨기기`,
    showWhy: (t) => `${t}이(가) 주의가 필요한 이유 보기`,
    needsAttention: "주의 필요",
    all: "전체",
    active: "활성",
    dead: "주의 필요",
    finished: "완료",
    nextRunPending: "다음 실행 대기 중",
    failedAgo: (ago) => `실패 ${ago}`,
    completedAgo: (ago) => `완료 ${ago}`,
    lastOccurrence: "이 반복 작업이 예정된 마지막 실행을 사용했습니다.",
    cutoffPassed: "이 반복 작업의 마감이 첫 실행 전에 지났습니다.",
    onceOn: (date, time) => `${date} ${time}에 한 번`,
    hourly: "매시간",
    everyNHours: (n) => `${n}시간마다`,
    dailyAt: (time) => `매일 ${time}`,
    everyNDaysAt: (n, time) => `${n}일마다 ${time}`,
    weekdaysAt: (time) => `평일 ${time}`,
    weekly: "매주",
    everyNWeeks: (n) => `${n}주마다`,
    everyN: (n, unit) => `${n}${unit}마다`,
    times: "회",
    until: (when) => `${when}까지`,
    weekdaysShort: { SU: "일", MO: "월", TU: "화", WE: "수", TH: "목", FR: "금", SA: "토" },
    starterDailyTitle: "매일 브리핑",
    starterDailyCadence: "평일 오전 8:00",
    starterDailyDesc: "오늘 일정과 회신이 필요한 읽지 않은 메일",
    starterWeeklyTitle: "주간 요약",
    starterWeeklyCadence: "금요일 오후 4:00",
    starterWeeklyDesc: "이번 주 Linear 이슈와 GitHub PR을 상태 업데이트로 정리",
    starterFollowTitle: "회신 모니터",
    starterFollowCadence: "평일 오전 9:00",
    starterFollowDesc: "회신을 기다리는 Gmail 스레드 표시",
    starterMetricsTitle: "지표 스냅샷",
    starterMetricsCadence: "월요일 오전 8:00",
    starterMetricsDesc: "스프레드시트나 쿼리를 새로고침하고 변화 지점 알림",
  },
};

function readLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "vi" || stored === "ko") return stored;
    const browser = navigator.language.toLowerCase();
    return browser.startsWith("vi") ? "vi" : browser.startsWith("ko") ? "ko" : "en";
  } catch {
    return "en";
  }
}

const listeners = new Set<() => void>();
let current: Locale = "en";

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const l of listeners) l();
}

// Keep the scheduler app in step with workshop-frontend, which writes the same key.
if (typeof window !== "undefined") {
  current = readLocale();
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      current = readLocale();
      emit();
    }
  });
}

export function setLocale(next: Locale) {
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  } catch {
    // localStorage unavailable; keep the in-memory value.
  }
  emit();
}

export function useLocale(): { locale: Locale; setLocale: typeof setLocale; t: Messages } {
  const locale = useSyncExternalStore(
    subscribe,
    () => current,
    () => "en" as Locale,
  );
  const t = useMemo(() => messages[locale], [locale]);
  return { locale, setLocale, t };
}
