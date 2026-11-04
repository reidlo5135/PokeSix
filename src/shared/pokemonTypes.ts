/**
 * 포켓몬 타입 18종 — 디자인 순서(게임 표시 순서 = 히트맵 열 순서).
 * ⚠ PokéAPI types.id 순서와 다르다. 언제나 key(identifier)로 잇는다.
 */
import type { Lang } from "./text.ts"

export const TYPE_KEYS = [
  "normal",
  "fire",
  "water",
  "grass",
  "electric",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const

export type TypeKey = (typeof TYPE_KEYS)[number]

interface TypeInfo {
  ko: string
  en: string
  ja: string
  abbr: string // 한 글자 약자(히트맵 머리 · 약점 칩)
  introGen: number
}

export const TYPE_INFO: Record<TypeKey, TypeInfo> = {
  normal: { ko: "노말", en: "Normal", ja: "ノーマル", abbr: "노", introGen: 1 },
  fire: { ko: "불꽃", en: "Fire", ja: "ほのお", abbr: "불", introGen: 1 },
  water: { ko: "물", en: "Water", ja: "みず", abbr: "물", introGen: 1 },
  grass: { ko: "풀", en: "Grass", ja: "くさ", abbr: "풀", introGen: 1 },
  electric: {
    ko: "전기",
    en: "Electric",
    ja: "でんき",
    abbr: "전",
    introGen: 1,
  },
  ice: { ko: "얼음", en: "Ice", ja: "こおり", abbr: "얼", introGen: 1 },
  fighting: {
    ko: "격투",
    en: "Fighting",
    ja: "かくとう",
    abbr: "격",
    introGen: 1,
  },
  poison: { ko: "독", en: "Poison", ja: "どく", abbr: "독", introGen: 1 },
  ground: { ko: "땅", en: "Ground", ja: "じめん", abbr: "땅", introGen: 1 },
  flying: { ko: "비행", en: "Flying", ja: "ひこう", abbr: "비", introGen: 1 },
  psychic: {
    ko: "에스퍼",
    en: "Psychic",
    ja: "エスパー",
    abbr: "에",
    introGen: 1,
  },
  bug: { ko: "벌레", en: "Bug", ja: "むし", abbr: "벌", introGen: 1 },
  rock: { ko: "바위", en: "Rock", ja: "いわ", abbr: "바", introGen: 1 },
  ghost: { ko: "고스트", en: "Ghost", ja: "ゴースト", abbr: "고", introGen: 1 },
  dragon: {
    ko: "드래곤",
    en: "Dragon",
    ja: "ドラゴン",
    abbr: "드",
    introGen: 1,
  },
  dark: { ko: "악", en: "Dark", ja: "あく", abbr: "악", introGen: 2 },
  steel: { ko: "강철", en: "Steel", ja: "はがね", abbr: "강", introGen: 2 },
  fairy: {
    ko: "페어리",
    en: "Fairy",
    ja: "フェアリー",
    abbr: "페",
    introGen: 6,
  },
}

export function isTypeKey(v: unknown): v is TypeKey {
  return typeof v === "string" && Object.hasOwn(TYPE_INFO, v)
}

/** 타입 이름(이름 표기 언어). 모르는 타입은 "???" */
export function typeName(key: string, lang: Lang): string {
  return isTypeKey(key) ? TYPE_INFO[key][lang] : "???"
}

/** 히트맵 · 약점 칩의 한 글자 약자 (한국어 고정 — 디자인 기준) */
export function typeAbbr(key: string, lang: Lang = "ko"): string {
  if (!isTypeKey(key)) return "?"
  const info = TYPE_INFO[key]
  return lang === "ko" ? info.abbr : info[lang].slice(0, lang === "en" ? 3 : 2)
}

/** 그 세대에 있는 타입인가 */
export const typeExistsIn = (key: TypeKey, generation: number): boolean =>
  TYPE_INFO[key].introGen <= generation
