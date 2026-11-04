/**
 * 검색 글자 다루기 — 한글 입력기(IME) 규칙 (Qt SearchField::searchText 이식).
 */

/** 검색 디바운스 (Qt kSearchDebounceMs) */
export const SEARCH_DEBOUNCE_MS = 150

/**
 * 조합 중인 끝 글자가 호환 자모(ㄱ-ㆎ)뿐이면 그 부분을 빼고 찾는다.
 * "ㅇ"을 치는 순간 결과가 0개로 번쩍이지 않게 — "이"부터는 바로 거른다.
 */
export function effectiveQuery(value: string, composing: boolean): string {
  if (!composing) return value
  return value.replace(/[ㄱ-ㆎ]+$/u, "")
}

/** 비교용 정규화: 앞뒤 공백 제거 + 소문자 */
export const normalizeQuery = (q: string): string => q.trim().toLowerCase()

/** 대소문자 무시 부분 일치. 빈 질의는 아무것도 맞지 않는다 */
export function matchesQuery(haystack: string, query: string): boolean {
  const q = normalizeQuery(query)
  if (q === "") return false
  return haystack.toLowerCase().includes(q)
}
