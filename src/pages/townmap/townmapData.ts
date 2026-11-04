/**
 * 타운맵 화면이 묻는 게임 데이터 — 저장소 함수 위에 얇게(캐시 · 이름 고르기).
 */
import {
  currentDatabase,
  loc,
  num,
  select,
  str,
} from "../../data/repository/db.ts"
import {
  itemsForGeneration,
  locationNames,
  regionDisplayName,
} from "../../data/repository/index.ts"
import type { ItemRow } from "../../data/repository/types.ts"
import {
  emptyText,
  text,
  type Language,
  type LocalizedText,
} from "../../data/text/localizedText.ts"
import { placeName } from "../../data/text/places.ts"
import type { RegionMap } from "./townmapBook.ts"
import type { SpeciesRef } from "./wild.ts"

/** 지도에 나오는 모든 지방의 장소 이름(PokéAPI) — 합본의 경계 노드(동성폭포 등)까지 */
export function mapLocationNames(
  map: RegionMap | null
): Map<string, LocalizedText> {
  const out = new Map<string, LocalizedText>()
  if (!map) return out
  const regions = new Set([map.region, ...map.nodes.map((n) => n.region)])
  for (const region of regions) {
    if (region === "") continue
    for (const [id, name] of locationNames(region)) out.set(id, name)
  }
  return out
}

/** 장소 이름 고르기: 사전 → 도로 규칙 → PokéAPI → identifier */
export const placeLabel = (
  names: ReadonlyMap<string, LocalizedText>,
  location: string,
  language: Language
): string => placeName(location, names.get(location) ?? emptyText(), language)

/** 지방 이름("johto" → 성도) */
export const regionLabel = (region: string, language: Language): string =>
  text(regionDisplayName(region), language) || region

/** 사전 종 identifier → 종 번호 · 기본 모습 · 이름 */
export function speciesByIdentifier(
  identifiers: readonly string[]
): Map<string, SpeciesRef> {
  const out = new Map<string, SpeciesRef>()
  const wanted = [...new Set(identifiers)].filter((s) => s !== "")
  if (wanted.length === 0 || !currentDatabase()) return out
  for (const r of select(
    `SELECT s.identifier, s.id, s.name_ko, s.name_en, s.name_ja,
            (SELECT MIN(p.id) FROM pokemon p WHERE p.species_id = s.id AND p.is_default = 1)
              AS pokemon_id
     FROM species s WHERE s.identifier IN (${wanted.map(() => "?").join(",")})`,
    wanted
  )) {
    const speciesId = num(r.id)
    out.set(str(r.identifier), {
      speciesId,
      pokemonId: num(r.pokemon_id) || speciesId,
      name: loc(r, "name"),
    })
  }
  return out
}

// 세대 · 게임마다 한 번 읽는다(아이템 대백과 전체라 무겁다)
const itemCache = new Map<string, Map<string, ItemRow>>()

/** 그 세대 · 게임의 아이템(identifier → 줄). dataVersion이 바뀌면 다시 읽는다 */
export function itemRowsFor(
  generation: number,
  versionGroup: string,
  dataVersion: number
): Map<string, ItemRow> {
  const key = `${dataVersion}|${generation}|${versionGroup}`
  let rows = itemCache.get(key)
  if (!rows) {
    if (itemCache.size > 8) itemCache.clear()
    rows = new Map(
      itemsForGeneration(generation, versionGroup).map((r) => [r.identifier, r])
    )
    itemCache.set(key, rows)
  }
  return rows
}
