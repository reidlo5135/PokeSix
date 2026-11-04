/**
 * 입수 사전을 게임 묶음마다 늦게 읽는다(SV 하나가 800 KB가 넘어 첫 화면에 다 싣지 않는다).
 * 읽은 결과는 이 실행 동안 기억하고, 바뀌면 구독자에게 알린다(useSyncExternalStore).
 */
import { useEffect, useSyncExternalStore } from "react"

import { emptyBook, parseBook, type AcquisitionBook } from "./acquisition.ts"

const LOADERS = import.meta.glob<unknown>(
  "../../data/bundled/acquisition/*.json",
  { import: "default" }
)

// 파일 이름(확장자 뺀 것) → 불러오기
const loaderByKey = new Map(
  Object.entries(LOADERS).map(([path, load]) => [
    path.replace(/^.*\//, "").replace(/\.json$/, ""),
    load,
  ])
)

type Entry = AcquisitionBook | "loading"

const books = new Map<string, Entry>()
const listeners = new Set<() => void>()

const notify = () => {
  for (const l of listeners) l()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** 아직 안 읽었으면 읽기 시작한다. 파일이 없으면 빈 사전 */
export function ensureBook(versionGroup: string): void {
  if (versionGroup === "" || books.has(versionGroup)) return
  const load = loaderByKey.get(versionGroup)
  if (!load) {
    books.set(versionGroup, emptyBook(versionGroup))
    notify()
    return
  }
  books.set(versionGroup, "loading")
  load()
    .then((raw) => books.set(versionGroup, parseBook(raw, versionGroup)))
    .catch(() => books.set(versionGroup, emptyBook(versionGroup)))
    .finally(notify)
}

/** 읽어 둔 사전. 아직이면 null */
export function bookIfLoaded(versionGroup: string): AcquisitionBook | null {
  const entry = books.get(versionGroup)
  return entry && entry !== "loading" ? entry : null
}

/** 화면용: 그 게임 묶음의 사전(읽는 중 · 게임 없음 = null) */
export function useAcquisitionBook(
  versionGroup: string
): AcquisitionBook | null {
  useEffect(() => ensureBook(versionGroup), [versionGroup])
  return useSyncExternalStore(
    subscribe,
    () => bookIfLoaded(versionGroup),
    () => null
  )
}
