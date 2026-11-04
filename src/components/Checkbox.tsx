/**
 * 체크박스 (C-14) — Qt식 네모(2px 먹선, 켜면 빨강 + 흰 ✓). 진짜 <input type="checkbox">를 쓴다.
 */
import type { ReactNode } from "react"

import { Icon } from "./Icon.tsx"
import styles from "./Checkbox.module.css"

export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  /** 아래 작은 설명 (12/17 text-3) */
  hint?: ReactNode
  disabled?: boolean
  className?: string
}

export function Checkbox({
  checked,
  onChange,
  label,
  hint,
  disabled,
  className,
}: CheckboxProps) {
  return (
    <label
      className={[styles.row, className].filter(Boolean).join(" ")}
      data-checked={checked ? "" : undefined}
    >
      <span className={styles.boxWrap}>
        <input
          type="checkbox"
          className={styles.input}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className={styles.box} aria-hidden="true">
          {checked && <Icon name="check" size={12} strokeWidth={3.2} />}
        </span>
      </span>
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
    </label>
  )
}
