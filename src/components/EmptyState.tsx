/**
 * 빈 상태 (C-44) — 육각 문양 · 제목 · 이유 · 버튼 최대 2개(S 크기).
 */
import type { ReactNode } from "react"

import styles from "./EmptyState.module.css"

export interface EmptyStateProps {
  title: ReactNode
  reason?: ReactNode
  /** <Button size="S" …/> 최대 2개 */
  actions?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  reason,
  actions,
  className,
}: EmptyStateProps) {
  return (
    <div className={[styles.empty, className].filter(Boolean).join(" ")}>
      <svg
        width="60"
        height="60"
        viewBox="0 0 100 100"
        aria-hidden="true"
        focusable="false"
      >
        <polygon
          points="50,4 89.8,27 89.8,73 50,96 10.2,73 10.2,27"
          className={styles.hex}
          strokeWidth="4"
        />
        <path
          d="M50 4v92M89.8 27L10.2 73M89.8 73L10.2 27"
          className={styles.spokes}
          strokeWidth="3"
        />
        <polygon
          points="50,36 62.1,43 62.1,57 50,64 37.9,57 37.9,43"
          className={styles.core}
        />
      </svg>
      <p className={styles.title}>{title}</p>
      {reason && <p className={styles.reason}>{reason}</p>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}
