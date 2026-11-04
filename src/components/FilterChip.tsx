/**
 * 필터 칩 (C-11) — 켜면 노랑 + ✓. 풀 수 있는 적용 칩 · 추가 칩도 여기.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react"

import { useT } from "../i18n/index.ts"
import { Icon } from "./Icon.tsx"
import styles from "./FilterChip.module.css"

export interface FilterChipProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  selected: boolean
  onSelectedChange?: (next: boolean) => void
  children: ReactNode
}

export function FilterChip({
  selected,
  onSelectedChange,
  onClick,
  children,
  className,
  ...rest
}: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      {...rest}
      className={[styles.chip, className].filter(Boolean).join(" ")}
      onClick={(e) => {
        onClick?.(e)
        onSelectedChange?.(!selected)
      }}
    >
      {selected && <Icon name="check" size={11} strokeWidth={3.4} />}
      {children}
    </button>
  )
}

/** 적용된 조건 칩 + 풀기(×) 버튼 */
export function RemovableChip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  const t = useT()
  return (
    <span className={styles.removable}>
      {label}
      <button
        type="button"
        className={styles.remove}
        aria-label={t("%1 해제", label)}
        onClick={onRemove}
      >
        <Icon name="close" size={10} strokeWidth={3.4} />
      </button>
    </span>
  )
}

/** 점선 "＋ 타입" 같은 추가 칩 · 버튼 (C-22 포함) */
export function AddChip({
  children,
  shape = "pill",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { shape?: "pill" | "box" }) {
  return (
    <button type="button" {...rest} className={styles.add} data-shape={shape}>
      <Icon
        name="plus"
        size={shape === "pill" ? 11 : 12}
        strokeWidth={shape === "pill" ? 3 : 2.6}
      />
      {children}
    </button>
  )
}
