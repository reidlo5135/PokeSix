/**
 * 리소스 투자 칸의 글자 — Qt squadpage.cpp refreshResources 이식.
 * 채운 기술 칸마다 배우는 방법을 정해 tally로 세고, 합계 한 줄 + 설명 줄들을 만든다.
 */
import type { MoveEntry, PokemonDetail } from "../../data/repository/types.ts"
import { machineName, teachPlan } from "../rules/learn.ts"
import {
  orderTotals,
  tally,
  type Cost,
  type MachineSupply,
  type TeachPlan,
} from "./resourceLedger.ts"

export type TextFn = (key: string, ...args: (string | number)[]) => string

export interface ResourceSlot {
  slot: number
  detail: PokemonDetail
  /** 배울 수 있는 기술(칸 순) */
  moves: readonly MoveEntry[]
}

export interface ResourceDeps {
  t: TextFn
  /** 기술 이름(지금 언어) */
  moveName: (move: MoveEntry) => string
  supply: (machineItem: string) => MachineSupply
  tutorCost: (identifier: string) => Cost[]
  costLabel: (amount: number, unit: string) => string
}

export interface ResourceLine {
  /** 모자람 — 앞에 빨강 ⚠ */
  warn: boolean
  text: string
}

export interface ResourceReport {
  /** 제목 오른쪽 합계("하트비늘 2개 · 160BP"). 없으면 "" */
  totals: string
  lines: ResourceLine[]
}

export function resourceReport(
  slots: readonly ResourceSlot[],
  deps: ResourceDeps
): ResourceReport {
  const { t, costLabel } = deps
  const plans: TeachPlan[] = []
  const supplies = new Map<string, MachineSupply>()
  const machineNames = new Map<string, string>()
  const tutors = new Map<
    number,
    { name: string; count: number; cost: Cost[] }
  >()

  for (const { slot, detail, moves } of slots)
    for (const move of moves) {
      const plan = teachPlan(slot, detail, move, deps.tutorCost)
      if (plan.means === "machine" && plan.machine) {
        if (!supplies.has(plan.machine))
          supplies.set(plan.machine, deps.supply(plan.machine))
        const entry = detail.machineMoves
          .filter((m) => m.moveId === move.moveId)
          .at(-1)
        if (entry)
          machineNames.set(
            plan.machine,
            `${machineName(entry)} ${deps.moveName(move)}`
          )
      } else if (plan.means === "tutor") {
        const use = tutors.get(move.moveId) ?? {
          name: deps.moveName(move),
          count: 0,
          cost: plan.cost ?? [],
        }
        use.count += 1
        tutors.set(move.moveId, use)
      }
      plans.push(plan)
    }

  const ledger = tally(plans, supplies)
  const totals: string[] = []
  if (ledger.heartScales > 0)
    totals.push(costLabel(ledger.heartScales, "heart-scale"))
  for (const c of orderTotals(ledger.totals))
    totals.push(costLabel(c.amount, c.unit))

  const lines: ResourceLine[] = []
  for (const use of ledger.machines) {
    const name = machineNames.get(use.machine) ?? use.machine
    const uses = use.members.length
    const head = uses > 1 ? t("%1 ×%2", name, uses) : name
    const notes: string[] = []
    if (use.shortfall)
      notes.push(t("이 게임에 %1개뿐이에요", use.supply.copies))
    if (use.bought > 0) {
      const price = use.supply.repeatCost.map((c) =>
        costLabel(c.amount * use.bought, c.unit)
      )
      notes.push(
        price.length === 0
          ? t("%1개는 더 구해요", use.bought)
          : t("%1개는 더 구해요 (%2)", use.bought, price.join(" + "))
      )
    }
    if (use.supply.postGameOnly) notes.push(t("관동 — 엔딩 후"))
    if (notes.length === 0) continue
    lines.push({
      warn: use.shortfall,
      text: `${head} — ${notes.join(" · ")}`,
    })
  }
  for (const [, use] of [...tutors.entries()].sort((a, b) => a[0] - b[0])) {
    const price = use.cost.map((c) => costLabel(c.amount * use.count, c.unit))
    if (price.length === 0) continue
    const head = use.count > 1 ? t("%1 ×%2", use.name, use.count) : use.name
    lines.push({
      warn: false,
      text: t("%1 — 가르침 %2", head, price.join(" + ")),
    })
  }
  return { totals: totals.join(" · "), lines }
}
