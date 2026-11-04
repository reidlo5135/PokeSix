/**
 * 설정 한 줄 (C-42) — 왼쪽 제목 · 설명, 오른쪽 조작. stacked면 조작이 아래로.
 */
import type { ReactNode } from "react"

import styles from "./Settings.module.css"

export interface SettingsRowProps {
  title: ReactNode
  description?: ReactNode
  /** 설명을 고정폭 글꼴로 (데이터 버전 줄) */
  monoDescription?: boolean
  control?: ReactNode
  stacked?: boolean
  /** 조작과 잇는 id (토글 등에 aria-describedby로) */
  id?: string
}

export function SettingsRow({
  title,
  description,
  monoDescription,
  control,
  stacked,
  id,
}: SettingsRowProps) {
  return (
    <div className={styles.row} data-stacked={stacked ? "" : undefined}>
      <div className={styles.rowText}>
        <span className={styles.rowTitle} id={id ? `${id}-title` : undefined}>
          {title}
        </span>
        {description && (
          <span
            className={styles.rowDesc}
            data-mono={monoDescription ? "" : undefined}
            id={id ? `${id}-desc` : undefined}
          >
            {description}
          </span>
        )}
      </div>
      {control}
    </div>
  )
}
