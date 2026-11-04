/**
 * 스쿼드 분석 — Qt core/analysis/squadanalyzer + data/analysis/squadinput 이식(순수 함수).
 * 세대를 모르고 입력(상성표 · 멤버 타입 · 배울 수 있는 기술)만 본다. 6자리 × 18타입을 매번 처음부터 센다.
 */
import {
  isBattleType,
  singleMultiplier,
  type MatchupChart,
} from "../typechart/index.ts"

export const SQUAD_SLOTS = 6
export const MOVE_SLOTS = 4

export const STATUS_CLASS = 1
export const PHYSICAL_CLASS = 2
export const SPECIAL_CLASS = 3

export interface AnalyzerMove {
  /** 그 세대 타입 key. ??? 타입이면 "" */
  type: string
  /** 그 세대 규칙을 적용한 분류(1 변화 · 2 물리 · 3 특수) */
  damageClass: number
  /** 반대 규칙이었다면의 분류(없으면 damageClass) */
  otherClass?: number
}

export interface AnalyzerMember {
  types: readonly string[]
  /** 배울 수 있는 기술만, 칸 순서 */
  moves: readonly AnalyzerMove[]
}

export interface SquadInput {
  /** 분석할 타입(그 세대, id 순) */
  types: string[]
  chart: MatchupChart
  /** 6칸, null = 빈 자리(또는 그 세대에 없는 포켓몬) */
  members: (AnalyzerMember | null)[]
}

export type ProblemKind = "weakStack" | "noResist" | "quad" | "noCoverage"

export interface Problem {
  kind: ProblemKind
  type: string
  /** 관련 슬롯(공격 문제는 빈 목록) */
  members: number[]
}

export interface Split {
  physical: number
  special: number
  status: number
  empty: number
}

export interface SquadAnalysis {
  types: string[]
  /** 입력 상성표(설명 글이 공격 타입을 찾을 때) */
  chart: MatchupChart
  /** 채운 슬롯(0→5) */
  filledSlots: number[]
  /** [슬롯][공격 타입] 받는 배율 */
  received: Record<string, number>[]
  weak: Record<string, number>
  resist: Record<string, number>
  covered: Record<string, boolean>
  hasAttackingMove: boolean
  filled: number
  split: Split
  /** 반대 규칙(1–3세대 ↔ 4세대~)이었다면의 분포 */
  otherSplit: Split
  problems: Problem[]
}

const normalizeClass = (c: number): number =>
  c === PHYSICAL_CLASS || c === SPECIAL_CLASS ? c : STATUS_CLASS

/** 상성표 · 멤버 → 분석 입력. 모르는 타입(stellar 등)은 빠진다 */
export function makeSquadInput(
  chart: MatchupChart,
  members: readonly (AnalyzerMember | null)[]
): SquadInput {
  const types = chart.types.filter(isBattleType)
  return {
    types,
    chart,
    members: Array.from({ length: SQUAD_SLOTS }, (_, slot) => {
      const m = members[slot]
      if (!m) return null
      return {
        types: m.types.filter(isBattleType),
        moves: m.moves.map((move) => ({
          type: isBattleType(move.type) ? move.type : "",
          damageClass: normalizeClass(move.damageClass),
          otherClass: normalizeClass(move.otherClass ?? move.damageClass),
        })),
      }
    }),
  }
}

const emptySplit = (): Split => ({
  physical: 0,
  special: 0,
  status: 0,
  empty: 0,
})

function countInto(split: Split, damageClass: number): void {
  if (damageClass === PHYSICAL_CLASS) split.physical += 1
  else if (damageClass === SPECIAL_CLASS) split.special += 1
  else split.status += 1
}

export function analyzeSquad(input: SquadInput): SquadAnalysis {
  const { types, chart } = input
  const at = (a: string, d: string) => singleMultiplier(chart, a, d)
  const ones = () => Object.fromEntries(types.map((t) => [t, 1]))
  const zeros = () => Object.fromEntries(types.map((t) => [t, 0]))
  const result: SquadAnalysis = {
    types,
    chart,
    filledSlots: [],
    received: Array.from({ length: SQUAD_SLOTS }, ones),
    weak: zeros(),
    resist: zeros(),
    covered: Object.fromEntries(types.map((t) => [t, false])),
    hasAttackingMove: false,
    filled: 0,
    split: emptySplit(),
    otherSplit: emptySplit(),
    problems: [],
  }

  input.members.forEach((member, slot) => {
    if (!member) return
    result.filled += 1
    result.filledSlots.push(slot)
    for (const attack of types) {
      let m = 1
      for (const d of member.types) m *= at(attack, d)
      result.received[slot][attack] = m
      if (m > 1) result.weak[attack] += 1
      else if (m < 1) result.resist[attack] += 1 // ×0도 받아낸다
    }
    for (const move of member.moves) {
      countInto(result.split, move.damageClass)
      countInto(result.otherSplit, move.otherClass ?? move.damageClass)
    }
    const empty = Math.max(0, MOVE_SLOTS - member.moves.length)
    result.split.empty += empty
    result.otherSplit.empty += empty
    for (const move of member.moves) {
      if (move.damageClass === STATUS_CLASS || move.type === "") continue
      result.hasAttackingMove = true
      for (const defense of types)
        if (at(move.type, defense) > 1) result.covered[defense] = true
    }
  })

  const hurt = (t: string, min: number) =>
    result.filledSlots.filter((s) =>
      min === 2 ? result.received[s][t] > 1 : result.received[s][t] >= min
    )

  // 종류 순(바깥) → 타입 id 순(안)
  for (const t of types)
    if (result.weak[t] >= 3)
      result.problems.push({ kind: "weakStack", type: t, members: hurt(t, 2) })
  for (const t of types)
    if (result.weak[t] === 2 && result.resist[t] === 0)
      result.problems.push({ kind: "noResist", type: t, members: hurt(t, 2) })
  for (const t of types) {
    const quad = hurt(t, 4)
    if (quad.length > 0)
      result.problems.push({ kind: "quad", type: t, members: quad })
  }
  if (result.hasAttackingMove)
    for (const t of types)
      if (!result.covered[t])
        result.problems.push({ kind: "noCoverage", type: t, members: [] })
  return result
}

export const isDefenseProblem = (p: Problem): boolean => p.kind !== "noCoverage"

/** 히트맵 테두리를 두를 "문제 열"(디자인: 약점 쌓임 · 받아낼 포켓몬 없음만) */
export function problemColumns(analysis: SquadAnalysis): Set<string> {
  return new Set(
    analysis.problems
      .filter((p) => p.kind === "weakStack" || p.kind === "noResist")
      .map((p) => p.type)
  )
}

/** 막대 기준 칸 수 = 채운 포켓몬 × 4 */
export const splitTotal = (s: Split): number =>
  s.physical + s.special + s.status + s.empty
