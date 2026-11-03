/**
 * PokéAPI *_past 규칙: 지난 줄 (g, v) = "g세대까지는 v였다". 지금 값은 본 표에 있다.
 * 이것을 [from, to] 구간 목록으로 바꾼다(to = null이면 끝없음). 이웃한 같은 값은 합친다.
 */

export interface GenRange<T> {
  from: number
  to: number | null
  value: T
}

export function toGenRanges<T>(
  firstGen: number,
  past: ReadonlyArray<readonly [number, T]>,
  current: T | undefined,
  equals: (a: T, b: T) => boolean = Object.is
): GenRange<T>[] {
  const sorted = [...past].sort((a, b) => a[0] - b[0])
  const ranges: GenRange<T>[] = []
  let start = firstGen
  for (const [lastGen, value] of sorted) {
    if (lastGen < start) continue
    const last = ranges[ranges.length - 1]
    if (last && equals(last.value, value)) last.to = lastGen
    else ranges.push({ from: start, to: lastGen, value })
    start = lastGen + 1
  }
  if (current !== undefined) {
    const last = ranges[ranges.length - 1]
    if (last && equals(last.value, current)) last.to = null
    else ranges.push({ from: start, to: null, value: current })
  }
  return ranges
}
