/**
 * 선 아이콘 모음 (24 격자, stroke = currentColor). 디자인 소스의 path를 그대로 옮겼다.
 * <Icon name="search" size={16} />
 */
import type { CSSProperties, ReactElement } from "react"

const PATHS = {
  home: <path d="M4 11l8-6 8 6v9H15v-6H9v6H4z" />,
  dex: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9h16M9 9v11" />
    </>
  ),
  items: (
    <>
      <path d="M5 8h14l-1.2 12H6.2z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </>
  ),
  squad: (
    <>
      <path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z" />
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
    </>
  ),
  squadPlus: (
    <>
      <path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z" />
      <path d="M12 8.5v7M8.5 12h7" />
    </>
  ),
  editor: (
    <>
      <rect x="4" y="4.5" width="11" height="15" rx="2" />
      <path d="M13.2 14.2l6.6-6.6-2.4-2.4-6.6 6.6-.6 3z" />
    </>
  ),
  townmap: (
    <>
      <path d="M3.5 6.5l5.5-2.2 6 2.2 5.5-2.2v13.4l-5.5 2.2-6-2.2-5.5 2.2z" />
      <path d="M9 4.3v13.7M15 6.5v13.4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.5-4.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  moon: <path d="M19.6 14.2A7.6 7.6 0 1 1 9.8 4.4a6.2 6.2 0 0 0 9.8 9.8z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4.4" />
      <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4.5" width="18" height="12.5" rx="2" />
      <path d="M9 20.5h6M12 17v3.5" />
    </>
  ),
  check: <path d="M5 12l5 5 9-10" />,
  refresh: <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  warning: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4M12 17v.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  pencil: <path d="M4 20h4L19 9l-4-4L4 16z" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  list: <path d="M4 6h16M4 12h16M4 18h16" />,
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" />
    </>
  ),
} satisfies Record<string, ReactElement>

export type IconName = keyof typeof PATHS

export interface IconProps {
  name: IconName
  /** 화면 크기(px) */
  size?: number
  strokeWidth?: number
  className?: string
  style?: CSSProperties
  /** 시스템 테마 표시용 작은 점 (테마 버튼) */
  dot?: boolean
}

export function Icon({
  name,
  size = 16,
  strokeWidth = 2.2,
  className,
  style,
  dot,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ flex: "none", ...style }}
    >
      {PATHS[name]}
      {dot && (
        <circle
          cx="19.5"
          cy="19.5"
          r="3"
          fill="currentColor"
          strokeWidth="1.5"
          style={{ stroke: "var(--color-white)" }}
        />
      )}
    </svg>
  )
}

/** 점 세 개(⋯) — 채움 아이콘 */
export function MoreIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  )
}
