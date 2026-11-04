/**
 * 게임별 입수 사전(acquisition/<게임 묶음>.json, Qt guidebook 이식) — 기술머신 · 진화 도구 입수처,
 * NPC 가르침 비용, 포켓몬 획득 줄(pokemon 묶음). 사전은 묶음마다 처음 쓸 때 따로 불러온다(2 MB).
 * 파일은 다른 작업이 채우는 중이라 늘 관대하게 읽는다: 칸마다 좁히고 모르는 칸은 버린다.
 */
import { tKey, type TFunction } from "../../../i18n/index.ts"
import {
  emptyText,
  isRecord,
  isEmptyText,
  localizedOf,
  text,
  type Language,
  type LocalizedText,
} from "../../../data/text/localizedText.ts"
import { placeName } from "../../../data/text/places.ts"
import { versionShort } from "./dexstyle.ts"

export interface Cost {
  amount: number
  unit: string
}

/** 입수처 한 줄 */
export interface Source {
  how: string
  where: string
  place: LocalizedText
  content: LocalizedText
  detail: LocalizedText
  cost: Cost[]
  versions: string[]
  region: string
}

/** 포켓몬 획득 줄 — 출현 한 줄과 같은 모양이 되게 레벨 · 데려오기 칸이 더 있다 */
export interface PokemonSource extends Source {
  minLevel: number // 0 = 모름
  maxLevel: number
  versionsFrom: string[] // transfer: 데려올 버전
  replaces: string // 같은 장소 · 버전의 PokéAPI 행 중 이 방법을 가린다
}

export interface GameBook {
  versionGroup: string
  items: Map<string, Source[]>
  tutors: Map<string, Source[]>
  pokemon: Map<string, PokemonSource[]>
}

const str = (v: unknown): string => (typeof v === "string" ? v : "")
const int = (v: unknown): number =>
  typeof v === "number" && Number.isInteger(v) ? v : 0
const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
const textOf = (v: unknown): LocalizedText =>
  v === undefined ? emptyText() : localizedOf(v)

function sourceOf(o: Record<string, unknown>): Source {
  const cost: Cost[] = []
  if (Array.isArray(o.cost))
    for (const c of o.cost)
      if (
        isRecord(c) &&
        typeof c.amount === "number" &&
        Number.isInteger(c.amount) &&
        typeof c.unit === "string"
      )
        cost.push({ amount: c.amount, unit: c.unit })
  return {
    how: str(o.how),
    where: str(o.where),
    place: textOf(o.place),
    content: textOf(o.content),
    detail: textOf(o.detail),
    cost,
    versions: strings(o.versions),
    region: str(o.region),
  }
}

function sourcesOf(value: unknown): Source[] {
  return Array.isArray(value) ? value.filter(isRecord).map(sourceOf) : []
}

function pokemonSourcesOf(value: unknown): PokemonSource[] {
  if (!Array.isArray(value)) return []
  return value.filter(isRecord).map((o) => ({
    ...sourceOf(o),
    minLevel: int(o.minLevel),
    maxLevel: int(o.maxLevel),
    versionsFrom: strings(o.versionsFrom),
    replaces: str(o.replaces),
  }))
}

function section<T>(
  value: unknown,
  read: (v: unknown) => T[]
): Map<string, T[]> {
  const out = new Map<string, T[]>()
  if (!isRecord(value)) return out
  for (const [key, entry] of Object.entries(value)) {
    if (key.startsWith("_")) continue
    const list = read(entry)
    if (list.length > 0) out.set(key, list)
  }
  return out
}

/** 사전 파일 하나 → GameBook. 묶음 이름은 versionGroup 칸, 없으면 파일 이름 */
export function parseBook(root: unknown, fallbackGroup: string): GameBook {
  const o = isRecord(root) ? root : {}
  return {
    versionGroup: str(o.versionGroup) || fallbackGroup,
    items: section(o.items, sourcesOf),
    tutors: section(o.tutors, sourcesOf),
    pokemon: section(o.pokemon, pokemonSourcesOf),
  }
}

export const emptyBook = (versionGroup = ""): GameBook => ({
  versionGroup,
  items: new Map(),
  tutors: new Map(),
  pokemon: new Map(),
})

// ── 불러오기: 파일마다 따로 묶는다(처음 쓸 때 한 번) ──
const FILES = import.meta.glob<unknown>(
  "../../../data/bundled/acquisition/*.json",
  { import: "default" }
)

const books = new Map<string, GameBook>()
const pending = new Map<string, Promise<GameBook>>()

/** 파일 이름 → 묶음 (versionGroup 칸이 파일 이름과 다를 수 있어 다 읽어 둔 것부터 찾는다) */
function fileOf(versionGroup: string): string | undefined {
  return Object.keys(FILES).find((path) =>
    path.endsWith(`/${versionGroup}.json`)
  )
}

/** 이미 불러온 사전(없으면 undefined) */
export const bookNow = (versionGroup: string): GameBook | undefined =>
  books.get(versionGroup)

/** 사전을 불러온다. 파일이 없거나 깨졌으면 빈 사전 */
export function loadBook(versionGroup: string): Promise<GameBook> {
  const done = books.get(versionGroup)
  if (done) return Promise.resolve(done)
  const waiting = pending.get(versionGroup)
  if (waiting) return waiting
  const path = fileOf(versionGroup)
  const load = path ? FILES[path] : undefined
  const promise = (load ? load() : Promise.resolve(undefined))
    .then((root) => parseBook(root, versionGroup))
    .catch((error: unknown) => {
      console.warn("acquisition book failed:", versionGroup, error)
      return emptyBook(versionGroup)
    })
    .then((book) => {
      books.set(versionGroup, book)
      pending.delete(versionGroup)
      return book
    })
  pending.set(versionGroup, promise)
  return promise
}

// ── 글자 ──
const HOW_LABELS: Record<string, string> = {
  field: tKey("필드"),
  hidden: tKey("숨겨진 아이템"),
  gift: tKey("받기"),
  shop: tKey("상점"),
  exchange: tKey("교환"),
  prize: tKey("경품"),
  reward: tKey("보상"),
  held: tKey("야생 포켓몬 소지"),
  trade: tKey("교환(통신)"),
  tutor: tKey("NPC 가르침"),
}

/** 입수 방법 이름. 모르는 값은 "" (줄에 방법 없이 장소부터) */
export function howLabel(how: string, t: TFunction): string {
  const key = HOW_LABELS[how]
  return key ? t(key) : ""
}

const UNITS: Record<string, string> = {
  money: tKey("%1원"),
  bp: tKey("%1BP"),
  coins: tKey("코인 %1"),
  "red-shard": tKey("빨강조각 %1개"),
  "blue-shard": tKey("파랑조각 %1개"),
  "yellow-shard": tKey("노랑조각 %1개"),
  "green-shard": tKey("초록조각 %1개"),
  "heart-scale": tKey("하트비늘 %1개"),
  "athlete-points": tKey("%1포인트"),
  watts: tKey("%1와트"),
  "league-points": tKey("%1LP"),
}

const grouping = new Intl.NumberFormat("ko-KR")

/** (10000, "money") → "10,000원". 모르는 단위는 "8 red-shard" */
export function costText(amount: number, unit: string, t: TFunction): string {
  const number = grouping.format(amount)
  const key = UNITS[unit]
  return key ? t(key, number) : `${number} ${unit}`
}

/** 한 줄로: [방법] · [장소] · [컨텐츠 비용] (조건) */
export function sourceText(
  source: Source,
  language: Language,
  t: TFunction
): string {
  const parts: string[] = []
  const how = howLabel(source.how, t)
  if (how) parts.push(how)
  let where = text(source.place, language)
  if (!where && source.where)
    where = placeName(source.where, emptyText(), language)
  const content = text(source.content, language)
  if (where && where !== content) parts.push(where)
  const price: string[] = []
  if (content) price.push(content)
  const costs = source.cost.map((c) => costText(c.amount, c.unit, t))
  if (costs.length > 0) price.push(costs.join(" + "))
  if (price.length > 0) parts.push(price.join(" "))
  let line = parts.join(" · ")
  const detail = text(source.detail, language)
  if (detail) line += ` (${detail})`
  return line
}

/**
 * 아이템 입수처 줄. version이 비면 묶음 전체(버전 한정은 "W2 — …"), 주면 그 버전 것만.
 * 항목은 있는데 이 버전 것이 없으면 "다른 버전 한정" 한 줄
 */
export function itemSources(
  book: GameBook | undefined,
  item: string,
  language: Language,
  t: TFunction,
  version = ""
): string[] {
  const sources = book?.items.get(item) ?? []
  const lines: string[] = []
  for (const source of sources) {
    if (source.versions.length === 0)
      lines.push(sourceText(source, language, t))
    else if (version === "")
      lines.push(
        `${source.versions.map(versionShort).join("/")} — ${sourceText(source, language, t)}`
      )
    else if (source.versions.includes(version))
      lines.push(sourceText(source, language, t))
  }
  if (lines.length === 0 && sources.length > 0)
    lines.push(t("이 버전에서는 얻을 수 없어요(다른 버전 한정)"))
  return lines
}

/** NPC 가르침 비용(장소 · 컨텐츠 · 비용, 방법 이름 없이). 없으면 "" */
export function tutorCost(
  book: GameBook | undefined,
  move: string,
  language: Language,
  t: TFunction
): string {
  return (book?.tutors.get(move) ?? [])
    .map((source) => sourceText({ ...source, how: "" }, language, t))
    .join(" / ")
}

/** 포켓몬 획득 줄(사전 pokemon 묶음, 키 = species identifier) */
export const pokemonSources = (
  book: GameBook | undefined,
  speciesIdentifier: string
): PokemonSource[] => book?.pokemon.get(speciesIdentifier) ?? []

/** 버전이 맞는 줄인가(versions가 비면 묶음 전체) */
export const sourceFitsVersion = (source: Source, version: string): boolean =>
  source.versions.length === 0 || source.versions.includes(version)

export const hasText = (t: LocalizedText): boolean => !isEmptyText(t)
