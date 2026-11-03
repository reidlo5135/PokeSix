/**
 * 도감 목록: 종의 기본 모습을 세대 g 기준으로(타입 · 종족값 · 전설 · 최종 진화).
 */
import { idList, loc, num, select, str, type Row } from "./db.ts"
import { emptyStats, type SpeciesRow, type Stats6 } from "./types.ts"

const SPECIAL_STAT = 9 // 1세대 전용 "특수"
const ONLY_THESE_LIMIT = 64 // 이 수 이하면 그 포켓몬만 묻는다(넘으면 표 전체를 한 번에)

// 열: species_id · pokemon_id · name_* · dex_number · legendary · final_evolution
function readSpecies(rows: Row[]): SpeciesRow[] {
  return rows.map((r) => ({
    speciesId: num(r.species_id),
    dexNumber: num(r.dex_number),
    pokemonId: num(r.pokemon_id),
    name: loc(r, "name"),
    types: [],
    stats: emptyStats(),
    total: 0,
    legendary: num(r.legendary) !== 0,
    finalEvolution: num(r.final_evolution) !== 0,
  }))
}

interface TypesAndStats {
  pokemonId: number
  types: string[]
  stats: Stats6
  total: number
}

/** rows의 pokemonId로 타입(슬롯 순) · 종족값 · 합계를 채운다(목록 · 상세 공통, 1세대 특수 규칙 포함) */
export function fillTypesAndStats(
  rows: TypesAndStats[],
  generation: number
): void {
  if (rows.length === 0) return
  const byPokemon = new Map<number, TypesAndStats[]>()
  for (const row of rows) {
    const list = byPokemon.get(row.pokemonId)
    if (list) list.push(row)
    else byPokemon.set(row.pokemonId, [row])
  }
  const only =
    rows.length <= ONLY_THESE_LIMIT
      ? ` AND pokemon_id IN (${idList(rows.map((r) => r.pokemonId))})`
      : ""
  const g = generation
  for (const r of select(
    `SELECT pt.pokemon_id, t.identifier FROM pokemon_types pt
     JOIN types t ON t.id = pt.type_id
     WHERE pt.gen_from <= ? AND (pt.gen_to IS NULL OR pt.gen_to >= ?)${only}
     ORDER BY pt.pokemon_id, pt.slot`,
    [g, g]
  ))
    for (const row of byPokemon.get(num(r.pokemon_id)) ?? [])
      row.types.push(str(r.identifier))

  for (const r of select(
    `SELECT pokemon_id, stat_id, value FROM pokemon_stats
     WHERE gen_from <= ? AND (gen_to IS NULL OR gen_to >= ?)${only}`,
    [g, g]
  )) {
    const stat = num(r.stat_id)
    const value = num(r.value)
    for (const row of byPokemon.get(num(r.pokemon_id)) ?? []) {
      if (stat >= 1 && stat <= 6) {
        row.stats[stat - 1] = value
        row.total += value
      } else if (stat === SPECIAL_STAT) {
        // 특공 · 특방 두 칸에 같은 값, 합계에는 한 번만
        row.stats[3] = value
        row.stats[4] = value
        row.total += value
      } // 7 · 8(명중 · 회피)은 무시
    }
  }
}

/** 세대 g까지 나온 종 전부 = 전국도감(번호 순, 기본 모습만). 도감 번호 = 종 번호 */
export function speciesForGeneration(generation: number): SpeciesRow[] {
  const rows = readSpecies(
    select(
      `SELECT s.id AS species_id, p.id AS pokemon_id,
              s.name_ko, s.name_en, s.name_ja, s.id AS dex_number,
              s.is_legendary OR s.is_mythical AS legendary,
              NOT EXISTS (SELECT 1 FROM species c WHERE c.evolves_from = s.id AND c.intro_gen <= ?)
                AS final_evolution
       FROM species s
       JOIN pokemon p ON p.species_id = s.id AND p.is_default = 1
       WHERE s.intro_gen <= ? ORDER BY s.id`,
      [generation, generation]
    )
  )
  fillTypesAndStats(rows, generation)
  return rows
}

/**
 * 지방 도감의 종(도감 번호 순). 타입 · 종족값은 g 기준.
 * 그 도감의 게임은 모두 g 이하에 나왔다고 본다(호출자가 그 세대의 도감만 넘긴다)
 */
export function speciesForDex(
  pokedexId: number,
  generation: number
): SpeciesRow[] {
  const rows = readSpecies(
    select(
      `SELECT s.id AS species_id, p.id AS pokemon_id,
              s.name_ko, s.name_en, s.name_ja, dn.number AS dex_number,
              s.is_legendary OR s.is_mythical AS legendary,
              NOT EXISTS (SELECT 1 FROM species c WHERE c.evolves_from = s.id AND c.intro_gen <= ?)
                AS final_evolution
       FROM dex_numbers dn
       JOIN species s ON s.id = dn.species_id
       JOIN pokemon p ON p.species_id = s.id AND p.is_default = 1
       WHERE dn.pokedex_id = ? ORDER BY dn.number`,
      [generation, pokedexId]
    )
  )
  fillTypesAndStats(rows, generation)
  return rows
}
