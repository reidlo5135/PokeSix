/**
 * 표 기본형 (C-26) — 머리 줄 · 줄무늬 · ▶ 선택 칸 · ↑↓ 선택 · Enter 실행.
 * 칸 넓이는 grid 트랙 문자열("40px", "1fr")로 준다. 줄 높이 = --row-h (설정 > 표 밀도).
 * 줄이 아주 많으면(수천) 쓰는 쪽에서 잘라 넘긴다 — 가상 스크롤은 없다.
 */
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react"

import { Cursor } from "./Cursor.tsx"
import { SkeletonRows } from "./SkeletonRows.tsx"
import styles from "./DataTable.module.css"

export type RowKey = string | number

export interface Column<R> {
  key: string
  header: ReactNode
  /** grid 트랙 ("40px" · "1fr" · "minmax(0,1fr)") */
  width: string
  align?: "start" | "end" | "center"
  render: (row: R, index: number) => ReactNode
  /** 머리를 눌러 정렬할 수 있다 */
  sortable?: boolean
}

export interface DataTableProps<R> {
  columns: readonly Column<R>[]
  rows: readonly R[]
  rowKey: (row: R) => RowKey
  ariaLabel: string
  selectedKey?: RowKey | null
  onSelect?: (row: R) => void
  /** Enter · 두 번 클릭 */
  onActivate?: (row: R) => void
  sort?: { key: string; dir: "asc" | "desc" }
  onSortChange?: (key: string) => void
  /** ▶ 칸(18px)을 맨 앞에 둔다 (기본 true) */
  cursorColumn?: boolean
  zebra?: boolean
  /** 칸 사이 (기본 8) */
  gap?: number
  loading?: boolean
  /** 줄이 없을 때 (보통 <EmptyState/>) */
  empty?: ReactNode
  /** 이 세대에 없는 줄 등 흐리게 */
  isDimmed?: (row: R) => boolean
  className?: string
}

export function DataTable<R>({
  columns,
  rows,
  rowKey,
  ariaLabel,
  selectedKey = null,
  onSelect,
  onActivate,
  sort,
  onSortChange,
  cursorColumn = true,
  zebra = true,
  gap = 8,
  loading = false,
  empty,
  isDimmed,
  className,
}: DataTableProps<R>) {
  const id = useId()
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const template = [
    cursorColumn ? "18px" : null,
    ...columns.map((c) => c.width),
  ]
    .filter(Boolean)
    .join(" ")
  const selectedIndex = rows.findIndex((r) => rowKey(r) === selectedKey)
  const rowDomId = (k: RowKey) => `${id}-row-${String(k)}`

  const move = (delta: number) => {
    if (rows.length === 0) return
    const next =
      selectedIndex < 0
        ? 0
        : Math.max(0, Math.min(rows.length - 1, selectedIndex + delta))
    const row = rows[next]
    onSelect?.(row)
    document
      .getElementById(rowDomId(rowKey(row)))
      ?.scrollIntoView({ block: "nearest" })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") move(1)
    else if (e.key === "ArrowUp") move(-1)
    else if (e.key === "PageDown") move(10)
    else if (e.key === "PageUp") move(-10)
    else if (e.key === "Home") move(-rows.length)
    else if (e.key === "End") move(rows.length)
    else if (e.key === "Enter" && selectedIndex >= 0)
      onActivate?.(rows[selectedIndex])
    else return
    e.preventDefault()
  }

  return (
    <div
      className={[styles.table, className].filter(Boolean).join(" ")}
      role="grid"
      aria-label={ariaLabel}
    >
      <div
        className={styles.head}
        role="row"
        style={{ gridTemplateColumns: template, gap }}
      >
        {cursorColumn && <span role="columnheader" aria-hidden="true" />}
        {columns.map((c) => {
          const active = sort?.key === c.key
          const arrow = active ? (sort?.dir === "desc" ? "▼" : "▲") : ""
          return (
            <span
              key={c.key}
              role="columnheader"
              aria-sort={
                active
                  ? sort?.dir === "desc"
                    ? "descending"
                    : "ascending"
                  : undefined
              }
              className={styles.th}
              data-align={c.align ?? "start"}
              data-active={active ? "" : undefined}
            >
              {c.sortable && onSortChange ? (
                <button
                  type="button"
                  className={styles.sortButton}
                  onClick={() => onSortChange(c.key)}
                >
                  {c.header}
                  {arrow}
                </button>
              ) : (
                <>
                  {c.header}
                  {arrow}
                </>
              )}
            </span>
          )
        })}
      </div>
      <div
        ref={bodyRef}
        className={styles.body}
        role="rowgroup"
        tabIndex={rows.length > 0 ? 0 : -1}
        aria-activedescendant={
          selectedIndex >= 0 ? rowDomId(rowKey(rows[selectedIndex])) : undefined
        }
        onKeyDown={onKeyDown}
      >
        {loading ? (
          <SkeletonRows rows={8} />
        ) : rows.length === 0 ? (
          empty
        ) : (
          rows.map((row, i) => {
            const k = rowKey(row)
            const selected = k === selectedKey
            return (
              <div
                key={k}
                id={rowDomId(k)}
                role="row"
                aria-selected={selected}
                className={styles.row}
                data-zebra={zebra && i % 2 === 1 ? "" : undefined}
                data-dimmed={isDimmed?.(row) ? "" : undefined}
                style={{ gridTemplateColumns: template, gap }}
                onClick={() => onSelect?.(row)}
                onDoubleClick={() => onActivate?.(row)}
              >
                {cursorColumn && (
                  <span role="gridcell" className={styles.cursorCell}>
                    <Cursor visible={selected} />
                  </span>
                )}
                {columns.map((c) => (
                  <span
                    key={c.key}
                    role="gridcell"
                    className={styles.td}
                    data-align={c.align ?? "start"}
                  >
                    {c.render(row, i)}
                  </span>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
