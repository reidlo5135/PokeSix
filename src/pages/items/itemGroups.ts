/**
 * 아이템 분류 묶음(itemstyle.json — Qt ui/theme/itemstyle 이식).
 * 아이템 하나 → 묶음: 숨김 분류면 "" → categories 표 → pockets 표 → rest 묶음(기타). 분류가 주머니보다 먼저다.
 * 색은 JSON의 hex 대신 디자인 토큰으로 고른다(CLAUDE.md: 색 하드코딩 금지).
 */
import itemStyleJson from "../../data/bundled/theme/itemstyle.json" with { type: "json" }

import {
  isRecord,
  localizedOf,
  type LocalizedText,
} from "../../data/text/localizedText.ts"

export const ALL_GROUP = "all"

export interface ItemGroup {
  key: string
  label: LocalizedText
  /** 견본 · 알약 바탕 (CSS 값) */
  color: string
  /** 알약 글자 (CSS 값) */
  textColor: string
}

export interface ItemStyle {
  groups: ItemGroup[]
  byCategory: Map<string, string>
  byPocket: Map<string, string>
  restKey: string
  hidden: Set<string>
}

// 묶음 키 → [바탕, 글자]. 토큰이 없는 볼 · 나무열매는 가까운 토큰을 섞어 만든다
const GROUP_COLORS: Record<string, readonly [string, string]> = {
  all: ["var(--color-white)", "var(--color-text-1)"],
  medicine: ["var(--color-stat-low)", "var(--color-on-yellow)"],
  balls: [
    "color-mix(in srgb, var(--color-stat-mid) 50%, var(--color-cat-physical))",
    "var(--color-on-yellow)",
  ],
  machines: ["var(--color-cat-special)", "var(--color-on-color)"],
  evolution: ["var(--color-green-face)", "var(--color-on-color)"],
  battle: ["var(--color-red)", "var(--color-on-color)"],
  berries: [
    "color-mix(in srgb, var(--type-bug) 70%, var(--type-grass))",
    "var(--color-on-yellow)",
  ],
  other: ["var(--color-cat-status)", "var(--color-on-yellow)"],
}

const FALLBACK_COLORS = GROUP_COLORS.other

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : []

function fallbackStyle(): ItemStyle {
  return {
    groups: [
      {
        key: ALL_GROUP,
        label: { ko: "전체", en: "All", ja: "すべて" },
        color: GROUP_COLORS.all[0],
        textColor: GROUP_COLORS.all[1],
      },
    ],
    byCategory: new Map(),
    byPocket: new Map(),
    restKey: "",
    hidden: new Set(),
  }
}

/** JSON을 믿지 않고 좁힌다. 묶음이 하나도 없으면 "전체" 하나 */
export function parseItemStyle(raw: unknown): ItemStyle {
  if (!isRecord(raw) || !Array.isArray(raw.groups)) return fallbackStyle()
  const style: ItemStyle = {
    groups: [],
    byCategory: new Map(),
    byPocket: new Map(),
    restKey: "",
    hidden: new Set(strings(raw.hiddenCategories)),
  }
  for (const g of raw.groups) {
    if (!isRecord(g) || typeof g.key !== "string" || g.key === "") continue
    if (style.groups.some((x) => x.key === g.key)) continue
    const key = g.key
    const [color, textColor] = GROUP_COLORS[key] ?? FALLBACK_COLORS
    style.groups.push({ key, label: localizedOf(g.label), color, textColor })
    for (const c of strings(g.categories)) style.byCategory.set(c, key)
    for (const p of strings(g.pockets)) style.byPocket.set(p, key)
    if (g.rest === true) style.restKey = key
  }
  return style.groups.length > 0 ? style : fallbackStyle()
}

export const ITEM_STYLE: ItemStyle = parseItemStyle(itemStyleJson as unknown)

/** 아이템이 드는 묶음 키. "" = 숨김(목록에서 뺀다) */
export function groupOf(
  style: ItemStyle,
  category: string,
  pocket: string
): string {
  if (style.hidden.has(category)) return ""
  return (
    style.byCategory.get(category) ??
    style.byPocket.get(pocket) ??
    style.restKey
  )
}

/** 묶음 거르기: all = 숨김만 뺀다 */
export function groupFilter(
  style: ItemStyle,
  key: string
): (category: string, pocket: string) => boolean {
  if (key === ALL_GROUP)
    return (category, pocket) => groupOf(style, category, pocket) !== ""
  return (category, pocket) => groupOf(style, category, pocket) === key
}

export function findGroup(style: ItemStyle, key: string): ItemGroup | null {
  return style.groups.find((g) => g.key === key) ?? null
}
