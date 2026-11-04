/**
 * 세대의 도감 · 게임 묶음 · 버전, 그리고 게임마다 만나는 종.
 */
import { supplement } from "../text/namebook.ts"
import { gameSpeciesCache, otherVersionSpeciesCache, memo } from "./cache.ts"
import {
  currentDatabase,
  idList,
  loc,
  num,
  select,
  str,
  VISIBLE_VERSIONS,
  type Row,
} from "./db.ts"
import { representativeVersionGroup } from "./rules.ts"
import type { DexInfo, GameInfo } from "./types.ts"

/**
 * 세대 g 게임들의 지방 도감(본편, 게임이 나온 순서). 전국도감은 넣지 않는다(UI가 따로 단다).
 * 지방이 없는 도감(전국 · conquest · Champions)은 빠진다
 */
function readDexesForGeneration(generation: number): DexInfo[] {
  const dexes: DexInfo[] = []
  const byId = new Map<number, DexInfo>()
  for (const r of select(
    `SELECT d.id AS dex_id, d.identifier AS dex,
            r.name_ko AS region_ko, r.name_en AS region_en, r.name_ja AS region_ja,
            v.identifier AS version, v.name_ko AS version_ko, v.name_en AS version_en,
            v.name_ja AS version_ja, vg.identifier AS version_group
     FROM pokedexes d
     JOIN pokedex_version_groups pvg ON pvg.pokedex_id = d.id
     JOIN version_groups vg ON vg.id = pvg.version_group_id
     JOIN versions v ON v.version_group_id = vg.id
     JOIN regions r ON r.id = d.region_id
     WHERE vg.generation = ? AND d.is_main_series = 1 AND ${VISIBLE_VERSIONS}
     ORDER BY vg.sort_order, v.id, d.id`,
    [generation]
  )) {
    const id = num(r.dex_id)
    let dex = byId.get(id)
    if (!dex) {
      dex = {
        pokedexId: id,
        identifier: str(r.dex),
        region: loc(r, "region"),
        versions: [],
        versionNames: [],
        versionGroups: [],
      }
      byId.set(id, dex)
      dexes.push(dex)
    }
    const version = str(r.version)
    dex.versions.push(version)
    dex.versionNames.push(supplement("versions", version, loc(r, "version")))
    const group = str(r.version_group)
    if (!dex.versionGroups.includes(group)) dex.versionGroups.push(group)
  }
  return dexes
}

/**
 * 그 세대의 본편 게임 묶음(도감이 연결된 것만 — 콜로세움 · XD는 빠진다), 출시 순.
 * 도감 연결만 보므로 9세대에 champions가 들어온다(Qt판 그대로)
 */
function readGamesForGeneration(generation: number): GameInfo[] {
  const games: GameInfo[] = []
  for (const r of select(
    `SELECT vg.identifier AS version_group, v.identifier AS version,
            v.name_ko AS version_ko, v.name_en AS version_en, v.name_ja AS version_ja
     FROM version_groups vg
     JOIN versions v ON v.version_group_id = vg.id WHERE vg.generation = ?
     AND EXISTS (SELECT 1 FROM pokedex_version_groups pvg WHERE pvg.version_group_id = vg.id)
     AND ${VISIBLE_VERSIONS} ORDER BY vg.sort_order, v.id`,
    [generation]
  )) {
    const group = str(r.version_group)
    let game = games.at(-1)
    if (!game || game.versionGroup !== group) {
      game = { versionGroup: group, versions: [], versionNames: [] }
      games.push(game)
    }
    const version = str(r.version)
    game.versions.push(version)
    game.versionNames.push(supplement("versions", version, loc(r, "version")))
  }
  return games
}

/** resolveVersion의 순수 부분: games = 그 세대의 게임 목록 */
export function resolveVersionIn(
  games: readonly GameInfo[],
  generation: number,
  version: string
): string {
  if (games.length === 0) return ""
  for (const game of games) {
    if (game.versions.includes(version)) return version // 그 세대의 버전이면 그대로
    if (game.versionGroup === version) return game.versions[0] ?? "" // 옛 저장값(묶음) → 첫 버전
  }
  const representative = representativeVersionGroup(generation)
  for (const game of games)
    if (game.versionGroup === representative) return game.versions[0] ?? ""
  return games[0].versions[0] ?? ""
}

/** 그 세대에서 쓸 버전 하나. 숨긴 버전 · 다른 세대 버전이면 대표 묶음의 첫 버전 */
export function resolveVersion(generation: number, version: string): string {
  return resolveVersionIn(gamesForGeneration(generation), generation, version)
}

/**
 * 같은 묶음의 다른 버전에서만 얻을 수 있는 종(HG에서 본 SS 한정 …). 진화 사슬 단위로 센다.
 * 출현 방법은 가리지 않는다. 출현 자료가 없는 게임은 늘 빈 집합
 */
export function otherVersionSpecies(version: string): Set<number> {
  const cached = otherVersionSpeciesCache.get(version)
  if (cached) return new Set(cached)
  if (!currentDatabase()) return new Set()
  const chains = (rows: Row[]) => rows.map((r) => num(r.chain))
  const mine = new Set(
    chains(
      select(
        `SELECT DISTINCT s.evolution_chain AS chain FROM encounters e
         JOIN versions v ON v.id = e.version_id
         JOIN pokemon p ON p.id = e.pokemon_id
         JOIN species s ON s.id = p.species_id WHERE v.identifier = ?`,
        [version]
      )
    )
  )
  const elsewhere = chains(
    select(
      `SELECT DISTINCT s.evolution_chain AS chain FROM encounters e
       JOIN versions v ON v.id = e.version_id
       JOIN pokemon p ON p.id = e.pokemon_id
       JOIN species s ON s.id = p.species_id
       WHERE v.identifier <> ?
         AND v.version_group_id = (SELECT version_group_id FROM versions WHERE identifier = ?)`,
      [version, version]
    )
  ).filter((chain) => !mine.has(chain))
  const species = new Set<number>()
  if (elsewhere.length > 0)
    for (const r of select(
      `SELECT id FROM species WHERE evolution_chain IN (${idList(elsewhere)})`
    ))
      species.add(num(r.id))
  otherVersionSpeciesCache.set(version, species)
  return new Set(species)
}

/**
 * 그 게임 묶음에서 만나는 종(진화 사슬 단위) = 지방 도감의 종 + 야생에서 잡는 종.
 * 고정 · 배회 · 선물 · 교환은 도감 밖이면 넣지 않는다. 비면 "모른다"(호출자가 거르지 않는다)
 */
export function gameSpecies(versionGroup: string): Set<number> {
  const cached = gameSpeciesCache.get(versionGroup)
  if (cached) return new Set(cached)
  if (!currentDatabase()) return new Set()
  const species = new Set<number>()
  for (const r of select(
    `SELECT s2.id AS id FROM dex_numbers d
     JOIN pokedex_version_groups pvg ON pvg.pokedex_id = d.pokedex_id
     JOIN version_groups vg ON vg.id = pvg.version_group_id
     JOIN species s ON s.id = d.species_id
     JOIN species s2 ON s2.evolution_chain = s.evolution_chain WHERE vg.identifier = ?
     UNION
     SELECT s2.id AS id FROM encounters e JOIN versions v ON v.id = e.version_id
     JOIN version_groups vg ON vg.id = v.version_group_id
     JOIN pokemon p ON p.id = e.pokemon_id JOIN species s ON s.id = p.species_id
     JOIN species s2 ON s2.evolution_chain = s.evolution_chain
     JOIN encounter_methods em ON em.id = e.method_id
     WHERE vg.identifier = ? AND em.identifier NOT IN
       ('static', 'gift', 'gift-egg', 'roaming-grass', 'roaming-water', 'npc-trade')`,
    [versionGroup, versionGroup]
  ))
    species.add(num(r.id))
  gameSpeciesCache.set(versionGroup, species)
  return new Set(species)
}

export function dexesForGeneration(generation: number) {
  return memo(`dexes/${generation}`, () => readDexesForGeneration(generation))
}

export function gamesForGeneration(generation: number) {
  return memo(`games/${generation}`, () => readGamesForGeneration(generation))
}
