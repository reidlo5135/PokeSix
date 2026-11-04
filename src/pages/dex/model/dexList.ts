/**
 * 도감 목록: 필터(전부 AND) · 검색 · 정렬 · 적용 알약 · 빈 상태 원인. 화면과 분리한 순수 함수.
 */
import type { SpeciesRow } from "../../../data/repository/types.ts"
import { sortRows } from "../../../data/models/sorting.ts"
import {
  allText,
  text,
  type Language,
  type LocalizedText,
} from "../../../data/text/localizedText.ts"
import { tKey, type TFunction } from "../../../i18n/index.ts"
import { typeName } from "../../../shared/pokemonTypes.ts"

export const STAT_KEYS = [
  "hp",
  "attack",
  "defense",
  "spAttack",
  "spDefense",
  "speed",
] as const
export type StatKey = (typeof STAT_KEYS)[number]

export const STAT_INDEX: Record<StatKey, number> = {
  hp: 0,
  attack: 1,
  defense: 2,
  spAttack: 3,
  spDefense: 4,
  speed: 5,
}

/** 화면 글자(원문). t(STAT_LABEL[k]) */
export const STAT_LABEL: Record<StatKey, string> = {
  hp: tKey("HP"),
  attack: tKey("공격"),
  defense: tKey("방어"),
  spAttack: tKey("특공"),
  spDefense: tKey("특방"),
  speed: tKey("스피드"),
}

export const isStatKey = (v: string): v is StatKey =>
  (STAT_KEYS as readonly string[]).includes(v)

// ── 종족값 합계 슬라이더 (디자인 180–720, 끝 = 제한 없음) ──
export const TOTAL_MIN = 180
export const TOTAL_MAX = 720
export const TOTAL_STEP = 10

export type CompareOp = ">=" | "<="

export interface StatCondition {
  id: number
  stat: StatKey
  op: CompareOp
  value: number | null // 비면 무시
}

export interface DexFilters {
  types: string[] // 고른 타입 중 하나라도 가지면 통과(OR)
  totalMin: number | null // null = 제한 없음
  totalMax: number | null
  statConditions: StatCondition[]
  excludeLegendary: boolean
  finalOnly: boolean
}

export const initialFilters = (): DexFilters => ({
  types: [],
  totalMin: null,
  totalMax: null,
  statConditions: [],
  excludeLegendary: false,
  finalOnly: false,
})

/** 슬라이더 값 → 필터 값(끝이면 제한 없음) */
export function totalRange(
  lo: number,
  hi: number
): {
  totalMin: number | null
  totalMax: number | null
} {
  return {
    totalMin: lo <= TOTAL_MIN ? null : lo,
    totalMax: hi >= TOTAL_MAX ? null : hi,
  }
}

/** 슬라이더 머리 글: 둘 다 끝이면 "전체", 아니면 "500 – 720" */
export function totalReadout(f: DexFilters, t: TFunction): string {
  if (f.totalMin === null && f.totalMax === null) return t("전체")
  return `${f.totalMin ?? TOTAL_MIN} – ${f.totalMax ?? TOTAL_MAX}`
}

// ── 검색 ──
/** 검색 대상: 도감 번호 · 전국 번호 · 세 언어 이름 · 그 세대 특성 이름 */
export const searchHaystack = (row: SpeciesRow, abilities = ""): string =>
  `${row.dexNumber} ${row.speciesId} ${allText(row.name)} ${abilities}`.toLowerCase()

export const normalize = (query: string): string => query.trim().toLowerCase()

export function acceptsRow(
  row: SpeciesRow,
  filters: DexFilters,
  query: string,
  abilities = ""
): boolean {
  const q = normalize(query)
  if (q && !searchHaystack(row, abilities).includes(q)) return false
  if (
    filters.types.length > 0 &&
    !row.types.some((type) => filters.types.includes(type))
  )
    return false
  if (filters.totalMin !== null && row.total < filters.totalMin) return false
  if (filters.totalMax !== null && row.total > filters.totalMax) return false
  for (const c of filters.statConditions) {
    if (c.value === null) continue
    const v = row.stats[STAT_INDEX[c.stat]]
    if (c.op === ">=" ? v < c.value : v > c.value) return false
  }
  if (filters.excludeLegendary && row.legendary) return false
  if (filters.finalOnly && !row.finalEvolution) return false
  return true
}

// ── 정렬 ──
export type SortKey = "number" | "name" | "total" | "types" | StatKey
export type SortDir = "asc" | "desc"

export interface DexSort {
  key: SortKey
  dir: SortDir
}

/** 처음 정렬: 합계 높은 순(디자인) */
export const DEFAULT_SORT: DexSort = { key: "total", dir: "desc" }
/** 도감을 고르면 그 도감 순서로(Qt) */
export const NUMBER_SORT: DexSort = { key: "number", dir: "asc" }

/** 머리를 처음 눌렀을 때 방향: 숫자는 높은 순, 번호 · 이름 · 타입은 오름차순 */
export const defaultDir = (key: SortKey): SortDir =>
  key === "number" || key === "name" || key === "types" ? "asc" : "desc"

/** 같은 열이면 방향만 뒤집고, 다른 열이면 그 열의 기본 방향 */
export const toggleSort = (current: DexSort, key: SortKey): DexSort =>
  current.key === key
    ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
    : { key, dir: defaultDir(key) }

function sortValue(
  row: SpeciesRow,
  key: SortKey,
  language: Language
): number | string {
  switch (key) {
    case "number":
      return row.dexNumber
    case "name":
      return text(row.name, language)
    case "total":
      return row.total
    case "types":
      return row.types[0] ?? ""
    default:
      return row.stats[STAT_INDEX[key]]
  }
}

export interface ListView {
  filters: DexFilters
  query: string
  sort: DexSort
  language: Language
  /** pokemonId → 그 세대 특성 이름(세 언어) */
  abilities?: ReadonlyMap<number, string>
}

/** 거르고 정렬한 새 배열. 같은 값이면 받은 순서(도감 번호 순) */
export function viewRows(
  rows: readonly SpeciesRow[],
  view: ListView
): SpeciesRow[] {
  const kept = rows.filter((row) =>
    acceptsRow(
      row,
      view.filters,
      view.query,
      view.abilities?.get(row.pokemonId) ?? ""
    )
  )
  return sortRows(
    kept,
    (row) => sortValue(row, view.sort.key, view.language),
    view.sort.dir === "asc" ? "ascending" : "descending",
    view.language
  )
}

/** 정렬 메뉴 9개(순서 고정) */
export const SORT_MENU: readonly SortKey[] = [
  "number",
  "name",
  "total",
  ...STAT_KEYS,
]

/** "합계 높은 순" · "번호 순" · "이름 순" (오름/내림에 맞춰) */
export function sortLabel(sort: DexSort, t: TFunction): string {
  const up = sort.dir === "asc"
  switch (sort.key) {
    case "number":
      return up ? t("번호 순") : t("번호 역순")
    case "name":
      return up ? t("이름 순") : t("이름 역순")
    case "types":
      return t("타입 순")
    case "total":
      return up ? t("합계 낮은 순") : t("합계 높은 순")
    default: {
      const stat = t(STAT_LABEL[sort.key])
      return up ? t("%1 낮은 순", stat) : t("%1 높은 순", stat)
    }
  }
}

/** 좁은 화면 정렬 버튼: "합계순" */
export function compactSortLabel(sort: DexSort, t: TFunction): string {
  switch (sort.key) {
    case "number":
      return t("번호순")
    case "name":
      return t("이름순")
    case "types":
      return t("타입순")
    case "total":
      return t("합계순")
    default:
      return t("%1순", t(STAT_LABEL[sort.key]))
  }
}

// ── 적용 알약 ──
export type PillAction =
  | { kind: "generation" }
  | { kind: "dex" }
  | { kind: "type"; type: string }
  | { kind: "types" }
  | { kind: "total" }
  | { kind: "stat"; id: number }
  | { kind: "legendary" }
  | { kind: "final" }

export interface FilterPill {
  key: string
  label: string
  /** 좁은 화면 칩 글(세대만 "GEN 4") */
  compactLabel: string
  action: PillAction
  removable: boolean
}

export interface PillContext {
  generation: number
  /** 지방 도감 이름. 전국이면 "" */
  dexLabel: string
  language: Language
  t: TFunction
}

export function filterPills(f: DexFilters, ctx: PillContext): FilterPill[] {
  const { t } = ctx
  const pill = (
    key: string,
    label: string,
    action: PillAction,
    removable = true,
    compactLabel = label
  ): FilterPill => ({ key, label, compactLabel, action, removable })
  const pills: FilterPill[] = [
    pill(
      "generation",
      t("%1세대", ctx.generation),
      { kind: "generation" },
      false,
      `GEN ${ctx.generation}`
    ),
  ]
  if (ctx.dexLabel)
    pills.push(pill("dex", t("%1 도감", ctx.dexLabel), { kind: "dex" }))
  if (f.types.length >= 3)
    pills.push(pill("types", t("타입 %1", f.types.length), { kind: "types" }))
  else
    for (const type of f.types)
      pills.push(
        pill(`type-${type}`, typeName(type, ctx.language), {
          kind: "type",
          type,
        })
      )
  if (f.totalMin !== null || f.totalMax !== null) {
    const label =
      f.totalMax === null
        ? t("합계 %1+", f.totalMin ?? TOTAL_MIN)
        : f.totalMin === null
          ? t("합계 ~%1", f.totalMax)
          : t("합계 %1–%2", f.totalMin, f.totalMax)
    pills.push(pill("total", label, { kind: "total" }))
  }
  for (const c of f.statConditions)
    if (c.value !== null)
      pills.push(
        pill(
          `stat-${c.id}`,
          `${t(STAT_LABEL[c.stat])} ${c.op === ">=" ? "≥" : "≤"} ${c.value}`,
          { kind: "stat", id: c.id }
        )
      )
  if (f.excludeLegendary)
    pills.push(pill("legendary", t("전설 제외"), { kind: "legendary" }))
  if (f.finalOnly)
    pills.push(pill("final", t("최종 진화만"), { kind: "final" }))
  return pills
}

/** 알약 하나 풀기(세대 · 도감은 화면이 다룬다) */
export function removePill(f: DexFilters, action: PillAction): DexFilters {
  switch (action.kind) {
    case "type":
      return { ...f, types: f.types.filter((x) => x !== action.type) }
    case "types":
      return { ...f, types: [] }
    case "total":
      return { ...f, totalMin: null, totalMax: null }
    case "stat":
      return {
        ...f,
        statConditions: f.statConditions.filter((c) => c.id !== action.id),
      }
    case "legendary":
      return { ...f, excludeLegendary: false }
    case "final":
      return { ...f, finalOnly: false }
    default:
      return f
  }
}

// ── 빈 상태 원인 ──
export interface SpeciesBrief {
  speciesId: number
  name: LocalizedText
  introGen: number
}

export type EmptyCause =
  | { kind: "generation"; name: LocalizedText; introGen: number }
  | { kind: "filters" }

/**
 * 결과가 비었을 때: 검색어가 이 세대 뒤에 나온 종과 맞으면 "n세대부터 나와요"(가장 이른 세대 ·
 * 그중 첫 종), 아니면 필터 탓
 */
export function emptyCause(
  query: string,
  all: readonly SpeciesBrief[],
  generation: number
): EmptyCause {
  const q = normalize(query)
  if (q) {
    let best: SpeciesBrief | null = null
    for (const s of all) {
      if (s.introGen <= generation) continue
      if (!`${s.speciesId} ${allText(s.name)}`.toLowerCase().includes(q))
        continue
      if (
        !best ||
        s.introGen < best.introGen ||
        (s.introGen === best.introGen && s.speciesId < best.speciesId)
      )
        best = s
    }
    if (best)
      return { kind: "generation", name: best.name, introGen: best.introGen }
  }
  return { kind: "filters" }
}

/** "025" — 세 자리보다 짧으면 0으로 채운다 */
export const padNumber = (n: number): string => String(n).padStart(3, "0")
