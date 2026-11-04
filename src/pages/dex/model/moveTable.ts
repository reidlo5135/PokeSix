/**
 * 습득 기술 표의 칸 글 · 자속 판정 · 하트비늘 풍선 (Qt MoveList 이식).
 */
import type { MoveEntry } from "../../../data/repository/types.ts"
import { machineLabel, STATUS_CLASS } from "../../../data/repository/rules.ts"
import type { TFunction } from "../../../i18n/index.ts"

export type MoveTab = "level" | "machine" | "egg" | "tutor" | "acquisition"

/** 위력 1 = 고정되지 않은 위력(PokéAPI 관례) */
export const VARIABLE_POWER = 1

/** 자속 보정: 기술 타입이 내 타입이고 공격 기술(위력 있음) */
export const isStab = (move: MoveEntry, types: readonly string[]): boolean =>
  move.damageClass !== STATUS_CLASS &&
  move.power > 0 &&
  move.type !== "" &&
  types.includes(move.type)

export function powerText(move: MoveEntry, t: TFunction): string {
  if (move.power <= 0) return "—"
  if (move.power === VARIABLE_POWER) return t("변동")
  return String(move.power)
}

export const accuracyText = (move: MoveEntry): string =>
  move.accuracy > 0 ? String(move.accuracy) : "—"

export const ppText = (move: MoveEntry): string =>
  move.pp > 0 ? String(move.pp) : "—"

/** 첫 칸: 레벨(0 = 진화할 때) 또는 기술머신 번호 */
export function firstCell(move: MoveEntry, tab: MoveTab, t: TFunction): string {
  if (tab === "machine")
    return machineLabel(move.machineItem, move.machineNumber)
  if (tab === "level") return move.level === 0 ? t("진화") : String(move.level)
  return ""
}

/** 하트비늘(기술 떠올리기) 풍선 */
export function reminderTooltip(earliestLevel: number, t: TFunction): string {
  return earliestLevel > 0
    ? t(
        "이 게임에서는 Lv %1부터 얻어요. 얻을 때 갖고 있지 않으면 기술 떠올리기(하트비늘)로 배워요.",
        earliestLevel
      )
    : t(
        "진화 전 단계에서는 배우지 않는 기술이에요. 진화한 뒤 기술 떠올리기(하트비늘)로 배워요."
      )
}

/** 하트비늘 아이콘 키: 5세대까지 BW 그림 */
export const heartScaleKey = (generation: number): string =>
  generation <= 5 ? "gen5/heart-scale" : "heart-scale"
