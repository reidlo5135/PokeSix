import { describe, expect, it } from "vitest"

import { emptyDetail, emptyMove } from "../../data/repository/types.ts"
import { format } from "../../i18n/index.ts"
import {
  itemSupply,
  parseAcquisitionBook,
  tutorCostAmounts,
  tutorCostText,
} from "./acquisition.ts"
import { featuresOf, typeExistsInGeneration } from "./generationFeatures.ts"
import { learnableMoves, learnBadge, teachPlan } from "./learn.ts"
import {
  describeMoveEffect,
  effectPlainText,
  firstSentence,
  parseMoveEffects,
} from "./moveEffect.ts"
import { parseStarters, starterLineOf } from "./starters.ts"

const t = (key: string, ...args: (string | number)[]) => format(key, ...args)

describe("featuresOf", () => {
  it("세대 표", () => {
    expect(featuresOf(1).heldItems).toBe(false)
    expect(featuresOf(2).heldItems).toBe(true)
    expect(featuresOf(2).abilities).toBe(false)
    expect(featuresOf(3).natures).toBe(true)
    expect(featuresOf(3).splitByMove).toBe(false)
    expect(featuresOf(4).splitByMove).toBe(true)
    expect(featuresOf(6).hiddenMachines).toBe(true)
    expect(featuresOf(7).hiddenMachines).toBe(false)
    expect(featuresOf(9)).toEqual(featuresOf(7))
    expect(featuresOf(0)).toEqual(featuresOf(1))
    expect(typeExistsInGeneration("dark", 1)).toBe(false)
    expect(typeExistsInGeneration("fairy", 5)).toBe(false)
    expect(typeExistsInGeneration("fairy", 6)).toBe(true)
  })
})

describe("starters", () => {
  it("계통 번호 · 없는 게임", () => {
    expect(starterLineOf("platinum", 389)).toBe(0)
    expect(starterLineOf("heartgold-soulsilver", 158)).toBe(2)
    expect(starterLineOf("platinum", 25)).toBe(-1)
    expect(starterLineOf("yellow", 25)).toBe(-1)
  })
  it("틀린 모양은 버린다", () => {
    const book = parseStarters({ starters: { x: [[1, "a", 2], "no"] } })
    expect(book.get("x")).toEqual([[1, 2]])
    expect(parseStarters(null).size).toBe(0)
  })
})

describe("acquisition", () => {
  const book = parseAcquisitionBook(
    {
      items: {
        tm26: [
          { how: "field", where: "a" },
          { how: "shop", cost: [{ amount: 80, unit: "bp" }] },
          { how: "other" },
        ],
        tm59: [{ how: "gift", versions: ["heartgold"] }, { where: "x" }],
        tm13: [
          {
            how: "prize",
            region: "kanto",
            cost: [{ amount: 4000, unit: "coins" }],
          },
        ],
        bad: "nope",
      },
      tutors: {
        outrage: [
          {
            how: "tutor",
            place: "212번 도로",
            cost: [
              { amount: 2, unit: "red-shard" },
              { amount: 1.5, unit: "x" },
            ],
          },
        ],
      },
      extra: true,
    },
    "heartgold-soulsilver"
  )
  it("공급 사정", () => {
    expect(itemSupply(book, "tm26", "heartgold")).toEqual({
      known: true,
      copies: 1,
      repeatable: true,
      repeatCost: [{ amount: 80, unit: "bp" }],
      postGameOnly: false,
    })
    expect(itemSupply(book, "tm59", "heartgold").copies).toBe(1)
    expect(itemSupply(book, "tm59", "soulsilver").known).toBe(false)
    expect(itemSupply(book, "tm13", "soulsilver").postGameOnly).toBe(true)
    expect(itemSupply(book, "nope", "").known).toBe(false)
  })
  it("가르침 비용", () => {
    expect(tutorCostAmounts(book, "outrage", "heartgold")).toEqual([
      { amount: 2, unit: "red-shard" },
    ])
    expect(tutorCostText(t, book, "outrage", "ko")).toBe(
      "212번 도로 · 빨강조각 2개"
    )
  })
})

describe("learn", () => {
  const lv = (id: number, level: number, reminder = false, from = 0) => ({
    ...emptyMove(id),
    level,
    needsReminder: reminder,
    fromPokemonId: from,
  })
  const tm = (id: number, n: number, hm = false) => ({
    ...emptyMove(id),
    machineItem: `${hm ? "hm" : "tm"}${String(n).padStart(2, "0")}`,
    machineNumber: n,
    hiddenMachine: hm,
  })
  const detail = {
    ...emptyDetail(),
    levelMoves: [lv(33, 1), lv(89, 50, true), lv(89, 60)],
    inheritedMoves: [lv(309, 43, false, 35)],
    machineMoves: [tm(89, 26), tm(57, 3, true)],
    tutorMoves: [{ ...emptyMove(200), identifier: "outrage" }],
    eggMoves: [emptyMove(14)],
  }
  it("learnableMoves — 한 줄로 합치고 처음 자리를 지킨다", () => {
    const rows = learnableMoves(detail)
    expect(rows.map((r) => r.move.moveId)).toEqual([33, 89, 309, 57, 200, 14])
    expect(rows[1]).toMatchObject({ level: 50, machine: "TM26" })
    expect(rows[2].move.fromPokemonId).toBe(35)
    expect(rows[3].machine).toBe("HM03")
    expect(rows[4].tutor).toBe(true)
    expect(rows[5].egg).toBe(true)
  })
  it("learnBadge", () => {
    expect(learnBadge(detail, 33)).toEqual({ kind: "level", level: 1 })
    expect(learnBadge(detail, 89)).toEqual({ kind: "level", level: 60 })
    expect(learnBadge(detail, 57)).toEqual({ kind: "machine", label: "HM03" })
    expect(learnBadge(detail, 200)).toEqual({ kind: "tutor" })
    expect(learnBadge(detail, 14)).toEqual({ kind: "egg" })
    expect(learnBadge(detail, 309)).toBeNull()
    expect(
      learnBadge({ ...detail, levelMoves: [lv(89, 50, true)] }, 89)
    ).toEqual({ kind: "reminder" })
  })
  it("teachPlan", () => {
    const cost = () => [{ amount: 48, unit: "bp" }]
    expect(teachPlan(0, detail, emptyMove(89), cost).means).toBe("levelUp")
    expect(
      teachPlan(0, { ...detail, levelMoves: [] }, emptyMove(89), cost)
    ).toEqual({ slot: 0, means: "machine", machine: "tm26" })
    expect(teachPlan(1, detail, emptyMove(57), cost).means).toBe("other")
    expect(
      teachPlan(2, detail, { ...emptyMove(200), identifier: "outrage" }, cost)
    ).toEqual({ slot: 2, means: "tutor", cost: cost() })
    expect(
      teachPlan(
        0,
        { ...detail, levelMoves: [lv(5, 9, true)] },
        emptyMove(5),
        cost
      ).means
    ).toBe("reminder")
  })
})

describe("moveEffect", () => {
  const base = {
    identifier: "",
    target: 10,
    ailment: 0,
    healing: 0,
    statChanges: [] as [number, number][],
    effect: { ko: "", en: "", ja: "" },
  }
  const rules = parseMoveEffects({
    moves: {
      growth: { history: [{ untilGen: 4, stats: [[4, 1]] }] },
      curse: {
        userType: "ghost",
        userTypeNote: { ko: "HP ½ 깎고 저주" },
      },
    },
  })
  it("능력치 · 대상 · 세대 옛 값", () => {
    const growth = {
      ...base,
      identifier: "growth",
      target: 7,
      statChanges: [
        [2, 1],
        [4, 1],
      ] as [number, number][],
    }
    expect(
      effectPlainText(describeMoveEffect(growth, 4, [], "ko", t, rules))
    ).toBe("특공 ▲1")
    expect(
      effectPlainText(describeMoveEffect(growth, 5, [], "ko", t, rules))
    ).toBe("공격 ▲1 · 특공 ▲1")
    const growl = { ...base, statChanges: [[2, -1]] as [number, number][] }
    expect(
      effectPlainText(describeMoveEffect(growl, 4, [], "ko", t, rules))
    ).toBe("상대 공격 ▼1")
  })
  it("1세대 특수 하나로 합치기 · 상태이상 · 회복 · 사용자 타입", () => {
    const amnesia = {
      ...base,
      target: 7,
      statChanges: [
        [4, 2],
        [5, 2],
      ] as [number, number][],
    }
    expect(
      effectPlainText(describeMoveEffect(amnesia, 1, [], "ko", t, rules))
    ).toBe("특수 ▲2")
    expect(
      effectPlainText(
        describeMoveEffect({ ...base, ailment: 1 }, 4, [], "ko", t, rules)
      )
    ).toBe("상대 마비")
    expect(
      effectPlainText(
        describeMoveEffect(
          { ...base, target: 7, healing: 50 },
          4,
          [],
          "ko",
          t,
          rules
        )
      )
    ).toBe("HP ½ 회복")
    expect(
      effectPlainText(
        describeMoveEffect(
          { ...base, identifier: "curse" },
          4,
          ["ghost"],
          "ko",
          t,
          rules
        )
      )
    ).toBe("HP ½ 깎고 저주")
  })
  it("뼈대가 없으면 설명문 첫 문장", () => {
    expect(firstSentence("A한다. B한다.")).toBe("A한다.")
    expect(
      effectPlainText(
        describeMoveEffect(
          { ...base, effect: { ko: "벽을 만든다. 5턴.", en: "", ja: "" } },
          4,
          [],
          "ko",
          t,
          rules
        )
      )
    ).toBe("벽을 만든다.")
  })
})
