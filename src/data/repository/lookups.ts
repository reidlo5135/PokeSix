/**
 * 타입 상성 · 성격 · 세이브 번호 변환 · 진화 전 종.
 */
import { loc, num, select, str } from "./db.ts"
import type { Nature, TypeChart } from "./types.ts"
import { memo } from "./cache.ts"

const LAST_BATTLE_TYPE_ID = 18 // stellar(19, 9세대)는 상성 줄이 없는 테라 전용 — 빼 둔다

/**
 * 세대 g의 타입 상성표(단일 타입 배율 — 복합 타입 방어는 호출하는 쪽이 곱한다).
 * 타입은 그 세대에 있는 전투 타입만(id 순)
 */
function readTypeChart(generation: number): TypeChart {
  const g = generation
  const types = select(
    "SELECT identifier FROM types WHERE intro_gen <= ? AND id <= ? ORDER BY id",
    [g, LAST_BATTLE_TYPE_ID]
  ).map((r) => str(r.identifier))
  const multipliers = new Map<string, number>()
  for (const r of select(
    `SELECT a.identifier AS attack, d.identifier AS defense, c.multiplier FROM type_chart c
     JOIN types a ON a.id = c.atk_type JOIN types d ON d.id = c.def_type
     WHERE c.gen_from <= ? AND (c.gen_to IS NULL OR c.gen_to >= ?)`,
    [g, g]
  ))
    multipliers.set(`${str(r.attack)}/${str(r.defense)}`, num(r.multiplier))
  return { types, multipliers }
}

/** 성격 25가지(id 순). 3세대부터 */
export function natures(): Nature[] {
  return select(
    `SELECT id, name_ko, name_en, name_ja, increased_stat, decreased_stat
     FROM natures ORDER BY id`
  ).map((r) => ({
    id: num(r.id),
    name: loc(r, "name"),
    increasedStat: num(r.increased_stat),
    decreasedStat: num(r.decreased_stat),
  }))
}

/** 세이브의 성격 번호(PID % 25) → natures.id. 없으면 0 */
export function natureIdForGameIndex(gameIndex: number): number {
  const [row] = select("SELECT id FROM natures WHERE game_index = ?", [
    gameIndex,
  ])
  return row ? num(row.id) : 0
}

/** 종 → 기본 모습 pokemon id. 없으면 0 */
export function defaultPokemonId(speciesId: number): number {
  const [row] = select(
    "SELECT id FROM pokemon WHERE species_id = ? AND is_default = 1",
    [speciesId]
  )
  return row ? num(row.id) : 0
}

/** 종 → 진화 전 종(세대를 따지지 않는다). 진화 전이 없는 종은 키가 없다 */
export function evolvesFrom(): Map<number, number> {
  return new Map(
    select(
      "SELECT id, evolves_from FROM species WHERE evolves_from IS NOT NULL"
    ).map((r) => [num(r.id), num(r.evolves_from)] as const)
  )
}

export function typeChart(generation: number) {
  return memo(`chart/${generation}`, () => readTypeChart(generation))
}
