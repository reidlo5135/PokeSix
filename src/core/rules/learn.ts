/**
 * 기술을 배우는 방법 — 스쿼드 기술 칸 · 기술 선택 창 · 리소스 투자가 같이 쓴다(순수 함수).
 * Qt squadsession.cpp learnableMoves · slotcard.cpp moveSource · squadpage.cpp refreshResources 이식.
 */
import type { MoveEntry, PokemonDetail } from "../../data/repository/types.ts"
import { machineLabel } from "../../data/repository/rules.ts"
import type { Cost, TeachPlan } from "../analysis/resourceLedger.ts"

type LearnSource = Pick<
  PokemonDetail,
  "levelMoves" | "inheritedMoves" | "machineMoves" | "tutorMoves" | "eggMoves"
>

/** 기술 선택 창의 한 줄 */
export interface LearnableMove {
  /** 그 기술이 처음 들어올 때의 값(진화 전 단계 기술이면 fromPokemonId > 0) */
  move: MoveEntry
  /** 레벨업 레벨(여러 레벨이면 가장 이른 것). −1 = 레벨업으로 못 배움 */
  level: number
  /** "TM26" · "HM03" · "" */
  machine: string
  tutor: boolean
  egg: boolean
}

/** 기술 칸 라벨에 쓰는 기술머신 이름 */
export const machineName = (move: MoveEntry): string =>
  machineLabel(move.machineItem, move.machineNumber)

/** 레벨업 → 진화 전 단계 → 기술머신 → 가르침 → 알. 같은 기술은 한 줄(처음 자리) */
export function learnableMoves(detail: LearnSource): LearnableMove[] {
  const rows: LearnableMove[] = []
  const index = new Map<number, number>()
  const row = (move: MoveEntry): LearnableMove => {
    const i = index.get(move.moveId)
    if (i !== undefined) return rows[i]
    const r: LearnableMove = {
      move,
      level: -1,
      machine: "",
      tutor: false,
      egg: false,
    }
    index.set(move.moveId, rows.length)
    rows.push(r)
    return r
  }
  for (const move of [...detail.levelMoves, ...detail.inheritedMoves]) {
    const r = row(move)
    if (r.level < 0) r.level = move.level
  }
  for (const move of detail.machineMoves) row(move).machine = machineName(move)
  for (const move of detail.tutorMoves) row(move).tutor = true
  for (const move of detail.eggMoves) row(move).egg = true
  return rows
}

/** 배울 수 있는 기술 표(같은 id는 뒤의 것이 덮는다 — Qt QHash::insert) */
export function learnableTable(detail: LearnSource): Map<number, MoveEntry> {
  const table = new Map<number, MoveEntry>()
  for (const list of [
    detail.levelMoves,
    detail.inheritedMoves,
    detail.machineMoves,
    detail.tutorMoves,
    detail.eggMoves,
  ])
    for (const move of list) table.set(move.moveId, move)
  return table
}

/** 기술 칸의 작은 "배우는 방법" 표시 */
export type LearnBadge =
  | { kind: "level"; level: number }
  | { kind: "reminder" }
  | { kind: "machine"; label: string }
  | { kind: "tutor" }
  | { kind: "egg" }

/** 진화 전 단계 기술(inheritedMoves)은 보지 않는다 — Qt 그대로 */
export function learnBadge(
  detail: LearnSource,
  moveId: number
): LearnBadge | null {
  let reminder = false
  for (const e of detail.levelMoves)
    if (e.moveId === moveId) {
      if (!e.needsReminder) return { kind: "level", level: e.level }
      reminder = true
    }
  if (reminder) return { kind: "reminder" }
  const machine = detail.machineMoves.find((m) => m.moveId === moveId)
  if (machine) return { kind: "machine", label: machineName(machine) }
  if (detail.tutorMoves.some((m) => m.moveId === moveId))
    return { kind: "tutor" }
  if (detail.eggMoves.some((m) => m.moveId === moveId)) return { kind: "egg" }
  return null
}

/**
 * 리소스 투자용: 칸 하나를 어떻게 배우는가. 자력 줄이 하나라도 있으면 공짜(하트비늘 줄만이면 하트비늘),
 * 그다음 기술머신(비전머신 제외), 가르침. 그 밖(비전머신 · 알 · 진화 전 단계)은 집계 밖
 */
export function teachPlan(
  slot: number,
  detail: LearnSource,
  move: MoveEntry,
  tutorCost: (identifier: string) => Cost[]
): TeachPlan {
  let level: MoveEntry | null = null
  for (const e of detail.levelMoves)
    if (e.moveId === move.moveId && (level === null || !e.needsReminder))
      level = e
  const machine = detail.machineMoves
    .filter((m) => m.moveId === move.moveId)
    .at(-1)
  if (level)
    return { slot, means: level.needsReminder ? "reminder" : "levelUp" }
  if (machine && !machine.hiddenMachine)
    return { slot, means: "machine", machine: machine.machineItem }
  if (detail.tutorMoves.some((m) => m.moveId === move.moveId))
    return { slot, means: "tutor", cost: tutorCost(move.identifier) }
  return { slot, means: "other" }
}
