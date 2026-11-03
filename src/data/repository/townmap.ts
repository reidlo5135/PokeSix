/**
 * 타운맵: 장소 · 버전의 야생 출현, 지방의 장소 이름, 버전이 걸친 지방.
 */
import type { LocalizedText } from "../text/localizedText.ts"
import { currentDatabase, loc, num, select, str } from "./db.ts"
import type { EncounterSpot } from "./types.ts"

/**
 * 그 장소 · 버전의 야생 출현(종 · 방법 단위). 레벨은 전체 범위, 확률은 가장 높은 값.
 * encounters는 임포트 때 이미 (포켓몬, 버전, 장소, 방법)마다 확률을 모두 더한 한 줄이라
 * 여기서 합쳐지는 건 같은 종의 다른 폼뿐이다 — rarity는 100을 넘을 수 있다
 */
export function encountersAt(
  location: string,
  version: string
): EncounterSpot[] {
  return select(
    `SELECT s.id AS species_id, MIN(p.id) AS pokemon_id, s.name_ko, s.name_en, s.name_ja,
            em.identifier AS method, MIN(e.min_level) AS min_level,
            MAX(e.max_level) AS max_level, MAX(e.rarity) AS rarity
     FROM encounters e
     JOIN versions v ON v.id = e.version_id
     JOIN locations l ON l.id = e.location_id
     JOIN encounter_methods em ON em.id = e.method_id
     JOIN pokemon p ON p.id = e.pokemon_id
     JOIN species s ON s.id = p.species_id
     WHERE l.identifier = ? AND v.identifier = ?
     GROUP BY s.id, em.id
     ORDER BY em.id, MAX(e.rarity) DESC, s.id`,
    [location, version]
  ).map((r) => ({
    speciesId: num(r.species_id),
    pokemonId: num(r.pokemon_id),
    name: loc(r, "name"),
    method: str(r.method),
    minLevel: num(r.min_level),
    maxLevel: num(r.max_level),
    rarity: num(r.rarity),
  }))
}

/** 지방(소문자 영어 "johto")의 장소 이름: identifier → 이름. 한국어는 대부분 없다(UI 사전 몫) */
export function locationNames(region: string): Map<string, LocalizedText> {
  return new Map(
    select(
      `SELECT l.identifier, l.name_ko, l.name_en, l.name_ja FROM locations l
       JOIN regions r ON r.id = l.region_id WHERE LOWER(r.name_en) = ?`,
      [region.toLowerCase()]
    ).map((r) => [str(r.identifier), loc(r, "name")] as const)
  )
}

/** 이 버전의 야생 출현이 걸친 지방(소문자 영어, 장소 수 많은 순) — 타운맵 지방 버튼 */
export function encounterRegions(version: string): string[] {
  return select(
    `SELECT LOWER(r.name_en) AS region FROM encounters e
     JOIN versions v ON v.id = e.version_id
     JOIN locations l ON l.id = e.location_id
     JOIN regions r ON r.id = l.region_id
     WHERE v.identifier = ? AND r.name_en IS NOT NULL
     GROUP BY r.id ORDER BY COUNT(DISTINCT l.id) DESC, r.id`,
    [version]
  ).map((r) => str(r.region))
}

/** 지방 이름("johto" → 성도). 못 찾으면 입력 그대로 세 칸, 비었거나 DB가 없으면 빈 칸 */
export function regionDisplayName(region: string): LocalizedText {
  if (region === "" || !currentDatabase()) return { ko: "", en: "", ja: "" }
  const [row] = select(
    "SELECT name_ko, name_en, name_ja FROM regions WHERE LOWER(name_en) = ?",
    [region.toLowerCase()]
  )
  return row ? loc(row, "name") : { ko: region, en: region, ja: region }
}
