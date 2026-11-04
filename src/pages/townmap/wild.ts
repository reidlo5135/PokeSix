/**
 * [야생] 탭 목록 만들기 — PokéAPI 출현(encountersAt) + 사전 pokemon 줄을 방법별로 묶는다.
 * 순서: PokéAPI 방법 순(방법 id → 확률 내림 → 종 번호) 그대로, 사전 줄은 같은 방법 묶음 끝(없으면 새 묶음)에.
 */
import type { EncounterSpot } from "../../data/repository/types.ts"
import type { LocalizedText } from "../../data/text/localizedText.ts"
import type { TFunction } from "../../i18n/index.ts"
import type { PokemonSource } from "./acquisition.ts"

export interface WildRow {
  key: string
  speciesId: number
  pokemonId: number
  name: LocalizedText
  method: string
  minLevel: number | null
  maxLevel: number | null
  rarity: number
  /** 사전 줄이면 그 입수처(내용 · 비용 · 조건 줄) */
  source: PokemonSource | null
}

export interface WildGroup {
  method: string
  rows: WildRow[]
}

/** 사전 종 identifier → 종 정보(그 DB에 없으면 null) */
export interface SpeciesRef {
  speciesId: number
  pokemonId: number
  name: LocalizedText
}

export function wildGroups(
  spots: readonly EncounterSpot[],
  extra: readonly { species: string; source: PokemonSource }[],
  speciesOf: (identifier: string) => SpeciesRef | null
): WildGroup[] {
  // 사전 줄이 replaces로 가리는 (종, 방법)
  const hidden = new Set<string>()
  const extraRows: WildRow[] = []
  extra.forEach(({ species, source }, i) => {
    const ref = speciesOf(species)
    if (!ref) return
    if (source.replaces !== "")
      hidden.add(`${ref.speciesId}/${source.replaces}`)
    extraRows.push({
      key: `book-${i}-${species}`,
      speciesId: ref.speciesId,
      pokemonId: ref.pokemonId,
      name: ref.name,
      method: source.how,
      minLevel: source.minLevel ?? source.maxLevel,
      maxLevel: source.maxLevel ?? source.minLevel,
      rarity: 0,
      source,
    })
  })

  const groups: WildGroup[] = []
  const push = (row: WildRow) => {
    let group = groups.find((g) => g.method === row.method)
    if (!group) {
      group = { method: row.method, rows: [] }
      groups.push(group)
    }
    group.rows.push(row)
  }
  for (const s of spots) {
    if (hidden.has(`${s.speciesId}/${s.method}`)) continue
    push({
      key: `api-${s.speciesId}-${s.method}`,
      speciesId: s.speciesId,
      pokemonId: s.pokemonId,
      name: s.name,
      method: s.method,
      minLevel: s.minLevel,
      maxLevel: s.maxLevel,
      rarity: s.rarity,
      source: null,
    })
  }
  for (const row of extraRows) push(row)
  return groups
}

/** "Lv.5" · "Lv.2–4" (레벨이 없으면 "") */
export function levelText(
  min: number | null,
  max: number | null,
  t: TFunction
): string {
  if (min === null || max === null) return ""
  return min === max ? t("Lv.%1", min) : t("Lv.%1–%2", min, max)
}

/** 줄 오른쪽 정보: "Lv.2–4 · 110%" · "Lv.5" · "110%" */
export function spotInfo(
  min: number | null,
  max: number | null,
  rarity: number,
  t: TFunction
): string {
  const levels = levelText(min, max, t)
  if (rarity <= 0) return levels
  return levels === "" ? `${rarity}%` : t("%1 · %2%", levels, rarity)
}
