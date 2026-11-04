import { describe, expect, it } from "vitest"

import {
  ALL_GENERATIONS,
  bandOf,
  countOf,
  GENERATIONS,
  nationalRange,
  regionOf,
} from "./generations.ts"

describe("세대 표", () => {
  it("9세대, 1–1025", () => {
    expect(GENERATIONS).toHaveLength(9)
    expect(nationalRange()).toEqual({ from: 1, to: 1025, generations: 9 })
    expect(ALL_GENERATIONS.reduce((n, g) => n + countOf(g), 0)).toBe(1025)
  })
  it("세대별 수", () => {
    expect(ALL_GENERATIONS.map(countOf)).toEqual([
      151, 100, 135, 107, 156, 72, 88, 96, 120,
    ])
  })
  it("띠 색은 빨 · 파 · 초 · 노를 돈다", () => {
    expect(ALL_GENERATIONS.map(bandOf)).toEqual([
      "red",
      "blue",
      "green",
      "yellow",
      "red",
      "blue",
      "green",
      "yellow",
      "red",
    ])
  })
  it("대표 지방", () => {
    expect(regionOf(4)).toEqual({ ko: "신오", en: "Sinnoh", ja: "シンオウ" })
    expect(regionOf(8).ko).toBe("가라르")
  })
})
