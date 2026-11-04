/**
 * 게임 칩 글자 — dexstyle.json의 버전 약칭(HG · SS)과 겹칠 때 붙는 묶음 이름(DLC).
 */
import dexstyle from "../../data/bundled/theme/dexstyle.json" with { type: "json" }

import type { GameInfo } from "../../data/repository/types.ts"
import {
  isRecord,
  localizedOf,
  text,
  type Language,
} from "../../data/text/localizedText.ts"

const root: unknown = dexstyle

function shorts(): Map<string, string> {
  const out = new Map<string, string>()
  const versions = isRecord(root) ? root.versions : undefined
  if (!isRecord(versions)) return out
  for (const [id, v] of Object.entries(versions))
    if (isRecord(v) && typeof v.short === "string" && v.short !== "")
      out.set(id, v.short)
  return out
}

let shortMap: Map<string, string> | null = null

/** 버전 약칭. 표에 없으면 "" */
export function versionShort(version: string): string {
  shortMap ??= shorts()
  return shortMap.get(version) ?? ""
}

/** 약칭이 겹치는 묶음에 붙일 짧은 이름(DLC). 없으면 "" */
export function versionGroupSuffix(
  versionGroup: string,
  language: Language
): string {
  const groups = isRecord(root) ? root.versionGroups : undefined
  const entry = isRecord(groups) ? groups[versionGroup] : undefined
  return isRecord(entry) ? text(localizedOf(entry.label), language) : ""
}

export interface ChipSegment {
  version: string
  short: string
  name: string
}

export interface GameChip {
  versionGroup: string
  segments: ChipSegment[]
  /** 앞 칩과 약칭이 같을 때만 */
  suffix: string
  /** 버전 이름 " · " */
  tooltip: string
}

/** 게임 묶음 → 칩. 약칭이 없는 버전은 이름 그대로 */
export function gameChips(
  games: readonly GameInfo[],
  language: Language
): GameChip[] {
  const seen = new Set<string>()
  return games.map((g) => {
    const segments = g.versions.map((version, i) => {
      const name =
        text(g.versionNames[i] ?? localizedOf(""), language) || version
      return { version, short: versionShort(version) || name, name }
    })
    const signature = segments.map((s) => s.short).join("|")
    const suffix = seen.has(signature)
      ? versionGroupSuffix(g.versionGroup, language)
      : ""
    seen.add(signature)
    return {
      versionGroup: g.versionGroup,
      segments,
      suffix,
      tooltip: segments.map((s) => s.name).join(" · "),
    }
  })
}
