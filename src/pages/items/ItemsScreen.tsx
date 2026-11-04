/**
 * 아이템 화면 본체 — 분류 창 · 목록 창 · 상세 창(좁으면 세그먼트 · 드로어).
 * 상태는 여기 하나에 모으고, 각 창은 받은 값만 그린다.
 * 게임 묶음 칩은 이 화면 안에서만 게임을 바꾼다(앱 전역 게임 · 스쿼드는 그대로).
 */
import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { Icon } from "../../components/Icon.tsx"
import { IconButton } from "../../components/Button.tsx"
import { SegmentedControl } from "../../components/SegmentedControl.tsx"
import {
  dexesForGeneration,
  gamesForGeneration,
  itemsForGeneration,
  resolveVersionIn,
} from "../../data/repository/index.ts"
import {
  existsIn,
  versionGroupOf,
  type ItemRow,
} from "../../data/repository/types.ts"
import { placeName, text } from "../../data/text/index.ts"
import { ctx, useT } from "../../i18n/index.ts"
import { useMediaQuery } from "../../shared/useMediaQuery.ts"
import { useDataVersion } from "../../state/data.ts"
import {
  useGame,
  useGeneration,
  useNameLanguage,
  useUiLanguage,
} from "../../state/settings.ts"
import { allowedItems } from "./acquisition.ts"
import { useAcquisitionBook } from "./acquisitionStore.ts"
import { CategoryNav } from "./CategoryNav.tsx"
import { DEX_STYLE, gameChips } from "./gameChips.ts"
import { ItemDetail } from "./ItemDetail.tsx"
import { ItemList } from "./ItemList.tsx"
import { ALL_GROUP, findGroup, groupFilter, ITEM_STYLE } from "./itemGroups.ts"
import { pokeapiLocationNames } from "./itemsData.ts"
import { visibleItems, type ItemSortKey } from "./itemView.ts"
import styles from "./Items.module.css"

export function ItemsScreen() {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const generation = useGeneration()
  const appGame = useGame()
  const lang = useNameLanguage()
  const uiLang = useUiLanguage()
  const dataVersion = useDataVersion()
  // ≥1360 세 창 · 1100–1359 분류 → 세그먼트 · <1100 상세 → 드로어 (breakpoint.wide · medium)
  const segmentMode = useMediaQuery("(max-width: 1359px)")
  const drawerMode = useMediaQuery("(max-width: 1099px)")

  const [localVg, setLocalVg] = useState("")
  const [seenAppGame, setSeenAppGame] = useState(appGame)
  const [groupKey, setGroupKey] = useState(ALL_GROUP)
  const [searchRaw, setSearchRaw] = useState("")
  const [search, setSearch] = useState("")
  const [onlyThisGeneration, setOnlyThisGeneration] = useState(true)
  const [sort, setSort] = useState<ItemSortKey>("name")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [seenLocation, setSeenLocation] = useState<string | null>(null)

  // 앱 게임이 바뀌면 이 화면의 칩 선택을 버리고 앱 게임을 따른다
  if (seenAppGame !== appGame) {
    setSeenAppGame(appGame)
    setLocalVg("")
  }

  // dataVersion: 데이터를 다시 받으면 다시 묻는다
  const games = useMemo(() => {
    void dataVersion
    return gamesForGeneration(generation)
  }, [generation, dataVersion])
  const dexes = useMemo(() => {
    void dataVersion
    return dexesForGeneration(generation)
  }, [generation, dataVersion])
  const versionGroup = games.some((g) => g.versionGroup === localVg)
    ? localVg
    : versionGroupOf(games, resolveVersionIn(games, generation, appGame))
  const game = games.find((g) => g.versionGroup === versionGroup)

  const rows = useMemo(() => {
    void dataVersion
    return itemsForGeneration(generation, versionGroup)
  }, [generation, versionGroup, dataVersion])
  const book = useAcquisitionBook(versionGroup)
  const allowed = useMemo(() => allowedItems(book), [book])

  const group = findGroup(ITEM_STYLE, groupKey) ?? ITEM_STYLE.groups[0]
  const visible = useMemo(
    () =>
      visibleItems(rows, {
        generation,
        onlyThisGeneration,
        group: groupFilter(ITEM_STYLE, group.key),
        allowed,
        search,
        sort,
        language: lang,
      }),
    [
      rows,
      generation,
      onlyThisGeneration,
      group.key,
      allowed,
      search,
      sort,
      lang,
    ]
  )
  // 고른 줄이 거르기로 사라지면 상세는 빈 상태
  const selected: ItemRow | null =
    selectedId === null
      ? null
      : (visible.find((r) => r.identifier === selectedId) ?? null)

  // 전체 검색에서 온 주소: /items?q=… · /items?item=<id> — 주소가 바뀔 때마다 한 번
  if (location.pathname === "/items" && location.key !== seenLocation) {
    setSeenLocation(location.key)
    const params = new URLSearchParams(location.search)
    const q = params.get("q")
    const itemId = Number(params.get("item"))
    if (q !== null) {
      setGroupKey(ALL_GROUP)
      setSearchRaw(q)
      setSearch(q.trim())
    }
    const target =
      Number.isInteger(itemId) && itemId > 0
        ? rows.find((r) => r.id === itemId)
        : undefined
    if (target) {
      setGroupKey(ALL_GROUP)
      if (q === null) {
        setSearchRaw("")
        setSearch("")
      }
      if (!existsIn(target, generation)) setOnlyThisGeneration(false)
      setSelectedId(target.identifier)
      setDrawerOpen(true)
    }
  }

  const locationNames = useMemo(() => {
    void dataVersion
    return pokeapiLocationNames()
  }, [dataVersion])
  const placeOf = useMemo(
    () => (where: string) =>
      placeName(
        where,
        locationNames.get(where) ?? { ko: "", en: "", ja: "" },
        lang
      ),
    [locationNames, lang]
  )

  const chips = useMemo(
    () => gameChips(games, dexes, DEX_STYLE, lang),
    [games, dexes, lang]
  )

  // 드로어: Esc로 닫기
  const showDrawer = drawerMode && drawerOpen && selected !== null
  useEffect(() => {
    if (!showDrawer) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [showDrawer])

  const select = (identifier: string) => {
    setSelectedId(identifier)
    setDrawerOpen(true)
  }

  const pickGroup = (key: string) => setGroupKey(key)
  const groupLabel = text(group.label, uiLang)

  const detail = (
    <ItemDetail
      item={selected}
      generation={generation}
      versionGroup={versionGroup}
      game={game}
      book={book}
      placeOf={placeOf}
      onOpenPokemon={(pokemonId) => navigate(`/dex/${pokemonId}`)}
    />
  )

  return (
    <div
      className={styles.screen}
      data-layout={drawerMode ? "narrow" : segmentMode ? "medium" : "wide"}
    >
      {!segmentMode && (
        <CategoryNav
          groups={ITEM_STYLE.groups}
          current={group.key}
          onPick={pickGroup}
          generation={generation}
          onlyThisGeneration={onlyThisGeneration}
          onOnlyThisGenerationChange={setOnlyThisGeneration}
        />
      )}
      <div className={styles.center}>
        {segmentMode && (
          <div className={styles.segmentRow}>
            <SegmentedControl
              ariaLabel={t(ctx("분류", "Items"))}
              options={ITEM_STYLE.groups.map((g) => ({
                value: g.key,
                label: text(g.label, uiLang),
              }))}
              value={group.key}
              onChange={pickGroup}
            />
          </div>
        )}
        <ItemList
          rows={visible}
          generation={generation}
          language={lang}
          selectedId={selected?.identifier ?? null}
          onSelect={select}
          groupKey={group.key}
          groupLabel={groupLabel}
          chips={chips}
          versionGroup={versionGroup}
          onPickGame={(vg) => {
            if (vg !== "" && vg !== versionGroup) setLocalVg(vg)
          }}
          searchRaw={searchRaw}
          onSearchRaw={setSearchRaw}
          search={search}
          onSearch={(q) => setSearch(q.trim())}
          sort={sort}
          onSort={setSort}
          compactCheckbox={segmentMode}
          onlyThisGeneration={onlyThisGeneration}
          onOnlyThisGenerationChange={setOnlyThisGeneration}
        />
      </div>
      {!drawerMode && detail}
      {showDrawer && (
        <div className={styles.drawer}>
          <IconButton
            className={styles.drawerClose}
            label={t("상세 닫기 (Esc)")}
            icon={<Icon name="close" size={16} strokeWidth={2.6} />}
            onClick={() => setDrawerOpen(false)}
          />
          {detail}
        </div>
      )}
    </div>
  )
}
