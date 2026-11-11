import { Link, useRouterState } from '@tanstack/react-router'
import { House, SquaresFour, FolderSimple, Bell, User } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

/**
 * Mobile bottom tab bar — GitHub Mobile 앱형 하단 내비게이션 (yctour-office #34).
 * 모바일(md 미만)에서만 표시되며, 데스크톱은 기존 사이드바를 사용한다.
 * 탭 5개: 홈 · 워크숍 · 자료 · 알림 · 더보기 (탐색은 사이드바 드로어로 접근).
 */
type Tab = {
  icon: ReactNode
  label: string
  to: '/' | '/workspaces' | '/context' | '/notifications' | '/profile'
  matchPrefix?: boolean
}

const TABS: Tab[] = [
  { icon: <House size={22} weight="duotone" />, label: '홈', to: '/' },
  { icon: <SquaresFour size={22} weight="duotone" />, label: '워크숍', to: '/workspaces', matchPrefix: true },
  { icon: <FolderSimple size={22} weight="duotone" />, label: '자료', to: '/context' },
  { icon: <Bell size={22} weight="duotone" />, label: '알림', to: '/notifications' },
  { icon: <User size={22} weight="duotone" />, label: '더보기', to: '/profile' },
]

export default function BottomTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-kumo-line bg-kumo-base/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid h-14 grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.matchPrefix
            ? pathname === tab.to || pathname.startsWith(tab.to + '/')
            : pathname === tab.to
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-[44px] flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-kumo-brand' : 'text-kumo-subtle hover:text-kumo-default'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
