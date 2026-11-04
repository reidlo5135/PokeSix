import { describe, expect, it } from "vitest"

import {
  bubblePosition,
  clampPan,
  geometryOf,
  initialView,
  inPolygon,
  MAX_SCALE,
  nodeAt,
  originOf,
  fitScale,
  viewReducer,
  zoomStep,
  type ViewState,
} from "./mapGeometry.ts"
import { regionMap, type MapNode } from "./townmapBook.ts"

const node = (
  location: string,
  x: number,
  y: number,
  w: number,
  h: number
): MapNode => ({
  location,
  region: "r",
  rect: { x, y, w, h },
  poly: null,
  also: [],
})

const sized = (canvas = { w: 358, h: 144 }, view = { w: 800, h: 700 }) =>
  viewReducer(initialView(canvas), { type: "resize", view })

describe("배율 · 원점", () => {
  it("세로에 맞춘 정수 배율, 최소 1", () => {
    expect(fitScale(700, { w: 358, h: 144 })).toBe(4)
    expect(fitScale(700, { w: 216, h: 168 })).toBe(4)
    expect(fitScale(100, { w: 358, h: 144 })).toBe(1)
    expect(fitScale(700, { w: 0, h: 0 })).toBe(1)
  })
  it("내용이 작은 축은 가운데, 큰 축은 팬", () => {
    const view = { w: 800, h: 700 }
    const content = { w: 1432, h: 576 }
    expect(originOf(view, content, { x: -100, y: -50 })).toEqual({
      x: -100,
      y: 62,
    })
  })
  it("팬 제한: 0 ~ view − content", () => {
    const view = { w: 800, h: 700 }
    const content = { w: 1432, h: 576 }
    expect(clampPan({ x: 50, y: 0 }, view, content)).toEqual({ x: 0, y: 0 })
    expect(clampPan({ x: -5000, y: -10 }, view, content)).toEqual({
      x: -632,
      y: 0,
    })
  })
})

describe("휠 확대", () => {
  it("커서 아래 캔버스 점이 그대로 (반올림 ±1px)", () => {
    const s = sized()
    // 가장자리에서는 팬 제한이 이긴다 — 확대 뒤에도 양쪽 축이 제한 안에 드는 가운데 점
    const at = { x: 400, y: 350 }
    const before = geometryOf(s)
    const canvasPoint = {
      x: (at.x - before.origin.x) / before.scale,
      y: (at.y - before.origin.y) / before.scale,
    }
    const next = zoomStep(s, at, 1)
    const after = geometryOf(next)
    expect(after.scale).toBe(before.scale + 1)
    expect(
      Math.abs(after.origin.x + canvasPoint.x * after.scale - at.x)
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs(after.origin.y + canvasPoint.y * after.scale - at.y)
    ).toBeLessThanOrEqual(1)
  })
  it("배율은 1–12", () => {
    let s = sized()
    for (let i = 0; i < 20; i++) s = zoomStep(s, { x: 10, y: 10 }, 1)
    expect(geometryOf(s).scale).toBe(MAX_SCALE)
    for (let i = 0; i < 20; i++) s = zoomStep(s, { x: 10, y: 10 }, -1)
    expect(geometryOf(s).scale).toBe(1)
    expect(zoomStep(s, { x: 0, y: 0 }, -1)).toBe(s)
  })
  it("휠: 0은 무시, 작은 값은 모아서 한 단계, 위로 굴리면 확대", () => {
    const s = sized()
    const at = { x: 100, y: 100 }
    expect(viewReducer(s, { type: "wheel", at, delta: 0 })).toBe(s)
    const half = viewReducer(s, { type: "wheel", at, delta: -30 })
    expect(geometryOf(half).scale).toBe(4)
    const full = viewReducer(half, { type: "wheel", at, delta: -30 })
    expect(geometryOf(full).scale).toBe(5)
    expect(full.wheel).toBe(0)
    expect(
      geometryOf(viewReducer(s, { type: "wheel", at, delta: 120 })).scale
    ).toBe(3)
  })
  it("숨김(0×0) 크기는 무시한다", () => {
    const s = sized()
    expect(viewReducer(s, { type: "resize", view: { w: 0, h: 0 } })).toBe(s)
  })
  it("reveal: 뷰 밖 노드가 보이게 팬", () => {
    const s: ViewState = sized()
    const r = viewReducer(s, {
      type: "reveal",
      rect: { x: 1300, y: 100, w: 36, h: 36 },
    })
    expect(r.pan.x).toBeLessThan(0)
    const g = geometryOf(r)
    expect(
      1300 + (g.origin.x - geometryOf(s).origin.x) + 36
    ).toBeLessThanOrEqual(800)
  })
})

describe("nodeAt", () => {
  const origin = { x: 0, y: 0 }
  it("겹치면 작은 노드가 이긴다 (무궁시티 > 29번 도로)", () => {
    const map = regionMap("johto-kanto")!
    expect(nodeAt(map.nodes, { x: 113, y: 112 }, origin, 1)?.location).toBe(
      "cherrygrove-city"
    )
    expect(nodeAt(map.nodes, { x: 130, y: 112 }, origin, 1)?.location).toBe(
      "johto-route-29"
    )
    expect(nodeAt(map.nodes, { x: 148, y: 113 }, origin, 1)?.location).toBe(
      "new-bark-town"
    )
  })
  it("반열린 구간 [x, x + w)", () => {
    const nodes = [node("a", 10, 10, 5, 5)]
    expect(nodeAt(nodes, { x: 10, y: 10 }, origin, 1)?.location).toBe("a")
    expect(nodeAt(nodes, { x: 14.9, y: 14.9 }, origin, 1)?.location).toBe("a")
    expect(nodeAt(nodes, { x: 15, y: 10 }, origin, 1)).toBeNull()
  })
  it("배율 · 원점을 따른다, 같은 면적이면 먼저 것", () => {
    const nodes = [node("first", 0, 0, 4, 4), node("second", 0, 0, 4, 4)]
    expect(
      nodeAt(nodes, { x: 103, y: 53 }, { x: 100, y: 50 }, 2)?.location
    ).toBe("first")
  })
  it("다각형 노드는 다각형으로 맞힌다", () => {
    const road: MapNode = {
      ...node("road", 0, 0, 10, 10),
      poly: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 0, y: 10 },
      ],
    }
    expect(nodeAt([road], { x: 2, y: 2 }, origin, 1)?.location).toBe("road")
    expect(nodeAt([road], { x: 9, y: 9 }, origin, 1)).toBeNull()
    expect(inPolygon({ x: 1, y: 1 }, road.poly!)).toBe(true)
  })
})

describe("말풍선 자리", () => {
  it("노드 위, 위로 넘치면 아래, 가로는 뷰 안", () => {
    const bubble = { w: 60, h: 20 }
    expect(bubblePosition({ x: 100, y: 100, w: 9, h: 9 }, bubble, 800)).toEqual(
      { x: 74, y: 74 }
    )
    expect(bubblePosition({ x: 100, y: 10, w: 9, h: 9 }, bubble, 800)).toEqual({
      x: 74,
      y: 24,
    })
    expect(bubblePosition({ x: 0, y: 100, w: 9, h: 9 }, bubble, 800).x).toBe(4)
    expect(bubblePosition({ x: 795, y: 100, w: 9, h: 9 }, bubble, 800).x).toBe(
      736
    )
  })
})
