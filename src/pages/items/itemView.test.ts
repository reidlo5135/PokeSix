import { describe, expect, it } from "vitest"

import type { GameInfo, ItemRow } from "../../data/repository/types.ts"
import { ALL_GROUP, groupFilter, ITEM_STYLE } from "./itemGroups.ts"
import {
  evolutionNoteParts,
  nextIndex,
  onlyIn,
  scrollToReveal,
  sortItems,
  visibleItems,
  windowRange,
  type ItemQuery,
} from "./itemView.ts"

const bits = (...gens: number[]) =>
  gens.reduce((acc, g) => acc | (1 << (g - 1)), 0)

function row(id: number, ko: string, over: Partial<ItemRow> = {}): ItemRow {
  return {
    id,
    identifier: `item-${id}`,
    category: "healing",
    pocket: "medicine",
    name: { ko, en: "", ja: "" },
    generations: bits(1, 2, 3, 4, 5, 6, 7, 8, 9),
    effect: { ko: "", en: "", ja: "" },
    cost: 0,
    machineMove: { ko: "", en: "", ja: "" },
    machineType: "",
    ...over,
  }
}

const query = (over: Partial<ItemQuery> = {}): ItemQuery => ({
  generation: 4,
  onlyThisGeneration: false,
  group: groupFilter(ITEM_STYLE, ALL_GROUP),
  allowed: new Set(),
  search: "",
  sort: "name",
  language: "ko",
  ...over,
})

describe("정렬", () => {
  it("가나다순은 숫자를 숫자로 (기술머신100은 10 · 11 뒤)", () => {
    const rows = [
      row(1, "기술머신100"),
      row(2, "기술머신11"),
      row(3, "기술머신10"),
    ]
    expect(sortItems(rows, "name", "ko").map((r) => r.id)).toEqual([3, 2, 1])
  })

  it("가격순: 비매품은 늘 맨 뒤, 같은 값은 id 순", () => {
    const rows = [
      row(1, "가", { cost: 0 }),
      row(2, "나", { cost: 300 }),
      row(3, "다", { cost: 100 }),
      row(4, "라", { cost: 300 }),
    ]
    expect(sortItems(rows, "priceAsc", "ko").map((r) => r.id)).toEqual([
      3, 2, 4, 1,
    ])
    expect(sortItems(rows, "priceDesc", "ko").map((r) => r.id)).toEqual([
      2, 4, 3, 1,
    ])
  })

  it("등장 세대순, 같으면 가나다", () => {
    const rows = [
      row(1, "다", { generations: bits(4, 5) }),
      row(2, "나", { generations: bits(2, 3) }),
      row(3, "가", { generations: bits(4) }),
    ]
    expect(sortItems(rows, "intro", "ko").map((r) => r.id)).toEqual([2, 3, 1])
  })

  it("받은 배열은 그대로", () => {
    const rows = [row(2, "나"), row(1, "가")]
    sortItems(rows, "name", "ko")
    expect(rows.map((r) => r.id)).toEqual([2, 1])
  })
})

describe("거르기", () => {
  const rows = [
    row(1, "상처약", {
      effect: { ko: "HP를 회복", en: "Restores HP", ja: "" },
    }),
    row(2, "각성의돌", {
      category: "evolution",
      pocket: "misc",
      generations: bits(4, 5),
    }),
    row(3, "얼음의돌", {
      category: "evolution",
      pocket: "misc",
      generations: bits(7, 8, 9),
    }),
    row(4, "기술머신01", {
      category: "all-machines",
      pocket: "machines",
      machineMove: { ko: "힘껏펀치", en: "Focus Punch", ja: "" },
    }),
    row(5, "숨김", { category: "unused", pocket: "key" }),
  ]

  it("전체 = 숨김 분류만 뺀다", () => {
    expect(visibleItems(rows, query()).map((r) => r.id)).toEqual([2, 4, 1, 3])
  })

  it("묶음 · 세대 · 검색(세 언어, 기술 이름 포함)", () => {
    const evo = query({ group: groupFilter(ITEM_STYLE, "evolution") })
    expect(visibleItems(rows, evo).map((r) => r.id)).toEqual([2, 3])
    expect(
      visibleItems(rows, { ...evo, onlyThisGeneration: true }).map((r) => r.id)
    ).toEqual([2])
    expect(
      visibleItems(rows, query({ search: "focus" })).map((r) => r.id)
    ).toEqual([4])
    expect(
      visibleItems(rows, query({ search: "  restores " })).map((r) => r.id)
    ).toEqual([1])
  })

  it("완전 목록 사전이 있으면 그 게임 아이템 + 기술머신만", () => {
    const allowed = new Set(["item-1"])
    expect(visibleItems(rows, query({ allowed })).map((r) => r.id)).toEqual([
      4, 1,
    ])
  })
})

describe("버전 한정", () => {
  const hgss: GameInfo = {
    versionGroup: "heartgold-soulsilver",
    versions: ["heartgold", "soulsilver"],
    versionNames: [],
  }
  const others: Record<string, Set<number>> = {
    heartgold: new Set([52]), // 나옹: SS에서만
    soulsilver: new Set([56]),
  }
  const other = (v: string) => others[v] ?? new Set<number>()

  it("다른 버전에서만 얻는 종은 그 버전 이름", () => {
    expect(onlyIn(hgss, 52, other)).toEqual(["soulsilver"])
    expect(onlyIn(hgss, 56, other)).toEqual(["heartgold"])
  })
  it("모든 버전에서 되거나 버전이 하나면 []", () => {
    expect(onlyIn(hgss, 25, other)).toEqual([])
    expect(
      onlyIn({ ...hgss, versions: ["platinum"] }, 52, () => new Set([52]))
    ).toEqual([])
    expect(onlyIn(undefined, 52, other)).toEqual([])
  })
})

describe("진화 보조 글자", () => {
  it("성별 · 지닌 채 진화 방법 · 버전 약칭", () => {
    expect(evolutionNoteParts(false, 2, 3, [])).toEqual({
      gender: "male",
      held: null,
      versions: [],
    })
    expect(evolutionNoteParts(true, 0, 2, ["SS", ""])).toEqual({
      gender: null,
      held: "trade",
      versions: ["SS"],
    })
    expect(evolutionNoteParts(true, 1, 1, []).held).toBe("levelUp")
    expect(evolutionNoteParts(true, 0, 7, []).held).toBe("other")
  })
})

describe("키보드 · 가상 스크롤", () => {
  it("↑↓ · Page · Home/End, 끝에서 멈춘다", () => {
    expect(nextIndex("ArrowDown", -1, 10, 5)).toBe(0)
    expect(nextIndex("ArrowDown", 9, 10, 5)).toBe(9)
    expect(nextIndex("ArrowUp", 0, 10, 5)).toBe(0)
    expect(nextIndex("PageDown", 2, 10, 5)).toBe(7)
    expect(nextIndex("PageUp", 2, 10, 5)).toBe(0)
    expect(nextIndex("End", 2, 10, 5)).toBe(9)
    expect(nextIndex("Home", 5, 10, 5)).toBe(0)
    expect(nextIndex("a", 5, 10, 5)).toBeNull()
    expect(nextIndex("ArrowDown", -1, 0, 5)).toBeNull()
  })

  it("보이는 구간 + 덤", () => {
    expect(windowRange(0, 340, 34, 1000, 2)).toEqual([0, 12])
    expect(windowRange(3400, 340, 34, 1000, 2)).toEqual([98, 112])
    expect(windowRange(0, 340, 34, 3, 2)).toEqual([0, 3])
  })

  it("고른 줄을 가장자리에 맞춰 보인다", () => {
    expect(scrollToReveal(0, 100, 340, 34)).toBe(0)
    expect(scrollToReveal(20, 0, 340, 34)).toBe(21 * 34 - 340)
    expect(scrollToReveal(5, 0, 340, 34)).toBeNull()
  })
})
