/**
 * 입수 사전(acquisition/<versionGroup>.json) 읽기 · 입수처 글자 만들기 — Qt ui/dex/guidebook 이식.
 * 사전은 사람 · 수집기가 채우는 파일이라 칸마다 좁힌다: 모양이 틀린 칸은 빈 값, 모르는 칸은 무시.
 */
import { tKey, type TFunction } from "../../i18n/index.ts"
import {
  isRecord,
  localizedOf,
  text,
  type Language,
  type LocalizedText,
} from "../../data/text/localizedText.ts"

export interface Cost {
  amount: number
  unit: string
}

/** 입수처 한 줄. 빈 칸 = "" · [] */
export interface AcquisitionSource {
  how: string // field · hidden · gift · shop · exchange · prize · reward · held · trade · tutor · other
  where: string // PokéAPI locations.identifier
  place: LocalizedText // where보다 먼저 보이는 장소 글자(층 · 건물)
  content: LocalizedText // 게임코너 · 배틀프런티어 …
  cost: Cost[] // 여럿이면 합쳐서 낸다
  detail: LocalizedText // 조건 · 메모
  versions: string[] // 같은 묶음의 이 버전에서만. 비면 모든 버전
  region: string // 진행 기준 지방(HGSS의 johto · kanto)
}

export interface AcquisitionBook {
  versionGroup: string
  /** true면 items가 "그 게임에서 얻는 아이템 전부" */
  completeItemList: boolean
  items: Map<string, AcquisitionSource[]>
  tutors: Map<string, AcquisitionSource[]>
}

const str = (v: unknown): string => (typeof v === "string" ? v : "")

const strings = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((s): s is string => typeof s === "string" && s !== "")
    : []

function parseCosts(v: unknown): Cost[] {
  if (!Array.isArray(v)) return []
  const out: Cost[] = []
  for (const c of v) {
    if (!isRecord(c)) continue
    const amount = c.amount
    const unit = str(c.unit)
    // 금액이 숫자가 아니면 그 비용만 버린다
    if (typeof amount !== "number" || !Number.isFinite(amount) || unit === "")
      continue
    out.push({ amount, unit })
  }
  return out
}

/** 입수처 한 칸. 객체가 아니면 null */
export function parseSource(v: unknown): AcquisitionSource | null {
  if (!isRecord(v)) return null
  return {
    how: str(v.how),
    where: str(v.where),
    place: localizedOf(v.place),
    content: localizedOf(v.content),
    cost: parseCosts(v.cost),
    detail: localizedOf(v.detail),
    versions: strings(v.versions),
    region: str(v.region),
  }
}

function parseSection(v: unknown): Map<string, AcquisitionSource[]> {
  const out = new Map<string, AcquisitionSource[]>()
  if (!isRecord(v)) return out
  for (const [key, list] of Object.entries(v)) {
    if (key === "" || key.startsWith("_") || !Array.isArray(list)) continue
    const sources = list
      .map(parseSource)
      .filter((s): s is AcquisitionSource => s !== null)
    out.set(key, sources)
  }
  return out
}

/** 사전 파일 하나. 키 = versionGroup 칸, 없으면 파일 이름 */
export function parseBook(raw: unknown, fileKey: string): AcquisitionBook {
  const root = isRecord(raw) ? raw : {}
  const vg = str(root.versionGroup)
  return {
    versionGroup: vg !== "" ? vg : fileKey,
    completeItemList: root.completeItemList === true,
    items: parseSection(root.items),
    tutors: parseSection(root.tutors),
  }
}

export const emptyBook = (versionGroup: string): AcquisitionBook => ({
  versionGroup,
  completeItemList: false,
  items: new Map(),
  tutors: new Map(),
})

// 입수 방법 이름 — 모르는 값 · other는 빈 칸(방법 없이 장소부터)
const HOW_LABELS: Readonly<Record<string, string>> = {
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

export function howLabel(how: string, t: TFunction): string {
  const key = Object.hasOwn(HOW_LABELS, how) ? HOW_LABELS[how] : undefined
  return key ? t(key) : ""
}

const COST_LABELS: Readonly<Record<string, string>> = {
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

const NUMBER = new Intl.NumberFormat("ko-KR")

/** 천 단위 쉼표 숫자 */
export const formatNumber = (n: number): string => NUMBER.format(n)

/** 비용 글자 "코인 10,000" · "32BP". 모르는 단위는 "{n} {unit}" */
export function costText(amount: number, unit: string, t: TFunction): string {
  const n = formatNumber(amount)
  const key = Object.hasOwn(COST_LABELS, unit) ? COST_LABELS[unit] : undefined
  return key ? t(key, n) : `${n} ${unit}`
}

export interface SourceTextOptions {
  language: Language
  t: TFunction
  /** where(identifier) → 장소 이름 */
  placeOf: (where: string) => string
  /** 방법 글자를 빼고 만든다(NPC 가르침 비용 칸) */
  omitHow?: boolean
}

/** 한 줄: "[방법] · [장소] · [컨텐츠 비용들] (조건)" */
export function sourceText(
  source: AcquisitionSource,
  { language, t, placeOf, omitHow = false }: SourceTextOptions
): string {
  const parts: string[] = []
  const how = omitHow ? "" : howLabel(source.how, t)
  if (how) parts.push(how)
  let where = text(source.place, language)
  if (!where && source.where) where = placeOf(source.where)
  const content = text(source.content, language)
  // "배틀프런티어 · 배틀프런티어 32BP"처럼 겹치면 장소를 뺀다
  if (where && where !== content) parts.push(where)
  const price: string[] = []
  if (content) price.push(content)
  const costs = source.cost.map((c) => costText(c.amount, c.unit, t))
  if (costs.length > 0) price.push(costs.join(" + "))
  if (price.length > 0) parts.push(price.join(" "))
  let line = parts.join(" · ")
  const detail = text(source.detail, language)
  if (detail) line = line ? `${line} (${detail})` : detail
  return line
}

export interface ItemSourcesOptions extends SourceTextOptions {
  /** 버전 약칭(dexstyle). 모르면 "" */
  shortOf: (version: string) => string
  /** 고른 버전. "" = 묶음 전체(버전 한정 줄은 "W2 — …" 접두) */
  version?: string
}

/** 이 게임에서 이 아이템을 얻는 곳(줄 목록). 사전이 없거나 항목이 없으면 [] */
export function itemSources(
  book: AcquisitionBook | null,
  item: string,
  options: ItemSourcesOptions
): string[] {
  const sources = book?.items.get(item) ?? []
  const version = options.version ?? ""
  const lines: string[] = []
  for (const s of sources) {
    const line = sourceText(s, options)
    if (line === "") continue
    if (s.versions.length === 0) lines.push(line)
    else if (version === "")
      lines.push(
        options.t(
          "%1 — %2",
          s.versions.map((v) => options.shortOf(v)).join("/"),
          line
        )
      )
    else if (s.versions.includes(version)) lines.push(line)
  }
  if (lines.length === 0 && sources.length > 0 && version !== "")
    lines.push(options.t("이 버전에서는 얻을 수 없어요(다른 버전 한정)"))
  return lines
}

/** 그 게임의 "완전 목록" 사전이 있는가 — 있을 때만 게임별로 거른다 */
export const hasItemBook = (book: AcquisitionBook | null): boolean =>
  book !== null && book.completeItemList && book.items.size > 0

/** 게임별 존재 필터에 쓸 아이템 키. 완전 목록이 아니면 빈 집합(거르지 않음) */
export const allowedItems = (book: AcquisitionBook | null): Set<string> =>
  hasItemBook(book) && book ? new Set(book.items.keys()) : new Set()
