/**
 * 떠 있는 메뉴(C-50) — 세대 메뉴 · 테마 메뉴 · 드롭다운이 같이 쓴다.
 * 열리면 고른 줄(없으면 첫 줄)에 초점. ↑↓(돌아감) · Home/End · Enter/Space 고르기 ·
 * Esc 닫고 버튼으로 초점 · Tab 닫기 · 바깥 클릭 닫기. 창 밖으로 넘치면 위로 뒤집는다.
 */
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react"
import { createPortal } from "react-dom"

import { Cursor } from "./Cursor.tsx"
import { Icon } from "./Icon.tsx"
import styles from "./MenuPopup.module.css"

export interface MenuItem {
  key: string
  /** 줄 내용 (▶ · ✓ 칸은 MenuPopup이 그린다) */
  content: ReactNode
  checked?: boolean
  disabled?: boolean
  /** 풍선 도움말 */
  title?: string
}

export type CloseReason = "escape" | "outside" | "tab" | "pick"

export interface MenuPopupProps {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  items: readonly MenuItem[]
  onPick: (key: string) => void
  onClose: (reason: CloseReason) => void
  ariaLabel: string
  /** 버튼과 맞출 쪽: end = 오른쪽 끝 맞춤 */
  align?: "start" | "end"
  /** 메뉴 넓이(px). 없으면 버튼 넓이 */
  width?: number
  /** 버튼 넓이를 쓸 때의 최소 넓이(px) */
  minWidth?: number
  /** gen = 34줄 · 17글자(세대 메뉴), compact = 30줄 · 15글자(테마 메뉴 · 드롭다운) */
  density?: "gen" | "compact"
  /** 첫 칸(▶)과 끝 칸(✓)을 그린다 (기본 true) */
  marks?: boolean
}

const GAP = 6

export function MenuPopup({
  open,
  anchorRef,
  items,
  onPick,
  onClose,
  ariaLabel,
  align = "start",
  width,
  minWidth = 0,
  density = "compact",
  marks = true,
}: MenuPopupProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // 자리 잡기 + 첫 초점 (DOM에 바로 쓴다)
  useLayoutEffect(() => {
    const menu = menuRef.current
    const anchor = anchorRef.current
    if (!open || !menu || !anchor) return
    const r = anchor.getBoundingClientRect()
    const w = width ?? Math.max(minWidth, r.width)
    menu.style.width = `${w}px`
    const left = align === "end" ? r.right - w : r.left
    menu.style.left = `${Math.max(4, Math.min(left, window.innerWidth - w - 4))}px`
    const h = menu.offsetHeight
    const below = r.bottom + GAP
    const top =
      below + h > window.innerHeight && r.top - GAP - h > 0
        ? r.top - GAP - h
        : below
    menu.style.top = `${top}px`
    const start = Math.max(
      0,
      items.findIndex((i) => i.checked && !i.disabled)
    )
    const first = items[start]?.disabled
      ? items.findIndex((i) => !i.disabled)
      : start
    itemRefs.current[first]?.focus()
  }, [open, anchorRef, items, width, minWidth, align])

  // 바깥 클릭으로 닫기
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (
        menuRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      )
        return
      onClose("outside")
    }
    document.addEventListener("pointerdown", onDown, true)
    return () => document.removeEventListener("pointerdown", onDown, true)
  }, [open, onClose, anchorRef])

  if (!open) return null

  const enabled = items
    .map((it, i) => (it.disabled ? -1 : i))
    .filter((i) => i >= 0)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const focused = itemRefs.current.findIndex(
      (el) => el === document.activeElement
    )
    const pos = enabled.indexOf(focused)
    let next: number | undefined
    if (e.key === "ArrowDown") next = enabled[(pos + 1) % enabled.length]
    else if (e.key === "ArrowUp")
      next = enabled[pos <= 0 ? enabled.length - 1 : pos - 1]
    else if (e.key === "Home") next = enabled[0]
    else if (e.key === "End") next = enabled[enabled.length - 1]
    else if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      onClose("escape")
      anchorRef.current?.focus()
      return
    } else if (e.key === "Tab") {
      onClose("tab")
      return
    }
    if (next === undefined) return
    e.preventDefault()
    itemRefs.current[next]?.focus()
  }

  const pick = (item: MenuItem) => {
    if (item.disabled) return
    onPick(item.key)
    onClose("pick")
    anchorRef.current?.focus()
  }

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={ariaLabel}
      className={styles.menu}
      data-density={density}
      onKeyDown={onKeyDown}
    >
      {items.map((item, i) => (
        <button
          key={item.key}
          ref={(el) => {
            itemRefs.current[i] = el
          }}
          type="button"
          role={marks ? "menuitemradio" : "menuitem"}
          aria-checked={marks ? item.checked === true : undefined}
          aria-disabled={item.disabled || undefined}
          tabIndex={-1}
          title={item.title}
          className={styles.row}
          data-marks={marks ? "" : undefined}
          onClick={() => pick(item)}
        >
          {marks && (
            <span className={styles.mark}>
              <Cursor
                size={density === "gen" ? "md" : "sm"}
                visible={item.checked === true}
              />
            </span>
          )}
          <span className={styles.content}>{item.content}</span>
          {marks && (
            <span className={styles.check}>
              {item.checked && (
                <Icon
                  name="check"
                  size={density === "gen" ? 14 : 13}
                  strokeWidth={3.4}
                />
              )}
            </span>
          )}
        </button>
      ))}
    </div>,
    document.body
  )
}
