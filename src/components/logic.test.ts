import { describe, expect, it } from "vitest"

import { segmentFill, snapValue, statFill, statTone } from "./logic.ts"

describe("컴포넌트 계산", () => {
  it("statFill 구간", () => {
    expect([59, 60, 89, 90, 119, 120].map(statFill)).toEqual([
      "low",
      "mid",
      "mid",
      "good",
      "good",
      "high",
    ])
  })
  it("statTone 구간", () => {
    expect([59, 60, 99, 100, 119, 120].map(statTone)).toEqual([
      "low",
      "plain",
      "plain",
      "strong",
      "strong",
      "high",
    ])
  })
  it("snapValue: step에 맞추고 범위 안으로", () => {
    expect(snapValue(504, 150, 800, 10)).toBe(500)
    expect(snapValue(506, 150, 800, 10)).toBe(510)
    expect(snapValue(10, 150, 800, 10)).toBe(150)
    expect(snapValue(9999, 150, 800, 10)).toBe(800)
  })
  it("segmentFill = floor(percent / 10)", () => {
    expect([0, 9, 10, 59, 60, 99, 100, 140, -5].map(segmentFill)).toEqual([
      0, 0, 1, 5, 6, 9, 10, 10, 0,
    ])
  })
})
