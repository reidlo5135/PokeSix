/**
 * 불러오는 중 줄 (C-45) — 계단식 깜빡임(steps), 움직임 줄이기 설정이면 멈춘다.
 */
import styles from "./SkeletonRows.module.css"

const NAME_WIDTHS = ["62%", "48%", "70%", "40%"]

export function SkeletonRows({ rows = 8 }: { rows?: number }) {
  return (
    <div className={styles.list} aria-busy="true" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.row}>
          <span className={styles.bar} />
          <span className={styles.sprite} />
          <span
            className={styles.bar}
            style={{ width: NAME_WIDTHS[i % NAME_WIDTHS.length] }}
          />
          <span className={[styles.bar, styles.soft].join(" ")} />
        </div>
      ))}
    </div>
  )
}
