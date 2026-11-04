/**
 * 리소스 투자 — Qt core/analysis/resourceledger 이식. 하트비늘 · 기술머신 · NPC 가르침 비용을 센다.
 * 한 게임에 하나뿐인 기술머신을 두 자리에 두면 모자람(shortfall)으로 경고한다.
 */
export interface Cost {
  amount: number
  /** 입수 사전 단위 그대로: "bp" · "coins" · "red-shard" · "money" … */
  unit: string
}

/** 기술 칸 하나를 배우는 방법 */
export type Means = "levelUp" | "reminder" | "machine" | "tutor" | "other"

export interface TeachPlan {
  slot: number
  means: Means
  /** machine: 기술머신 아이템 identifier("tm26") */
  machine?: string
  /** tutor: 한 번 배우는 비용 */
  cost?: Cost[]
}

export interface MachineSupply {
  /** 입수 사전에 이 기술머신이 있다(모르면 경고도 비용도 없다) */
  known: boolean
  /** 한 번만 얻는 입수처 수 */
  copies: number
  /** 반복 입수처(상점 · 교환 · 경품)가 있다 */
  repeatable: boolean
  repeatCost: Cost[]
  /** 모든 입수처가 엔딩 후 지역 */
  postGameOnly: boolean
}

export const unknownSupply = (): MachineSupply => ({
  known: false,
  copies: 0,
  repeatable: false,
  repeatCost: [],
  postGameOnly: false,
})

export interface MachineUse {
  machine: string
  /** 이 기술머신이 필요한 슬롯(들어온 순서, 중복 없이) */
  members: number[]
  /** 반복 입수로 더 구할 수 = 쓰임 − copies (반복 입수가 있을 때만) */
  bought: number
  /** 쓰임 > copies인데 반복 입수가 없다 */
  shortfall: boolean
  supply: MachineSupply
}

export interface Ledger {
  heartScales: number
  /** machine identifier 사전순 */
  machines: MachineUse[]
  /** 단위 이름 사전순 */
  totals: Cost[]
}

const byKey = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

export function tally(
  plans: readonly TeachPlan[],
  supplies: ReadonlyMap<string, MachineSupply>
): Ledger {
  let heartScales = 0
  const totals = new Map<string, number>()
  const add = (c: Cost, times = 1) =>
    totals.set(c.unit, (totals.get(c.unit) ?? 0) + c.amount * times)
  const machines = new Map<string, MachineUse>()

  for (const plan of plans) {
    if (plan.means === "reminder") heartScales += 1
    else if (plan.means === "machine" && plan.machine) {
      let use = machines.get(plan.machine)
      if (!use) {
        use = {
          machine: plan.machine,
          members: [],
          bought: 0,
          shortfall: false,
          supply: unknownSupply(),
        }
        machines.set(plan.machine, use)
      }
      if (!use.members.includes(plan.slot)) use.members.push(plan.slot)
    } else if (plan.means === "tutor") for (const c of plan.cost ?? []) add(c)
  }

  const uses = [...machines.values()].sort((a, b) =>
    byKey(a.machine, b.machine)
  )
  for (const use of uses) {
    use.supply = supplies.get(use.machine) ?? unknownSupply()
    const missing = use.members.length - use.supply.copies
    if (use.supply.known && missing > 0) {
      if (use.supply.repeatable) {
        use.bought = missing
        for (const c of use.supply.repeatCost) add(c, missing)
      } else use.shortfall = true
    }
  }

  return {
    heartScales,
    machines: uses,
    totals: [...totals.entries()]
      .sort((a, b) => byKey(a[0], b[0]))
      .map(([unit, amount]) => ({ amount, unit })),
  }
}

/** 합계 글자 순서: 이 단위들 먼저(이 순서), 나머지는 뒤에(이미 사전순) */
export const TOTAL_UNIT_ORDER: readonly string[] = [
  "bp",
  "coins",
  "red-shard",
  "blue-shard",
  "yellow-shard",
  "green-shard",
  "money",
]

export function orderTotals(totals: readonly Cost[]): Cost[] {
  const rank = (u: string) => {
    const i = TOTAL_UNIT_ORDER.indexOf(u)
    return i < 0 ? TOTAL_UNIT_ORDER.length : i
  }
  return [...totals].sort((a, b) => rank(a.unit) - rank(b.unit))
}
