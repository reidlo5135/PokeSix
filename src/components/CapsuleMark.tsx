/**
 * PokeSix 마크 — 빨간 막대 위 스티커 캡슐 (v2 01b §6, 32 크기 규칙).
 * 색은 마크 전용 고정 토큰(--color-capsule-* · --color-mark-*)이라 테마에 따라 바뀌지 않는다.
 */
import styles from "./CapsuleMark.module.css"

export function CapsuleMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      className={styles.mark}
    >
      <g transform="translate(50 50) scale(1.071) rotate(-35) translate(-50 -50)">
        <rect
          x="10"
          y="25"
          width="80"
          height="50"
          rx="25"
          className={styles.rim}
          strokeWidth="16"
        />
        <path
          d="M50 25 L35 25 A25 25 0 0 0 35 75 L50 75 Z"
          className={styles.red}
        />
        <path
          d="M50 25 L65 25 A25 25 0 0 1 65 75 L50 75 Z"
          className={styles.cream}
        />
        <line
          x1="50"
          y1="25"
          x2="50"
          y2="75"
          className={styles.seam}
          strokeWidth="6"
        />
        <rect
          x="10"
          y="25"
          width="80"
          height="50"
          rx="25"
          className={styles.outline}
          strokeWidth="7"
        />
        <ellipse cx="61" cy="47" rx="4.8" ry="5.4" className={styles.eye} />
        <ellipse cx="77" cy="47" rx="4.8" ry="5.4" className={styles.eye} />
      </g>
    </svg>
  )
}
