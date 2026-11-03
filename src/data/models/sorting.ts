/**
 * 표 정렬 공통: 숫자는 숫자로, 글자는 그 언어 가나다순. 안정 정렬(같은 값은 원래 순서).
 */
import type { Language } from "../text/localizedText.ts"

export type SortDirection = "ascending" | "descending"

export type SortValue = number | string

const collators = new Map<Language, Intl.Collator>()

export function collatorFor(language: Language): Intl.Collator {
  let collator = collators.get(language)
  if (!collator) {
    collator = new Intl.Collator(language)
    collators.set(language, collator)
  }
  return collator
}

export function compareSortValues(
  a: SortValue,
  b: SortValue,
  language: Language
): number {
  if (typeof a === "number" && typeof b === "number") return a - b
  return collatorFor(language).compare(String(a), String(b))
}

/** rows를 key 값으로 정렬한 새 배열(받은 배열은 그대로) */
export function sortRows<T>(
  rows: readonly T[],
  key: (row: T) => SortValue,
  direction: SortDirection,
  language: Language
): T[] {
  const sign = direction === "ascending" ? 1 : -1
  return rows
    .map((row, index) => ({ row, index, value: key(row) }))
    .sort(
      (a, b) =>
        sign * compareSortValues(a.value, b.value, language) ||
        a.index - b.index
    )
    .map((entry) => entry.row)
}
