/**
 * 좁은 화면(< 1360) 칩 줄: [필터 n] 적용 칩(× 풀기) [+ 타입] … 정렬.
 * "필터 n"은 필터 창 본문을 팝오버로 연다(Esc · 바깥 클릭으로 닫힘).
 */
import { useCallback, useEffect, useRef, type ReactNode } from "react"

import {
  AddChip,
  DropdownButton,
  Icon,
  RemovableChip,
} from "../../components/index.ts"
import { useT } from "../../i18n/index.ts"
import {
  SORT_MENU,
  compactSortLabel,
  defaultDir,
  type DexSort,
  type FilterPill,
} from "./model/dexList.ts"
import styles from "./Dex.module.css"

export interface CompactBarProps {
  pills: readonly FilterPill[]
  onRemove: (pill: FilterPill) => void
  sort: DexSort
  onSort: (sort: DexSort) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  /** "+ 타입": 팝오버를 열고 타입 칸으로 */
  onAddType: () => void
  /** 팝오버 안 내용(필터 본문) */
  children: ReactNode
}

const sortValue = (s: DexSort) => `${s.key}:${s.dir}`

export function CompactBar({
  pills,
  onRemove,
  sort,
  onSort,
  open,
  onOpenChange,
  onAddType,
  children,
}: CompactBarProps) {
  const t = useT()
  const anchor = useRef<HTMLDivElement | null>(null)
  const close = useCallback(() => onOpenChange(false), [onOpenChange])
  const options = SORT_MENU.map((key) =>
    key === sort.key ? sort : { key, dir: defaultDir(key) }
  )
  if (!SORT_MENU.includes(sort.key)) options.push(sort)

  // 바깥 클릭 · Esc로 닫기
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element | null
      if (anchor.current?.contains(target)) return
      // 팝오버 안에서 연 메뉴(포털)는 바깥이 아니다
      if (target?.closest?.('[role="menu"]')) return
      close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return
      e.preventDefault()
      close()
    }
    document.addEventListener("pointerdown", onDown, true)
    window.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDown, true)
      window.removeEventListener("keydown", onKey)
    }
  }, [open, close])

  return (
    <div className={styles.chipBar}>
      <div className={styles.popoverAnchor} ref={anchor}>
        <button
          type="button"
          className={styles.filterButton}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => onOpenChange(!open)}
        >
          <Icon name="filter" size={14} strokeWidth={2.6} />
          {t("필터 %1", pills.length)}
        </button>
        {open && (
          <div className={styles.popover} role="dialog" aria-label={t("필터")}>
            {children}
          </div>
        )}
      </div>
      <div className={styles.chipList}>
        {pills.map((p) =>
          p.removable ? (
            <RemovableChip
              key={p.key}
              label={p.compactLabel}
              onRemove={() => onRemove(p)}
            />
          ) : (
            <span key={p.key} className={styles.fixedChip}>
              {p.compactLabel}
            </span>
          )
        )}
        <AddChip onClick={onAddType}>{t("타입")}</AddChip>
      </div>
      <span className={styles.spacer} />
      <DropdownButton
        ariaLabel={t("정렬")}
        size={30}
        align="end"
        options={options.map((s) => ({
          value: sortValue(s),
          label: compactSortLabel(s, t),
        }))}
        value={sortValue(sort)}
        onChange={(v) => {
          const picked = options.find((s) => sortValue(s) === v)
          if (picked) onSort(picked)
        }}
      />
    </div>
  )
}
