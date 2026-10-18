import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ChartBar,
  Clock,
  FolderOpen,
  Spinner,
} from '@phosphor-icons/react'
import type {
  IssueStatsRow,
  IssueStatsSnapshotDetail,
  IssueStatsSnapshotSummary,
} from '@gadgets/workshop-shared/api'
import { useAuthenticatedApi } from '../AuthContext'
import { useLocale } from '../LocaleContext'
import { useDocumentTitle } from '../useDocumentTitle'
import { WorkshopButton } from '../components/WorkshopControls'

// Issue Stats: org/project open counts loaded from issue-managing-statistics.md into D1 by
// scripts/issue-stats/load-issue-stats.mjs. List = snapshots; detail = one snapshot's project rows.

type IssueStatsSearch = { snapshot?: number }

export const Route = createFileRoute('/issue-stats')({
  validateSearch: (search: Record<string, unknown>): IssueStatsSearch => {
    const raw = search.snapshot
    const n = typeof raw === 'string' ? Number(raw) : typeof raw === 'number' ? raw : NaN
    return Number.isInteger(n) && n > 0 ? { snapshot: n } : {}
  },
  component: IssueStatsPage,
})

function IssueStatsPage() {
  const { t } = useLocale()
  useDocumentTitle(t.issueStats)
  const { authenticatedApi } = useAuthenticatedApi()
  const navigate = useNavigate()
  const { snapshot: snapshotId } = Route.useSearch()

  const [snapshots, setSnapshots] = useState<IssueStatsSnapshotSummary[] | null>(null)
  const [detail, setDetail] = useState<IssueStatsSnapshotDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    let cancelled = false
    authenticatedApi
      .listIssueStatsSnapshots()
      .then((rows: IssueStatsSnapshotSummary[]) => {
        if (!cancelled) setSnapshots(rows)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [authenticatedApi])

  useEffect(() => {
    if (snapshotId == null) {
      setDetail(null)
      return
    }
    let cancelled = false
    setLoadingDetail(true)
    setError(null)
    authenticatedApi
      .getIssueStatsSnapshot(snapshotId)
      .then((row: IssueStatsSnapshotDetail | null) => {
        if (cancelled) return
        setDetail(row)
        if (!row) setError(t.issueStatsNotFound)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false)
      })
    return () => {
      cancelled = true
    }
  }, [authenticatedApi, snapshotId, t.issueStatsNotFound])

  if (snapshotId != null) {
    return (
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-4 overflow-auto p-6">
        <div className="flex items-center gap-2">
          <WorkshopButton
            onClick={() => navigate({ to: '/issue-stats', search: {} })}
          >
            <ArrowLeft size={14} />
            {t.issueStatsBackToList}
          </WorkshopButton>
        </div>
        {loadingDetail && (
          <div className="flex items-center gap-2 text-kumo-inactive">
            <Spinner size={16} className="animate-spin" />
            {t.issueStatsLoading}
          </div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {detail && (
          <IssueStatsDetailTable detail={detail} />
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-4 overflow-auto p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-kumo-default">
          <ChartBar size={20} weight="bold" className="text-kumo-brand" />
          {t.issueStats}
        </h1>
        <p className="mt-1 text-sm text-kumo-inactive">{t.issueStatsDescription}</p>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!snapshots && !error && (
        <div className="flex items-center gap-2 text-kumo-inactive">
          <Spinner size={16} className="animate-spin" />
          {t.issueStatsLoading}
        </div>
      )}
      {snapshots && snapshots.length === 0 && (
        <div className="rounded-lg border border-kumo-line bg-kumo-elevated p-6 text-sm text-kumo-inactive">
          {t.issueStatsEmpty}
        </div>
      )}
      {snapshots && snapshots.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-kumo-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-kumo-tint text-kumo-inactive">
              <tr>
                <th className="px-3 py-2 font-medium">{t.issueStatsOrg}</th>
                <th className="px-3 py-2 font-medium">{t.issueStatsOpenTotal}</th>
                <th className="px-3 py-2 font-medium">{t.issueStatsRows}</th>
                <th className="px-3 py-2 font-medium">{t.issueStatsQueriedAt}</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer border-t border-kumo-line hover:bg-kumo-tint"
                  onClick={() => navigate({ to: '/issue-stats', search: { snapshot: s.id } })}
                >
                  <td className="px-3 py-2 text-kumo-default">{s.org}</td>
                  <td className="px-3 py-2 tabular-nums text-kumo-default">{s.openTotal}</td>
                  <td className="px-3 py-2 tabular-nums text-kumo-inactive">{s.rowCount}</td>
                  <td className="px-3 py-2 text-kumo-inactive">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {s.queriedAt}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function IssueStatsDetailTable({ detail }: { detail: IssueStatsSnapshotDetail }) {
  const { t } = useLocale()
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-kumo-default">{detail.org}</h2>
        <p className="mt-1 text-sm text-kumo-inactive">
          {t.issueStatsOpenTotal}: {detail.openTotal} · {t.issueStatsQueriedAt}: {detail.queriedAt}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-kumo-inactive">
          <FolderOpen size={12} />
          {detail.sourceFile}
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border border-kumo-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-kumo-tint text-kumo-inactive">
            <tr>
              <th className="px-3 py-2 font-medium">{t.issueStatsProject}</th>
              <th className="px-3 py-2 font-medium">{t.issueStatsType}</th>
              <th className="px-3 py-2 font-medium">{t.issueStatsOpenTotal}</th>
              <th className="px-3 py-2 font-medium">{t.issueStatsNotes}</th>
            </tr>
          </thead>
          <tbody>
            {detail.rows.map((row: IssueStatsRow, i: number) => (
              <tr key={`${row.project}-${i}`} className="border-t border-kumo-line">
                <td className="px-3 py-2 text-kumo-default">{row.project}</td>
                <td className="px-3 py-2 text-kumo-inactive">{row.issueType ?? '—'}</td>
                <td className="px-3 py-2 tabular-nums text-kumo-default">{row.openCount}</td>
                <td className="px-3 py-2 text-xs text-kumo-inactive">{row.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
