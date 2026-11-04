/**
 * 변화 기술의 효과 한 줄: "공격 ▲2" · "상대 스피드 ▼1" · "상대 마비" · "HP ½ 회복" (Qt ui/dex/moveeffect 이식).
 * 뼈대는 DB(move_meta · 능력치 변화 — 지금 게임 값), 세대 차이 · 예외는 move-effects.json이 덮는다.
 * 그릴 뼈대가 없으면 그 세대 게임 설명문 첫 문장.
 */
import movesJson from "../../data/bundled/move-effects.json" with { type: "json" }
import {
  isEmptyText,
  localizedOf,
  text,
  type Language,
  type LocalizedText,
} from "../../data/text/localizedText.ts"
import { featuresOf } from "./generationFeatures.ts"

export type TextFn = (key: string, ...args: (string | number)[]) => string

/** 조각 색 역할: 글자 1–3 · 오름(빨강) · 내림(파랑) · 회복(초록) */
export type EffectTone = "text1" | "text2" | "text3" | "up" | "down" | "heal"

export interface EffectSegment {
  text: string
  tone: EffectTone
}

/** describe가 보는 기술 값(MoveEntry의 일부) */
export interface EffectMove {
  identifier: string
  target: number
  ailment: number
  healing: number
  statChanges: [number, number][]
  effect: LocalizedText
}

type StatList = [number, number][]

interface Rule {
  history: { untilGen: number; stats: StatList }[]
  stats: StatList | null
  note: LocalizedText
  ailment: LocalizedText
  userType: string
  userTypeNote: LocalizedText
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

function statsOf(v: unknown): StatList {
  if (!Array.isArray(v)) return []
  const out: StatList = []
  for (const pair of v)
    if (
      Array.isArray(pair) &&
      Number.isInteger(pair[0]) &&
      Number.isInteger(pair[1])
    )
      out.push([pair[0] as number, pair[1] as number])
  return out
}

export function parseMoveEffects(root: unknown): Map<string, Rule> {
  const rules = new Map<string, Rule>()
  const moves = isRecord(root) ? root.moves : undefined
  if (!isRecord(moves)) return rules
  for (const [key, raw] of Object.entries(moves)) {
    if (!isRecord(raw)) continue
    rules.set(key, {
      history: Array.isArray(raw.history)
        ? raw.history.filter(isRecord).map((h) => ({
            untilGen: Number.isInteger(h.untilGen) ? (h.untilGen as number) : 0,
            stats: statsOf(h.stats),
          }))
        : [],
      stats: "stats" in raw ? statsOf(raw.stats) : null,
      note: localizedOf(raw.note),
      ailment: localizedOf(raw.ailment),
      userType: typeof raw.userType === "string" ? raw.userType : "",
      userTypeNote: localizedOf(raw.userTypeNote),
    })
  }
  return rules
}

let rules: Map<string, Rule> | null = null
const loaded = () => (rules ??= parseMoveEffects(movesJson as unknown))

// 대상이 자신(쪽)인 move_targets.id — 나머지는 상대 쪽이라 앞에 "상대"
const SELF_TARGETS = new Set([3, 4, 5, 7, 13, 15])

function statName(t: TextFn, stat: number, specialSplit: boolean): string {
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

function ailmentName(t: TextFn, ailment: number): string {
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

/** "A한다. B한다." → "A한다." (일본어 。도) */
export function firstSentence(s: string): string {
  for (let i = 0; i + 1 < s.length; i++)
    if ((s[i] === "." && s[i + 1] === " ") || s[i] === "。")
      return s.slice(0, i + 1)
  return s
}

function healingText(t: TextFn, healing: number): string {
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

export function describeMoveEffect(
  move: EffectMove,
  generation: number,
  userTypes: readonly string[],
  language: Language,
  t: TextFn,
  source: Map<string, Rule> = loaded()
): EffectSegment[] {
  const { specialSplit } = featuresOf(generation)
  const rule = source.get(move.identifier)
  const parts: EffectSegment[] = []
  const separator = () => {
    if (parts.length > 0) parts.push({ text: " · ", tone: "text3" })
  }

  // 1) 쓰는 포켓몬의 타입에 따라 다른 효과(저주: 고스트)
  if (rule && rule.userType !== "" && userTypes.includes(rule.userType))
    return [{ text: text(rule.userTypeNote, language), tone: "text2" }]

  // 2) 능력치 변화: 그 세대 옛 값 > 사전 고정 값 > DB
  let stats: StatList = rule?.stats ?? move.statChanges
  for (const h of rule?.history ?? [])
    if (generation <= h.untilGen) {
      stats = h.stats
      break
    }
  const self = SELF_TARGETS.has(move.target)
  const named: [string, number][] = []
  for (const [stat, change] of stats) {
    const name = statName(t, stat, specialSplit)
    if (name === "" || named.some(([n, c]) => n === name && c === change))
      continue
    named.push([name, change])
  }
  named.forEach(([name, change], i) => {
    separator()
    if (!self && i === 0) parts.push({ text: `${t("상대")} `, tone: "text3" })
    parts.push({ text: `${name} `, tone: "text1" })
    parts.push({
      text: `${change > 0 ? "▲" : "▼"}${Math.abs(change)}`,
      tone: change > 0 ? "up" : "down",
    })
  })

  // 3) 상태이상 · 회복 · 메모
  const ailment =
    rule && !isEmptyText(rule.ailment)
      ? text(rule.ailment, language)
      : ailmentName(t, move.ailment)
  if (ailment !== "") {
    separator()
    parts.push({
      text: (self ? "" : `${t("상대")} `) + ailment,
      tone: "text1",
    })
  }
  if (move.healing !== 0) {
    separator()
    parts.push({
      text: healingText(t, move.healing),
      tone: move.healing > 0 ? "heal" : "text1",
    })
  }
  if (rule && !isEmptyText(rule.note)) {
    separator()
    parts.push({ text: text(rule.note, language), tone: "text2" })
  }

  // 4) 뼈대가 없으면 설명문 첫 문장
  if (parts.length === 0 && !isEmptyText(move.effect))
    parts.push({
      text: firstSentence(text(move.effect, language)),
      tone: "text3",
    })
  return parts
}

export const effectPlainText = (parts: readonly EffectSegment[]): string =>
  parts.map((p) => p.text).join("")
