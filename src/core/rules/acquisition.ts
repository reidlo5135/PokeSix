/**
 * 입수 사전(acquisition/<게임 묶음>.json) 읽기 — 스쿼드가 쓰는 부분: 기술머신 공급 사정 · NPC 가르침 비용.
 * Qt ui/dex/guidebook의 itemSupply · tutorCostAmounts · costLabel · tutorCost 이식.
 *
 * 사전은 지금도 채워지는 중이라 너그럽게 읽는다: 칸마다 검증하고 모르는 칸은 버린다.
 */
import {
  emptyText,
  localizedOf,
  text,
  type Language,
  type LocalizedText,
} from "../../data/text/localizedText.ts"
import { placeName } from "../../data/text/places.ts"
import type { Cost, MachineSupply } from "../analysis/resourceLedger.ts"

export interface Source {
  how: string
  where: string
  place: LocalizedText
  content: LocalizedText
  cost: Cost[]
  detail: LocalizedText
  versions: string[]
  region: string
}

export interface AcquisitionBook {
  versionGroup: string
  items: Map<string, Source[]>
  tutors: Map<string, Source[]>
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)
const str = (v: unknown): string => (typeof v === "string" ? v : "")

function costsOf(v: unknown): Cost[] {
  if (!Array.isArray(v)) return []
  const out: Cost[] = []
  for (const c of v)
    if (
      isRecord(c) &&
      Number.isInteger(c.amount) &&
      typeof c.unit === "string" &&
      c.unit !== ""
    )
      out.push({ amount: c.amount as number, unit: c.unit })
  return out
}

export function sourceOf(raw: unknown): Source | null {
  if (!isRecord(raw)) return null
  return {
    how: str(raw.how),
    where: str(raw.where),
    place: localizedOf(raw.place),
    content: localizedOf(raw.content),
    cost: costsOf(raw.cost),
    detail: localizedOf(raw.detail),
    versions: Array.isArray(raw.versions)
      ? raw.versions.filter((v): v is string => typeof v === "string")
      : [],
    region: str(raw.region),
  }
}

function sectionOf(raw: unknown): Map<string, Source[]> {
  const out = new Map<string, Source[]>()
  if (!isRecord(raw)) return out
  for (const [key, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue
    const sources = list.map(sourceOf).filter((s): s is Source => s !== null)
    out.set(key, sources)
  }
  return out
}

export function parseAcquisitionBook(
  root: unknown,
  versionGroup = ""
): AcquisitionBook {
  const r = isRecord(root) ? root : {}
  return {
    versionGroup: str(r.versionGroup) || versionGroup,
    items: sectionOf(r.items),
    tutors: sectionOf(r.tutors),
  }
}

export const emptyBook = (versionGroup = ""): AcquisitionBook => ({
  versionGroup,
  items: new Map(),
  tutors: new Map(),
})

// ── 불러오기(게임 묶음마다 처음 필요할 때 한 번) ──
const loaders = import.meta.glob<unknown>(
  "../../data/bundled/acquisition/*.json",
  { import: "default" }
)
const books = new Map<string, AcquisitionBook>()

export function cachedAcquisitionBook(
  versionGroup: string
): AcquisitionBook | null {
  return books.get(versionGroup) ?? null
}

/** 사전이 없는 게임 묶음은 빈 사전 */
export async function loadAcquisitionBook(
  versionGroup: string
): Promise<AcquisitionBook> {
  const cached = books.get(versionGroup)
  if (cached) return cached
  const load = loaders[`../../data/bundled/acquisition/${versionGroup}.json`]
  let book = emptyBook(versionGroup)
  if (load) {
    try {
      book = parseAcquisitionBook(await load(), versionGroup)
    } catch {
      book = emptyBook(versionGroup)
    }
  }
  books.set(versionGroup, book)
  return book
}

// ── 공급 사정 ──
const ONCE = new Set(["field", "hidden", "gift", "reward", "trade"])
const REPEAT = new Set(["shop", "exchange", "prize"])
// 엔딩 후에야 가는 지방(1차 근사)
const POST_GAME_REGION: Record<string, string> = {
  "gold-silver": "kanto",
  crystal: "kanto",
  "heartgold-soulsilver": "kanto",
}

const appliesTo = (s: Source, version: string) =>
  s.versions.length === 0 || version === "" || s.versions.includes(version)

/** 기술머신(아이템) 하나의 그 게임 입수 사정 */
export function itemSupply(
  book: AcquisitionBook,
  item: string,
  version: string
): MachineSupply {
  const postGame = POST_GAME_REGION[book.versionGroup] ?? ""
  const supply: MachineSupply = {
    known: false,
    copies: 0,
    repeatable: false,
    repeatCost: [],
    postGameOnly: false,
  }
  let beforeEnding = false
  for (const s of book.items.get(item) ?? []) {
    if (!appliesTo(s, version)) continue
    const once = ONCE.has(s.how)
    if (!once && !REPEAT.has(s.how)) continue // 픽업 같은 랜덤 입수는 셀 수 없다
    supply.known = true
    if (once) supply.copies += 1
    else {
      supply.repeatable = true
      if (supply.repeatCost.length === 0) supply.repeatCost = s.cost
    }
    if (postGame === "" || s.region !== postGame) beforeEnding = true
  }
  supply.postGameOnly = supply.known && postGame !== "" && !beforeEnding
  return supply
}

/** 가르침 비용: 버전이 맞는 입수처 중 비용이 적힌 첫 것. 없으면 [] */
export function tutorCostAmounts(
  book: AcquisitionBook,
  move: string,
  version: string
): Cost[] {
  for (const s of book.tutors.get(move) ?? [])
    if (appliesTo(s, version) && s.cost.length > 0) return s.cost
  return []
}

// ── 글자 ──
export type TextFn = (key: string, ...args: (string | number)[]) => string

/** 한국식 천 단위 쉼표 */
export const groupDigits = (n: number): string => n.toLocaleString("ko-KR")

/** (48, "bp") → "48BP", (10000, "money") → "10,000원". 모르는 단위는 "8 unit" */
export function costLabel(t: TextFn, amount: number, unit: string): string {
  const n = groupDigits(amount)
  switch (unit) {
    case "money":
      return t("%1원", n)
    case "bp":
      return t("%1BP", n)
    case "coins":
      return t("코인 %1", n)
    case "red-shard":
      return t("빨강조각 %1개", n)
    case "blue-shard":
      return t("파랑조각 %1개", n)
    case "yellow-shard":
      return t("노랑조각 %1개", n)
    case "green-shard":
      return t("초록조각 %1개", n)
    case "heart-scale":
      return t("하트비늘 %1개", n)
    case "athlete-points":
      return t("%1포인트", n)
    case "watts":
      return t("%1와트", n)
    case "league-points":
      return t("%1LP", n)
    default:
      return `${n} ${unit}`
  }
}

/** 한 줄: [장소] · [컨텐츠 비용] (조건) — 방법 이름은 뺀다(칸이 이미 "NPC 가르침") */
export function tutorSourceText(
  t: TextFn,
  s: Source,
  language: Language
): string {
  const parts: string[] = []
  let where = text(s.place, language)
  if (where === "" && s.where !== "")
    where = placeName(s.where, emptyText(), language)
  const content = text(s.content, language)
  if (where !== "" && where !== content) parts.push(where)
  const price: string[] = []
  if (content !== "") price.push(content)
  const costs = s.cost.map((c) => costLabel(t, c.amount, c.unit))
  if (costs.length > 0) price.push(costs.join(" + "))
  if (price.length > 0) parts.push(price.join(" "))
  let line = parts.join(" · ")
  const detail = text(s.detail, language)
  if (detail !== "") line += ` (${detail})`
  return line
}

/** 기술 선택 창의 "NPC 가르침(…)" 괄호 안 — 입수처마다 " / "로 */
export function tutorCostText(
  t: TextFn,
  book: AcquisitionBook,
  move: string,
  language: Language
): string {
  return (book.tutors.get(move) ?? [])
    .map((s) => tutorSourceText(t, s, language))
    .filter((line) => line !== "")
    .join(" / ")
}
