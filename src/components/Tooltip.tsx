/**
 * 풍선 도움말 (C-51) — 아이콘만 있는 탭 · 버튼에 붙인다. 마우스는 0.5초 뒤, 키보드 초점은 바로.
 * 대상에는 이미 aria-label이 있어야 한다(풍선은 보이는 글자일 뿐 — 화면 읽기에는 숨김).
 */
import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

import styles from "./Tooltip.module.css"

const DELAY_MS = 500

export interface TooltipProps {
  text: string
  children: ReactNode
  /** false면 풍선 없이 children만 */
  enabled?: boolean
}

export function Tooltip({ text, children, enabled = true }: TooltipProps) {
  const wrap = useRef<HTMLSpanElement | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const show = () => {
    const r = wrap.current?.getBoundingClientRect()
    if (r) setPos({ left: r.left + r.width / 2, top: r.bottom + 6 })
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    setPos(null)
  }

  if (!enabled) return <>{children}</>

  return (
    <span
      ref={wrap}
      className={styles.wrap}
      onMouseEnter={() => {
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(show, DELAY_MS)
      }}
      onMouseLeave={hide}
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches(":focus-visible")) show()
      }}
      onBlur={hide}
      onKeyDown={(e) => {
        if (e.key === "Escape") hide()
      }}
      onPointerDown={hide}
    >
      {children}
      {pos &&
        createPortal(
          <span
            className={styles.tip}
            aria-hidden="true"
            style={{ left: pos.left, top: pos.top }}
          >
            {text}
          </span>,
          document.body
        )}
    </span>
  )
}
