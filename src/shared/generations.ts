/**
 * 세대 표 — 지방 · 전국도감 구간 · 카드 띠 색 (Qt resources/theme/homecards.json 이식).
 * 지방 이름은 게임 데이터라 이름 표기 언어(nameLanguage)를 따른다.
 */
import homecards from "../data/bundled/theme/homecards.json" with { type: "json" }

import type { LocalizedText } from "./text.ts"

export type Generation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export const MIN_GENERATION = 1
export const MAX_GENERATION = 9
export const DEFAULT_GENERATION: Generation = 4

export interface GenerationInfo {
  generation: Generation
  regions: LocalizedText[] // 첫째가 대표 지방
  from: number
  to: number
}

export function isGeneration(v: unknown): v is Generation {
  return (
    typeof v === "number" &&
    Number.isInteger(v) &&
    v >= MIN_GENERATION &&
    v <= MAX_GENERATION
  )
}

/** 묶어 둔 JSON도 경계에서 좁힌다 */
function toText(v: unknown): LocalizedText {
  const o =
    typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {}
  const pick = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : "")
  return { ko: pick("ko"), en: pick("en"), ja: pick("ja") }
}

function parseCards(raw: unknown): GenerationInfo[] {
  const cards = (raw as { cards?: unknown }).cards
  if (!Array.isArray(cards)) return []
  const out: GenerationInfo[] = []
  for (const card of cards) {
    if (typeof card !== "object" || card === null) continue
    const c = card as Record<string, unknown>
    const range = Array.isArray(c.range) ? c.range : []
    if (
      !isGeneration(c.generation) ||
      typeof range[0] !== "number" ||
      typeof range[1] !== "number"
    )
      continue
    const regions = Array.isArray(c.regions) ? c.regions.map(toText) : []
    out.push({
      generation: c.generation,
      regions,
      from: range[0],
      to: range[1],
    })
  }
  return out.sort((a, b) => a.generation - b.generation)
}

export const GENERATIONS: readonly GenerationInfo[] = parseCards(homecards)

export const ALL_GENERATIONS: readonly Generation[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
]

const EMPTY_TEXT: LocalizedText = { ko: "", en: "", ja: "" }

export function generationInfo(g: Generation): GenerationInfo {
  return (
    GENERATIONS.find((x) => x.generation === g) ?? {
      generation: g,
      regions: [],
      from: 0,
      to: -1,
    }
  )
}

/** 대표 지방 이름(다국어) */
export function regionOf(g: Generation): LocalizedText {
  return generationInfo(g).regions[0] ?? EMPTY_TEXT
}

/** 그 세대에 새로 나온 포켓몬 수 */
export function countOf(g: Generation): number {
  const info = generationInfo(g)
  return Math.max(0, info.to - info.from + 1)
}

/** 카드 띠 색 (v1 Home BAND[(n-1)%4]) */
export const BANDS = ["red", "blue", "green", "yellow"] as const
export type Band = (typeof BANDS)[number]
export const bandOf = (g: Generation): Band => BANDS[(g - 1) % 4]

/** 전국도감 전체 구간 */
export function nationalRange(): {
  from: number
  to: number
  generations: number
} {
  const first = GENERATIONS[0]
  const last = GENERATIONS[GENERATIONS.length - 1]
  return {
    from: first?.from ?? 1,
    to: last?.to ?? 0,
    generations: GENERATIONS.length,
  }
}

/** 세대에 게임을 고르지 않았을 때 쓰는 대표 게임 묶음 (Qt representativeVersionGroup) */
export const REPRESENTATIVE_VERSION_GROUP: Record<Generation, string> = {
  1: "yellow",
  2: "crystal",
  3: "emerald",
  4: "platinum",
  5: "black-2-white-2",
  6: "x-y",
  7: "ultra-sun-ultra-moon",
  8: "sword-shield",
  9: "scarlet-violet",
}
