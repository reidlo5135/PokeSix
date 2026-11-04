/**
 * 지도 뷰어 — Qt MapView 이식. 정수 배율 니어리스트 확대(휠 · +/−, 커서 아래 점 고정) · 빈 곳 끌기 = 이동 ·
 * 호버 = 먹색 테 + 이름 말풍선 · 클릭 = 선택(노란 테) · 빈 곳 클릭 = 선택 해제.
 * 지도 그림은 실행 중에 받는다(커밋 금지). 받기 전 · 실패하면 노드 배치를 토큰 색 캔버스(스키매틱)로 보인다.
 * 지도가 바뀌면 부모가 key로 새로 만든다 → 배율 · 이동 · 호버가 처음으로.
 */
import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react"

import { useT } from "../../i18n/index.ts"
import { spriteUrls } from "../../shared/sprites.ts"
import {
  bubblePosition,
  DRAG_THRESHOLD,
  geometryOf,
  initialView,
  nodeAt,
  scaleRect,
  viewReducer,
} from "./mapGeometry.ts"
import type { MapNode, Point, RegionMap } from "./townmapBook.ts"
import styles from "./TownMap.module.css"

type ImageState = "ready" | "failed"
// 이번 실행에서 받은 · 실패한 그림(실패는 다시 시도하지 않는다 — Qt 규칙)
const images = new Map<string, ImageState>()

const layerUrl = (source: string, fallback: string): string =>
  spriteUrls("townMap", source)[0] ?? fallback

const ORIGIN: Point = { x: 0, y: 0 }

export interface MapViewProps {
  map: RegionMap | null
  nameOf: (location: string) => string
  layerLabels: readonly string[]
  selected: string
  onSelect: (location: string) => void
  ariaLabel: string
}

export function MapView({
  map,
  nameOf,
  layerLabels,
  selected,
  onSelect,
  ariaLabel,
}: MapViewProps) {
  const t = useT()
  const viewRef = useRef<HTMLDivElement | null>(null)
  const bubbleRef = useRef<HTMLDivElement | null>(null)
  const [view, dispatch] = useReducer(
    viewReducer,
    map?.canvas ?? { w: 0, h: 0 },
    initialView
  )
  const [hover, setHover] = useState("")
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ start: Point; pan: Point; panning: boolean } | null>(
    null
  )
  const [loaded, setLoaded] = useState<ReadonlyMap<string, ImageState>>(
    () => new Map(images)
  )

  // 크기 재기 — 숨김(0×0)은 리듀서가 무시한다
  useEffect(() => {
    const el = viewRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() =>
      dispatch({
        type: "resize",
        view: { w: el.clientWidth, h: el.clientHeight },
      })
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 휠: React onWheel은 passive라 기본 스크롤을 막지 못한다
  const hasMap = map !== null
  useEffect(() => {
    const el = viewRef.current
    if (!el || !hasMap) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 400 : 1
      dispatch({
        type: "wheel",
        at: { x: e.clientX - r.left, y: e.clientY - r.top },
        delta: e.deltaY * unit,
      })
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [hasMap])

  const geo = geometryOf(view)
  const { scale, content, origin } = geo

  // 말풍선: 그린 뒤 크기를 재어 자리를 잡는다
  const hoverNode =
    map && hover !== "" && hover !== selected
      ? (map.nodes.find((n) => n.location === hover) ?? null)
      : null
  const hoverRect = hoverNode ? scaleRect(hoverNode.rect, scale, origin) : null
  useLayoutEffect(() => {
    const bubble = bubbleRef.current
    if (!bubble || !hoverRect) return
    const p = bubblePosition(
      hoverRect,
      { w: bubble.offsetWidth, h: bubble.offsetHeight },
      view.view.w
    )
    bubble.style.left = `${p.x}px`
    bubble.style.top = `${p.y}px`
    bubble.style.visibility = "visible"
  })

  if (!map)
    return (
      <div className={styles.view} ref={viewRef} aria-label={ariaLabel}>
        <p className={styles.viewNotice}>
          {t("이 지방의 지도는 아직 준비 중이에요")}
        </p>
      </div>
    )

  const urls = map.layers.map((l) => layerUrl(l.source, l.url))
  const pictureReady =
    urls.length > 0 && urls.every((u) => loaded.get(u) === "ready")
  const pictureFailed = urls.some((u) => loaded.get(u) === "failed")
  const mark = (url: string, state: ImageState) => {
    images.set(url, state)
    setLoaded((prev) => new Map(prev).set(url, state))
  }

  const local = (e: { clientX: number; clientY: number }): Point => {
    const r = viewRef.current?.getBoundingClientRect()
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : ORIGIN
  }
  const hitAt = (p: Point): MapNode | null =>
    nodeAt(map.nodes, p, origin, scale)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const p = local(e)
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const panning = hitAt(p) === null // 노드 위에서 누르면 끌지 않는다
    drag.current = { start: p, pan: origin, panning }
    if (panning) setDragging(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = local(e)
    const d = drag.current
    if (d?.panning) {
      dispatch({
        type: "pan",
        pan: { x: d.pan.x + p.x - d.start.x, y: d.pan.y + p.y - d.start.y },
      })
      return
    }
    const location = hitAt(p)?.location ?? ""
    if (location !== hover) setHover(location)
  }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    drag.current = null
    setDragging(false)
    const p = local(e)
    if (Math.abs(p.x - d.start.x) + Math.abs(p.y - d.start.y) > DRAG_THRESHOLD)
      return // 끌기였다
    const location = hitAt(p)?.location ?? ""
    if (location !== selected) onSelect(location)
  }
  const onPointerCancel = () => {
    drag.current = null
    setDragging(false)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const center = { x: view.view.w / 2, y: view.view.h / 2 }
    if (e.key === "Escape" && selected !== "") onSelect("")
    else if (e.key === "+" || e.key === "=")
      dispatch({ type: "step", at: center, step: 1 })
    else if (e.key === "-" || e.key === "_")
      dispatch({ type: "step", at: center, step: -1 })
    else return
    e.preventDefault()
  }

  // 장소마다 키보드 버튼 하나(첫 조각 자리) — 마우스 맞히기는 뷰가 한다
  const firstFragments = map.nodes.filter(
    (n, i) => map.nodes.findIndex((m) => m.location === n.location) === i
  )
  const fragmentsOf = (location: string) =>
    location === "" ? [] : map.nodes.filter((n) => n.location === location)
  // 노드 모양(내용 좌표): 다각형이면 polygon, 아니면 사방 grow만큼 넓힌 rect
  const shape = (n: MapNode, grow: number, className: string, key: string) =>
    n.poly ? (
      <polygon
        key={key}
        points={n.poly.map((p) => `${p.x * scale},${p.y * scale}`).join(" ")}
        className={className}
      />
    ) : (
      <rect
        key={key}
        x={n.rect.x * scale - grow}
        y={n.rect.y * scale - grow}
        width={n.rect.w * scale + grow * 2}
        height={n.rect.h * scale + grow * 2}
        rx={grow > 0 ? 3 : 0}
        className={className}
      />
    )
  const schematic = !pictureReady

  return (
    <div
      ref={viewRef}
      className={styles.view}
      role="group"
      aria-label={ariaLabel}
      data-cursor={dragging ? "grabbing" : hover !== "" ? "pointer" : "grab"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={() => {
        if (!drag.current && hover !== "") setHover("")
      }}
      onKeyDown={onKeyDown}
    >
      <div
        className={styles.content}
        style={{
          left: origin.x,
          top: origin.y,
          width: content.w,
          height: content.h,
        }}
        data-schematic={schematic ? "" : undefined}
      >
        {schematic && (
          <div
            className={styles.grid}
            style={{ backgroundSize: `${10 * scale}px ${10 * scale}px` }}
          />
        )}
        {map.layers.map((layer, i) => {
          const url = urls[i]
          if (loaded.get(url) === "failed") return null
          return (
            <div
              key={`${layer.source}-${i}`}
              className={styles.layer}
              style={{
                left: layer.offset.x * scale,
                top: layer.offset.y * scale,
                width: layer.crop.w * scale,
                height: layer.crop.h * scale,
              }}
              data-ready={pictureReady ? "" : undefined}
            >
              <img
                src={url}
                alt=""
                draggable={false}
                className={styles.layerImage}
                style={{
                  left: -layer.crop.x * scale,
                  top: -layer.crop.y * scale,
                  width: layer.size.w * scale,
                  height: layer.size.h * scale,
                }}
                onLoad={() => mark(url, "ready")}
                onError={() => mark(url, "failed")}
              />
            </div>
          )
        })}
        <svg
          className={styles.overlay}
          width={content.w}
          height={content.h}
          aria-hidden="true"
        >
          {schematic &&
            map.nodes.map((n, i) => shape(n, 0, styles.cell, `cell-${i}`))}
          {fragmentsOf(selected).map((n, i) =>
            shape(n, 2, styles.selectedRing, `selected-${i}`)
          )}
          {hover !== selected &&
            fragmentsOf(hover).map((n, i) =>
              shape(n, 2, styles.hoverRing, `hover-${i}`)
            )}
        </svg>
        {map.layers.length > 1 &&
          map.layers.map((layer, i) => {
            const label = layerLabels[i] ?? ""
            if (label === "") return null
            const left =
              i === 0
                ? layer.offset.x * scale + 8
                : (layer.offset.x + layer.crop.w) * scale - 8
            return (
              <span
                key={`label-${layer.source}`}
                className={styles.layerLabel}
                data-align={i === 0 ? "start" : "end"}
                style={{ left, top: layer.offset.y * scale + 8 }}
              >
                {label}
              </span>
            )
          })}
        {firstFragments.map((n) => {
          const r = scaleRect(n.rect, scale, ORIGIN)
          const name = nameOf(n.location)
          return (
            <button
              key={n.location}
              type="button"
              className={styles.nodeButton}
              style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
              aria-label={name}
              aria-pressed={n.location === selected}
              onFocus={() => {
                setHover(n.location)
                dispatch({
                  type: "reveal",
                  rect: scaleRect(n.rect, scale, origin),
                })
              }}
              onBlur={() => setHover((h) => (h === n.location ? "" : h))}
              onClick={() => {
                if (n.location !== selected) onSelect(n.location)
              }}
            />
          )
        })}
      </div>
      {hoverRect && hoverNode && nameOf(hoverNode.location) !== "" && (
        <div
          ref={bubbleRef}
          key={hoverNode.location}
          className={styles.bubble}
          aria-hidden="true"
        >
          {nameOf(hoverNode.location)}
        </div>
      )}
      {schematic && (
        <p className={styles.viewStatus}>
          {pictureFailed
            ? t("지도 그림을 받지 못했어요")
            : t("지도 그림을 받는 중이에요…")}
        </p>
      )}
    </div>
  )
}
