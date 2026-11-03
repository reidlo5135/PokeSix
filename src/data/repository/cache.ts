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

export function clearCaches(): void {
  detailCache.clear()
  otherVersionSpeciesCache.clear()
  gameSpeciesCache.clear()
}
