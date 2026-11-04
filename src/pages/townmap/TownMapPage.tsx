/**
 * 타운맵 (Qt v0.5.1 타운맵 백과 이식, v1 디자인 시스템으로) — 왼쪽 지도 패널(초록 머리, 게임 · 지방 칩) +
 * 오른쪽 상세 패널(파랑 머리, [야생] [아이템] [랜드마크]).
 * 이 파일은 기본 내보내기 컴포넌트 하나로 둔다: AppShell이 lazy로 불러 살려 둔다.
 */
import { useCallback, useMemo, useState } from "react"

import { DataGate } from "../../components/DataGate.tsx"
import { FilterChip } from "../../components/FilterChip.tsx"
import { Panel } from "../../components/Panel.tsx"
import {
  encounterRegions,
  gamesForGeneration,
  resolveVersionIn,
  versionGroupOf,
} from "../../data/repository/index.ts"
import { useT } from "../../i18n/index.ts"
import { useDataVersion } from "../../state/data.ts"
import {
  settingsActions,
  useGame,
  useGeneration,
  useNameLanguage,
  useSettings,
} from "../../state/settings.ts"
import { DetailPanel, type InfoTab } from "./DetailPanel.tsx"
import { GameChips } from "./GameChips.tsx"
import { MapView } from "./MapView.tsx"
import {
  coveredRegions,
  mapRegions,
  pickRegion,
  regionTitle,
} from "./regions.ts"
import {
  alsoOf,
  distinctLocations,
  hasRegionMap,
  regionMap,
} from "./townmapBook.ts"
import { mapLocationNames, placeLabel, regionLabel } from "./townmapData.ts"
import { gameChips } from "./versionLabels.ts"
import styles from "./TownMap.module.css"

export default function TownMapPage() {
  return (
    <main className={styles.page}>
      <DataGate>
        <TownMapBody />
      </DataGate>
    </main>
  )
}

function TownMapBody() {
  const t = useT()
  const generation = useGeneration()
  const game = useGame()
  const language = useNameLanguage()
  const showOriginal = useSettings((s) => s.showOriginalName)
  const dataVersion = useDataVersion()

  // 세대 · 게임 → 버전 · 게임 묶음 · 지도 후보
  const games = useMemo(() => {
    void dataVersion
    return gamesForGeneration(generation)
  }, [generation, dataVersion])
  const version = resolveVersionIn(games, generation, game)
  const versionGroup = versionGroupOf(games, version)
  const regions = useMemo(() => {
    void dataVersion
    return mapRegions(
      coveredRegions(versionGroup, () => encounterRegions(version)),
      hasRegionMap
    )
  }, [versionGroup, version, dataVersion])

  const [chosenRegion, setChosenRegion] = useState("")
  const region = pickRegion(regions, chosenRegion)
  const map = regionMap(region)

  // 장소 · 지방 이름(데이터 표기 언어)
  const dbNames = useMemo(() => {
    void dataVersion
    return mapLocationNames(map)
  }, [map, dataVersion])
  const nameOf = useCallback(
    (location: string) => placeLabel(dbNames, location, language),
    [dbNames, language]
  )
  const titleOf = (key: string) =>
    regionTitle(key, (r) => regionLabel(r, language))
  const layerLabels = useMemo(() => {
    void dataVersion
    return (map?.layers ?? []).map((l) => regionLabel(l.source, language))
  }, [map, language, dataVersion])

  // 지도 · 게임 · 언어가 바뀌면 선택 · 배율 · 이동을 처음으로(Qt refresh → selectRegion)
  const viewKey = `${dataVersion}|${version}|${region}|${language}`
  const [selection, setSelection] = useState({ key: "", location: "" })
  const selected = selection.key === viewKey ? selection.location : ""
  const select = (location: string) => setSelection({ key: viewKey, location })
  const [tab, setTab] = useState<InfoTab>("wild")

  // [고른 장소, ...하위 장소] — 글자 key로 묶어 같은 선택이면 같은 배열
  const locationsKey =
    selected === "" ? "" : [selected, ...alsoOf(map, selected)].join(",")
  const locations = useMemo(
    () => (locationsKey === "" ? [] : locationsKey.split(",")),
    [locationsKey]
  )

  const chips = useMemo(() => gameChips(games, language), [games, language])
  const mapTitle = region === "" ? t("타운맵") : t("%1 타운맵", titleOf(region))

  return (
    <div className={styles.layout}>
      <Panel
        className={styles.mapPanel}
        bodyClassName={styles.mapBody}
        header={{
          title: mapTitle,
          detail: map ? t("%1곳", distinctLocations(map).length) : undefined,
          tone: "green",
          right:
            chips.length > 1 || regions.length > 1 ? (
              <>
                {regions.length > 1 && (
                  <div
                    className={styles.regionChips}
                    role="group"
                    aria-label={t("지방")}
                  >
                    {regions.map((r) => (
                      <FilterChip
                        key={r}
                        selected={r === region}
                        onSelectedChange={() => setChosenRegion(r)}
                      >
                        {titleOf(r)}
                      </FilterChip>
                    ))}
                  </div>
                )}
                {chips.length > 1 && (
                  <GameChips
                    chips={chips}
                    version={version}
                    onSelect={(v) => settingsActions().setGame(v)}
                    ariaLabel={t("게임")}
                  />
                )}
              </>
            ) : undefined,
        }}
      >
        <MapView
          key={viewKey}
          map={map}
          nameOf={nameOf}
          layerLabels={layerLabels}
          selected={selected}
          onSelect={select}
          ariaLabel={mapTitle}
        />
      </Panel>
      <DetailPanel
        locations={locations}
        placeOf={nameOf}
        tab={tab}
        onTab={setTab}
        generation={generation}
        version={version}
        versionGroup={versionGroup}
        language={language}
        showOriginal={showOriginal}
        dataVersion={dataVersion}
      />
    </div>
  )
}
