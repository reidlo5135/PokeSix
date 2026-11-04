/**
 * 그림 칸 (C-39) — 포켓몬 아이콘 · 정면 그림 · 아이템 아이콘.
 * 게임 그림은 저장소에 없다: 실행 중에 PokeAPI/sprites에서 받는다(후보 주소를 차례로).
 * 받는 동안 · 실패하면 자리 표시(무늬 · 작은 네모)만 보이고, 화면은 절대 막지 않는다.
 * 이번 실행에서 실패한 주소는 다시 시도하지 않는다(Qt 규칙).
 */
import { useMemo, useState, type SyntheticEvent } from "react"

import {
  frontKey,
  itemIconKey,
  spriteUrls,
  type SpriteKind,
} from "../shared/sprites.ts"
import styles from "./Sprite.module.css"

/** 칸 모양 — list 26(도감 목록) · slot 26(스쿼드 머리) · search 34×28 · grid 56 · detail 84 · drawer 64 · itemList 26(원) · itemDetail 76(원) · fill(부모 채움) */
export type SpriteBox =
  | "list"
  | "slot"
  | "search"
  | "grid"
  | "detail"
  | "drawer"
  | "itemList"
  | "itemDetail"
  | "fill"

const failed = new Set<string>()
const cropCache = new Map<string, string>()

/** 투명 테두리를 잘라 낸 그림 (아이콘 68×56은 여백이 많다). 실패하면 null */
function cropToOpaque(img: HTMLImageElement): string | null {
  try {
    const w = img.naturalWidth
    const h = img.naturalHeight
    if (w === 0 || h === 0) return null
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, w, h).data
    let x0 = w
    let y0 = h
    let x1 = -1
    let y1 = -1
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (data[(y * w + x) * 4 + 3] > 0) {
          if (x < x0) x0 = x
          if (x > x1) x1 = x
          if (y < y0) y0 = y
          if (y > y1) y1 = y
        }
    if (x1 < 0) return null
    const out = document.createElement("canvas")
    out.width = x1 - x0 + 1
    out.height = y1 - y0 + 1
    out
      .getContext("2d")
      ?.drawImage(
        canvas,
        x0,
        y0,
        out.width,
        out.height,
        0,
        0,
        out.width,
        out.height
      )
    return out.toDataURL()
  } catch {
    return null // CORS로 캔버스가 막히면 자르지 않고 쓴다
  }
}

export interface SpriteProps {
  kind: SpriteKind
  spriteKey: string
  /** 대체 글자 (보통 포켓몬 · 아이템 이름) */
  alt: string
  box?: SpriteBox
  /** 투명 여백 자르기 (포켓몬 아이콘 기본 켬) */
  crop?: boolean
  /** 정면 그림 등: 정수 배 확대 · 픽셀 그대로 */
  pixelated?: boolean
  /** 자리 표시 글자 (스쿼드 머리: 도감 번호) */
  placeholderText?: string
  className?: string
}

export function Sprite(props: SpriteProps) {
  return <SpriteInner key={`${props.kind}:${props.spriteKey}`} {...props} />
}

function SpriteInner({
  kind,
  spriteKey,
  alt,
  box = "list",
  crop = false,
  pixelated = false,
  placeholderText,
  className,
}: SpriteProps) {
  const urls = useMemo(
    () => spriteUrls(kind, spriteKey).filter((u) => !failed.has(u)),
    [kind, spriteKey]
  )
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const url = urls[index]
  const [cropped, setCropped] = useState<string | null>(() =>
    url ? (cropCache.get(url) ?? null) : null
  )

  const onLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    if (crop && url && !cropped) {
      const c = cropToOpaque(e.currentTarget)
      if (c) {
        cropCache.set(url, c)
        setCropped(c)
        return
      }
    }
    setLoaded(true)
  }

  const onError = () => {
    if (url) failed.add(url)
    setLoaded(false)
    setCropped(null)
    setIndex((i) => i + 1)
  }

  return (
    <span
      className={[styles.box, className].filter(Boolean).join(" ")}
      data-box={box}
      data-loaded={loaded ? "" : undefined}
    >
      {url && (
        <img
          src={cropped ?? url}
          alt={alt}
          crossOrigin="anonymous"
          loading="lazy"
          decoding="async"
          draggable={false}
          className={styles.img}
          data-pixelated={pixelated ? "" : undefined}
          onLoad={onLoad}
          onError={onError}
        />
      )}
      {!loaded && (
        <span className={styles.placeholder} aria-hidden="true">
          {placeholderText}
        </span>
      )}
    </span>
  )
}

/** 포켓몬 아이콘 (목록 · 스쿼드 · 검색). pokemonId = PokéAPI pokemon.id */
export function PokemonIcon({
  pokemonId,
  alt,
  box = "list",
  placeholderText,
}: {
  pokemonId: number
  alt: string
  box?: SpriteBox
  placeholderText?: string
}) {
  return (
    <Sprite
      kind="pokemonIcon"
      spriteKey={String(pokemonId)}
      alt={alt}
      box={box}
      crop
      placeholderText={placeholderText}
    />
  )
}

/** 그 세대 정면 그림 (도감 상세) */
export function PokemonFront({
  generation,
  pokemonId,
  alt,
  box = "detail",
}: {
  generation: number
  pokemonId: number
  alt: string
  box?: SpriteBox
}) {
  return (
    <Sprite
      kind="pokemonFront"
      spriteKey={frontKey(generation, pokemonId)}
      alt={alt}
      box={box}
      pixelated
    />
  )
}

/** 아이템 아이콘. machineType = 기술머신에 담긴 기술의 타입(없으면 null) */
export function ItemIcon({
  identifier,
  machineType = null,
  generation,
  alt,
  box = "itemList",
}: {
  identifier: string
  machineType?: string | null
  generation: number
  alt: string
  box?: SpriteBox
}) {
  return (
    <Sprite
      kind="item"
      spriteKey={itemIconKey(identifier, machineType, generation)}
      alt={alt}
      box={box}
      pixelated
    />
  )
}
