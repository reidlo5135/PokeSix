/**
 * 작은 드롭다운 (C-19, 정렬 · 짧은 선택) — "합계 높은 순 ▾" 버튼 + 메뉴.
 */
import { useCallback, useRef, useState } from "react"

import { Icon } from "./Icon.tsx"
import { MenuPopup } from "./MenuPopup.tsx"
import styles from "./DropdownButton.module.css"

export interface DropdownOption<T extends string> {
  value: T
  label: string
}

export interface DropdownButtonProps<T extends string> {
  options: readonly DropdownOption<T>[]
  value: T
  onChange: (value: T) => void
  /** 버튼 이름 (예: "정렬") — 화면 읽기에 "정렬: 합계 높은 순" */
  ariaLabel: string
  /** 28(도감 목록 머리) · 30(좁은 화면) · 34(아이템 도구줄) */
  size?: 28 | 30 | 34
  /** 메뉴 넓이 (기본 = 버튼 넓이, 최소 160) */
  menuWidth?: number
  align?: "start" | "end"
  disabled?: boolean
}

export function DropdownButton<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 28,
  menuWidth,
  align = "start",
  disabled,
}: DropdownButtonProps<T>) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement | null>(null)
  const current = options.find((o) => o.value === value)
  const close = useCallback(() => setOpen(false), [])
  return (
    <>
      <button
        ref={anchor}
        type="button"
        className={styles.button}
        data-size={size}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${ariaLabel}: ${current?.label ?? ""}`}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      >
        {current?.label}
        <Icon name="chevronDown" size={11} strokeWidth={3} />
      </button>
      <MenuPopup
        open={open}
        anchorRef={anchor}
        ariaLabel={ariaLabel}
        align={align}
        width={menuWidth}
        minWidth={160}
        items={options.map((o) => ({
          key: o.value,
          content: o.label,
          checked: o.value === value,
        }))}
        onPick={(key) => {
          const picked = options.find((o) => o.value === key)
          if (picked) onChange(picked.value)
        }}
        onClose={close}
      />
    </>
  )
}
