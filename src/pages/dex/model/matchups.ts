/**
 * 타입 상성(Qt MatchupView 이식): 받을 때(방어) ×4 ×2 ×½ ×¼ ×0, 자속 기술로 줄 때(공격) ×2 ×½ ×0.
 * 그 세대에 없는 공격 타입(페어리 · 악 · 강철)은 처음 나온 세대의 상성표로 계산해 점선 칩으로 단다.
 */
import { typeChartAt, type TypeChart } from "../../../data/repository/types.ts"
import {
  TYPE_INFO,
  TYPE_KEYS,
  isTypeKey,
} from "../../../shared/pokemonTypes.ts"

export type HeatTone = "x4" | "x2" | "half" | "quarter" | "zero"

export interface MatchupRow {
  multiplier: number
  label: string
  tone: HeatTone
  types: string[]
  /** 그 세대에 없는 타입: 처음 나온 세대 */
  absent: { type: string; introGen: number }[]
}

const ROWS: readonly { multiplier: number; label: string; tone: HeatTone }[] = [
  { multiplier: 4, label: "×4", tone: "x4" },
  { multiplier: 2, label: "×2", tone: "x2" },
  { multiplier: 0.5, label: "×½", tone: "half" },
  { multiplier: 0.25, label: "×¼", tone: "quarter" },
  { multiplier: 0, label: "×0", tone: "zero" },
]

/** 디자인 순서(노말 불꽃 물 …)로 그 세대 타입 */
export const typesInDesignOrder = (chart: TypeChart): string[] =>
  TYPE_KEYS.filter((type) => chart.types.includes(type))

/** 공격 타입 하나가 방어 타입들에게 주는 배율(곱) */
export const multiplierAgainst = (
  chart: TypeChart,
  attack: string,
  defense: readonly string[]
): number => defense.reduce((m, d) => m * typeChartAt(chart, attack, d), 1)

function emptyRows(): MatchupRow[] {
  return ROWS.map((r) => ({ ...r, types: [], absent: [] }))
}

/**
 * 받을 때. chartOf(g) = g세대 상성표(그 세대에 없는 타입 계산용 — 페어리 6, 악 · 강철 2).
 * 빈 줄 · ×1은 뺀다
 */
export function defenseRows(
  defense: readonly string[],
  chart: TypeChart,
  chartOf: (generation: number) => TypeChart
): MatchupRow[] {
  const rows = emptyRows()
  const rowOf = (m: number) => rows.find((r) => r.multiplier === m)
  for (const attack of typesInDesignOrder(chart))
    rowOf(multiplierAgainst(chart, attack, defense))?.types.push(attack)
  if (defense.length > 0)
    for (const attack of TYPE_KEYS) {
      if (chart.types.includes(attack)) continue
      const introGen = TYPE_INFO[attack].introGen
      const m = multiplierAgainst(chartOf(introGen), attack, defense)
      if (m !== 1) rowOf(m)?.absent.push({ type: attack, introGen })
    }
  return rows.filter((r) => r.types.length > 0 || r.absent.length > 0)
}

/** 자속 기술로 줄 때: 방어 타입마다 내 타입 중 가장 센 배율. ×2 · ×½ · ×0만 */
export function offenseRows(
  own: readonly string[],
  chart: TypeChart
): MatchupRow[] {
  const rows = emptyRows().filter((r) => [2, 0.5, 0].includes(r.multiplier))
  const attacks = own.filter(isTypeKey)
  if (attacks.length === 0) return []
  for (const defense of typesInDesignOrder(chart)) {
    const best = Math.max(...attacks.map((a) => typeChartAt(chart, a, defense)))
    rows.find((r) => r.multiplier === best)?.types.push(defense)
  }
  return rows.filter((r) => r.types.length > 0)
}
