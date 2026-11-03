/**
 * 도감 표: 열 · 정렬 값 · 검색 문자열 · 필터(조건은 전부 AND). 화면 위젯과 분리한 순수 함수.
 */
import type { SpeciesRow } from "../repository/types.ts"
import { allText, text, type Language } from "../text/localizedText.ts"
import { sortRows, type SortDirection, type SortValue } from "./sorting.ts"

/** 열 순서 고정 */
export const SPECIES_COLUMNS = [
  "cursor",
  "number",
  "icon",
  "name",
  "types",
  "hp",
  "attack",
  "defense",
  "spAttack",
  "spDefense",
  "speed",
  "total",
] as const

export type SpeciesColumn = (typeof SPECIES_COLUMNS)[number]

/** 머리 글자(▶ · 아이콘 열은 빈 칸) */
export const SPECIES_HEADERS: Record<SpeciesColumn, string> = {
  cursor: "",
  number: "No.",
  icon: "",
  name: "이름",
  types: "타입",
  hp: "HP",
  attack: "공격",
  defense: "방어",
  spAttack: "특공",
  spDefense: "특방",
  speed: "스피드",
  total: "합계",
}

const STAT_INDEX: Partial<Record<SpeciesColumn, number>> = {
  hp: 0,
  attack: 1,
  defense: 2,
  spAttack: 3,
  spDefense: 4,
  speed: 5,
}

/** 오른쪽 정렬(HP 열부터) */
export const isSpeciesNumericColumn = (column: SpeciesColumn): boolean =>
  column === "total" || STAT_INDEX[column] !== undefined

/** 정렬 값: 이름은 그 언어 이름, 타입은 첫 타입, ▶ · 아이콘은 도감 번호, 나머지는 숫자 그대로 */
export function speciesSortValue(
  row: SpeciesRow,
  column: SpeciesColumn,
  language: Language
): SortValue {
  switch (column) {
    case "name":
      return text(row.name, language)
    case "types":
      return row.types[0] ?? ""
    case "total":
      return row.total
    case "cursor":
    case "number":
    case "icon":
      return row.dexNumber
    default:
      return row.stats[STAT_INDEX[column] ?? 0]
  }
}

/** 검색 문자열: 지방 번호와 전국 번호 둘 다로 찾는다(신오 111 = 전국 445) */
export const speciesSearchText = (row: SpeciesRow): string =>
  `${row.dexNumber} ${row.speciesId} ${allText(row.name)}`

/** 합계 상한 없음 */
export const NO_MAXIMUM = 9999

export interface SpeciesFilter {
  search: string
  types: ReadonlySet<string> // 고른 타입 중 하나라도 가지면 통과. 비면 거르지 않음
  minTotal: number
  maxTotal: number // 양 끝 포함
  excludeLegendary: boolean
  finalOnly: boolean
}

export const initialSpeciesFilter = (): SpeciesFilter => ({
  search: "",
  types: new Set(),
  minTotal: 0,
  maxTotal: NO_MAXIMUM,
  excludeLegendary: false,
  finalOnly: false,
})

/** 필터 초기화: 검색 글자는 그대로 두고 나머지를 처음으로 */
export const clearSpeciesFilters = (filter: SpeciesFilter): SpeciesFilter => ({
  ...initialSpeciesFilter(),
  search: filter.search,
})

export function acceptsSpecies(
  row: SpeciesRow,
  filter: SpeciesFilter
): boolean {
  const search = filter.search.trim().toLowerCase()
  if (search && !speciesSearchText(row).toLowerCase().includes(search))
    return false
  if (filter.types.size > 0 && !row.types.some((t) => filter.types.has(t)))
    return false
  if (row.total < filter.minTotal || row.total > filter.maxTotal) return false
  if (filter.excludeLegendary && row.legendary) return false
  if (filter.finalOnly && !row.finalEvolution) return false
  return true
}

export interface SpeciesSort {
  column: SpeciesColumn
  direction: SortDirection
}

export interface SpeciesView {
  filter: SpeciesFilter
  sort: SpeciesSort | null // null = 받은 순서(도감 번호 순)
  language: Language
}

/** 거르고 정렬한 새 배열 */
export function viewSpecies(
  rows: readonly SpeciesRow[],
  view: SpeciesView
): SpeciesRow[] {
  const kept = rows.filter((row) => acceptsSpecies(row, view.filter))
  const sort = view.sort
  if (!sort) return kept
  return sortRows(
    kept,
    (row) => speciesSortValue(row, sort.column, view.language),
    sort.direction,
    view.language
  )
}
