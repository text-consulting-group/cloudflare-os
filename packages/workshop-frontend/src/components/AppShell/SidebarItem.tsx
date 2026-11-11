import { Link, useRouterState, type LinkProps } from '@tanstack/react-router'
import type { ReactNode } from 'react'

/**
 * A single nav row in the sidebar. Renders as a TanStack <Link>. Active state is computed from the
 * current router pathname so we can also tint the icon (TanStack's activeProps only swaps top-level
 * className, not child styles). When `collapsed` is true the label is hidden but kept in the DOM for
 * screen readers / hover-tooltips.
 */
export type SidebarItemProps = {
  icon: ReactNode
  label: string
  to: LinkProps['to']
  params?: LinkProps['params']
  trailing?: ReactNode
  collapsed?: boolean
  /** When true, match this item active when the current path starts with `to`. */
  matchPrefix?: boolean
}

export default function SidebarItem({
  icon,
  label,
  to,
  params,
  trailing,
  collapsed = false,
  matchPrefix = false,
}: SidebarItemProps) {
  // Resolve the active path manually so we can style the icon as well as the row. For parameterized
  // routes (e.g. "/gatekeepers/$appId"), substitute the params so the resolved path can match.
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  let target = typeof to === 'string' ? to : ''
  if (params) {
    for (const [key, value] of Object.entries(params as Record<string, string>)) {
      target = target.replaceAll(`$${key}`, String(value))
    }
  }
  const isActive = matchPrefix
    ? pathname === target || pathname.startsWith(target + '/')
    : pathname === target

  // Kept loose: the generated route-tree union is stricter than is convenient for a generic row.
  const linkProps = { to, params } as unknown as LinkProps

  return (
    <Link
      {...linkProps}
      title={collapsed ? label : undefined}
      className={[
        'group relative flex min-h-[44px] items-center gap-2.5 rounded-lg px-2.5 text-[15px] leading-[20px] tracking-[-0.25px] transition-colors md:h-8 md:text-[13px] md:leading-[18px]',
        isActive
          ? 'bg-kumo-fill font-medium text-kumo-strong'
          : 'font-normal text-kumo-default hover:bg-kumo-tint',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-6 w-6 shrink-0 items-center justify-center transition-colors [&>svg]:h-[18px] [&>svg]:w-[18px] md:h-5 md:w-5 md:[&>svg]:h-[14px] md:[&>svg]:w-[14px]',
          isActive ? 'text-kumo-brand' : 'text-kumo-subtle group-hover:text-kumo-default',
        ].join(' ')}
      >
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {trailing && <span className="shrink-0 text-kumo-inactive">{trailing}</span>}
        </>
      )}
    </Link>
  )
}
