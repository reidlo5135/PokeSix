import { describe, expect, it } from "vitest"

import { format } from "../../i18n/index.ts"
import { emptyDetail, emptyMove } from "../../data/repository/types.ts"
import { costLabel } from "../rules/acquisition.ts"
import { descendsFrom, memberWarning } from "./memberWarning.ts"
import {
  orderTotals,
  tally,
  unknownSupply,
  type MachineSupply,
  type TeachPlan,
} from "./resourceLedger.ts"
import { resourceReport } from "./resourceReport.ts"

const t = (key: string, ...args: (string | number)[]) => format(key, ...args)
const supply = (patch: Partial<MachineSupply>): MachineSupply => ({
  ...unknownSupply(),
  known: true,
  ...patch,
})
const machine = (slot: number, m: string): TeachPlan => ({
  slot,
  means: "machine",
  machine: m,
})

describe("tally — resourceledger_test 그대로", () => {
  it("하트비늘", () => {
    const l = tally(
      [
        { slot: 0, means: "reminder" },
        { slot: 2, means: "reminder" },
        { slot: 3, means: "levelUp" },
      ],
      new Map()
    )
    expect(l.heartScales).toBe(2)
    expect(l.machines).toEqual([])
    expect(l.totals).toEqual([])
  })
  it("하나뿐인 기술머신을 둘이 쓰면 모자람", () => {
    const l = tally(
      [machine(0, "tm59"), machine(4, "tm59")],
      new Map([["tm59", supply({ copies: 1 })]])
    )
    expect(l.machines[0].members).toEqual([0, 4])
    expect(l.machines[0].shortfall).toBe(true)
    expect(l.machines[0].bought).toBe(0)
    expect(l.totals).toEqual([])
  })
  it("반복 입수가 있으면 더 산다", () => {
    const l = tally(
      [machine(0, "tm26"), machine(1, "tm26"), machine(5, "tm26")],
      new Map([
        [
          "tm26",
          supply({
            copies: 1,
            repeatable: true,
            repeatCost: [{ amount: 80, unit: "bp" }],
          }),
        ],
      ])
    )
    expect(l.machines[0].shortfall).toBe(false)
    expect(l.machines[0].bought).toBe(2)
    expect(l.totals).toEqual([{ amount: 160, unit: "bp" }])
  })
  it("엔딩 후 표시는 그대로 · 경고 없음", () => {
    const l = tally(
      [machine(0, "tm13")],
      new Map([
        [
          "tm13",
          supply({
            copies: 1,
            repeatable: true,
            repeatCost: [{ amount: 10000, unit: "coins" }],
            postGameOnly: true,
          }),
        ],
      ])
    )
    expect(l.machines[0].shortfall).toBe(false)
    expect(l.machines[0].bought).toBe(0)
    expect(l.machines[0].supply.postGameOnly).toBe(true)
  })
  it("사전에 없는 기술머신은 세지 않는다", () => {
    const l = tally([machine(0, "tm44"), machine(1, "tm44")], new Map())
    expect(l.machines[0].shortfall).toBe(false)
    expect(l.machines[0].bought).toBe(0)
  })
  it("가르침 비용 + 구매 합계는 단위 사전순", () => {
    const l = tally(
      [
        { slot: 0, means: "tutor", cost: [{ amount: 48, unit: "bp" }] },
        { slot: 1, means: "tutor", cost: [{ amount: 32, unit: "bp" }] },
        {
          slot: 2,
          means: "tutor",
          cost: [
            { amount: 2, unit: "red-shard" },
            { amount: 2, unit: "blue-shard" },
          ],
        },
        machine(3, "tm06"),
      ],
      new Map([
        [
          "tm06",
          supply({
            copies: 0,
            repeatable: true,
            repeatCost: [{ amount: 80, unit: "bp" }],
          }),
        ],
      ])
    )
    expect(l.totals).toEqual([
      { amount: 2, unit: "blue-shard" },
      { amount: 160, unit: "bp" },
      { amount: 2, unit: "red-shard" },
    ])
    expect(orderTotals(l.totals).map((c) => c.unit)).toEqual([
      "bp",
      "red-shard",
      "blue-shard",
    ])
  })
  it("같은 슬롯이 같은 기술머신을 두 번 써도 한 번", () => {
    const l = tally(
      [machine(2, "tm26"), machine(2, "tm26")],
      new Map([["tm26", supply({ copies: 1 })]])
    )
    expect(l.machines[0].members).toEqual([2])
    expect(l.machines[0].shortfall).toBe(false)
  })
})

describe("resourceReport", () => {
  const quake = {
    ...emptyMove(89),
    identifier: "earthquake",
    machineItem: "tm26",
    machineNumber: 26,
  }
  const outrage = { ...emptyMove(200), identifier: "outrage" }
  const detail = {
    ...emptyDetail(),
    pokemonId: 445,
    machineMoves: [quake],
    tutorMoves: [outrage],
  }
  it("기술머신 구매 · 가르침 비용 줄", () => {
    const r = resourceReport(
      [0, 1, 2].map((slot) => ({ slot, detail, moves: [quake, outrage] })),
      {
        t,
        moveName: (m) => (m.moveId === 89 ? "지진" : "역린"),
        supply: () =>
          supply({
            copies: 1,
            repeatable: true,
            repeatCost: [{ amount: 80, unit: "bp" }],
          }),
        tutorCost: () => [{ amount: 48, unit: "bp" }],
        costLabel: (a, u) => costLabel(t, a, u),
      }
    )
    expect(r.totals).toBe("304BP")
    expect(r.lines).toEqual([
      { warn: false, text: "TM26 지진 ×3 — 2개는 더 구해요 (160BP)" },
      { warn: false, text: "역린 ×3 — 가르침 144BP" },
    ])
  })
})

describe("costLabel", () => {
  it("단위 · 천 단위 쉼표", () => {
    expect(costLabel(t, 10000, "money")).toBe("10,000원")
    expect(costLabel(t, 48, "bp")).toBe("48BP")
    expect(costLabel(t, 4000, "coins")).toBe("코인 4,000")
    expect(costLabel(t, 2, "red-shard")).toBe("빨강조각 2개")
    expect(costLabel(t, 8, "mystery")).toBe("8 mystery")
  })
})

describe("memberWarning", () => {
  // 피츄(172) → 피카츄(25) → 라이츄(26), 이브이(133) → 샤미드(134) · 블래키(197)
  const evo = new Map([
    [25, 172],
    [26, 25],
    [134, 133],
    [197, 133],
    [388, 387],
    [389, 388],
  ])
  const starter = (s: number) =>
    [387, 388, 389].includes(s) ? 0 : [390, 391, 392].includes(s) ? 1 : -1
  const others = [
    { slot: 0, speciesId: 26, name: "라이츄" },
    { slot: 1, speciesId: 197, name: "블래키" },
    { slot: 2, speciesId: 388, name: "수풀부기" },
  ]
  it("거슬러 올라가기", () => {
    expect(descendsFrom(26, 172, evo)).toBe(true)
    expect(descendsFrom(172, 26, evo)).toBe(false)
  })
  it("같은 종 → 진화 관계 → 스타팅 순으로 하나만", () => {
    expect(memberWarning(3, 26, others, evo, starter)).toEqual({
      kind: "same",
      slot: 0,
    })
    expect(memberWarning(3, 172, others, evo, starter)).toEqual({
      kind: "evolved",
      name: "라이츄",
    })
    expect(memberWarning(3, 389, others, evo, starter)).toEqual({
      kind: "preEvolution",
      name: "수풀부기",
    })
    expect(memberWarning(3, 391, others, evo, starter)).toEqual({
      kind: "starter",
      name: "수풀부기",
    })
    // 형제 갈래는 경고하지 않는다
    expect(memberWarning(3, 134, others, evo, starter)).toBeNull()
    // 자기 자리는 보지 않는다
    expect(memberWarning(0, 26, others, evo, starter)).toBeNull()
  })
})
