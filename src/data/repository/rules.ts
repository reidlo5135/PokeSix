/**
 * 저장소의 세대 규칙 — DB 없이 테스트할 수 있는 순수 함수.
 */
import type { LocalizedText } from "../text/localizedText.ts"
import type { MoveEntry } from "./types.ts"

// 세대의 대표 게임 묶음: 그 세대를 가장 넓게 담는 셋째 판 · 확장판(리메이크는 쓰지 않는다)
const REPRESENTATIVE: readonly string[] = [
  "yellow",
  "crystal",
  "emerald",
  "platinum", // DP에 없던 기술 가르침이 있고, 기술머신 획득처 사전도 Pt 기준
  "black-2-white-2",
  "x-y",
  "ultra-sun-ultra-moon",
  "sword-shield",
  "scarlet-violet",
]

/** 기술 · 기술머신 번호의 기준 게임 묶음. 1–9 밖이면 "" */
export const representativeVersionGroup = (generation: number): string =>
  REPRESENTATIVE[generation - 1] ?? ""

// ── 물리 · 특수: 3세대까지는 기술이 아니라 타입이 정했다(4세대 DP에서 기술별로)
export const STATUS_CLASS = 1
export const PHYSICAL_CLASS = 2
export const SPECIAL_CLASS = 3
export const LAST_TYPE_BASED_DAMAGE_CLASS_GENERATION = 3

const PHYSICAL_TYPES_BEFORE_SPLIT = new Set([
  "normal",
  "fighting",
  "flying",
  "poison",
  "ground",
  "rock",
  "bug",
  "ghost",
  "steel",
])

/** 3세대까지의 타입별 분류. 빈 타입(???)은 특수 */
export const typeBasedClass = (type: string): number =>
  PHYSICAL_TYPES_BEFORE_SPLIT.has(type) ? PHYSICAL_CLASS : SPECIAL_CLASS

/** 그 세대의 분류: 3세대까지 변화가 아니면 타입이 정한다(DB NULL → 0도 바뀐다) */
export const damageClassIn = (
  generation: number,
  dbClass: number,
  type: string
): number =>
  generation <= LAST_TYPE_BASED_DAMAGE_CLASS_GENERATION &&
  dbClass !== STATUS_CLASS
    ? typeBasedClass(type)
    : dbClass

// ── 비전머신 번호: PokéAPI는 비전머신 n을 100 + n으로 센다(BDSP hm01–08은 93–100이라 그대로)
export const HIDDEN_MACHINE_OFFSET = 100

export function machineNumberOf(item: string, number: number): number {
  return item.startsWith("hm") && number > HIDDEN_MACHINE_OFFSET
    ? number - HIDDEN_MACHINE_OFFSET
    : number
}

/** 기술머신 정렬: 기술머신 → (기술레코드) → 비전머신, 번호 순 */
export function compareMachineMoves(a: MoveEntry, b: MoveEntry): number {
  if (a.hiddenMachine !== b.hiddenMachine) return a.hiddenMachine ? 1 : -1
  if (a.machineItem.slice(0, 2) !== b.machineItem.slice(0, 2))
    return a.machineItem < b.machineItem ? -1 : 1
  return a.machineNumber - b.machineNumber
}

/**
 * 기술머신 라벨. number = MoveEntry.machineNumber(비전머신은 이미 1–8로 보정).
 * tr(SwSh 100–199) → TR{n−100}, hm 1–8 → HM{n}, BDSP hm(93–100) → 게임 속 이름 TM{n}, 그 밖 TM{n}.
 * 번호는 두 자리 이상(SV 3자리 허용)
 */
export function machineLabel(item: string, number: number): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  if (item.startsWith("tr"))
    return `TR${pad(number >= 100 ? number - 100 : number)}`
  if (item.startsWith("hm") && number <= 8) return `HM${pad(number)}`
  return `TM${pad(number)}`
}

// ── 가까운 세대 문구(아이템 · 기술 · 특성 설명문 공통). 언어마다 따로 고른다:
// g 이하 중 그 언어 문구가 있는 가장 최근 세대, 없으면 g 초과 중 가장 이른 세대, 그것도 없으면 ""
export interface EffectRow {
  generation: number
  ko: string | null
  en: string | null
  ja: string | null
}

/** rows는 반드시 generation 오름차순 */
export function pickNearest(
  rows: readonly EffectRow[],
  generation: number
): LocalizedText {
  const into: LocalizedText = { ko: "", en: "", ja: "" }
  const from = { ko: 0, en: 0, ja: 0 } // 언어별로 문구를 가져온 세대(0 = 아직 없음)
  for (const row of rows) {
    for (const lang of ["ko", "en", "ja"] as const) {
      const value = row[lang]
      if (!value) continue
      if (
        from[lang] === 0 ||
        (row.generation <= generation && from[lang] <= generation)
      ) {
        into[lang] = value
        from[lang] = row.generation
      }
    }
  }
  return into
}
