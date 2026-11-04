/**
 * 도감 표시 규칙(dexstyle.json, Qt ADR 0012) — 버전 약칭 · 배지 색, 숨기는 도감, 도감 · DLC 이름.
 * 배지 색은 디자인 토큰이 아니라 데이터다: 화면은 CSS 사용자 변수(--badge-bg · --badge-fg)로 넘긴다.
 */
import dexstyleJson from "../../../data/bundled/theme/dexstyle.json" with { type: "json" }
import {
  emptyText,
  isRecord,
  localizedOf,
  text,
  type Language,
  type LocalizedText,
} from "../../../data/text/localizedText.ts"
import type { DexInfo, GameInfo } from "../../../data/repository/types.ts"

interface RawVersion {
  short: string
  background: string | null
  text: string | null
}

export interface DexStyleTable {
  versions: Map<string, RawVersion>
  dexes: Map<string, { label: LocalizedText; hidden: boolean }>
  groups: Map<string, LocalizedText>
}

const HEX = /^#[0-9a-f]{6}$/i

/** JSON을 믿지 않고 좁힌다 — 모양이 틀린 칸은 버린다 */
export function parseDexStyle(root: unknown): DexStyleTable {
  const table: DexStyleTable = {
    versions: new Map(),
    dexes: new Map(),
    groups: new Map(),
  }
  if (!isRecord(root)) return table
  if (isRecord(root.versions))
    for (const [id, v] of Object.entries(root.versions)) {
      if (!isRecord(v)) continue
      const color = (c: unknown) =>
        typeof c === "string" && HEX.test(c) ? c : null
      table.versions.set(id, {
        short: typeof v.short === "string" ? v.short : "",
        background: color(v.background),
        text: color(v.text),
      })
    }
  if (isRecord(root.pokedexes))
    for (const [id, d] of Object.entries(root.pokedexes)) {
      if (!isRecord(d)) continue
      table.dexes.set(id, {
        label: d.label === undefined ? emptyText() : localizedOf(d.label),
        hidden: d.hidden === true,
      })
    }
  if (isRecord(root.versionGroups))
    for (const [id, g] of Object.entries(root.versionGroups))
      if (isRecord(g)) table.groups.set(id, localizedOf(g.label))
  return table
}

let table: DexStyleTable | null = null
const loaded = (): DexStyleTable =>
  (table ??= parseDexStyle(dexstyleJson as unknown))

/** 배지 한 칸: 약칭 + 색(CSS 값). 사전에 없으면 영어 버전 이름 · 흰 바탕 · 먹 글자 */
export interface VersionStyle {
  short: string
  background: string
  color: string
}

export function versionStyle(
  version: string,
  fallbackName: string
): VersionStyle {
  const raw = loaded().versions.get(version)
  return {
    short: raw?.short || fallbackName,
    background: raw?.background ?? "var(--color-white)",
    color: raw?.text ?? "var(--color-text-1)",
  }
}

/** 배지 색을 CSS 사용자 변수로 */
export const badgeVars = (s: VersionStyle): Record<string, string> => ({
  "--badge-bg": s.background,
  "--badge-fg": s.color,
})

/** 알로라 섬 도감처럼 숨기는 도감 */
export const isHiddenDex = (identifier: string): boolean =>
  loaded().dexes.get(identifier)?.hidden === true

/** 도감 버튼 글: 사전 이름(센트럴 · 외딴섬 …) → 지방 이름 */
export function dexLabel(dex: DexInfo, language: Language): string {
  const label = loaded().dexes.get(dex.identifier)?.label
  const fromBook = label ? text(label, language) : ""
  return fromBook || text(dex.region, language)
}

/** DLC 묶음의 짧은 이름(외딴섬 · 벽록의 가면). 없으면 "" */
export function groupLabel(versionGroup: string, language: Language): string {
  const label = loaded().groups.get(versionGroup)
  return label ? text(label, language) : ""
}

/** 배지 칸: 버전마다 하나, 같은 약칭은 한 번만(관동 1세대 G|R|B|Y) */
export interface BadgeCell extends VersionStyle {
  version: string
}

export function badgeCells(
  versions: readonly string[],
  names: readonly LocalizedText[]
): BadgeCell[] {
  const cells: BadgeCell[] = []
  versions.forEach((version, i) => {
    const style = versionStyle(version, names[i]?.en || version)
    if (cells.some((c) => c.short === style.short)) return
    cells.push({ ...style, version })
  })
  return cells
}

/** 게임 칩 하나 = 버전 하나(HGSS → HG · SS) */
export interface GameChip {
  version: string
  versionGroup: string
  style: VersionStyle
  /** 같은 약칭이 앞에 있을 때만: DLC 이름 또는 그 버전 이름 */
  suffix: string
  /** 버전 이름(고른 언어) */
  name: string
}

export function gameChips(
  games: readonly GameInfo[],
  language: Language
): GameChip[] {
  const chips: GameChip[] = []
  for (const game of games)
    game.versions.forEach((version, i) => {
      const names = game.versionNames[i] ?? emptyText()
      const style = versionStyle(version, names.en || version)
      const name = text(names, language) || version
      const repeated = chips.some((c) => c.style.short === style.short)
      chips.push({
        version,
        versionGroup: game.versionGroup,
        style,
        suffix: repeated ? groupLabel(game.versionGroup, language) || name : "",
        name,
      })
    })
  return chips
}

/** 버전 약칭(예: "W2"). 사전에 없으면 identifier */
export const versionShort = (version: string): string =>
  versionStyle(version, version).short
