/**
 * 도감 목록 창(빨강 머리): 제목 · n마리 · 적용 알약 · 정렬 · 목록/그리드 + 표(또는 카드).
 * 몸통은 초점 하나(role=listbox): ↑↓ · Home/End · PgUp/PgDn 고르기, Enter = 스쿼드에 추가.
 */
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react"

import {
  DropdownButton,
  Icon,
  Pill,
  PokemonIcon,
  SegmentedControl,
  StatValue,
  TypeChip,
} from "../../components/index.ts"
import type { SpeciesRow } from "../../data/repository/types.ts"
import { text } from "../../data/text/localizedText.ts"
import { useT } from "../../i18n/index.ts"
import { useNameLanguage } from "../../state/settings.ts"
import {
  SORT_MENU,
  STAT_KEYS,
  STAT_LABEL,
  defaultDir,
  padNumber,
  sortLabel,
  type DexSort,
  type FilterPill,
  type SortKey,
} from "./model/dexList.ts"
import styles from "./Dex.module.css"

export type ListViewMode = "list" | "grid"

export interface SpeciesListProps {
  rows: readonly SpeciesRow[]
  compact: boolean
  showSprite: boolean
  pills: readonly FilterPill[]
  sort: DexSort
  onSort: (sort: DexSort) => void
  onHeaderSort: (key: SortKey) => void
  view: ListViewMode
  onView: (view: ListViewMode) => void
  selectedId: number | null
  onSelect: (row: SpeciesRow) => void
  /** Enter */
  onActivate: (row: SpeciesRow) => void
  /** Space · 클릭(좁은 화면 드로어 다시 열기) */
  onOpen: (row: SpeciesRow) => void
  generation: number
  empty: ReactNode
}

const sortValue = (s: DexSort) => `${s.key}:${s.dir}`
const GRID_COLUMNS = 4

export function SpeciesList({
  rows,
  compact,
  showSprite,
  pills,
  sort,
  onSort,
  onHeaderSort,
  view,
  onView,
  selectedId,
  onSelect,
  onActivate,
  onOpen,
  generation,
  empty,
}: SpeciesListProps) {
  const t = useT()
  const lang = useNameLanguage()
  const body = useRef<HTMLDivElement | null>(null)
  const index = rows.findIndex((r) => r.pokemonId === selectedId)

  // 고른 줄이 보이게
  useEffect(() => {
    if (selectedId === null) return
    const el = body.current?.querySelector<HTMLElement>(
      `[data-pokemon="${selectedId}"]`
    )
    el?.scrollIntoView?.({ block: "nearest" })
  }, [selectedId, view])

  const options = SORT_MENU.map((key) =>
    key === sort.key ? sort : { key, dir: defaultDir(key) }
  )
  if (!SORT_MENU.includes(sort.key)) options.push(sort)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (rows.length === 0) return
    const step = view === "grid" ? GRID_COLUMNS : 1
    const page = Math.max(
      1,
      Math.floor((body.current?.clientHeight ?? 340) / 34) - 1
    )
    const at = index < 0 ? -1 : index
    let next: number | null = null
    switch (e.key) {
      case "ArrowDown":
        next = at < 0 ? 0 : at + step
        break
      case "ArrowUp":
        next = at < 0 ? 0 : at - step
        break
      case "ArrowRight":
        if (view === "grid") next = at + 1
        break
      case "ArrowLeft":
        if (view === "grid") next = at - 1
        break
      case "Home":
        next = 0
        break
      case "End":
        next = rows.length - 1
        break
      case "PageDown":
        next = at + page
        break
      case "PageUp":
        next = at - page
        break
      case "Enter":
        if (index >= 0 && !e.nativeEvent.isComposing) {
          e.preventDefault()
          onActivate(rows[index])
        }
        return
      case " ":
        if (index >= 0) {
          e.preventDefault()
          onOpen(rows[index])
        }
        return
      default:
        return
    }
    if (next === null) return
    e.preventDefault()
    onSelect(rows[Math.max(0, Math.min(rows.length - 1, next))])
  }

  const header = (key: SortKey, label: string, numeric = false) => {
    const on = sort.key === key
    return (
      <button
        key={key}
        type="button"
        className={styles.headCell}
        data-numeric={numeric ? "" : undefined}
        data-sorted={on ? "" : undefined}
        aria-sort={
          on ? (sort.dir === "asc" ? "ascending" : "descending") : undefined
        }
        onClick={() => onHeaderSort(key)}
      >
        {label}
        {on && (sort.dir === "asc" ? "▲" : "▼")}
      </button>
    )
  }

  return (
    <section
      className={styles.listPanel}
      aria-label={t("도감 대백과")}
      data-compact={compact ? "" : undefined}
    >
      <div className={styles.listHead}>
        <h1 className={styles.listTitle}>{t("도감 대백과")}</h1>
        <span className={styles.listCount}>{t("%1마리", rows.length)}</span>
        {!compact && (
          <span className={styles.pills}>
            {pills.map((p) => (
              <Pill key={p.key} tone="filter">
                {p.label}
              </Pill>
            ))}
          </span>
        )}
        <span className={styles.spacer} />
        {!compact && (
          <DropdownButton
            ariaLabel={t("정렬")}
            size={28}
            align="end"
            options={options.map((s) => ({
              value: sortValue(s),
              label: sortLabel(s, t),
            }))}
            value={sortValue(sort)}
            onChange={(v) => {
              const picked = options.find((s) => sortValue(s) === v)
              if (picked) onSort(picked)
            }}
          />
        )}
        <SegmentedControl
          ariaLabel={t("보기")}
          variant="icon"
          className={styles.viewToggle}
          value={view}
          onChange={onView}
          options={[
            {
              value: "list",
              ariaLabel: t("목록 보기"),
              label: <Icon name="list" size={15} strokeWidth={2.6} />,
            },
            {
              value: "grid",
              ariaLabel: t("그리드 보기"),
              label: <Icon name="grid" size={15} strokeWidth={2.2} />,
            },
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <div className={styles.emptyBody}>{empty}</div>
      ) : view === "list" ? (
        <div className={styles.table} data-sprite={showSprite ? "" : undefined}>
          <div className={styles.tableHead} role="presentation">
            <span />
            {header("number", t("No."))}
            {showSprite && <span />}
            {header("name", t("이름"))}
            {header("types", t("타입"))}
            <span className={styles.statCols}>
              {STAT_KEYS.map((k) =>
                header(
                  k,
                  generation === 1 && (k === "spAttack" || k === "spDefense")
                    ? t("특수")
                    : t(STAT_LABEL[k]),
                  true
                )
              )}
            </span>
            {header("total", t("합계"), true)}
          </div>
          <div
            ref={body}
            className={styles.tableBody}
            role="listbox"
            tabIndex={0}
            aria-label={t("포켓몬 목록")}
            aria-activedescendant={
              index >= 0 ? `dex-row-${rows[index].pokemonId}` : undefined
            }
            onKeyDown={onKeyDown}
          >
            {rows.map((row, i) => {
              const name = text(row.name, lang)
              const selected = row.pokemonId === selectedId
              return (
                <div
                  key={row.pokemonId}
                  id={`dex-row-${row.pokemonId}`}
                  data-pokemon={row.pokemonId}
                  role="option"
                  aria-selected={selected}
                  className={styles.row}
                  data-odd={i % 2 === 1 ? "" : undefined}
                  onClick={() => {
                    onSelect(row)
                    onOpen(row)
                  }}
                >
                  <span className={styles.cursorCell}>
                    {selected && <span className={styles.cursor} />}
                  </span>
                  <span className={styles.number}>
                    {padNumber(row.dexNumber)}
                  </span>
                  {showSprite && (
                    <PokemonIcon pokemonId={row.pokemonId} alt="" />
                  )}
                  <span className={styles.name}>{name}</span>
                  <span className={styles.types}>
                    {row.types.map((type) => (
                      <TypeChip key={type} type={type} size="sm" />
                    ))}
                  </span>
                  <span className={styles.statCols}>
                    {row.stats.map((v, k) => (
                      <StatValue key={k} value={v} />
                    ))}
                  </span>
                  <span className={styles.totalCell}>
                    <StatValue value={row.total} total />
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div
          ref={body}
          className={styles.grid}
          role="listbox"
          tabIndex={0}
          aria-label={t("포켓몬 목록")}
          aria-activedescendant={
            index >= 0 ? `dex-card-${rows[index].pokemonId}` : undefined
          }
          onKeyDown={onKeyDown}
        >
          {rows.map((row) => {
            const name = text(row.name, lang)
            return (
              <div
                key={row.pokemonId}
                id={`dex-card-${row.pokemonId}`}
                data-pokemon={row.pokemonId}
                role="option"
                aria-selected={row.pokemonId === selectedId}
                className={styles.card}
                onClick={() => {
                  onSelect(row)
                  onOpen(row)
                }}
              >
                <PokemonIcon pokemonId={row.pokemonId} alt="" box="grid" />
                <span className={styles.cardRow}>
                  <span className={styles.cardName}>{name}</span>
                  <span className={styles.cardNumber}>
                    {padNumber(row.dexNumber)}
                  </span>
                </span>
                <span className={styles.cardTypes}>
                  {row.types.map((type) => (
                    <TypeChip key={type} type={type} size="card" />
                  ))}
                </span>
                <span
                  className={styles.cardTotal}
                  data-high={row.total >= 600 ? "" : undefined}
                >
                  {t("합계 %1", row.total)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
