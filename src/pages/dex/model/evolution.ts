/**
 * 진화 조건 글 · 진화 도구 입수처 줄 (Qt EvolutionView 이식).
 */
import type {
  EvolutionCondition,
  EvolutionStep,
} from "../../../data/repository/types.ts"
import {
  isEmptyText,
  text,
  type Language,
} from "../../../data/text/localizedText.ts"
import { placeName } from "../../../data/text/places.ts"
import type { TFunction } from "../../../i18n/index.ts"
import { isTypeKey, typeName } from "../../../shared/pokemonTypes.ts"
import { itemSources, type GameBook } from "./guidebook.ts"

/** 조건 하나 → "Lv 36 · 밤" */
export function conditionText(
  c: EvolutionCondition,
  language: Language,
  t: TFunction
): string {
  const parts: string[] = []
  switch (c.trigger) {
    case 1:
      parts.push(c.minLevel > 0 ? t("Lv %1", c.minLevel) : t("레벨업"))
      break
    case 2:
      if (!isEmptyText(c.heldItem))
        parts.push(t("%1 지니고 통신교환", text(c.heldItem, language)))
      else if (!isEmptyText(c.tradeSpecies))
        parts.push(t("%1과(와) 통신교환", text(c.tradeSpecies, language)))
      else parts.push(t("통신교환"))
      break
    case 3:
      parts.push(t("%1 사용", text(c.item, language)))
      break
    case 4:
      parts.push(t("파티 빈자리 · 몬스터볼"))
      break
    default:
      parts.push(t("특별한 조건"))
  }
  if (c.trigger === 1 && !isEmptyText(c.heldItem))
    parts.push(t("%1 지님", text(c.heldItem, language)))
  if (c.location)
    parts.push(t("%1에서", placeName(c.location, c.locationName, language)))
  if (c.minHappiness > 0 || c.minAffection > 0) parts.push(t("친밀도"))
  if (c.minBeauty > 0) parts.push(t("아름다움"))
  if (c.timeOfDay === "day") parts.push(t("낮"))
  else if (c.timeOfDay === "night") parts.push(t("밤"))
  else if (c.timeOfDay === "dusk") parts.push(t("황혼"))
  if (c.gender === 1) parts.push(t("암컷"))
  else if (c.gender === 2) parts.push(t("수컷"))
  if (!isEmptyText(c.knownMove))
    parts.push(t("%1 배운 상태", text(c.knownMove, language)))
  if (isTypeKey(c.knownMoveType))
    parts.push(t("%1 타입 기술 배운 상태", typeName(c.knownMoveType, language)))
  if (c.relativeStats === 1) parts.push(t("공격 > 방어"))
  else if (c.relativeStats === 0) parts.push(t("공격 = 방어"))
  else if (c.relativeStats === -1) parts.push(t("공격 < 방어"))
  if (!isEmptyText(c.partySpecies))
    parts.push(t("파티에 %1", text(c.partySpecies, language)))
  if (isTypeKey(c.partyType))
    parts.push(t("파티에 %1 타입", typeName(c.partyType, language)))
  if (c.needsRain) parts.push(t("비 오는 날"))
  if (c.upsideDown) parts.push(t("기기 뒤집기"))
  return parts.join(" · ")
}

/** 진화 방법이 여럿이면 그중 하나로 — 서로 다른 글을 " / "로 */
export function conditionsOf(
  step: EvolutionStep,
  language: Language,
  t: TFunction
): string {
  const seen: string[] = []
  for (const c of step.conditions) {
    const s = conditionText(c, language, t)
    if (!seen.includes(s)) seen.push(s)
  }
  return seen.join(" / ")
}

/** 조건에 나오는 도구(사용 · 지님)마다 "도구 — 입수처" 한 줄 */
export function itemLines(
  step: EvolutionStep,
  book: GameBook | undefined,
  version: string,
  language: Language,
  t: TFunction
): string[] {
  const lines: string[] = []
  const seen = new Set<string>()
  for (const c of step.conditions)
    for (const [identifier, name] of [
      [c.itemIdentifier, c.item],
      [c.heldItemIdentifier, c.heldItem],
    ] as const) {
      if (!identifier || seen.has(identifier)) continue
      seen.add(identifier)
      const sources = itemSources(book, identifier, language, t, version)
      lines.push(
        `${text(name, language)} — ${
          sources.length > 0
            ? sources.join(" / ")
            : t("입수 정보가 아직 없어요")
        }`
      )
    }
  return lines
}

/** 개요 줄용: 깊이마다 이름 묶음(이브이 → 샤미드 · 쥬피썬더 · …) */
export function evolutionStages(
  steps: readonly EvolutionStep[]
): EvolutionStep[][] {
  const stages: EvolutionStep[][] = []
  for (const step of steps) (stages[step.depth] ??= []).push(step)
  return stages.filter((s) => s !== undefined)
}

/** 진화 전 단계가 있다(이 종의 깊이 > 0) */
export const hasPreEvolution = (
  steps: readonly EvolutionStep[],
  speciesId: number
): boolean => steps.some((s) => s.speciesId === speciesId && s.depth > 0)
