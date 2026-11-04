import { describe, expect, it } from "vitest"

import {
  ALL_GROUP,
  findGroup,
  groupFilter,
  groupOf,
  ITEM_STYLE,
  parseItemStyle,
} from "./itemGroups.ts"

describe("분류 묶음 (itemstyle.json)", () => {
  it("묶음 8개를 파일 순서대로 읽는다", () => {
    expect(ITEM_STYLE.groups.map((g) => g.key)).toEqual([
      "all",
      "medicine",
      "balls",
      "machines",
      "evolution",
      "battle",
      "berries",
      "other",
    ])
    expect(findGroup(ITEM_STYLE, "balls")?.label).toEqual({
      ko: "볼",
      en: "Poké Balls",
      ja: "ボール",
    })
  })

  it("색은 hex가 아니라 토큰", () => {
    for (const g of ITEM_STYLE.groups) {
      expect(g.color).toMatch(/var\(--/)
      expect(g.textColor).toMatch(/var\(--/)
    }
  })

  it("분류가 주머니보다 먼저 · 숨김 분류는 ''", () => {
    const of = (c: string, p: string) => groupOf(ITEM_STYLE, c, p)
    expect(of("evolution", "misc")).toBe("evolution")
    expect(of("held-items", "misc")).toBe("battle")
    expect(of("stat-boosts", "battle")).toBe("battle")
    expect(of("special-balls", "pokeballs")).toBe("balls")
    expect(of("unused", "key")).toBe("")
    expect(of("collectibles", "misc")).toBe("other")
    expect(of("all-machines", "machines")).toBe("machines")
    expect(of("medicine", "berries")).toBe("berries")
  })

  it("전체는 숨김만 뺀다", () => {
    const all = groupFilter(ITEM_STYLE, ALL_GROUP)
    expect(all("collectibles", "misc")).toBe(true)
    expect(all("tm-materials", "misc")).toBe(false)
    const evo = groupFilter(ITEM_STYLE, "evolution")
    expect(evo("evolution", "misc")).toBe(true)
    expect(evo("healing", "medicine")).toBe(false)
  })

  it("깨진 파일이면 '전체' 하나", () => {
    for (const raw of [null, 3, { groups: "x" }, { groups: [{}] }]) {
      const style = parseItemStyle(raw)
      expect(style.groups.map((g) => g.key)).toEqual(["all"])
    }
  })

  it("label이 글자 하나면 한국어", () => {
    const style = parseItemStyle({
      groups: [{ key: "x", label: "엑스", rest: true }],
    })
    expect(style.groups[0].label).toEqual({ ko: "엑스", en: "", ja: "" })
    expect(groupOf(style, "anything", "misc")).toBe("x")
  })
})
