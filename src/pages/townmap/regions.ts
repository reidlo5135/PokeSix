/**
 * 게임(버전) → 보여 줄 지도 고르기 — Qt townmappage refresh 이식.
 * 출현이 걸친 지방이 둘 이상이고 합본 지도("johto-kanto")가 있으면 합본 하나, 아니면 지도가 있는 지방들.
 *
 * 지방 출처는 게임 묶음의 지방 표(PokéAPI version-group.regions)를 먼저 쓴다. Qt처럼 출현에서만 유도하면
 * 에메랄드가 관동 지도(배꼽바위 · 탄생의 섬), 울트라썬 · 울트라문이 신오 지도(트레이너스쿨)를 연다.
 */

const VERSION_GROUP_REGIONS: Readonly<Record<string, readonly string[]>> = {
  "red-green-japan": ["kanto"],
  "red-blue": ["kanto"],
  yellow: ["kanto"],
  "gold-silver": ["kanto", "johto"],
  crystal: ["kanto", "johto"],
  "ruby-sapphire": ["hoenn"],
  emerald: ["hoenn"],
  "firered-leafgreen": ["kanto"],
  "diamond-pearl": ["sinnoh"],
  platinum: ["sinnoh"],
  "heartgold-soulsilver": ["kanto", "johto"],
  "black-white": ["unova"],
  "black-2-white-2": ["unova"],
  "x-y": ["kalos"],
  "omega-ruby-alpha-sapphire": ["hoenn"],
  "sun-moon": ["alola"],
  "ultra-sun-ultra-moon": ["alola"],
  "lets-go-pikachu-lets-go-eevee": ["kanto"],
}

/** 그 게임 묶음이 걸친 지방(소문자 영어). 표에 없는 묶음은 fromEncounters()(출현 유도) */
export function coveredRegions(
  versionGroup: string,
  fromEncounters: () => string[]
): string[] {
  const known = VERSION_GROUP_REGIONS[versionGroup]
  return known ? [...known] : fromEncounters()
}

/** 지방 목록 → 지도 key 목록(합본이 있으면 그것 하나) */
export function mapRegions(
  covered: readonly string[],
  hasMap: (key: string) => boolean
): string[] {
  const combined = [...covered].sort().join("-")
  if (covered.length > 1 && hasMap(combined)) return [combined]
  return covered.filter((r) => hasMap(r))
}

/** 고른 지도가 목록에 없으면 첫 지도(없으면 "") */
export const pickRegion = (
  regions: readonly string[],
  current: string
): string => (regions.includes(current) ? current : (regions[0] ?? ""))

/** "johto-kanto" → "성도 · 관동" (조각마다 지방 이름) */
export function regionTitle(
  key: string,
  nameOf: (region: string) => string
): string {
  return key
    .split("-")
    .filter((part) => part !== "")
    .map(nameOf)
    .join(" · ")
}
