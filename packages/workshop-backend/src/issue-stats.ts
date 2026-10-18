/**
 * Read-only queries against the ISSUE_STATS D1 database populated by
 * `scripts/issue-stats/load-issue-stats.mjs` (yctour-office). The markdown file
 * `plans/github-issue/issue-managing-statistics.md` remains the source of truth;
 * this module only serves snapshots for the Issue Stats UI.
 */

import type {
  IssueStatsRow,
  IssueStatsSnapshotDetail,
  IssueStatsSnapshotSummary,
} from "@gadgets/workshop-shared/api";

type IssueStatsEnv = { ISSUE_STATS?: D1Database };

type SnapshotRow = {
  id: number;
  org: string;
  open_total: number;
  queried_at: string;
  source_file: string;
  row_count: number;
};

type ProjectRow = {
  org: string;
  project: string;
  issue_type: string | null;
  open_count: number;
  notes: string | null;
};

function requireDb(env: IssueStatsEnv): D1Database {
  if (!env.ISSUE_STATS) {
    throw new Error("ISSUE_STATS D1 binding is not configured");
  }
  return env.ISSUE_STATS;
}

/** Newest-first snapshot summaries, including the per-snapshot project row count. */
export async function listIssueStatsSnapshots(
  env: IssueStatsEnv,
): Promise<IssueStatsSnapshotSummary[]> {
  const db = requireDb(env);
  const result = await db
    .prepare(
      `SELECT s.id, s.org, s.open_total, s.queried_at,
              (SELECT COUNT(*) FROM issue_stats_rows r WHERE r.snapshot_id = s.id) AS row_count
       FROM issue_stats_snapshots s
       ORDER BY s.id DESC`,
    )
    .all<SnapshotRow>();
  return (result.results ?? []).map((row) => ({
    id: row.id,
    org: row.org,
    openTotal: row.open_total,
    queriedAt: row.queried_at,
    rowCount: row.row_count,
  }));
}

/** One snapshot with its project rows, ordered by open count descending. */
export async function getIssueStatsSnapshot(
  env: IssueStatsEnv,
  id: number,
): Promise<IssueStatsSnapshotDetail | null> {
  if (!Number.isInteger(id) || id < 1) return null;
  const db = requireDb(env);
  const snapshot = await db
    .prepare(
      `SELECT s.id, s.org, s.open_total, s.queried_at, s.source_file,
              (SELECT COUNT(*) FROM issue_stats_rows r WHERE r.snapshot_id = s.id) AS row_count
       FROM issue_stats_snapshots s
       WHERE s.id = ?`,
    )
    .bind(id)
    .first<SnapshotRow>();
  if (!snapshot) return null;

  const rows = await db
    .prepare(
      `SELECT org, project, issue_type, open_count, notes
       FROM issue_stats_rows
       WHERE snapshot_id = ?
       ORDER BY open_count DESC, project ASC`,
    )
    .bind(id)
    .all<ProjectRow>();

  return {
    id: snapshot.id,
    org: snapshot.org,
    openTotal: snapshot.open_total,
    queriedAt: snapshot.queried_at,
    rowCount: snapshot.row_count,
    sourceFile: snapshot.source_file,
    rows: (rows.results ?? []).map(
      (row): IssueStatsRow => ({
        org: row.org,
        project: row.project,
        issueType: row.issue_type,
        openCount: row.open_count,
        notes: row.notes,
      }),
    ),
  };
}
