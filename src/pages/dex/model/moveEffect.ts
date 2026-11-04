/**
 * 변화 기술의 효과 한 줄(Qt moveeffect 이식): "상대 공격 ▼1 · 마비 · HP ½ 회복".
 * 조각마다 색 역할을 단다 — 화면이 토큰 색으로 칠한다.
 */
import moveEffectsJson from "../../../data/bundled/move-effects.json" with { type: "json" }
import type { TFunction } from "../../../i18n/index.ts"
import type { MoveEntry } from "../../../data/repository/types.ts"
import {
  emptyText,
  isEmptyText,
  isRecord,
  localizedOf,
  text,
  type Language,
  type LocalizedText,
} from "../../../data/text/localizedText.ts"

export type EffectTone = "text1" | "text2" | "text3" | "up" | "down" | "heal"

export interface EffectPart {
  text: string
  tone: EffectTone
}

type StatList = [stat: number, change: number][]

interface Rule {
  history: { untilGen: number; stats: StatList }[]
  hasStats: boolean
  stats: StatList
  note: LocalizedText
  ailment: LocalizedText
  userType: string
  userTypeNote: LocalizedText
}

function statsOf(value: unknown): StatList {
  if (!Array.isArray(value)) return []
  const out: StatList = []
  for (const pair of value)
    if (
      Array.isArray(pair) &&
      typeof pair[0] === "number" &&
      typeof pair[1] === "number"
    )
      out.push([pair[0], pair[1]])
  return out
}

const textOf = (v: unknown): LocalizedText =>
  v === undefined ? emptyText() : localizedOf(v)

export function parseMoveEffects(root: unknown): Map<string, Rule> {
  const rules = new Map<string, Rule>()
  const moves = isRecord(root) ? root.moves : undefined
  if (!isRecord(moves)) return rules
  for (const [id, value] of Object.entries(moves)) {
    if (!isRecord(value)) continue
    const history = Array.isArray(value.history)
      ? value.history.filter(isRecord).map((h) => ({
          untilGen: typeof h.untilGen === "number" ? h.untilGen : 0,
          stats: statsOf(h.stats),
        }))
      : []
    rules.set(id, {
      history,
      hasStats: "stats" in value,
      stats: statsOf(value.stats),
      note: textOf(value.note),
      ailment: textOf(value.ailment),
      userType: typeof value.userType === "string" ? value.userType : "",
      userTypeNote: textOf(value.userTypeNote),
    })
  }
  return rules
}

let rules: Map<string, Rule> | null = null
const loaded = () => (rules ??= parseMoveEffects(moveEffectsJson as unknown))

// 대상이 자신(쪽)인 move_targets.id — 나머지는 상대 쪽이라 앞에 "상대"
const SELF_TARGETS = new Set([3, 4, 5, 7, 13, 15])

function statName(stat: number, specialSplit: boolean, t: TFunction): string {
  switch (stat) {
    case 1:
      return t("HP")
    case 2:
      return t("공격")
    case 3:
      return t("방어")
    case 4:
      return specialSplit ? t("특공") : t("특수")
    case 5:
      return specialSplit ? t("특방") : t("특수")
    case 6:
      return t("스피드")
    case 7:
      return t("명중률")
    case 8:
      return t("회피율")
    default:
      return ""
  }
}

function ailmentName(ailment: number, t: TFunction): string {
  switch (ailment) {
    case 1:
      return t("마비")
    case 2:
      return t("잠듦")
    case 3:
      return t("얼음")
    case 4:
      return t("화상")
    case 5:
      return t("독")
    case 6:
      return t("혼란")
    case 7:
      return t("헤롱헤롱")
    case 14:
      return t("하품(다음 턴 잠듦)")
    default:
      return ""
  }
}

/** "A. B." → "A." (일본어 。도). 한 문장뿐이면 그대로 */
export function firstSentence(s: string): string {
  for (let i = 0; i + 1 < s.length; i++)
    if ((s[i] === "." && s[i + 1] === " ") || s[i] === "。")
      return s.slice(0, i + 1)
  return s
}

function healingText(healing: number, t: TFunction): string {
  const amount = Math.abs(healing)
  const part =
    amount === 50
      ? "½"
      : amount === 25
        ? "¼"
        : amount === 100
          ? t("전부")
          : `${amount}%`
  return healing > 0 ? t("HP %1 회복", part) : t("HP %1 소모", part)
}

/** 효과 조각. userTypes = 쓰는 포켓몬의 그 세대 타입 */
export function describeMove(
  move: MoveEntry,
  generation: number,
  userTypes: readonly string[],
  language: Language,
  t: TFunction
): EffectPart[] {
  const rule = loaded().get(move.identifier)
  const parts: EffectPart[] = []
  const separator = () => {
    if (parts.length > 0) parts.push({ text: " · ", tone: "text3" })
  }
  // 1) 쓰는 포켓몬의 타입에 따라 아예 다른 효과(저주: 고스트)
  if (rule?.userType && userTypes.includes(rule.userType)) {
    parts.push({ text: text(rule.userTypeNote, language), tone: "text2" })
    return parts
  }
  // 2) 능력치 변화: 그 세대의 옛 값(history) > 사전의 고정 값 > DB
  let stats: StatList = rule?.hasStats ? rule.stats : move.statChanges
  for (const h of rule?.history ?? [])
    if (generation <= h.untilGen) {
      stats = h.stats
      break
    }
  const self = SELF_TARGETS.has(move.target)
  const specialSplit = generation >= 2
  const named: [string, number][] = [] // 1세대: 특공 · 특방 → "특수" 하나
  for (const [stat, change] of stats) {
    const name = statName(stat, specialSplit, t)
    if (!name || named.some(([n, c]) => n === name && c === change)) continue
    named.push([name, change])
  }
  named.forEach(([name, change], i) => {
    separator()
    if (!self && i === 0) parts.push({ text: `${t("상대")} `, tone: "text3" })
    parts.push({ text: `${name} `, tone: "text1" })
    parts.push({
      text: (change > 0 ? "▲" : "▼") + String(Math.abs(change)),
      tone: change > 0 ? "up" : "down",
    })
  })
  // 3) 상태이상 · 회복 · 사전 요약
  const ailment =
    rule && !isEmptyText(rule.ailment)
      ? text(rule.ailment, language)
      : ailmentName(move.ailment, t)
  if (ailment) {
    separator()
    parts.push({
      text: (self ? "" : `${t("상대")} `) + ailment,
      tone: "text1",
    })
  }
  if (move.healing !== 0) {
    separator()
    parts.push({
      text: healingText(move.healing, t),
      tone: move.healing > 0 ? "heal" : "text1",
    })
  }
  if (rule && !isEmptyText(rule.note)) {
    separator()
    parts.push({ text: text(rule.note, language), tone: "text2" })
  }
  // 4) 뼈대가 없다 → 그 세대 게임 설명문 첫 문장(전체는 풍선 도움말)
  if (parts.length === 0 && !isEmptyText(move.effect))
    parts.push({
      text: firstSentence(text(move.effect, language)),
      tone: "text3",
    })
  return parts
}

export const plainText = (parts: readonly EffectPart[]): string =>
  parts.map((p) => p.text).join("")

/** 풍선 도움말: 효과 줄 + (다르면) 게임 설명문 전체 */
export function effectTooltip(
  parts: readonly EffectPart[],
  move: MoveEntry,
  language: Language
): string {
  const plain = plainText(parts)
  const flavor = text(move.effect, language)
  return flavor && flavor !== plain ? `${plain}\n${flavor}` : plain
}
