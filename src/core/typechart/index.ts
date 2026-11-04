/**
 * 타입 상성 계산 — 순수 함수(DB · React 없음). 상성표는 저장소의 typeChart(g)가 준다.
 *
 * 타입 순서가 둘이다:
 * - PokéAPI id 순(TYPE_ID_ORDER): 분석 입력 · 문제 목록 · "공격 커버" 설명의 순서
 * - 게임 표기 순(TYPE_KEYS, shared/pokemonTypes): 히트맵 열 · 카드 약점 칩
 */
import { TYPE_KEYS, type TypeKey } from "../../shared/pokemonTypes.ts"

/** 저장소 TypeChart와 같은 모양(구조만 본다) */
export interface MatchupChart {
  /** 그 세대에 있는 타입(id 순) */
  types: readonly string[]
  /** key = `${공격}/${방어}`, 표에 없는 쌍 = 1 */
  multipliers: ReadonlyMap<string, number>
}

/** PokéAPI types.id 순서(1 normal … 18 fairy). stellar(19)는 분석에서 뺀다 */
export const TYPE_ID_ORDER: readonly TypeKey[] = [
  "normal",
  "fighting",
  "flying",
  "poison",
  "ground",
  "rock",
  "bug",
  "ghost",
  "steel",
  "fire",
  "water",
  "grass",
  "electric",
  "psychic",
  "ice",
  "dragon",
  "dark",
  "fairy",
]

/** 게임 표기 순서(히트맵 열) */
export const DISPLAY_ORDER: readonly TypeKey[] = TYPE_KEYS

const KNOWN = new Set<string>(TYPE_ID_ORDER)

/** 분석이 아는 타입인가(stellar · ??? 는 아니다) */
export const isBattleType = (key: string): key is TypeKey => KNOWN.has(key)

/** 단일 타입 배율. 표에 없는 쌍은 1 */
export const singleMultiplier = (
  chart: MatchupChart,
  attack: string,
  defense: string
): number => chart.multipliers.get(`${attack}/${defense}`) ?? 1

/** 복합 타입 방어 배율 = 방어 타입마다 곱한다(모르는 타입은 건너뛴다) */
export function defenseMultiplier(
  chart: MatchupChart,
  attack: string,
  defenseTypes: readonly string[]
): number {
  let m = 1
  for (const d of defenseTypes)
    if (isBattleType(d)) m *= singleMultiplier(chart, attack, d)
  return m
}

/** 그 세대 상성표에 있는 타입인가 */
export const chartHasType = (chart: MatchupChart, type: string): boolean =>
  chart.types.includes(type)

/** 배율 → 글자: ≥4 "4" · ≥2 "2" · ≤0 "0" · ≤¼ "¼" · ≤½ "½" · 그 밖 "1" */
export function multiplierGlyph(m: number): string {
  if (m >= 4) return "4"
  if (m >= 2) return "2"
  if (m <= 0) return "0"
  if (m <= 0.25) return "¼"
  if (m <= 0.5) return "½"
  return "1"
}

/** 히트맵 칸 모양 단계 */
export type HeatLevel = "x4" | "x2" | "neutral" | "zero" | "quarter" | "half"

export function heatLevel(m: number): HeatLevel {
  if (m >= 4) return "x4"
  if (m >= 2) return "x2"
  if (m === 1) return "neutral"
  if (m <= 0) return "zero"
  if (m <= 0.25) return "quarter"
  if (m < 1) return "half"
  return "neutral"
}

export interface Weakness {
  type: TypeKey
  multiplier: number
}

/**
 * 카드 약점 칩: ×4 먼저(표기 순), 그다음 ×2(표기 순). 그 세대에 없는 타입은 뺀다
 */
export function weaknessesOf(
  chart: MatchupChart,
  defenseTypes: readonly string[]
): Weakness[] {
  const all = DISPLAY_ORDER.filter((t) => chartHasType(chart, t)).map((t) => ({
    type: t,
    multiplier: defenseMultiplier(chart, t, defenseTypes),
  }))
  return [
    ...all.filter((w) => w.multiplier >= 4),
    ...all.filter((w) => w.multiplier >= 2 && w.multiplier < 4),
  ]
}
