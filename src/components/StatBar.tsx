/**
 * 종족값 막대 (C-23) — 색은 타입이 아니라 수치 구간(≤59 · 60–89 · 90–119 · 120+). 최대 255 기준.
 * StatTotal = 점선 위 "합계" 줄. StatValue = 표 안 숫자(C-24).
 */
import { statFill, statTone } from "./logic.ts"
import styles from "./StatBar.module.css"

export interface StatBarProps {
  label: string
  value: number
  max?: number
}

export function StatBar({ label, value, max = 255 }: StatBarProps) {
  const width = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      <span className={styles.bar} role="img" aria-label={`${label} ${value}`}>
        <span
          className={styles.fill}
          data-fill={statFill(value)}
          style={{ width: `${width.toFixed(1)}%` }}
        />
      </span>
    </div>
  )
}

export function StatTotal({
  label,
  value,
  caption,
}: {
  label: string
  value: number
  caption?: string
}) {
  return (
    <div className={[styles.row, styles.total].join(" ")}>
      <span className={styles.label}>{label}</span>
      <span className={styles.totalValue}>{value}</span>
      {caption && <span className={styles.caption}>{caption}</span>}
    </div>
  )
}

/** 표 칸 숫자: ≥120 파랑 굵게 · 100–119 굵게 · ≤59 빨강. total이면 합계 규칙(≥600 빨강) */
export function StatValue({
  value,
  total = false,
}: {
  value: number
  total?: boolean
}) {
  const tone = total ? (value >= 600 ? "totalHigh" : "total") : statTone(value)
  return (
    <span className={styles.cell} data-tone={tone}>
      {value}
    </span>
  )
}
