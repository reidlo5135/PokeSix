/** Ctrl+K → 전체 검색 칸에 알린다 (셸 단축키와 앱 막대 검색을 잇는 작은 통로) */
type Listener = () => void

const listeners = new Set<Listener>()

export function requestGlobalSearch(): void {
  for (const l of listeners) l()
}

export function onGlobalSearchRequest(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
