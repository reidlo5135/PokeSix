/**
 * 전역 단축키 (Ctrl/⌘ + 1–7 탭 이동, Ctrl/⌘ + K 전체 검색).
 * e.code로 본다 — 자판 배열 · 한글 입력 상태와 상관없이 같다. Ctrl+0은 쓰지 않는다(Chromium 확대 초기화).
 */
import { TABS, type TabId } from "./tabs.ts"

export type ShortcutAction = { type: "tab"; tab: TabId } | { type: "search" }

export interface KeyLike {
  code: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}

export function shortcutAction(
  e: KeyLike,
  mac: boolean
): ShortcutAction | null {
  const accel = mac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey
  if (!accel || e.altKey || e.shiftKey) return null
  const digit = /^(?:Digit|Numpad)([1-7])$/.exec(e.code)
  if (digit) return { type: "tab", tab: TABS[Number(digit[1]) - 1].id }
  if (e.code === "KeyK") return { type: "search" }
  return null
}
