/**
 * 그림 칸 (C-39) — 포켓몬 아이콘 · 정면 그림 · 아이템 아이콘.
 * 게임 그림은 저장소에 없다: 실행 중에 PokeAPI/sprites에서 받는다(후보 주소를 차례로).
 * 받는 동안 · 실패하면 자리 표시(무늬 · 작은 네모)만 보이고, 화면은 절대 막지 않는다.
 * 이번 실행에서 실패한 주소는 다시 시도하지 않는다(Qt 규칙).
 */
import {
  useMemo,
  useState,
  type CSSProperties,
  type SyntheticEvent,
} from "react"

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

/*
 * 투명 테두리 자르기 (아이콘 68×56은 여백이 많다).
 * 새 그림을 만들지 않고(PNG 인코딩이 느리다) 불투명 영역만 재서 CSS object-view-box로 자른다.
 * 잰 값은 localStorage에 남겨 다음 실행부터는 재지 않는다.
 */
const CROP_KEY = "pokesix.spriteCrop"
const CROP_VERSION = 1
const SAVE_DELAY_MS = 1000
const NO_CROP = "none"

let crops: Map<string, string> | null = null
let saveTimer: number | undefined
let scratch: CanvasRenderingContext2D | null = null

const cropId = (url: string): string => url.split("/sprites/").at(-1) ?? url

function cropStore(): Map<string, string> {
  if (crops) return crops
  crops = new Map()
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(CROP_KEY) ?? "null")
    if (
      raw &&
      typeof raw === "object" &&
      "v" in raw &&
      raw.v === CROP_VERSION &&
      "crops" in raw &&
      raw.crops &&
      typeof raw.crops === "object"
    )
      for (const [k, v] of Object.entries(raw.crops))
        if (typeof v === "string") crops.set(k, v)
  } catch {
    // 저장소를 못 쓰면 이번 실행 동안만 기억한다
  }
  return crops
}

/** 이미 잰 자르기 값("inset(…)" · "none"). 모르면 undefined */
const knownCrop = (url: string): string | undefined =>
  cropStore().get(cropId(url))

function rememberCrop(url: string, value: string): void {
  cropStore().set(cropId(url), value)
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(
        CROP_KEY,
        JSON.stringify({
          v: CROP_VERSION,
          crops: Object.fromEntries(cropStore()),
        })
      )
    } catch {
      // 가득 찼거나 막혔으면 저장하지 않는다
    }
  }, SAVE_DELAY_MS)
}

/** 불투명 영역 → "inset(위 오른 아래 왼)". 잘라 낼 것이 없거나 읽을 수 없으면 "none" */
function measureCrop(img: HTMLImageElement): string {
  try {
    const w = img.naturalWidth
    const h = img.naturalHeight
    if (w === 0 || h === 0) return NO_CROP
    // 캔버스 하나를 돌려 쓴다. willReadFrequently = CPU 쪽 캔버스라 getImageData가 빠르다
    scratch ??= document
      .createElement("canvas")
      .getContext("2d", { willReadFrequently: true })
    const ctx = scratch
    if (!ctx) return NO_CROP
    if (ctx.canvas.width < w) ctx.canvas.width = w
    if (ctx.canvas.height < h) ctx.canvas.height = h
    ctx.clearRect(0, 0, w, h)
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
    if (x1 < 0) return NO_CROP
    if (x0 === 0 && y0 === 0 && x1 === w - 1 && y1 === h - 1) return NO_CROP
    return `inset(${y0}px ${w - 1 - x1}px ${h - 1 - y1}px ${x0}px)`
  } catch {
    return NO_CROP // CORS로 캔버스가 막히면 자르지 않고 쓴다
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
  const inset = crop && url ? knownCrop(url) : undefined

  const onLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    if (crop && url && inset === undefined)
      rememberCrop(url, measureCrop(e.currentTarget))
    setLoaded(true)
  }

  const onError = () => {
    if (url) failed.add(url)
    setLoaded(false)
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
          src={url}
          data-crop={inset && inset !== NO_CROP ? "" : undefined}
          style={
            inset && inset !== NO_CROP
              ? ({ "--crop": inset } as CSSProperties)
              : undefined
          }
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
