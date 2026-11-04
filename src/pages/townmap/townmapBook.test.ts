import { describe, expect, it } from "vitest"

import {
  alsoOf,
  distinctLocations,
  hasRegionMap,
  landmarksAt,
  parseLandmarks,
  parseRegionMap,
  regionMap,
} from "./townmapBook.ts"

describe("앱에 든 지도", () => {
  it.each([
    ["johto", 45, 45, 166, 144],
    ["kanto", 49, 49, 200, 160],
    ["johto-kanto", 92, 91, 358, 144],
    ["sinnoh", 69, 68, 216, 168],
    ["unova", 82, 77, 256, 168],
  ])("%s: 노드 %i · 장소 %i · 캔버스 %i×%i", (key, nodes, places, w, h) => {
    const map = regionMap(key)
    expect(map).not.toBeNull()
    // 데이터 보강(노드 추가)이 들어와도 줄지는 않는다
    expect(map!.nodes.length).toBeGreaterThanOrEqual(nodes)
    expect(distinctLocations(map!).length).toBeGreaterThanOrEqual(places)
    expect(map!.canvas).toEqual({ w, h })
  })
  it("합본은 성도 · 관동 두 장을 이어 붙인다", () => {
    const map = regionMap("johto-kanto")!
    expect(map.layers.map((l) => [l.source, l.offset.x, l.crop.w])).toEqual([
      ["johto", 0, 158],
      ["kanto", 158, 200],
    ])
    expect(map.nodes.find((n) => n.location === "cerulean-city")?.region).toBe(
      "kanto"
    )
  })
  it("없는 지방 · 빈 key는 null", () => {
    expect(regionMap("hoenn")).toBeNull()
    expect(regionMap("")).toBeNull()
    expect(hasRegionMap("sinnoh")).toBe(true)
  })
})

describe("parseRegionMap", () => {
  it("옛 형식: crop 크기가 캔버스, 노드는 crop 원점만큼 옮긴다", () => {
    const map = parseRegionMap(
      {
        region: "kanto",
        image: { url: "u", width: 200, height: 618, crop: [10, 20, 100, 80] },
        nodes: [
          { location: "a", rect: [15, 25, 5, 5] },
          { location: "b", region: "johto", rect: [10, 20, 3, 3] },
        ],
      },
      "file"
    )
    expect(map.canvas).toEqual({ w: 100, h: 80 })
    expect(map.layers[0]).toMatchObject({
      source: "kanto",
      size: { w: 200, h: 618 },
      crop: { x: 10, y: 20, w: 100, h: 80 },
    })
    expect(
      map.nodes.map((n) => [n.location, n.region, n.rect.x, n.rect.y])
    ).toEqual([
      ["a", "kanto", 5, 5],
      ["b", "johto", 0, 0],
    ])
  })
  it("새 형식 레이어, 지도 key 기본값은 파일 이름", () => {
    const map = parseRegionMap(
      {
        canvas: [30, 20],
        layers: [
          { source: "x", size: [30, 20], crop: [0, 0, 30, 20], offset: [0, 0] },
          { source: "", size: [1, 1] }, // source 없음 → 버림
          { source: "y", size: "bad" }, // size 틀림 → 버림
        ],
        nodes: [{ location: "n", rect: [1, 1, 2, 2] }],
      },
      "fallback"
    )
    expect(map.region).toBe("fallback")
    expect(map.layers.map((l) => l.source)).toEqual(["x"])
    expect(map.nodes[0].region).toBe("fallback")
  })
  it("틀린 rect · 캔버스 밖 · 0×0 노드는 버린다", () => {
    const map = parseRegionMap(
      {
        region: "r",
        canvas: [50, 50],
        layers: [],
        nodes: [
          { location: "ok", rect: [0, 0, 5, 5] },
          { location: "short", rect: [0, 0, 5] },
          { location: "text", rect: ["0", 0, 5, 5] },
          { location: "neg", rect: [-1, 0, 5, 5] },
          { location: "outside", rect: [60, 60, 5, 5] },
          { location: "null", rect: [3, 3, 0, 0] },
          { rect: [0, 0, 5, 5] },
          "junk",
        ],
      },
      "r"
    )
    expect(map.nodes.map((n) => n.location)).toEqual(["ok"])
  })
  it("poly · also 확장: rect가 없으면 다각형의 경계 상자", () => {
    const map = parseRegionMap(
      {
        region: "r",
        canvas: [100, 100],
        layers: [],
        nodes: [
          {
            location: "road",
            poly: [
              [44, 68],
              [44, 73],
              [68, 89],
              [69, 84],
            ],
          },
          { location: "city", rect: [1, 1, 9, 9], also: ["tower", 3, "city"] },
          { location: "city", rect: [20, 1, 9, 9], also: ["well", "tower"] },
        ],
      },
      "r"
    )
    expect(map.nodes[0].rect).toEqual({ x: 44, y: 68, w: 26, h: 22 })
    expect(map.nodes[0].poly).toHaveLength(4)
    expect(alsoOf(map, "city")).toEqual(["tower", "well"])
    expect(alsoOf(map, "road")).toEqual([])
  })
  it("객체가 아니면 빈 지도", () => {
    expect(parseRegionMap(null, "k").nodes).toEqual([])
  })
})

describe("랜드마크", () => {
  it("HGSS 금빛시티 6항목, 다른 게임은 없다", () => {
    const list = landmarksAt("heartgold-soulsilver", "goldenrod-city")
    expect(list.length).toBeGreaterThanOrEqual(6)
    expect(list[0].name.ko).toBe("체육관 — 노말 · 아카네")
    expect(landmarksAt("platinum", "goldenrod-city")).toEqual([])
  })
  it("글자 · 객체 이름, 틀린 항목은 버린다", () => {
    const book = parseLandmarks(
      {
        landmarks: {
          a: [
            { name: "가", detail: "설명" },
            { name: { en: "B" } },
            { detail: "이름 없음" },
            7,
          ],
          b: "not a list",
        },
      },
      "vg"
    )
    expect(book.versionGroup).toBe("vg")
    expect(book.landmarks.get("a")?.map((l) => l.name.ko || l.name.en)).toEqual(
      ["가", "B"]
    )
    expect(book.landmarks.get("a")?.[0].detail.ko).toBe("설명")
    expect(book.landmarks.has("b")).toBe(false)
  })
})
