/**
 * 선택 창(Qt ListPicker) — 검색 칸 + 목록. ↑↓로 고르고 Enter, 줄을 누르면 바로 고른다.
 * "비우기" 단추(noneText)가 있으면 null을 고른다. 포켓몬 · 기술 · 지닌 물건 선택이 같이 쓴다.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { Button, SearchField } from "../../components/index.ts"
import { useT } from "../../i18n/index.ts"
import { normalizeQuery } from "../../shared/search.ts"
import { Modal } from "./Modal.tsx"
import styles from "./Picker.module.css"

export interface ListPickerProps<R> {
  title: string
  rows: readonly R[]
  rowKey: (row: R) => string | number
  searchText: (row: R) => string
  renderRow: (row: R) => ReactNode
  /** 칸 제목 줄 */
  columns?: ReactNode
  /** 목록 위(도감 칩 등) */
  toolbar?: ReactNode
  /** 개수 머리 글("포켓몬 고르기 · 107마리") */
  heading?: string
  /** 지금 고른 줄 */
  current?: R | null
  /** 경고 줄 등 */
  rowTone?: (row: R) => "warn" | undefined
  rowHeight?: number
  noneText?: string
  onPick: (row: R | null) => void
  onClose: () => void
  width?: number
  height?: number
}

export function ListPicker<R>({
  title,
  rows,
  rowKey,
  searchText,
  renderRow,
  columns,
  toolbar,
  heading,
  current = null,
  rowTone,
  rowHeight = 40,
  noneText,
  onPick,
  onClose,
  width = 600,
  height = 620,
}: ListPickerProps<R>) {
  const t = useT()
  const [query, setQuery] = useState("")
  const listRef = useRef<HTMLDivElement | null>(null)
  const shown = useMemo(() => {
    const q = normalizeQuery(query)
    if (q === "") return rows
    // 낱말마다 모두 들어 있어야 한다("물 특수")
    const words = q.split(/\s+/)
    return rows.filter((r) => {
      const hay = searchText(r).toLowerCase()
      return words.every((w) => hay.includes(w))
    })
  }, [rows, query, searchText])
  const currentIndex = current === null ? -1 : shown.indexOf(current)
  const [active, setActive] = useState(-1)
  const activeIndex =
    active >= 0 && active < shown.length ? active : Math.max(currentIndex, 0)

  // 처음 열 때 지금 고른 줄이 보이게
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-current="true"]')
    if (el instanceof HTMLElement) el.scrollIntoView({ block: "center" })
  }, [])

  const move = (delta: number) => {
    if (shown.length === 0) return
    const next = Math.min(Math.max(activeIndex + delta, 0), shown.length - 1)
    setActive(next)
    const el = listRef.current?.children[next]
    if (el instanceof HTMLElement) el.scrollIntoView({ block: "nearest" })
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      width={width}
      height={height}
      headerExtra={
        heading ? <span className={styles.heading}>{heading}</span> : null
      }
      footer={
        noneText ? (
          <Button size="S" onClick={() => onPick(null)}>
            {noneText}
          </Button>
        ) : undefined
      }
    >
      <div className={styles.top}>
        <SearchField
          ariaLabel={t("검색")}
          placeholder={t("이름으로 찾기")}
          height={34}
          autoFocus
          debounceMs={80}
          onQuery={(q) => {
            setQuery(q)
            setActive(0)
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              move(1)
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              move(-1)
            } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              const row = shown[activeIndex]
              if (row !== undefined) onPick(row)
            }
          }}
        />
        {toolbar}
      </div>
      {columns && <div className={styles.columns}>{columns}</div>}
      <div
        ref={listRef}
        className={styles.list}
        role="listbox"
        aria-label={title}
      >
        {shown.map((row, i) => (
          <div
            key={rowKey(row)}
            role="option"
            aria-selected={i === currentIndex}
            data-current={i === currentIndex ? "true" : undefined}
            data-active={i === activeIndex ? "" : undefined}
            data-tone={rowTone?.(row)}
            className={styles.row}
            style={{ minHeight: rowHeight }}
            onPointerEnter={() => setActive(i)}
            onClick={() => onPick(row)}
          >
            {renderRow(row)}
          </div>
        ))}
        {shown.length === 0 && (
          <p className={styles.empty}>{t("찾는 결과가 없어요")}</p>
        )}
      </div>
    </Modal>
  )
}
