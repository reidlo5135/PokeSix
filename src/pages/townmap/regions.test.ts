import { describe, expect, it } from "vitest"

import {
  coveredRegions,
  mapRegions,
  pickRegion,
  regionTitle,
} from "./regions.ts"
import { hasRegionMap } from "./townmapBook.ts"

describe("지도 고르기", () => {
  it("성도 · 관동이 걸치면 합본 하나", () => {
    expect(mapRegions(["johto", "kanto"], hasRegionMap)).toEqual([
      "johto-kanto",
    ])
    expect(mapRegions(["kanto", "johto"], hasRegionMap)).toEqual([
      "johto-kanto",
    ])
  })
  it("한 지방이면 그 지도, 지도가 없으면 빈 목록", () => {
    expect(mapRegions(["kanto"], hasRegionMap)).toEqual(["kanto"])
    expect(mapRegions(["hoenn"], hasRegionMap)).toEqual([])
  })
  it("합본이 없으면 지도가 있는 지방들(순서 유지)", () => {
    expect(mapRegions(["unova", "kalos", "sinnoh"], hasRegionMap)).toEqual([
      "unova",
      "sinnoh",
    ])
  })
  it("게임 묶음의 지방 표가 출현 유도보다 먼저 — 에메랄드는 관동 지도가 아니다", () => {
    const fromEncounters = () => ["hoenn", "kanto"]
    expect(
      mapRegions(coveredRegions("emerald", fromEncounters), hasRegionMap)
    ).toEqual([])
    expect(
      mapRegions(
        coveredRegions("ultra-sun-ultra-moon", () => ["alola", "sinnoh"]),
        hasRegionMap
      )
    ).toEqual([])
    expect(
      mapRegions(
        coveredRegions("heartgold-soulsilver", () => []),
        hasRegionMap
      )
    ).toEqual(["johto-kanto"])
    expect(coveredRegions("unknown-game", () => ["galar"])).toEqual(["galar"])
  })
  it("고른 지도가 없으면 첫 지도", () => {
    expect(pickRegion(["a", "b"], "b")).toBe("b")
    expect(pickRegion(["a", "b"], "z")).toBe("a")
    expect(pickRegion([], "z")).toBe("")
  })
  it("지도 제목: 조각마다 지방 이름", () => {
    const names: Record<string, string> = { johto: "성도", kanto: "관동" }
    expect(regionTitle("johto-kanto", (r) => names[r] ?? r)).toBe("성도 · 관동")
  })
})
