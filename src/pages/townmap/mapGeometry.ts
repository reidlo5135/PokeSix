/**
 * 지도 뷰어의 좌표 계산 — Qt mapview 이식(순수 함수, 테스트 대상).
 * 캔버스 좌표(1배) × 정수 배율 + 원점 = 화면(뷰) 좌표. 기본 배율은 세로에 꽉 맞춘다.
 */
import type { MapNode, Point, Rect, Size } from "./townmapBook.ts"

export const MIN_SCALE = 1
export const MAX_SCALE = 12
/** 세로 맞춤에서 빼는 여백(Qt 24) */
const FIT_MARGIN = 24
/** 누른 뒤 이만큼(맨해튼 거리) 넘게 움직이면 클릭이 아니라 끌기 */
export const DRAG_THRESHOLD = 4
/** 휠 누적 한 단계(px). 마우스 휠 한 칸은 보통 100 안팎, 트랙패드는 작게 여러 번 온다 */
export const WHEEL_STEP = 50

const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(Math.max(v, lo), hi)

/** 세로에 맞춘 정수 배율(최소 1) */
export function fitScale(viewHeight: number, canvas: Size): number {
  if (canvas.h <= 0) return 1
  return Math.max(1, Math.trunc((viewHeight - FIT_MARGIN) / canvas.h))
}

/** 실제 배율 = fit + zoom (최소 1) */
export const scaleOf = (fit: number, zoom: number): number =>
  Math.max(MIN_SCALE, fit + zoom)

export const contentSize = (canvas: Size, scale: number): Size => ({
  w: canvas.w * scale,
  h: canvas.h * scale,
})

/** 팬 제한: 왼쪽/위 끝 0, 오른쪽/아래 끝 view − content (내용이 작으면 0) */
export function clampPan(pan: Point, view: Size, content: Size): Point {
  return {
    x: clamp(pan.x, Math.min(0, view.w - content.w), 0),
    y: clamp(pan.y, Math.min(0, view.h - content.h), 0),
  }
}

/** 축마다: 내용이 뷰보다 작거나 같으면 가운데, 크면 팬 */
export function originOf(view: Size, content: Size, pan: Point): Point {
  const p = clampPan(pan, view, content)
  return {
    x: content.w <= view.w ? Math.trunc((view.w - content.w) / 2) : p.x,
    y: content.h <= view.h ? Math.trunc((view.h - content.h) / 2) : p.y,
  }
}

/** 캔버스 사각형 → 원점 기준 화면 사각형 */
export const scaleRect = (r: Rect, scale: number, origin: Point): Rect => ({
  x: origin.x + r.x * scale,
  y: origin.y + r.y * scale,
  w: r.w * scale,
  h: r.h * scale,
})

const inRect = (p: Point, r: Rect): boolean =>
  p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h

/** 짝홀 규칙의 점-다각형 판정 */
export function inPolygon(p: Point, poly: readonly Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside
  }
  return inside
}

/**
 * 화면 점 아래의 노드. 겹치면 면적이 가장 작은 것(같으면 먼저 것) — 마을이 겹친 도로 띠를 이긴다.
 * poly가 있는 노드는 다각형으로 맞히고, 면적은 상자 그대로 비교한다
 */
export function nodeAt(
  nodes: readonly MapNode[],
  p: Point,
  origin: Point,
  scale: number
): MapNode | null {
  let best: MapNode | null = null
  const canvasPoint = {
    x: (p.x - origin.x) / scale,
    y: (p.y - origin.y) / scale,
  }
  for (const n of nodes) {
    const hit = n.poly
      ? inRect(p, scaleRect(n.rect, scale, origin)) &&
        inPolygon(canvasPoint, n.poly)
      : inRect(p, scaleRect(n.rect, scale, origin))
    if (!hit) continue
    if (!best || n.rect.w * n.rect.h < best.rect.w * best.rect.h) best = n
  }
  return best
}

/**
 * 말풍선 왼쪽 위. 노드 위(아래 끝 = 노드 위 − 6), 뷰 위로 넘치면 노드 아래로.
 * 가로는 노드 가운데 기준, 뷰 안 [4, W − 폭 − 4]로 제한
 */
export function bubblePosition(
  anchor: Rect,
  bubble: Size,
  viewW: number
): Point {
  const centerX = anchor.x + Math.trunc((anchor.w - 1) / 2)
  let top = anchor.y - 6 - bubble.h
  if (top < 4) top = anchor.y + anchor.h - 1 + 6
  const left = Math.max(
    4,
    Math.min(viewW - bubble.w - 4, centerX - Math.trunc(bubble.w / 2))
  )
  return { x: left, y: top }
}

// ── 보기 상태(배율 · 팬). 지도가 바뀌면 컴포넌트를 새로 만들어 초기화한다

export interface ViewState {
  canvas: Size
  view: Size
  zoom: number // fit에 더하는 정수. 0 = 기본
  pan: Point // 0 이하
  wheel: number // 휠 누적(px)
}

export type ViewAction =
  | { type: "resize"; view: Size }
  | { type: "pan"; pan: Point }
  | { type: "wheel"; at: Point; delta: number }
  | { type: "step"; at: Point; step: 1 | -1 }
  | { type: "reveal"; rect: Rect }

export const initialView = (canvas: Size): ViewState => ({
  canvas,
  view: { w: 0, h: 0 },
  zoom: 0,
  pan: { x: 0, y: 0 },
  wheel: 0,
})

export interface ViewGeometry {
  scale: number
  content: Size
  origin: Point
}

export function geometryOf(s: ViewState): ViewGeometry {
  const scale = scaleOf(fitScale(s.view.h, s.canvas), s.zoom)
  const content = contentSize(s.canvas, scale)
  return { scale, content, origin: originOf(s.view, content, s.pan) }
}

/** 한 단계 확대/축소 — 커서 아래 캔버스 점이 그 자리에 남는다. 바뀌지 않으면 그대로 */
export function zoomStep(s: ViewState, at: Point, step: 1 | -1): ViewState {
  const { scale, origin } = geometryOf(s)
  const next = clamp(scale + step, MIN_SCALE, MAX_SCALE)
  if (next === scale) return s
  const before = { x: (at.x - origin.x) / scale, y: (at.y - origin.y) / scale }
  const content = contentSize(s.canvas, next)
  const pan = clampPan(
    {
      x: Math.round(at.x - before.x * next),
      y: Math.round(at.y - before.y * next),
    },
    s.view,
    content
  )
  return {
    ...s,
    zoom: next - fitScale(s.view.h, s.canvas),
    pan,
  }
}

export function viewReducer(s: ViewState, a: ViewAction): ViewState {
  switch (a.type) {
    case "resize": {
      // 숨김(0×0)일 때는 크기를 잊지 않는다 — 다시 보일 때 배율이 튀지 않게
      if (a.view.w <= 0 || a.view.h <= 0) return s
      if (a.view.w === s.view.w && a.view.h === s.view.h) return s
      const next = { ...s, view: a.view }
      return { ...next, pan: clampPan(s.pan, a.view, geometryOf(next).content) }
    }
    case "pan": {
      const pan = clampPan(a.pan, s.view, geometryOf(s).content)
      return pan.x === s.pan.x && pan.y === s.pan.y ? s : { ...s, pan }
    }
    case "wheel": {
      if (a.delta === 0) return s // 가로 휠 · 0 이벤트는 무시
      const total = s.wheel + a.delta
      if (Math.abs(total) < WHEEL_STEP) return { ...s, wheel: total }
      // 아래로 굴림(+) = 축소, 위로(−) = 확대
      return { ...zoomStep(s, a.at, total < 0 ? 1 : -1), wheel: 0 }
    }
    case "step":
      return zoomStep(s, a.at, a.step)
    case "reveal": {
      // 키보드로 고른 노드가 뷰 밖이면 보이게 옮긴다
      const { content, origin } = geometryOf(s)
      const margin = 16
      let { x, y } = s.pan
      if (content.w > s.view.w) {
        x = origin.x
        if (a.rect.x < margin) x += margin - a.rect.x
        else if (a.rect.x + a.rect.w > s.view.w - margin)
          x -= a.rect.x + a.rect.w - (s.view.w - margin)
      }
      if (content.h > s.view.h) {
        y = origin.y
        if (a.rect.y < margin) y += margin - a.rect.y
        else if (a.rect.y + a.rect.h > s.view.h - margin)
          y -= a.rect.y + a.rect.h - (s.view.h - margin)
      }
      return viewReducer(s, { type: "pan", pan: { x, y } })
    }
  }
}
