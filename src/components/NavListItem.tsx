/**
 * 분류 · 섹션 목록 한 줄 (C-41) — ▶ 칸 · 색 견본 · 이름. 고르면 노랑 옅은 면 + 먹선.
 * href를 주면 <a>, 아니면 <button aria-pressed>.
 */
import type { MouseEvent, ReactNode } from "react"

import { Cursor } from "./Cursor.tsx"
import styles from "./NavListItem.module.css"

export interface NavListItemProps {
  selected: boolean
  children: ReactNode
  /** 견본 색 (CSS 값, 예: "var(--color-red)") */
  swatch?: string
  /** 견본 크기: 16(기본) · 14(설정) */
  swatchSize?: 14 | 16
  href?: string
  onClick?: (e: MouseEvent<HTMLElement>) => void
  /** 오른쪽 끝 숫자 등 */
  trailing?: ReactNode
}

export function NavListItem({
  selected,
  children,
  swatch,
  swatchSize = 16,
  href,
  onClick,
  trailing,
}: NavListItemProps) {
  const inner = (
    <>
      <span className={styles.cursor}>
        <Cursor visible={selected} />
      </span>
      {swatch && (
        <span
          className={styles.swatch}
          aria-hidden="true"
          style={{ background: swatch, width: swatchSize, height: swatchSize }}
          data-small={swatchSize === 14 ? "" : undefined}
        />
      )}
      <span className={styles.label}>{children}</span>
      {trailing && <span className={styles.trailing}>{trailing}</span>}
    </>
  )
  if (href !== undefined)
    return (
      <a
        href={href}
        className={styles.item}
        data-selected={selected ? "" : undefined}
        aria-current={selected ? "true" : undefined}
        onClick={onClick}
      >
        {inner}
      </a>
    )
  return (
    <button
      type="button"
      className={styles.item}
      data-selected={selected ? "" : undefined}
      aria-pressed={selected}
      onClick={onClick}
    >
      {inner}
    </button>
  )
}

/** NavListItem을 담는 세로 목록 */
export function NavList({
  children,
  label,
}: {
  children: ReactNode
  label?: string
}) {
  return (
    <div
      className={styles.list}
      role={label ? "list" : undefined}
      aria-label={label}
    >
      {children}
    </div>
  )
}
