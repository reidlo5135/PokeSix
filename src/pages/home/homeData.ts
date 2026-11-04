/**
 * 홈이 DB에서 읽는 작은 것들 — 스쿼드 멤버의 그 세대 타입, 게임(버전) 이름.
 */
import { num, select, str } from "../../data/repository/db.ts"
import { gamesForGeneration } from "../../data/repository/index.ts"
import type { Generation } from "../../shared/generations.ts"
import type { LocalizedText } from "../../shared/text.ts"

const LATEST_GENERATION = 99

/** 포켓몬 id → 타입(슬롯 순). historic이면 그 세대 당시 타입, 아니면 지금 타입 */
export function memberTypes(
  pokemonIds: readonly number[],
  generation: Generation,
  historic: boolean
): Map<number, string[]> {
  const out = new Map<number, string[]>()
  const ids = [
    ...new Set(pokemonIds.filter((id) => Number.isInteger(id) && id > 0)),
  ]
  if (ids.length === 0) return out
  const g = historic ? generation : LATEST_GENERATION
  const rows = select(
    `SELECT pt.pokemon_id, t.identifier FROM pokemon_types pt JOIN types t ON t.id = pt.type_id
     WHERE pt.pokemon_id IN (${ids.join(",")}) AND pt.gen_from <= ? AND (pt.gen_to IS NULL OR pt.gen_to >= ?)
     ORDER BY pt.pokemon_id, pt.slot`,
    [g, g]
  )
  for (const r of rows) {
    const id = num(r.pokemon_id)
    const list = out.get(id) ?? []
    list.push(str(r.identifier))
    out.set(id, list)
  }
  return out
}

/** 게임 키(버전 또는 묶음) → 버전 이름. 모르면 null */
export function versionName(
  generation: Generation,
  game: string
): LocalizedText | null {
  for (const info of gamesForGeneration(generation)) {
    const i = info.versions.indexOf(game)
    if (i >= 0) return info.versionNames[i] ?? null
    if (info.versionGroup === game) return info.versionNames[0] ?? null
  }
  return null
}
