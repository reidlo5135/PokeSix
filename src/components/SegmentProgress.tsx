/**
 * 10칸 진행 막대 (C-46) — 칸 수 = floor(percent / 10), 한 칸씩 찬다(부드러운 움직임 없음).
 */
import { segmentFill } from "./logic.ts"
import styles from "./SegmentProgress.module.css"

export function SegmentProgress({
  percent,
  label,
}: {
  percent: number
  label?: string
}) {
  const filled = segmentFill(percent)
  return (
    <div
      className={styles.bar}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-label={label}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={styles.cell}
          data-on={i < filled ? "" : undefined}
        />
      ))}
    </div>
  )
}
