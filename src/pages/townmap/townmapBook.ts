/**
 * 타운맵 JSON(src/data/bundled/townmap/*.json) · 랜드마크 JSON 읽기 — Qt townmapbook 이식.
 * 앱에 든 파일도 경계에서 좁힌다: 모양이 틀린 칸 · 노드는 버린다.
 * 두 형식: 옛 형식(image 한 장 + crop) · 새 형식(layers를 한 캔버스에 이어 붙임).
 * 확장(선택): 노드의 poly(대각선 도로 다각형) · also(지도 자리가 없는 하위 장소).
 */
import {
  emptyText,
  isRecord,
  localizedOf,
  type LocalizedText,
} from "../../data/text/localizedText.ts"

export interface Point {
  x: number
  y: number
}
export interface Size {
  w: number
  h: number
}
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface MapNode {
  location: string
  region: string
  /** 캔버스 좌표(1배 픽셀) */
  rect: Rect
  /** 있으면 맞히기 · 테를 이 다각형으로(캔버스 좌표) */
  poly: Point[] | null
  /** 상세 패널이 이어 보이는 하위 장소 */
  also: string[]
}

export interface MapLayer {
  source: string // 그림 키 "johto"
  url: string
  size: Size // 원본 그림 크기
  crop: Rect // 원본에서 쓸 부분
  offset: Point // 캔버스에 놓을 자리
}

export interface RegionMap {
  region: string
  canvas: Size
  layers: MapLayer[]
  nodes: MapNode[]
}

export const emptyMap = (region = ""): RegionMap => ({
  region,
  canvas: { w: 0, h: 0 },
  layers: [],
  nodes: [],
})

export const isValidMap = (map: RegionMap | null): map is RegionMap =>
  map !== null && map.nodes.length > 0

// ── 숫자 배열 좁히기: 정수 · 음수 아님 · 길이가 맞을 때만
function ints(value: unknown, length: number): number[] | null {
  if (!Array.isArray(value) || value.length !== length) return null
  const out: number[] = []
  for (const v of value) {
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0) return null
    out.push(v)
  }
  return out
}

const sizeOf = (value: unknown): Size | null => {
  const v = ints(value, 2)
  return v ? { w: v[0], h: v[1] } : null
}
const pointOf = (value: unknown): Point | null => {
  const v = ints(value, 2)
  return v ? { x: v[0], y: v[1] } : null
}
const rectOf = (value: unknown): Rect | null => {
  const v = ints(value, 4)
  return v ? { x: v[0], y: v[1], w: v[2], h: v[3] } : null
}

const stringOf = (value: unknown): string =>
  typeof value === "string" ? value : ""

const stringsOf = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v !== "")
    : []

/** [[x, y], …] (꼭짓점 3개 이상). 아니면 null */
function polyOf(value: unknown): Point[] | null {
  if (!Array.isArray(value) || value.length < 3) return null
  const out: Point[] = []
  for (const v of value) {
    const p = pointOf(v)
    if (!p) return null
    out.push(p)
  }
  return out
}

export function boundsOf(points: readonly Point[]): Rect {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, w: Math.max(...xs) - x + 1, h: Math.max(...ys) - y + 1 }
}

const intersects = (r: Rect, canvas: Size): boolean =>
  r.x < canvas.w && r.y < canvas.h && r.x + r.w > 0 && r.y + r.h > 0

function shift(r: Rect, by: Point): Rect {
  return { x: r.x - by.x, y: r.y - by.y, w: r.w, h: r.h }
}

/**
 * JSON 하나 → 지도. key = root.region(없으면 fallbackKey). 노드가 하나도 없으면 nodes = [](isValid false)
 */
export function parseRegionMap(root: unknown, fallbackKey: string): RegionMap {
  if (!isRecord(root)) return emptyMap(fallbackKey)
  const region = stringOf(root.region) || fallbackKey
  const map = emptyMap(region)
  let move: Point = { x: 0, y: 0 } // 옛 형식: 원본 좌표 → crop 기준

  if ("layers" in root) {
    map.canvas = sizeOf(root.canvas) ?? { w: 0, h: 0 }
    const layers = Array.isArray(root.layers) ? root.layers : []
    for (const raw of layers) {
      if (!isRecord(raw)) continue
      const source = stringOf(raw.source)
      const size = sizeOf(raw.size)
      if (source === "" || !size) continue
      map.layers.push({
        source,
        url: stringOf(raw.url),
        size,
        crop: rectOf(raw.crop) ?? { x: 0, y: 0, w: size.w, h: size.h },
        offset: pointOf(raw.offset) ?? { x: 0, y: 0 },
      })
    }
  } else {
    const image = isRecord(root.image) ? root.image : {}
    const w = typeof image.width === "number" ? image.width : 0
    const h = typeof image.height === "number" ? image.height : 0
    if (Number.isInteger(w) && Number.isInteger(h) && w > 0 && h > 0) {
      const crop = rectOf(image.crop) ?? { x: 0, y: 0, w, h }
      map.layers.push({
        source: region,
        url: stringOf(image.url),
        size: { w, h },
        crop,
        offset: { x: 0, y: 0 },
      })
      map.canvas = { w: crop.w, h: crop.h }
      move = { x: crop.x, y: crop.y }
    }
  }

  const nodes = Array.isArray(root.nodes) ? root.nodes : []
  for (const raw of nodes) {
    if (!isRecord(raw)) continue
    const location = stringOf(raw.location)
    if (location === "") continue
    const rawPoly = polyOf(raw.poly)
    const rawRect = rectOf(raw.rect) ?? (rawPoly ? boundsOf(rawPoly) : null)
    if (!rawRect || (rawRect.w === 0 && rawRect.h === 0)) continue
    const rect = shift(rawRect, move)
    if (!intersects(rect, map.canvas)) continue
    map.nodes.push({
      location,
      region: stringOf(raw.region) || region,
      rect,
      poly: rawPoly
        ? rawPoly.map((p) => ({ x: p.x - move.x, y: p.y - move.y }))
        : null,
      also: stringsOf(raw.also).filter((a) => a !== location),
    })
  }
  return map
}

// ── 랜드마크

export interface Landmark {
  name: LocalizedText
  detail: LocalizedText
}

export interface LandmarkBook {
  versionGroup: string
  landmarks: Map<string, Landmark[]>
}

export function parseLandmarks(
  root: unknown,
  fallbackVersionGroup: string
): LandmarkBook {
  const book: LandmarkBook = {
    versionGroup: fallbackVersionGroup,
    landmarks: new Map(),
  }
  if (!isRecord(root)) return book
  book.versionGroup = stringOf(root.versionGroup) || fallbackVersionGroup
  const section = isRecord(root.landmarks) ? root.landmarks : {}
  for (const [location, list] of Object.entries(section)) {
    if (!Array.isArray(list)) continue
    const out: Landmark[] = []
    for (const raw of list) {
      if (!isRecord(raw)) continue
      const name = localizedOf(raw.name)
      if (!name.ko && !name.en && !name.ja) continue
      out.push({
        name,
        detail: "detail" in raw ? localizedOf(raw.detail) : emptyText(),
      })
    }
    if (out.length > 0) book.landmarks.set(location, out)
  }
  return book
}

// ── 앱에 든 파일 (처음 쓸 때 한 번 읽는다)

const MAP_FILES = import.meta.glob<unknown>(
  "../../data/bundled/townmap/*.json",
  { eager: true, import: "default" }
)
const LANDMARK_FILES = import.meta.glob<unknown>(
  "../../data/bundled/townmap/landmarks/*.json",
  { eager: true, import: "default" }
)

const baseName = (path: string): string =>
  (path.split("/").at(-1) ?? path).replace(/\.json$/, "")

let maps: Map<string, RegionMap> | null = null
let landmarkBooks: Map<string, LandmarkBook> | null = null

function loadedMaps(): Map<string, RegionMap> {
  if (!maps) {
    maps = new Map()
    for (const [path, root] of Object.entries(MAP_FILES)) {
      const map = parseRegionMap(root, baseName(path))
      if (isValidMap(map)) maps.set(map.region, map)
    }
  }
  return maps
}

/** 지도 key("johto-kanto")의 지도. 없으면 null */
export function regionMap(key: string): RegionMap | null {
  return key === "" ? null : (loadedMaps().get(key) ?? null)
}

export const hasRegionMap = (key: string): boolean => regionMap(key) !== null

/** 그 게임 · 장소의 랜드마크. 없으면 [] */
export function landmarksAt(
  versionGroup: string,
  location: string
): Landmark[] {
  if (!landmarkBooks) {
    landmarkBooks = new Map()
    for (const [path, root] of Object.entries(LANDMARK_FILES)) {
      const book = parseLandmarks(root, baseName(path))
      landmarkBooks.set(book.versionGroup, book)
    }
  }
  return landmarkBooks.get(versionGroup)?.landmarks.get(location) ?? []
}

/** 서로 다른 장소 수(조각은 한 번) */
export const distinctLocations = (map: RegionMap): string[] => [
  ...new Set(map.nodes.map((n) => n.location)),
]

/** 그 장소의 하위 장소(모든 조각의 also를 모아, 중복 없이) */
export function alsoOf(map: RegionMap | null, location: string): string[] {
  if (!map || location === "") return []
  const out: string[] = []
  for (const n of map.nodes)
    if (n.location === location)
      for (const a of n.also) if (!out.includes(a)) out.push(a)
  return out
}
