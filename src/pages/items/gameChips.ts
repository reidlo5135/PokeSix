/**
 * 게임 묶음 칩([신오 D|P] [신오 Pt] [성도 HG|SS]) — Qt DexSelector · dexstyle.json 이식.
 * 칩 이름 = 그 묶음을 쓰는 (숨기지 않은) 첫 지방 도감의 이름 바꾸기 → 지방 이름 → 묶음 이름 바꾸기.
 * 배지 = 버전 약칭 칸(같은 약칭은 한 번만). 색은 dexstyle.json 값을 그대로 쓴다(데이터).
 */
import dexStyleJson from "../../data/bundled/theme/dexstyle.json" with { type: "json" }

import type { DexInfo, GameInfo } from "../../data/repository/types.ts"
import {
  isRecord,
  localizedOf,
  text,
  type Language,
  type LocalizedText,
} from "../../data/text/localizedText.ts"

export interface VersionStyle {
  short: string
  background: string
  text: string
}

export interface DexStyle {
  versions: Map<string, VersionStyle>
  pokedexes: Map<string, { hidden: boolean; label: LocalizedText | null }>
  versionGroups: Map<string, LocalizedText>
}

const str = (v: unknown): string => (typeof v === "string" ? v : "")

export function parseDexStyle(raw: unknown): DexStyle {
  const style: DexStyle = {
    versions: new Map(),
    pokedexes: new Map(),
    versionGroups: new Map(),
  }
  if (!isRecord(raw)) return style
  if (isRecord(raw.versions))
    for (const [id, v] of Object.entries(raw.versions)) {
      if (!isRecord(v) || str(v.short) === "") continue
      style.versions.set(id, {
        short: str(v.short),
        background: str(v.background),
        text: str(v.text),
      })
    }
  if (isRecord(raw.pokedexes))
    for (const [id, v] of Object.entries(raw.pokedexes)) {
      if (!isRecord(v)) continue
      style.pokedexes.set(id, {
        hidden: v.hidden === true,
        label: v.label === undefined ? null : localizedOf(v.label),
      })
    }
  if (isRecord(raw.versionGroups))
    for (const [id, v] of Object.entries(raw.versionGroups))
      if (isRecord(v) && v.label !== undefined)
        style.versionGroups.set(id, localizedOf(v.label))
  return style
}

export const DEX_STYLE: DexStyle = parseDexStyle(dexStyleJson as unknown)

/** 버전 약칭. 표에 없으면 "" */
export const versionShort = (style: DexStyle, version: string): string =>
  style.versions.get(version)?.short ?? ""

export interface VersionBadge {
  short: string
  /** 바탕 · 글자 색 (CSS 값). 표에 없는 버전은 토큰 */
  background: string
  color: string
}

export interface GameChip {
  versionGroup: string
  label: string
  badges: VersionBadge[]
  /** "신오 — 디아루가 · 펄기아" */
  tooltip: string
}

/** 칩 이름: 숨기지 않은 첫 지방 도감의 이름 바꾸기 → 지방 이름 → 묶음 이름 바꾸기 → "" */
export function chipLabel(
  game: GameInfo,
  dexes: readonly DexInfo[],
  style: DexStyle,
  language: Language
): string {
  const dex = dexes.find(
    (d) =>
      d.versionGroups.includes(game.versionGroup) &&
      style.pokedexes.get(d.identifier)?.hidden !== true
  )
  if (dex) {
    const label = style.pokedexes.get(dex.identifier)?.label
    const name = label ? text(label, language) : ""
    if (name !== "") return name
    const region = text(dex.region, language)
    if (region !== "") return region
  }
  const groupLabel = style.versionGroups.get(game.versionGroup)
  return groupLabel ? text(groupLabel, language) : ""
}

/** 버전 배지 칸들 — 같은 약칭은 한 번만(DLC Sw · Sh) */
export function versionBadges(game: GameInfo, style: DexStyle): VersionBadge[] {
  const out: VersionBadge[] = []
  game.versions.forEach((version, i) => {
    const s = style.versions.get(version)
    const badge: VersionBadge = s
      ? {
          short: s.short,
          background: s.background || "var(--color-white)",
          color: s.text || "var(--color-text-1)",
        }
      : {
          short: game.versionNames[i]?.en || version,
          background: "var(--color-white)",
          color: "var(--color-text-1)",
        }
    if (!out.some((b) => b.short === badge.short)) out.push(badge)
  })
  return out
}

export function gameChips(
  games: readonly GameInfo[],
  dexes: readonly DexInfo[],
  style: DexStyle,
  language: Language
): GameChip[] {
  return games.map((game) => {
    const label = chipLabel(game, dexes, style, language)
    const names = game.versionNames.map((n) => text(n, language)).join(" · ")
    return {
      versionGroup: game.versionGroup,
      label,
      badges: versionBadges(game, style),
      tooltip: label ? `${label} — ${names}` : names,
    }
  })
}
