/**
 * 입수 사전(acquisition/<versionGroup>.json) 중 타운맵이 쓰는 부분 — Qt guidebook itemsAt · sourceText 이식.
 * 다른 작업이 사전을 채우는 중이라 칸마다 따로 좁힌다: 모르는 칸은 무시, 모양이 틀린 칸은 버린다.
 * pokemon 묶음(data-gaps §5.2)의 where 있는 줄은 [야생] 탭에 이어 보인다.
 */
import {
  emptyText,
  isRecord,
  localizedOf,
  text,
  type Language,
  type LocalizedText,
} from "../../data/text/localizedText.ts"
import { placeName } from "../../data/text/places.ts"
import { tKey, type TFunction } from "../../i18n/index.ts"

export interface Cost {
  amount: number
  unit: string
}

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

export interface PokemonSource extends Source {
  minLevel: number | null
  maxLevel: number | null
  versionsFrom: string[]
  replaces: string
}

export interface AcquisitionBook {
  versionGroup: string
  items: Map<string, Source[]>
  pokemon: Map<string, PokemonSource[]>
}

export const emptySource = (): Source => ({
  how: "",
  where: "",
  place: emptyText(),
  content: emptyText(),
  cost: [],
  detail: emptyText(),
  versions: [],
  region: "",
})

const stringOf = (v: unknown): string => (typeof v === "string" ? v : "")
const stringsOf = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((s): s is string => typeof s === "string" && s !== "")
    : []
const levelOf = (v: unknown): number | null =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null

function costsOf(v: unknown): Cost[] {
  if (!Array.isArray(v)) return []
  const out: Cost[] = []
  for (const c of v)
    if (
      isRecord(c) &&
      typeof c.amount === "number" &&
      Number.isInteger(c.amount) &&
      typeof c.unit === "string" &&
      c.unit !== ""
    )
      out.push({ amount: c.amount, unit: c.unit })
  return out
}

export function parseSource(raw: Record<string, unknown>): Source {
  return {
    how: stringOf(raw.how),
    where: stringOf(raw.where),
    place: localizedOf(raw.place),
    content: localizedOf(raw.content),
    cost: costsOf(raw.cost),
    detail: localizedOf(raw.detail),
    versions: stringsOf(raw.versions),
    region: stringOf(raw.region),
  }
}

function parsePokemonSource(raw: Record<string, unknown>): PokemonSource {
  return {
    ...parseSource(raw),
    minLevel: levelOf(raw.minLevel),
    maxLevel: levelOf(raw.maxLevel),
    versionsFrom: stringsOf(raw.versionsFrom),
    replaces: stringOf(raw.replaces),
  }
}

function section<T>(
  root: Record<string, unknown>,
  key: string,
  parse: (raw: Record<string, unknown>) => T
): Map<string, T[]> {
  const out = new Map<string, T[]>()
  const value = root[key]
  if (!isRecord(value)) return out
  for (const [id, list] of Object.entries(value)) {
    if (!Array.isArray(list)) continue
    const sources = list.filter(isRecord).map(parse)
    if (sources.length > 0) out.set(id, sources)
  }
  return out
}

export function parseAcquisitionBook(
  root: unknown,
  fallbackVersionGroup: string
): AcquisitionBook {
  if (!isRecord(root))
    return {
      versionGroup: fallbackVersionGroup,
      items: new Map(),
      pokemon: new Map(),
    }
  return {
    versionGroup: stringOf(root.versionGroup) || fallbackVersionGroup,
    items: section(root, "items", parseSource),
    pokemon: section(root, "pokemon", parsePokemonSource),
  }
}

const forVersion = (s: Source, version: string): boolean =>
  s.versions.length === 0 || version === "" || s.versions.includes(version)

/** 그 장소(where)에서 얻는 아이템 · 입수처(버전 한정이면 그 버전 것만). 아이템 순서 = 사전 순서 */
export function itemsAt(
  book: AcquisitionBook,
  where: string,
  version: string
): { item: string; source: Source }[] {
  const out: { item: string; source: Source }[] = []
  for (const [item, sources] of book.items)
    for (const source of sources)
      if (source.where === where && forVersion(source, version))
        out.push({ item, source })
  return out
}

// 목록 줄이 아니라 안내로 보이는 방법(데려오기 · 배포)
const NOT_A_ROW = new Set(["transfer", "event"])

/** 그 장소에서 만나는 포켓몬(사전 pokemon 묶음). 키 = species identifier */
export function pokemonAt(
  book: AcquisitionBook,
  where: string,
  version: string
): { species: string; source: PokemonSource }[] {
  const out: { species: string; source: PokemonSource }[] = []
  for (const [species, sources] of book.pokemon)
    for (const source of sources)
      if (
        source.where === where &&
        source.how !== "" &&
        !NOT_A_ROW.has(source.how) &&
        forVersion(source, version)
      )
        out.push({ species, source })
  return out
}

// ── 한 줄 글자

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

/** 방법 이름. other · 빈 값 · 모르는 값 = "" */
export const howLabel = (how: string, t: TFunction): string => {
  const key = HOW_LABELS[how]
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

const grouping = new Intl.NumberFormat("en-US", { useGrouping: true })

/** 비용 한 칸: 숫자는 천 단위 쉼표, 모르는 단위는 "숫자 단위" */
export function costText(cost: Cost, t: TFunction): string {
  const n = grouping.format(cost.amount)
  const key = COST_LABELS[cost.unit]
  return key ? t(key, n) : `${n} ${cost.unit}`
}

/** [방법] · [장소] · [내용 비용] (조건) */
export function sourceText(
  source: Source,
  language: Language,
  t: TFunction
): string {
  const parts: string[] = []
  const how = howLabel(source.how, t)
  if (how !== "") parts.push(how)
  let where = text(source.place, language)
  if (source.where !== "")
    where = placeName(source.where, emptyText(), language)
  const content = text(source.content, language)
  if (where !== "" && where !== content) parts.push(where)
  const price: string[] = []
  if (content !== "") price.push(content)
  if (source.cost.length > 0)
    price.push(source.cost.map((c) => costText(c, t)).join(" + "))
  if (price.length > 0) parts.push(price.join(" "))
  let line = parts.join(" · ")
  const detail = text(source.detail, language)
  if (detail !== "") line += ` (${detail})`
  return line
}

/** 타운맵 줄: 장소는 이미 지도에서 골랐으니 where · place를 지우고 쓴다 */
export const sourceTextHere = (
  source: Source,
  language: Language,
  t: TFunction
): string =>
  sourceText({ ...source, where: "", place: emptyText() }, language, t)

// ── 앱에 든 사전 (게임마다 처음 쓸 때 읽는다 — 30권이라 한꺼번에 싣지 않는다)

const BOOK_FILES = import.meta.glob<unknown>(
  "../../data/bundled/acquisition/*.json",
  { import: "default" }
)

const books = new Map<string, Promise<AcquisitionBook | null>>()

/** 게임 묶음의 사전. 없으면 null */
export function loadAcquisitionBook(
  versionGroup: string
): Promise<AcquisitionBook | null> {
  let pending = books.get(versionGroup)
  if (!pending) {
    const path = Object.keys(BOOK_FILES).find((p) =>
      p.endsWith(`/${versionGroup}.json`)
    )
    const load = path ? BOOK_FILES[path] : undefined
    pending = load
      ? load().then(
          (root) => parseAcquisitionBook(root, versionGroup),
          () => null
        )
      : Promise.resolve(null)
    books.set(versionGroup, pending)
  }
  return pending
}

// ── [아이템] 탭 묶기

/** 아이템 표에서 쓰는 만큼(ItemRow의 부분) */
export interface ItemInfo {
  id: number
  name: LocalizedText
  machineMove: LocalizedText
  machineType: string
}

export interface ItemHere {
  title: string
  item: string
  info: ItemInfo
  lines: string[]
}

/**
 * 장소의 입수처 → 제목(이름 — 기술)별로 묶어 제목 순(코드 단위 비교). 그 세대 · 게임에 없는 아이템
 * (infoOf가 null — 사전의 엉뚱한 키)은 뺀다
 */
export function groupItemsHere(
  entries: readonly { item: string; source: Source }[],
  infoOf: (item: string) => ItemInfo | null,
  language: Language,
  t: TFunction
): ItemHere[] {
  const grouped = new Map<string, ItemHere>()
  for (const { item, source } of entries) {
    const info = infoOf(item)
    if (!info) continue
    let title = text(info.name, language) || item
    const move = text(info.machineMove, language)
    if (move !== "") title += ` — ${move}`
    let entry = grouped.get(title)
    if (!entry) {
      entry = { title, item, info, lines: [] }
      grouped.set(title, entry)
    }
    entry.item = item
    entry.info = info
    const line = sourceTextHere(source, language, t)
    if (line !== "") entry.lines.push(line)
  }
  return [...grouped.values()].sort((a, b) =>
    a.title < b.title ? -1 : a.title > b.title ? 1 : 0
  )
}
