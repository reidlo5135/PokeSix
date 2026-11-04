/**
 * 저장소 캐시. 게임 데이터는 읽기 전용이라 한 번 읽은 값을 그대로 쓴다.
 * 돌려줄 때는 복사본을 준다 — 화면이 결과를 고쳐도 캐시는 그대로(C++ 값 복사와 같다).
 */
import type { PokemonDetail } from "./types.ts"

/** 상세 캐시가 이만큼 차면 통째로 비운다(오래된 것만 골라 버릴 만큼 크지 않다) */
export const DETAIL_CACHE_SIZE = 256

export const detailCache = new Map<string, PokemonDetail>()
export const otherVersionSpeciesCache = new Map<string, Set<number>>()
export const gameSpeciesCache = new Map<string, Set<number>>()

/** 목록 질의 결과(세대별 종 · 아이템 · 게임 · 도감 · 상성표). 키 = "함수/인자…" */
const listCache = new Map<string, unknown>()

const isEmptyResult = (v: unknown): boolean =>
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" &&
    v !== null &&
    "types" in v &&
    Array.isArray(v.types) &&
    v.types.length === 0)

/**
 * 한 번 읽은 목록을 기억해 두고 복사본을 준다. 빈 결과(DB 없음 · 질의 실패)는 기억하지 않는다 —
 * 데이터를 받은 뒤 다시 읽어야 하니까
 */
export function memo<T>(key: string, read: () => T): T {
  if (listCache.has(key)) return structuredClone(listCache.get(key) as T)
  const value = read()
  if (!isEmptyResult(value)) listCache.set(key, value)
  return structuredClone(value)
}

export function clearCaches(): void {
  listCache.clear()
  detailCache.clear()
  otherVersionSpeciesCache.clear()
  gameSpeciesCache.clear()
}
