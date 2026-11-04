/**
 * 게임 칩 · 도감 칩 표시 규칙(theme/dexstyle.json) — 버전 약칭 · 배지 색, 숨기는 도감, 묶음 짧은 이름.
 * 배지 색은 데이터(버전마다 다르다)라 CSS 토큰이 아니라 이 사전에서 온다(Qt VersionChip 그대로).
 */
import dexstyleJson from "../../data/bundled/theme/dexstyle.json" with { type: "json" }
import {
  emptyText,
  localizedOf,
  type LocalizedText,
} from "../../data/text/localizedText.ts"

export interface VersionStyle {
  short: string
  background: string
  text: string
}

interface DexStyle {
  versions: Map<string, VersionStyle>
  pokedexes: Map<string, { hidden: boolean; label: LocalizedText }>
  groups: Map<string, LocalizedText>
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)
const str = (v: unknown) => (typeof v === "string" ? v : "")
// 색 값은 #RGB · #RRGGBB만 받는다(사전이 CSS를 주입하지 못하게)
const color = (v: unknown) =>
  typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : ""

export function parseDexStyle(root: unknown): DexStyle {
  const out: DexStyle = {
    versions: new Map(),
    pokedexes: new Map(),
    groups: new Map(),
  }
  if (!isRecord(root)) return out
  if (isRecord(root.versions))
    for (const [k, v] of Object.entries(root.versions))
      if (isRecord(v))
        out.versions.set(k, {
          short: str(v.short),
          background: color(v.background),
          text: color(v.text),
        })
  if (isRecord(root.pokedexes))
    for (const [k, v] of Object.entries(root.pokedexes))
      if (isRecord(v))
        out.pokedexes.set(k, {
          hidden: v.hidden === true,
          label: localizedOf(v.label),
        })
  if (isRecord(root.versionGroups))
    for (const [k, v] of Object.entries(root.versionGroups))
      if (isRecord(v)) out.groups.set(k, localizedOf(v.label))
  return out
}

let style: DexStyle | null = null
const loaded = () => (style ??= parseDexStyle(dexstyleJson as unknown))

/** 표에 없는 버전은 약칭 = fallback(보통 영어 이름) · 색 없음 */
export function versionStyle(version: string, fallback = ""): VersionStyle {
  return (
    loaded().versions.get(version) ?? {
      short: fallback || version,
      background: "",
      text: "",
    }
  )
}

export const isHiddenDex = (identifier: string): boolean =>
  loaded().pokedexes.get(identifier)?.hidden === true

export const dexLabel = (identifier: string): LocalizedText =>
  loaded().pokedexes.get(identifier)?.label ?? emptyText()

export const groupLabel = (versionGroup: string): LocalizedText =>
  loaded().groups.get(versionGroup) ?? emptyText()
