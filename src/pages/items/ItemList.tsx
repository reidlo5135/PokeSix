/**
 * 목록 창(빨강 머리) — 제목 · 게임 묶음 칩 · 검색 · 정렬 · 표(가상 스크롤).
 * 줄: ▶ · 아이콘 · 이름 · 효과(기술머신은 [타입] 기술 이름 + 설명) · 세대 1–9 칸.
 * ↑↓ · PageUp/Down · Home/End로 고른다. 지금 세대에 없는 줄은 흐리게 + "n세대 없음".
 */
import { useEffect, useRef, useState, type KeyboardEvent } from "react"

import { Checkbox } from "../../components/Checkbox.tsx"
import { Cursor } from "../../components/Cursor.tsx"
import { DropdownButton } from "../../components/DropdownButton.tsx"
import { EmptyState } from "../../components/EmptyState.tsx"
import { Panel } from "../../components/Panel.tsx"
import { SearchField } from "../../components/SearchField.tsx"
import { Sprite } from "../../components/Sprite.tsx"
import { TypeChip } from "../../components/TypeChip.tsx"
import { existsIn, type ItemRow } from "../../data/repository/types.ts"
import { text, type Language } from "../../data/text/localizedText.ts"
import { ctx, useT } from "../../i18n/index.ts"
import { itemIconKey } from "../../shared/sprites.ts"
import { GameChipBar } from "./GameChipBar.tsx"
import type { GameChip } from "./gameChips.ts"
import {
  nextIndex,
  scrollToReveal,
  SORT_OPTIONS,
  windowRange,
  type ItemSortKey,
} from "./itemView.ts"
import styles from "./Items.module.css"

const ROW_HEIGHT = 34
const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const
// 크기를 아직 못 잰 동안(숨김 · 테스트) 그릴 높이
const FALLBACK_VIEWPORT = 600

export interface ItemListProps {
  rows: readonly ItemRow[]
  generation: number
  language: Language
  selectedId: string | null
  onSelect: (identifier: string) => void
  groupKey: string
  groupLabel: string
  chips: readonly GameChip[]
  versionGroup: string
  onPickGame: (versionGroup: string) => void
  searchRaw: string
  onSearchRaw: (raw: string) => void
  search: string
  onSearch: (query: string) => void
  sort: ItemSortKey
  onSort: (sort: ItemSortKey) => void
  /** 분류 창이 없을 때(세그먼트 모드) 도구줄에 체크를 둔다 */
  compactCheckbox: boolean
  onlyThisGeneration: boolean
  onOnlyThisGenerationChange: (value: boolean) => void
}

export function ItemList(props: ItemListProps) {
  const {
    rows,
    generation,
    language,
    selectedId,
    onSelect,
    groupKey,
    groupLabel,
    search,
  } = props
  const t = useT()
  const scroller = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewport, setViewport] = useState(0)

  // 창 높이 재기 (숨겨졌다 보이면 다시 잰다)
  useEffect(() => {
    const el = scroller.current
    if (!el || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => setViewport(el.clientHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 분류를 바꾸면 맨 위로
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = 0
  }, [groupKey])

  const selectedIndex =
    selectedId === null
      ? -1
      : rows.findIndex((r) => r.identifier === selectedId)
  const height = viewport > 0 ? viewport : FALLBACK_VIEWPORT

  // 고른 줄이 보이게 (가장자리에 맞춤)
  useEffect(() => {
    const el = scroller.current
    if (!el || selectedIndex < 0) return
    const view = el.clientHeight > 0 ? el.clientHeight : FALLBACK_VIEWPORT
    const next = scrollToReveal(selectedIndex, el.scrollTop, view, ROW_HEIGHT)
    if (next !== null) el.scrollTop = next
  }, [selectedIndex])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const next = nextIndex(
      e.key,
      selectedIndex,
      rows.length,
      Math.floor(height / ROW_HEIGHT) - 1
    )
    if (next === null) return
    e.preventDefault()
    onSelect(rows[next].identifier)
  }

  const [start, end] = windowRange(scrollTop, height, ROW_HEIGHT, rows.length)
  const activeId =
    selectedIndex >= 0 ? `item-row-${rows[selectedIndex].id}` : undefined

  return (
    <Panel
      as="main"
      className={styles.listPanel}
      header={{
        level: 1,
        tone: "red",
        title: t("아이템 대백과"),
        detail: (
          <span className={styles.headDetail}>
            {t("%1 · %2개", groupLabel, rows.length.toLocaleString("ko-KR"))}
          </span>
        ),
        right:
          props.chips.length > 0 ? (
            <GameChipBar
              chips={props.chips}
              current={props.versionGroup}
              onPick={props.onPickGame}
            />
          ) : undefined,
      }}
    >
      <div className={styles.toolbar}>
        <SearchField
          ariaLabel={t("아이템 검색")}
          placeholder={t("이름 · 효과 검색")}
          height={34}
          value={props.searchRaw}
          onValueChange={props.onSearchRaw}
          onQuery={props.onSearch}
        />
        <DropdownButton
          ariaLabel={t("정렬")}
          size={34}
          align="end"
          options={SORT_OPTIONS.map((o) => ({
            value: o.value,
            label: t(o.label),
          }))}
          value={props.sort}
          onChange={props.onSort}
        />
        {props.compactCheckbox && (
          <Checkbox
            className={styles.toolbarCheck}
            checked={props.onlyThisGeneration}
            onChange={props.onOnlyThisGenerationChange}
            label={t("%1세대에 있는 것만", generation)}
          />
        )}
      </div>
      <div className={styles.table}>
        <div className={styles.tableHead} aria-hidden="true">
          <span />
          <span />
          <span>{t(ctx("이름", "Items"))}</span>
          <span>{t(ctx("효과", "Items"))}</span>
          <span className={styles.genHead}>
            {GENERATIONS.map((g) => (
              <span
                key={g}
                className={styles.genHeadCell}
                data-current={g === generation ? "" : undefined}
              >
                {g}
              </span>
            ))}
          </span>
        </div>
        <div
          ref={scroller}
          className={styles.scroller}
          role="listbox"
          tabIndex={0}
          aria-label={t("아이템 목록")}
          aria-activedescendant={activeId}
          onKeyDown={onKeyDown}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
          {rows.length === 0 ? (
            <EmptyState
              className={styles.empty}
              title={t("조건에 맞는 아이템이 없어요")}
              reason={
                search !== ""
                  ? t("‘%1’에 맞는 이름 · 효과가 없어요", search)
                  : undefined
              }
            />
          ) : (
            <div
              className={styles.spacer}
              style={{ height: rows.length * ROW_HEIGHT }}
            >
              <div
                className={styles.window}
                style={{ transform: `translateY(${start * ROW_HEIGHT}px)` }}
              >
                {rows.slice(start, end).map((row, i) => (
                  <ItemRowView
                    key={row.id}
                    row={row}
                    index={start + i}
                    generation={generation}
                    language={language}
                    selected={row.identifier === selectedId}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

function ItemRowView({
  row,
  index,
  generation,
  language,
  selected,
  onSelect,
}: {
  row: ItemRow
  index: number
  generation: number
  language: Language
  selected: boolean
  onSelect: (identifier: string) => void
}) {
  const t = useT()
  const name = text(row.name, language)
  const effect = text(row.effect, language)
  const move = text(row.machineMove, language)
  const present = existsIn(row, generation)
  return (
    <div
      id={`item-row-${row.id}`}
      role="option"
      aria-selected={selected}
      className={styles.row}
      data-odd={index % 2 === 1 ? "" : undefined}
      data-selected={selected ? "" : undefined}
      data-absent={present ? undefined : ""}
      onClick={() => onSelect(row.identifier)}
    >
      <span className={styles.cellCursor}>
        <Cursor visible={selected} />
      </span>
      <span className={styles.cellIcon}>
        <Sprite
          kind="item"
          spriteKey={itemIconKey(row.identifier, row.machineType, generation)}
          alt=""
          box="itemList"
          pixelated
          className={styles.listIcon}
        />
      </span>
      <span className={styles.cellName} title={name}>
        {name}
      </span>
      <span className={styles.cellEffect}>
        {move !== "" && (
          <>
            {row.machineType !== "" && (
              <TypeChip type={row.machineType} size="sm" />
            )}
            <span className={styles.moveName}>{move}</span>
          </>
        )}
        <span className={styles.effectText} title={effect}>
          {effect}
        </span>
        {!present && (
          <span className={styles.absentTag}>
            {t("%1세대 없음", generation)}
          </span>
        )}
      </span>
      <GenerationCells row={row} generation={generation} />
    </div>
  )
}

function GenerationCells({
  row,
  generation,
}: {
  row: ItemRow
  generation: number
}) {
  return (
    <span className={styles.genCells} aria-hidden="true">
      {GENERATIONS.map((g) => (
        <span
          key={g}
          className={styles.genCell}
          data-present={existsIn(row, g) ? "" : undefined}
          data-current={g === generation ? "" : undefined}
        />
      ))}
    </span>
  )
}
