/**
 * 성격 5×5 표(Qt NaturePicker): 줄 = 올리는 능력(▲), 칸 = 내리는 능력(▼), 대각선 = 무보정.
 * 버튼 아래 오른쪽 끝을 맞춰 뜨고, 바깥 클릭 · Esc로 닫힌다. 맨 아래 "성격 없음".
 */
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react"
import { createPortal } from "react-dom"

import type { Nature } from "../../../data/repository/index.ts"
import { text } from "../../../data/text/localizedText.ts"
import { tKey, useT } from "../../../i18n/index.ts"
import { useNameLanguage } from "../../../state/settings.ts"
import styles from "./Detail.module.css"

// stats.id 2 공격 · 3 방어 · 4 특공 · 5 특방 · 6 스피드
const STATS: readonly { id: number; label: string }[] = [
  { id: 2, label: tKey("공격") },
  { id: 3, label: tKey("방어") },
  { id: 4, label: tKey("특공") },
  { id: 5, label: tKey("특방") },
  { id: 6, label: tKey("스피드") },
]
const GAP = 4

export function NaturePicker({
  anchorRef,
  natures,
  natureId,
  onPick,
  onClose,
}: {
  anchorRef: RefObject<HTMLElement | null>
  natures: readonly Nature[]
  natureId: number
  onPick: (natureId: number) => void
  onClose: () => void
}) {
  const t = useT()
  const lang = useNameLanguage()
  const panel = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    const el = panel.current
    const r = anchorRef.current?.getBoundingClientRect()
    if (!el || !r) return
    const w = el.offsetWidth
    el.style.left = `${Math.max(4, Math.min(r.right - w, window.innerWidth - w - 4))}px`
    el.style.top = `${r.bottom + GAP}px`
    el.querySelector<HTMLButtonElement>("[aria-pressed='true']")?.focus()
  }, [anchorRef])

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (
        panel.current?.contains(target) ||
        anchorRef.current?.contains(target)
      )
        return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      e.preventDefault()
      e.stopPropagation()
      onClose()
      anchorRef.current?.focus()
    }
    document.addEventListener("pointerdown", onDown, true)
    window.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("pointerdown", onDown, true)
      window.removeEventListener("keydown", onKey, true)
    }
  }, [anchorRef, onClose])

  const at = (up: number, down: number) =>
    natures.find((n) => n.increasedStat === up && n.decreasedStat === down)

  return createPortal(
    <div
      ref={panel}
      className={styles.naturePanel}
      role="dialog"
      aria-label={t("성격")}
    >
      <div className={styles.natureGrid}>
        <span />
        {STATS.map((s) => (
          <span key={s.id} className={styles.natureDown}>
            ▼{t(s.label)}
          </span>
        ))}
        {STATS.map((row) => (
          <NatureRow
            key={row.id}
            label={t(row.label)}
            cells={STATS.map((col) => at(row.id, col.id))}
            natureId={natureId}
            onPick={onPick}
            lang={lang}
          />
        ))}
      </div>
      <button
        type="button"
        className={styles.natureNone}
        onClick={() => onPick(0)}
      >
        {t("성격 없음")}
      </button>
    </div>,
    document.body
  )
}

function NatureRow({
  label,
  cells,
  natureId,
  onPick,
  lang,
}: {
  label: string
  cells: (Nature | undefined)[]
  natureId: number
  onPick: (id: number) => void
  lang: "ko" | "en" | "ja"
}) {
  return (
    <>
      <span className={styles.natureUp}>▲{label}</span>
      {cells.map((n, i) =>
        n ? (
          <button
            key={n.id}
            type="button"
            className={styles.natureCell}
            data-neutral={n.increasedStat === n.decreasedStat ? "" : undefined}
            aria-pressed={n.id === natureId}
            onClick={() => onPick(n.id)}
          >
            {text(n.name, lang)}
          </button>
        ) : (
          <span key={`empty-${i}`} />
        )
      )}
    </>
  )
}
