import { useState, type DependencyList } from "react"

import { useDataVersion } from "../../../state/data.ts"

const sameDeps = (a: readonly unknown[], b: readonly unknown[]): boolean =>
  a.length === b.length && a.every((v, i) => Object.is(v, b[i]))

/**
 * DB 질의 결과 기억: deps가 바뀌거나 데이터를 다시 받으면(dataVersion) 다시 묻는다.
 * deps 길이가 부르는 쪽마다 달라 useMemo 대신 "렌더 중 상태 갱신"으로 기억한다.
 */
export function useDataMemo<T>(compute: () => T, deps: DependencyList): T {
  const dataVersion = useDataVersion()
  const next = [...deps, dataVersion]
  const [memo, setMemo] = useState(() => ({ deps: next, value: compute() }))
  if (sameDeps(memo.deps, next)) return memo.value
  const fresh = { deps: next, value: compute() }
  setMemo(fresh)
  return fresh.value
}
