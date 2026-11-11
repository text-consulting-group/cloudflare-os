import { createFileRoute, Link } from '@tanstack/react-router'
import { Bell, Pulse } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import type { GadgetMetadataWithTimestamps } from '@gadgets/workshop-shared/api'
import { useAuthenticatedApi } from '../AuthContext'
import { useDocumentTitle } from '../useDocumentTitle'
import { formatRelativeTime } from '../Activity'

/**
 * Notifications hub (yctour-office #34 — GitHub Mobile 앱형 알림 탭).
 * 승인 대기(pending actions)는 워크숍 내부 Overseer에 속해 있어 전역 조회 API가 아직 없다.
 * 따라서 이 화면은 "최근 활동 워크숍" 피드를 카드로 보여주고, 각 카드에서 워크숍 상세
 * (Activity 패널)로 점프해 승인·알림을 처리하도록 한다.
 */
export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
})

function NotificationsPage() {
  useDocumentTitle('Notifications')
  const { authenticatedApi } = useAuthenticatedApi()
  const [gadgets, setGadgets] = useState<GadgetMetadataWithTimestamps[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    authenticatedApi
      .listGadgets()
      .then((list) => {
        if (cancelled) return
        setGadgets(
          [...list].sort(
            (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime(),
          ),
        )
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load workspaces')
      })
    return () => {
      cancelled = true
    }
  }, [authenticatedApi])

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col px-4 sm:px-10">
      <header className="flex items-end justify-between gap-4 px-1 pb-3 pt-8 sm:px-3 sm:pt-10">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-kumo-default">Notifications</h1>
          <p className="mt-1 text-[13px] leading-[18px] tracking-[-0.25px] text-kumo-subtle">
            Recent workspace activity. Open a workspace to review pending approvals in its Activity panel.
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {error && (
          <p className="px-3 py-6 text-sm text-kumo-danger">{error}</p>
        )}
        {!gadgets && !error && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-kumo-brand border-t-transparent" />
          </div>
        )}
        {gadgets && gadgets.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-3 py-16 text-center">
            <Bell size={28} className="text-kumo-subtle" />
            <p className="text-sm text-kumo-subtle">No workspace activity yet.</p>
            <Link to="/" className="text-sm font-medium text-kumo-brand hover:underline">
              Start a conversation
            </Link>
          </div>
        )}
        {gadgets && gadgets.length > 0 && (
          <ul className="flex flex-col gap-2 px-1 sm:px-3">
            {gadgets.map((g) => (
              <li key={g.id}>
                <Link
                  to="/workspace/$id"
                  params={{ id: g.id }}
                  className="press flex min-h-[56px] items-center gap-3 rounded-xl border border-kumo-line bg-kumo-surface px-4 py-3 transition-colors hover:border-kumo-brand/40 hover:bg-kumo-tint"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-kumo-tint text-kumo-default">
                    <Pulse size={18} weight="duotone" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium tracking-[-0.25px] text-kumo-default">
                      {g.title || 'Untitled workspace'}
                    </span>
                    <span className="mt-0.5 block text-xs text-kumo-subtle">
                      Last active {formatRelativeTime(g.lastActive)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
