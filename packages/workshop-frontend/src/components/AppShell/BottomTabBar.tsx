import { Link, useRouterState } from '@tanstack/react-router'
import { House, SquaresFour, Bell, User } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

/**
 * Mobile bottom tab bar — GitHub Mobile 앱형 하단 내비게이션 (yctour-office #34).
 * 모바일(md 미만)에서만 표시되며, 데스크톱은 기존 사이드바를 사용한다.
 * 탭 4개: 홈 · 워크스페이스 · 알림 · 더보기 (2026-11-11 소유자 피드백: 자료 탭 제거,
 * 탭·글씨 크기 확대, 워크숍→워크스페이스 표기).
 */
type Tab = {
  icon: ReactNode
  label: string
  to: '/' | '/workspaces' | '/notifications' | '/profile'
  matchPrefix?: boolean
}

const TABS: Tab[] = [
  { icon: <House size={26} weight="duotone" />, label: '홈', to: '/' },
  { icon: <SquaresFour size={26} weight="duotone" />, label: '워크스페이스', to: '/workspaces', matchPrefix: true },
  { icon: <Bell size={26} weight="duotone" />, label: '알림', to: '/notifications' },
  { icon: <User size={26} weight="duotone" />, label: '더보기', to: '/profile' },
]

export default function BottomTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-kumo-line bg-kumo-base/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid h-16 grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.matchPrefix
            ? pathname === tab.to || pathname.startsWith(tab.to + '/')
            : pathname === tab.to
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-[44px] flex-col items-center justify-center gap-1 transition-colors ${
                active ? 'text-kumo-brand' : 'text-kumo-subtle hover:text-kumo-default'
              }`}
            >
              {tab.icon}
              <span className="text-xs leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
