/**
 * 전체 검색의 대상(지금 세대에 있는 포켓몬 · 기술 · 아이템)과 거르기.
 * 거르기(filterCorpus)는 순수 함수 — 대상 만들기(buildCorpus)만 DB를 읽는다.
 */
import {
  existsIn,
  itemsForGeneration,
  moves as movesOf,
  speciesForGeneration,
} from "../../data/repository/index.ts"
import { num, select } from "../../data/repository/db.ts"
import { normalizeQuery } from "../../shared/search.ts"
import { searchTextOf, type LocalizedText } from "../../shared/text.ts"

export interface SearchPokemon {
  kind: "pokemon"
  /** PokéAPI pokemon.id (기본 모습) — /dex/:pokemonId */
  id: number
  dexNumber: number
  name: LocalizedText
  types: string[]
  hay: string
}

export interface SearchMove {
  kind: "move"
  id: number
  name: LocalizedText
  type: string
  damageClass: number
  power: number
  hay: string
}

export interface SearchItem {
  kind: "item"
  id: number
  identifier: string
  machineType: string
  name: LocalizedText
  hay: string
}

export type SearchRow = SearchPokemon | SearchMove | SearchItem

export interface SearchCorpus {
  pokemon: SearchPokemon[]
  moves: SearchMove[]
  items: SearchItem[]
}

export interface SearchGroup<R> {
  /** 보일 줄 (최대 limit) */
  rows: R[]
  /** 맞은 전체 수 */
  total: number
}

export interface SearchResult {
  pokemon: SearchGroup<SearchPokemon>
  moves: SearchGroup<SearchMove>
  items: SearchGroup<SearchItem>
}

/** 묶음마다 보일 줄 수 */
export const SEARCH_GROUP_LIMIT = 5

function pick<R extends { hay: string }>(
  rows: readonly R[],
  q: string,
  limit: number
): SearchGroup<R> {
  const hits = q === "" ? [] : rows.filter((r) => r.hay.includes(q))
  return { rows: hits.slice(0, limit), total: hits.length }
}

/** 대소문자 무시 부분 일치 (Qt 검색 규칙) */
export function filterCorpus(
  corpus: SearchCorpus,
  query: string,
  limit = SEARCH_GROUP_LIMIT
): SearchResult {
  const q = normalizeQuery(query)
  return {
    pokemon: pick(corpus.pokemon, q, limit),
    moves: pick(corpus.moves, q, limit),
    items: pick(corpus.items, q, limit),
  }
}

export const isEmptyResult = (r: SearchResult): boolean =>
  r.pokemon.total === 0 && r.moves.total === 0 && r.items.total === 0

const hayOf = (...parts: (string | number)[]) => parts.join(" ").toLowerCase()

/** 세대 g의 검색 대상을 DB에서 만든다 (DB가 없으면 빈 대상) */
export function buildCorpus(generation: number): SearchCorpus {
  const pokemon: SearchPokemon[] = speciesForGeneration(generation).map(
    (s) => ({
      kind: "pokemon",
      id: s.pokemonId,
      dexNumber: s.dexNumber,
      name: s.name,
      types: s.types,
      hay: hayOf(s.dexNumber, s.pokemonId, searchTextOf(s.name)),
    })
  )
  const moveIds = select(
    "SELECT id FROM moves WHERE intro_gen <= ? ORDER BY id",
    [generation]
  ).map((r) => num(r.id))
  const moves: SearchMove[] = movesOf(moveIds, generation).map((m) => ({
    kind: "move",
    id: m.moveId,
    name: m.name,
    type: m.type,
    damageClass: m.damageClass,
    power: m.power,
    hay: hayOf(searchTextOf(m.name)),
  }))
  const items: SearchItem[] = itemsForGeneration(generation)
    .filter((i) => existsIn(i, generation))
    .map((i) => ({
      kind: "item",
      id: i.id,
      identifier: i.identifier,
      machineType: i.machineType,
      name: i.name,
      hay: hayOf(searchTextOf(i.name)),
    }))
  return { pokemon, moves, items }
}

const cache = new Map<string, SearchCorpus>()

/** 세대 · 데이터 번호마다 한 번만 만든다 */
export function corpusFor(
  generation: number,
  dataVersion: number
): SearchCorpus {
  const key = `${dataVersion}:${generation}`
  let corpus = cache.get(key)
  if (!corpus) {
    cache.clear()
    corpus = buildCorpus(generation)
    cache.set(key, corpus)
  }
  return corpus
}
