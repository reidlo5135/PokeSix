/**
 * 도감 화면 본체 — 필터 창 · 목록 창 · 상세 창(≥1360).
 * 1100–1359: 필터 → 칩 줄 + 팝오버. <1100: 상세 → 오른쪽 드로어.
 * 상태는 여기 하나에 모으고, 각 창은 받은 값만 그린다.
 */
import { useEffect, useMemo, useRef, useState } from "react"

import { Button, EmptyState, Panel } from "../../components/index.ts"
import {
  dexesForGeneration,
  gamesForGeneration,
  otherVersionSpecies,
  resolveVersion,
  speciesForDex,
  speciesForGeneration,
  typeChart,
  versionGroupOf,
  type SpeciesRow,
} from "../../data/repository/index.ts"
import { text } from "../../data/text/localizedText.ts"
import { useT } from "../../i18n/index.ts"
import { useMediaQuery } from "../../shared/useMediaQuery.ts"
import {
  settingsActions,
  useGame,
  useGeneration,
  useNameLanguage,
} from "../../state/settings.ts"
import { SQUAD_SIZE } from "../../state/squads.ts"
import { session } from "../squad/session.ts"
import { setPokemon } from "../squad/squadEdits.ts"
import { CompactBar } from "./CompactBar.tsx"
import { DexDetail } from "./detail/DexDetail.tsx"
import { FilterBody } from "./FilterBody.tsx"
import { abilityTextByPokemon, speciesBriefs } from "./model/dexData.ts"
import {
  DEFAULT_SORT,
  emptyCause,
  filterPills,
  initialFilters,
  removePill,
  toggleSort,
  viewRows,
  type DexFilters,
  type DexSort,
  type FilterPill,
} from "./model/dexList.ts"
import { dexLabel, gameChips, isHiddenDex } from "./model/dexstyle.ts"
import { useDataMemo } from "./model/useDataMemo.ts"
import { SpeciesList, type ListViewMode } from "./SpeciesList.tsx"
import styles from "./Dex.module.css"

const NOTICE_MS = 2500

export function DexScreen() {
  const t = useT()
  const g = useGeneration()
  const appGame = useGame()
  const lang = useNameLanguage()
  // breakpoint.wide 1360 · breakpoint.medium 1100
  const compact = useMediaQuery("(max-width: 1359px)")
  const narrow = useMediaQuery("(max-width: 1099px)")

  const [seenGen, setSeenGen] = useState(g)
  const [dexId, setDexId] = useState(0)
  const [filters, setFilters] = useState<DexFilters>(initialFilters)
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<DexSort>(DEFAULT_SORT)
  const [view, setView] = useState<ListViewMode>("list")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [notice, setNotice] = useState("")
  const typesRef = useRef<HTMLDivElement | null>(null)

  // 세대가 바뀌면: 도감 → 전국, 필터 초기화(검색은 둔다), 고른 것 비우기
  if (seenGen !== g) {
    setSeenGen(g)
    setDexId(0)
    setFilters(initialFilters())
    setSelectedId(null)
    setDrawerOpen(false)
  }

  const games = useDataMemo(() => gamesForGeneration(g), [g])
  const version = useDataMemo(() => resolveVersion(g, appGame), [g, appGame])
  const versionGroup = versionGroupOf(games, version)
  const dexes = useDataMemo(
    () => dexesForGeneration(g).filter((d) => !isHiddenDex(d.identifier)),
    [g]
  )
  const dex = dexes.find((d) => d.pokedexId === dexId)
  const chips = useMemo(() => gameChips(games, lang), [games, lang])
  const availableTypes = useDataMemo(() => typeChart(g).types, [g])
  const abilities = useDataMemo(() => abilityTextByPokemon(g), [g])

  const baseRows = useDataMemo(() => {
    const rows =
      dexId === 0 || !dex ? speciesForGeneration(g) : speciesForDex(dexId, g)
    const exclusive = otherVersionSpecies(version)
    return rows.filter((r) => !exclusive.has(r.speciesId))
  }, [g, dexId, dex, version])
  const rows = useMemo(
    () =>
      viewRows(baseRows, { filters, query, sort, language: lang, abilities }),
    [baseRows, filters, query, sort, lang, abilities]
  )
  const pills = filterPills(filters, {
    generation: g,
    dexLabel: dex ? dexLabel(dex, lang) : "",
    language: lang,
    t,
  })

  // 넓은 화면은 상세가 비지 않게 첫 줄을 보인다
  const listSelected =
    selectedId ?? (narrow ? null : (rows[0]?.pokemonId ?? null))
  const detailId = listSelected
  const shownRow = rows.find((r) => r.pokemonId === detailId)

  // 알림 줄은 잠깐 보였다 사라진다
  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(""), NOTICE_MS)
    return () => window.clearTimeout(id)
  }, [notice])

  // 드로어: Esc로 닫는다
  useEffect(() => {
    if (!narrow || !drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [narrow, drawerOpen])

  const resetFilters = () => setFilters(initialFilters())
  const removeFilterPill = (pill: FilterPill) => {
    if (pill.action.kind === "dex") setDexId(0)
    else setFilters(removePill(filters, pill.action))
  }

  const addToSquad = (pokemonId: number, name: string) => {
    const context = { generation: g, version, versionGroup }
    const squad = session.current(context)
    const slot = squad.members.findIndex((m) => m.pokemonId <= 0)
    if (slot < 0) {
      setNotice(t("스쿼드가 가득 찼어요 (%1/%1)", SQUAD_SIZE))
      return
    }
    session.edit(context, (s) => setPokemon(s, slot, pokemonId))
    if (session.current(context).members[slot]?.pokemonId === pokemonId)
      setNotice(
        t("%1을(를) 스쿼드에 넣었어요 (%2/%3)", name, slot + 1, SQUAD_SIZE)
      )
  }

  const select = (row: SpeciesRow) => setSelectedId(row.pokemonId)
  const open = (row: SpeciesRow) => {
    setSelectedId(row.pokemonId)
    if (narrow) setDrawerOpen(true)
  }
  const activate = (row: SpeciesRow) =>
    addToSquad(row.pokemonId, text(row.name, lang))

  const cause = emptyCause(query, speciesBriefs(), g)
  const empty =
    cause.kind === "generation" ? (
      <EmptyState
        title={t(
          "%1은(는) %2세대부터 나와요",
          text(cause.name, lang),
          cause.introGen
        )}
        reason={t("세대를 바꾸면 볼 수 있어요.")}
        actions={
          <Button
            size="S"
            variant="primary"
            onClick={() => settingsActions().setGeneration(cause.introGen)}
          >
            {t("%1세대로 보기", cause.introGen)}
          </Button>
        }
      />
    ) : (
      <EmptyState
        title={t("조건에 맞는 포켓몬이 없어요")}
        reason={t("필터를 줄이거나 초기화해 보세요.")}
        actions={
          <>
            <Button size="S" variant="primary" onClick={resetFilters}>
              {t("필터 초기화")}
            </Button>
            {search !== "" && (
              <Button
                size="S"
                onClick={() => {
                  setSearch("")
                  setQuery("")
                }}
              >
                {t("검색 지우기")}
              </Button>
            )}
          </>
        }
      />
    )

  const filterBody = (
    <FilterBody
      generation={g}
      search={search}
      onSearchChange={setSearch}
      onQuery={setQuery}
      filters={filters}
      onFilters={setFilters}
      availableTypes={availableTypes}
      dexes={dexes}
      dexId={dexId}
      onDex={setDexId}
      chips={chips}
      version={version}
      onReset={resetFilters}
      typesRef={typesRef}
    />
  )

  const detail = (
    <DexDetail
      pokemonId={detailId}
      generation={g}
      version={version}
      variant={narrow ? "drawer" : "pane"}
      onSelectPokemon={(id) => setSelectedId(id)}
      onAddToSquad={addToSquad}
      onClose={() => setDrawerOpen(false)}
      regional={
        dex && shownRow
          ? { label: dexLabel(dex, lang), number: shownRow.dexNumber }
          : undefined
      }
    />
  )

  return (
    <div
      className={styles.screen}
      data-layout={narrow ? "narrow" : compact ? "medium" : "wide"}
    >
      {!compact && (
        <Panel
          className={styles.filterPanel}
          bodyClassName={styles.filterPanelBody}
          header={{
            title: t("필터"),
            tone: "blue",
            right: (
              <span className={styles.appliedCount}>
                {t("%1개 적용", pills.length)}
              </span>
            ),
          }}
        >
          {filterBody}
        </Panel>
      )}
      <div className={styles.center}>
        {compact && (
          <CompactBar
            pills={pills}
            onRemove={removeFilterPill}
            sort={sort}
            onSort={setSort}
            open={popoverOpen}
            onOpenChange={setPopoverOpen}
            onAddType={() => {
              setPopoverOpen(true)
              requestAnimationFrame(() =>
                typesRef.current?.scrollIntoView({ block: "start" })
              )
            }}
          >
            {filterBody}
          </CompactBar>
        )}
        <SpeciesList
          rows={rows}
          compact={compact}
          showSprite={!compact}
          pills={pills}
          sort={sort}
          onSort={setSort}
          onHeaderSort={(key) => setSort((s) => toggleSort(s, key))}
          view={view}
          onView={setView}
          selectedId={listSelected}
          onSelect={select}
          onActivate={activate}
          onOpen={open}
          generation={g}
          empty={empty}
        />
      </div>
      {!narrow && detail}
      {narrow && drawerOpen && detailId !== null && (
        <div className={styles.drawer}>{detail}</div>
      )}
      {notice && (
        <div className={styles.notice} role="status">
          {notice}
        </div>
      )}
    </div>
  )
}
