/**
 * 아이템 표: 열 · 정렬 값 · 검색 문자열 · 필터. 화면 위젯과 분리한 순수 함수.
 * 세대 존재 칸(1–9)은 generations 비트로 그린다(existsIn).
 */
import { existsIn, type ItemRow } from "../repository/types.ts"
import { allText, text, type Language } from "../text/localizedText.ts"
import { sortRows, type SortDirection, type SortValue } from "./sorting.ts"

export const ITEM_COLUMNS = [
  "cursor",
  "icon",
  "name",
  "effect",
  "price",
] as const

export type ItemColumn = (typeof ITEM_COLUMNS)[number]

export const ITEM_HEADERS: Record<ItemColumn, string> = {
  cursor: "",
  icon: "",
  name: "이름",
  effect: "효과",
  price: "가격",
}

/** 정렬 값: 가격은 숫자, 효과는 그 언어 문구, 그 밖은 이름 */
export function itemSortValue(
  row: ItemRow,
  column: ItemColumn,
  language: Language
): SortValue {
  if (column === "price") return row.cost
  if (column === "effect") return text(row.effect, language)
  return text(row.name, language)
}

/** 검색 문자열: 이름 · 효과 · 담긴 기술(세 언어 모두) */
export const itemSearchText = (row: ItemRow): string =>
  `${allText(row.name)} ${allText(row.effect)} ${allText(row.machineMove)}`

export interface ItemFilter {
  search: string
  /** 화면 묶음(회복 · 기술머신 …) 규칙 — UI itemstyle.json이 정한다. null = 거르지 않음 */
  category: ((category: string, pocket: string) => boolean) | null
  onlyInGeneration: boolean // true면 지금 세대에 있는 아이템만
  allowed: ReadonlySet<string> // 게임별 존재(그 게임 입수 사전의 identifier). 비면 거르지 않음
}

export const initialItemFilter = (): ItemFilter => ({
  search: "",
  category: null,
  onlyInGeneration: false,
  allowed: new Set(),
})

export function acceptsItem(
  row: ItemRow,
  filter: ItemFilter,
  generation: number,
  language: Language
): boolean {
  if (filter.onlyInGeneration && !existsIn(row, generation)) return false
  // 게임별: 기술머신은 그 게임 표에 담긴 기술이 있으면 통과, 나머지는 입수 사전에 있어야 통과
  if (
    filter.allowed.size > 0 &&
    !filter.allowed.has(row.identifier) &&
    text(row.machineMove, language) === ""
  )
    return false
  if (filter.category && !filter.category(row.category, row.pocket))
    return false
  const search = filter.search.trim().toLowerCase()
  if (search && !itemSearchText(row).toLowerCase().includes(search))
    return false
  return true
}

export interface ItemSort {
  column: ItemColumn
  direction: SortDirection
}

export interface ItemView {
  filter: ItemFilter
  sort: ItemSort | null // null = 받은 순서(id 순)
  generation: number // 표의 기준 세대(onlyInGeneration · "현재 세대" 강조)
  language: Language
}

/** 거르고 정렬한 새 배열 */
export function viewItems(rows: readonly ItemRow[], view: ItemView): ItemRow[] {
  const kept = rows.filter((row) =>
    acceptsItem(row, view.filter, view.generation, view.language)
  )
  const sort = view.sort
  if (!sort) return kept
  return sortRows(
    kept,
    (row) => itemSortValue(row, sort.column, view.language),
    sort.direction,
    view.language
  )
}
