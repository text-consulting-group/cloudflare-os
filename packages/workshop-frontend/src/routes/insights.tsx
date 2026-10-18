import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Lightbulb,
  Plus,
  Spinner,
} from '@phosphor-icons/react'
import type { InsightCard, InsightStatus } from '@gadgets/workshop-shared/api'
import { useAuthenticatedApi } from '../AuthContext'
import { useLocale } from '../LocaleContext'
import { useDocumentTitle } from '../useDocumentTitle'
import { WorkshopButton } from '../components/WorkshopControls'

// Insight Tracker (Gadget-style): cards with source links and status flow
// 신규 → 검증중 → 채택|보류. Seeded from ideas/insight-cards.

type InsightsSearch = { card?: string; status?: string }

const STATUSES: InsightStatus[] = ['신규', '검증중', '채택', '보류']

export const Route = createFileRoute('/insights')({
  validateSearch: (search: Record<string, unknown>): InsightsSearch => {
    const out: InsightsSearch = {}
    if (typeof search.card === 'string' && search.card) out.card = search.card
    if (typeof search.status === 'string' && STATUSES.includes(search.status as InsightStatus)) {
      out.status = search.status
    }
    return out
  },
  component: InsightsPage,
})

function InsightsPage() {
  const { t } = useLocale()
  useDocumentTitle(t.insights)
  const { authenticatedApi } = useAuthenticatedApi()
  const navigate = useNavigate()
  const { card: cardId, status } = Route.useSearch()

  const [cards, setCards] = useState<InsightCard[] | null>(null)
  const [detail, setDetail] = useState<InsightCard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')

  const reload = () => {
    setCards(null)
    authenticatedApi
      .listInsightCards(status as InsightStatus | undefined)
      .then((rows: InsightCard[]) => setCards(rows))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticatedApi, status])

  useEffect(() => {
    if (!cardId) {
      setDetail(null)
      return
    }
    let cancelled = false
    authenticatedApi
      .getInsightCard(cardId)
      .then((row: InsightCard | null) => {
        if (!cancelled) setDetail(row)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
    return () => {
      cancelled = true
    }
  }, [authenticatedApi, cardId])

  const setStatus = async (id: string, next: InsightStatus) => {
    setBusy(true)
    try {
      const updated = await authenticatedApi.setInsightCardStatus(id, next)
      if (updated) setDetail(updated)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const create = async () => {
    if (!newTitle.trim()) return
    setBusy(true)
    try {
      const created = await authenticatedApi.createInsightCard({
        title: newTitle.trim(),
        body: newBody,
      })
      setShowCreate(false)
      setNewTitle('')
      setNewBody('')
      navigate({ to: '/insights', search: { card: created.cardId } })
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const statusTabs = useMemo(
    () => [
      { key: undefined as string | undefined, label: t.insightsAll },
      ...STATUSES.map((s) => ({ key: s as string | undefined, label: s })),
    ],
    [t.insightsAll],
  )

  if (cardId) {
    return (
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-4 overflow-auto p-6">
        <div className="flex items-center gap-2">
          <WorkshopButton onClick={() => navigate({ to: '/insights', search: status ? { status } : {} })}>
            <ArrowLeft size={14} />
            {t.issueStatsBackToList}
          </WorkshopButton>
        </div>
        {!detail && !error && (
          <div className="flex items-center gap-2 text-kumo-inactive">
            <Spinner size={16} className="animate-spin" />
            {t.issueStatsLoading}
          </div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {detail && (
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-xs text-kumo-inactive">{detail.cardId}</div>
              <h2 className="text-lg font-semibold text-kumo-default">{detail.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.status} />
                <span className="rounded bg-kumo-tint px-2 py-0.5 text-xs text-kumo-inactive">
                  {detail.priority}
                </span>
                {detail.tags.map((tag) => (
                  <span key={tag} className="rounded bg-kumo-tint px-2 py-0.5 text-xs text-kumo-inactive">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg border border-kumo-line bg-kumo-elevated p-4 text-sm text-kumo-default">
              {detail.body || '—'}
            </pre>
            {detail.sources.length > 0 && (
              <div className="text-sm text-kumo-inactive">
                <div className="mb-1 font-medium text-kumo-default">{t.insightsSources}</div>
                <ul className="list-disc space-y-1 pl-5">
                  {detail.sources.map((s, i) => (
                    <li key={i}>
                      {s.ref && /^https?:/.test(s.ref) ? (
                        <a href={s.ref} target="_blank" rel="noreferrer" className="underline">
                          {s.label || s.ref}
                        </a>
                      ) : (
                        <span>{s.label || s.ref || JSON.stringify(s)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <WorkshopButton
                  key={s}
                  tone={detail.status === s ? 'primary' : 'secondary'}
                  disabled={busy || detail.status === s}
                  onClick={() => setStatus(detail.cardId, s)}
                >
                  {s}
                </WorkshopButton>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-4 overflow-auto p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-kumo-default">
            <Lightbulb size={20} weight="bold" className="text-kumo-brand" />
            {t.insights}
          </h1>
          <p className="mt-1 text-sm text-kumo-inactive">{t.insightsDescription}</p>
        </div>
        <WorkshopButton tone="primary" onClick={() => setShowCreate((v) => !v)}>
          <Plus size={14} />
          {t.insightsCreate}
        </WorkshopButton>
      </div>

      {showCreate && (
        <div className="flex flex-col gap-2 rounded-lg border border-kumo-line bg-kumo-elevated p-4">
          <input
            className="rounded-md border border-kumo-line bg-kumo-base px-3 py-2 text-sm"
            placeholder={t.insightsTitle}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea
            className="min-h-[100px] rounded-md border border-kumo-line bg-kumo-base px-3 py-2 text-sm"
            placeholder={t.insightsBody}
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
          />
          <div>
            <WorkshopButton tone="primary" disabled={busy || !newTitle.trim()} onClick={create}>
              {t.insightsCreate}
            </WorkshopButton>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            className={`rounded-full px-3 py-1 text-xs ${
              (status ?? undefined) === tab.key
                ? 'bg-kumo-contrast text-kumo-inverse'
                : 'bg-kumo-tint text-kumo-inactive'
            }`}
            onClick={() => navigate({ to: '/insights', search: tab.key ? { status: tab.key } : {} })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {!cards && !error && (
        <div className="flex items-center gap-2 text-kumo-inactive">
          <Spinner size={16} className="animate-spin" />
          {t.issueStatsLoading}
        </div>
      )}
      {cards && cards.length === 0 && (
        <div className="rounded-lg border border-kumo-line bg-kumo-elevated p-6 text-sm text-kumo-inactive">
          {t.insightsEmpty}
        </div>
      )}
      {cards && cards.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-kumo-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-kumo-tint text-kumo-inactive">
              <tr>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">{t.insightsTitle}</th>
                <th className="px-3 py-2 font-medium">{t.insightsStatus}</th>
                <th className="px-3 py-2 font-medium">{t.insightsPriority}</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr
                  key={c.cardId}
                  className="cursor-pointer border-t border-kumo-line hover:bg-kumo-tint"
                  onClick={() => navigate({ to: '/insights', search: { card: c.cardId } })}
                >
                  <td className="px-3 py-2 text-kumo-inactive">{c.cardId}</td>
                  <td className="px-3 py-2 text-kumo-default">{c.title}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-3 py-2 text-kumo-inactive">{c.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: InsightStatus }) {
  const color =
    status === '채택'
      ? 'bg-green-100 text-green-800'
      : status === '보류'
        ? 'bg-amber-100 text-amber-800'
        : status === '검증중'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-kumo-tint text-kumo-inactive'
  return <span className={`rounded-full px-2 py-0.5 text-xs ${color}`}>{status}</span>
}
