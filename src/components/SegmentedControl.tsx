/**
 * 세그먼트 (C-16) — role="radiogroup". 고른 칸 = 노랑. ←/→로 옮기며 바로 고른다(라디오 규칙).
 * 아이콘 세그먼트(목록/그리드 보기)는 variant="icon" + option.icon.
 */
import { useRef, type KeyboardEvent, type ReactNode } from "react"

import styles from "./SegmentedControl.module.css"

export interface SegmentOption<T extends string> {
  value: T
  label: ReactNode
  /** 아이콘 세그먼트에서 화면 읽기 이름 */
  ariaLabel?: string
  disabled?: boolean
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  /** 칸 좌우 여백: 12(짧은 항목 · 기본) · 14(세대 규칙) */
  padX?: 12 | 14
  variant?: "text" | "icon"
  className?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  padX = 12,
  variant = "text",
  className,
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const enabled = options
    .map((o, i) => (o.disabled ? -1 : i))
    .filter((i) => i >= 0)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = options.findIndex((o) => o.value === value)
    const pos = enabled.indexOf(current)
    let next = -1
    if (e.key === "ArrowRight" || e.key === "ArrowDown")
      next = enabled[(pos + 1) % enabled.length]
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = enabled[(pos - 1 + enabled.length) % enabled.length]
    else if (e.key === "Home") next = enabled[0]
    else if (e.key === "End") next = enabled[enabled.length - 1]
    if (next === undefined || next < 0) return
    e.preventDefault()
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={[styles.group, className].filter(Boolean).join(" ")}
      data-variant={variant}
      onKeyDown={onKeyDown}
    >
      {options.map((o, i) => {
        const checked = o.value === value
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={o.ariaLabel}
            title={o.ariaLabel}
            disabled={o.disabled}
            tabIndex={checked ? 0 : -1}
            className={styles.item}
            style={variant === "text" ? { paddingInline: padX } : undefined}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
