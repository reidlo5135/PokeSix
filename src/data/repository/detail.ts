/**
 * 포켓몬 상세(세대 g 기준): 기본 정보 · 습득 기술 · 진화 트리 · 하트비늘 · 특성 · 야생 출현.
 */
import { emptyText, type LocalizedText } from "../text/localizedText.ts"
import { supplement } from "../text/namebook.ts"
import { DETAIL_CACHE_SIZE, detailCache } from "./cache.ts"
import {
  currentDatabase,
  idList,
  loc,
  num,
  numOrNull,
  select,
  str,
  VISIBLE_VERSIONS,
  type Row,
} from "./db.ts"
import { reachableMoves, type LevelMove, type Stage } from "./moveReach.ts"
import { effectRowsBy, fillMoves } from "./moves.ts"
import {
  compareMachineMoves,
  machineNumberOf,
  pickNearest,
  representativeVersionGroup,
} from "./rules.ts"
import { fillTypesAndStats } from "./species.ts"
import {
  emptyDetail,
  emptyMove,
  emptyStats,
  isValidDetail,
  NO_RELATIVE_STATS,
  type AbilityEntry,
  type EvolutionCondition,
  type EvolutionStep,
  type PokemonDetail,
} from "./types.ts"

/**
 * 포켓몬 하나의 상세. versionGroup = 기술 · 기술머신의 기준 게임 묶음 — 비었거나 그 세대 게임이
 * 아니면 세대의 대표 게임. 그 세대에 없는 포켓몬도 돌아오고 types가 빈다(화면이 이것으로 판정)
 */
export function pokemonDetail(
  pokemonId: number,
  generation: number,
  versionGroup = ""
): PokemonDetail {
  const key = `${pokemonId}/${generation}/${versionGroup}`
  if (currentDatabase()) {
    const cached = detailCache.get(key)
    if (cached) return structuredClone(cached)
  }
  const detail = readPokemonDetail(pokemonId, generation, versionGroup)
  if (isValidDetail(detail)) {
    if (detailCache.size >= DETAIL_CACHE_SIZE) detailCache.clear()
    detailCache.set(key, structuredClone(detail))
  }
  return detail
}

function readPokemonDetail(
  pokemonId: number,
  generation: number,
  versionGroup: string
): PokemonDetail {
  const detail = emptyDetail()
  const g = generation

  // 1) 이름 · 분류 · 키 · 몸무게
  const [base] = select(
    `SELECT s.id, s.name_ko, s.name_en, s.name_ja, s.genus_ko, s.genus_en, s.genus_ja,
            p.height, p.weight
     FROM pokemon p JOIN species s ON s.id = p.species_id WHERE p.id = ?`,
    [pokemonId]
  )
  if (!base) return detail
  detail.pokemonId = pokemonId
  detail.speciesId = num(base.id)
  detail.name = loc(base, "name")
  detail.genus = loc(base, "genus")
  detail.height = num(base.height)
  detail.weight = num(base.weight)
  detail.generation = g

  // 2) 타입 · 종족값: 목록과 같은 함수로
  const one = {
    pokemonId,
    types: [] as string[],
    stats: emptyStats(),
    total: 0,
  }
  fillTypesAndStats([one], g)
  detail.types = one.types
  detail.stats = one.stats
  detail.total = one.total

  // 3) 기술 기준 게임 묶음: 고른 게임(그 세대 것일 때만), 아니면 세대의 대표 게임
  let groupId = 0
  for (const candidate of [versionGroup, representativeVersionGroup(g)]) {
    if (candidate === "") continue
    const [found] = select(
      "SELECT id FROM version_groups WHERE identifier = ? AND generation = ?",
      [candidate, g]
    )
    if (found) {
      groupId = num(found.id)
      detail.versionGroup = candidate
      break
    }
  }
  for (const r of select(
    `SELECT v.identifier, v.name_ko, v.name_en, v.name_ja FROM versions v
     WHERE v.version_group_id = ? AND ${VISIBLE_VERSIONS} ORDER BY v.id`,
    [groupId]
  )) {
    const version = str(r.identifier)
    detail.groupVersions.push(version)
    detail.groupGames.push(supplement("versions", version, loc(r, "name")))
  }

  // 4) 습득 기술: 레벨업(1) · 기술머신(4) · 가르침(3) · 알(2)
  for (const r of select(
    `SELECT move_id, level FROM pokemon_moves
     WHERE pokemon_id = ? AND version_group_id = ? AND method = 1
     ORDER BY level, sort_order, move_id`,
    [pokemonId, groupId]
  )) {
    const move = emptyMove(num(r.move_id))
    move.level = num(r.level)
    detail.levelMoves.push(move)
  }
  for (const r of select(
    `SELECT pm.move_id, m.machine_number, i.identifier FROM pokemon_moves pm
     JOIN machines m ON m.version_group_id = pm.version_group_id AND m.move_id = pm.move_id
     JOIN items i ON i.id = m.item_id
     WHERE pm.pokemon_id = ? AND pm.version_group_id = ? AND pm.method = 4`,
    [pokemonId, groupId]
  )) {
    const move = emptyMove(num(r.move_id))
    move.machineItem = str(r.identifier)
    move.hiddenMachine = move.machineItem.startsWith("hm")
    move.machineNumber = machineNumberOf(
      move.machineItem,
      num(r.machine_number)
    )
    detail.machineMoves.push(move)
  }
  detail.machineMoves.sort(compareMachineMoves)
  detail.tutorMoves = methodMoves(pokemonId, groupId, 3)
  detail.eggMoves = methodMoves(pokemonId, groupId, 2)

  fillEvolution(detail, groupId)
  fillMoves(detail.inheritedMoves, g)
  fillMoves(detail.levelMoves, g)
  fillMoves(detail.machineMoves, g)
  fillMoves(detail.tutorMoves, g)
  fillMoves(detail.eggMoves, g)
  fillAbilities(detail)

  // 5) 야생 출현: 그 세대의 모든 (보이는) 버전. 장소 이름은 UI 사전이 채운다
  for (const r of select(
    `SELECT v.identifier AS version, v.name_ko AS version_ko, v.name_en AS version_en,
            v.name_ja AS version_ja, l.identifier AS location, l.name_ko AS location_ko,
            l.name_en AS location_en, l.name_ja AS location_ja, em.identifier AS method,
            e.min_level, e.max_level, e.rarity
     FROM encounters e JOIN versions v ON v.id = e.version_id
     JOIN version_groups vg ON vg.id = v.version_group_id
     JOIN locations l ON l.id = e.location_id
     JOIN encounter_methods em ON em.id = e.method_id
     WHERE e.pokemon_id = ? AND vg.generation = ? AND ${VISIBLE_VERSIONS}
     ORDER BY v.id, l.id, em.id`,
    [pokemonId, g]
  )) {
    const version = str(r.version)
    detail.encounters.push({
      version,
      versionName: supplement("versions", version, loc(r, "version")),
      location: str(r.location),
      locationName: loc(r, "location"),
      method: str(r.method),
      minLevel: num(r.min_level),
      maxLevel: num(r.max_level),
      rarity: num(r.rarity),
    })
  }
  return detail
}

/** 가르침 · 알 기술: move id 순, 중복 없이 */
function methodMoves(pokemonId: number, groupId: number, method: number) {
  return select(
    `SELECT DISTINCT move_id FROM pokemon_moves
     WHERE pokemon_id = ? AND version_group_id = ? AND method = ? ORDER BY move_id`,
    [pokemonId, groupId, method]
  ).map((r) => emptyMove(num(r.move_id)))
}

/** 레벨업 기술 행(낮은 레벨부터 — 한 기술을 여러 레벨에서 배우면 가장 낮은 레벨이 먼저) */
function learnsetOf(pokemonId: number, groupId: number): LevelMove[] {
  return select(
    `SELECT move_id, level, sort_order FROM pokemon_moves
     WHERE pokemon_id = ? AND version_group_id = ? AND method = 1
     ORDER BY level, sort_order, move_id`,
    [pokemonId, groupId]
  ).map((r) => ({
    move: num(r.move_id),
    level: num(r.level),
    order: num(r.sort_order),
  }))
}

/**
 * 진화 트리 · 하트비늘 · 진화 전 자력기 · 알 기술. levelMoves · eggMoves는 id만 채운 상태로 받는다.
 * groupId는 0일 수 있다(그러면 기술 질의가 모두 빈다)
 */
function fillEvolution(detail: PokemonDetail, groupId: number): void {
  const g = detail.generation

  // 1) 같은 진화 사슬의 종(그 세대에 있는 것만)
  const [chainRow] = select(
    "SELECT evolution_chain FROM species WHERE id = ?",
    [detail.speciesId]
  )
  const chain = chainRow ? num(chainRow.evolution_chain) : 0
  const steps = new Map<number, EvolutionStep>()
  const order: number[] = []
  for (const r of select(
    `SELECT s.id, s.evolves_from, s.name_ko, s.name_en, s.name_ja, p.id AS pokemon_id
     FROM species s
     JOIN pokemon p ON p.species_id = s.id AND p.is_default = 1
     WHERE s.evolution_chain = ? AND s.intro_gen <= ? ORDER BY s.id`,
    [chain, g]
  )) {
    const step: EvolutionStep = {
      speciesId: num(r.id),
      pokemonId: num(r.pokemon_id),
      fromSpeciesId: num(r.evolves_from),
      depth: 0,
      name: loc(r, "name"),
      conditions: [],
    }
    steps.set(step.speciesId, step)
    order.push(step.speciesId)
  }
  // 진화 전 종이 이 세대에 없으면(1세대의 피카츄: 피츄는 2세대부터) 그 종이 뿌리다
  for (const step of steps.values())
    if (!steps.has(step.fromSpeciesId)) step.fromSpeciesId = 0

  // 2) 하트비늘: 이 게임에서 잡기 · 받기 · 진화로 얻는 길을 따라 자연히 익히는 기술과 견준다
  const ancestors: number[] = [] // 기본 모습 pokemon id(가까운 단계부터)
  const ancestorSpecies: number[] = []
  for (
    let from = steps.get(detail.speciesId)?.fromSpeciesId ?? 0;
    from !== 0;
    from = steps.get(from)?.fromSpeciesId ?? 0
  ) {
    ancestors.push(steps.get(from)?.pokemonId ?? 0)
    ancestorSpecies.push(from)
  }
  const path: Stage[] = [] // 뿌리 → 이 포켓몬
  for (let i = ancestors.length; i >= 0; i--) {
    const pokemonId = i > 0 ? ancestors[i - 1] : detail.pokemonId // 대상 자신은 폼 그대로
    const speciesId = i > 0 ? ancestorSpecies[i - 1] : detail.speciesId
    const stage: Stage = {
      learnset: learnsetOf(pokemonId, groupId),
      evolveLevel: 0,
    }
    const [caught] = select(
      `SELECT MIN(e.min_level) AS level FROM encounters e
       JOIN versions v ON v.id = e.version_id
       WHERE e.pokemon_id = ? AND v.version_group_id = ?`,
      [pokemonId, groupId]
    )
    const caughtLevel = caught ? numOrNull(caught.level) : null
    if (caughtLevel !== null) stage.caughtLevel = caughtLevel
    if (path.length > 0) {
      // 그 세대 이하에서 가장 최근 세대의 진화 방법 중 가장 낮은 레벨(레벨 조건 없음 = 0)
      const [evolve] = select(
        `SELECT MIN(COALESCE(min_level, 0)) AS level FROM evolutions
         WHERE evolved_species_id = ? AND generation = (SELECT MAX(generation) FROM evolutions
                                                         WHERE evolved_species_id = ? AND generation <= ?)`,
        [speciesId, speciesId, g]
      )
      stage.evolveLevel = evolve ? num(evolve.level) : 0
    }
    path.push(stage)
  }
  const reach = reachableMoves(path)

  // 3) 진화 전 단계의 자력기: 진화해도 기술은 남는다(가디 Lv 43 불대문자 → 윈디).
  // 가까운 단계부터 넣고, 제 자력표에 있는 기술과 이미 넣은 기술은 건너뛴다
  const taken = new Set(detail.levelMoves.map((m) => m.moveId))
  for (let k = 0; k < ancestors.length; k++) {
    const stage = path[path.length - 2 - k]
    const from = steps.get(ancestorSpecies[k])
    for (const learned of stage.learnset) {
      if (taken.has(learned.move)) continue
      taken.add(learned.move)
      const move = emptyMove(learned.move)
      move.level = learned.level
      move.fromPokemonId = from?.pokemonId ?? 0
      move.fromName = from ? { ...from.name } : emptyText()
      move.needsReminder = reach.obtainable && !reach.moves.has(learned.move)
      detail.inheritedMoves.push(move)
    }
  }
  detail.inheritedMoves.sort((a, b) => a.level - b.level || a.moveId - b.moveId)

  // 알 기술은 사슬의 뿌리에만 적혀 있다 — 뿌리 것 중 아직 없는 것을 뒤에 붙인다
  if (ancestors.length > 0) {
    const known = new Set(detail.eggMoves.map((m) => m.moveId))
    for (const move of methodMoves(ancestors[ancestors.length - 1], groupId, 2))
      if (!known.has(move.moveId)) detail.eggMoves.push(move)
  }

  if (reach.obtainable) {
    detail.earliestLevel = reach.earliestLevel
    for (const move of detail.levelMoves)
      move.needsReminder = !reach.moves.has(move.moveId)
  } else if (ancestors.length > 0) {
    // 이 게임의 출현 자료로는 얻을 수 없다(다른 게임에서 데려오기 등): 진화 전 단계가
    // 레벨업으로 배우지 않는 Lv 1 기술만
    const inherited = new Set<number>()
    for (const id of ancestors)
      for (const r of select(
        `SELECT move_id FROM pokemon_moves
         WHERE pokemon_id = ? AND version_group_id = ? AND method = 1`,
        [id, groupId]
      ))
        inherited.add(num(r.move_id))
    const laterLevels = new Set(
      detail.levelMoves.filter((m) => m.level > 1).map((m) => m.moveId)
    )
    for (const move of detail.levelMoves)
      move.needsReminder =
        move.level <= 1 &&
        !inherited.has(move.moveId) &&
        !laterLevels.has(move.moveId)
  }

  if (steps.size < 2) return // 진화하지 않는 포켓몬

  // 4) 진화 방법: 종마다 "그 세대 이하에서 방법이 있는 가장 최근 세대"의 줄만
  const rows = select(
    `SELECT rowid, evolved_species_id, generation, trigger, item_id, min_level, gender,
            location_id, held_item_id, time_of_day, known_move_id, known_move_type_id,
            min_happiness, min_beauty, min_affection, relative_stats, party_species_id,
            party_type_id, trade_species_id, needs_rain, upside_down
     FROM evolutions WHERE generation <= ? AND evolved_species_id IN (${idList(order)})
     ORDER BY rowid`,
    [g]
  )
  const latest = new Map<number, number>()
  for (const r of rows) {
    const species = num(r.evolved_species_id)
    latest.set(species, Math.max(latest.get(species) ?? 0, num(r.generation)))
  }
  for (const r of rows) {
    const species = num(r.evolved_species_id)
    const step = steps.get(species)
    if (!step || num(r.generation) !== latest.get(species)) continue
    step.conditions.push(conditionOf(r))
  }

  // 5) 뿌리부터 깊이 우선(형제는 종 번호 순): 랄토스 → 킬리아 → 가디안 · 엘레이드
  const children = new Map<number, number[]>()
  const roots: number[] = []
  for (const id of order) {
    const from = steps.get(id)?.fromSpeciesId ?? 0
    if (from === 0) roots.push(id)
    else children.set(from, [...(children.get(from) ?? []), id])
  }
  const visit = (id: number, depth: number) => {
    const step = steps.get(id)
    if (!step) return
    detail.evolution.push({ ...step, depth })
    for (const child of children.get(id) ?? []) visit(child, depth + 1)
  }
  for (const root of roots) visit(root, 0)
}

type NamedTable = "items" | "moves" | "locations" | "species"

// 이름 찾기(도구 · 기술 · 장소 · 종). 줄이 몇 개뿐이라 그때그때 묻는다
function nameOf(table: NamedTable, id: number | null): LocalizedText {
  if (id === null) return emptyText()
  const [r] = select(
    `SELECT name_ko, name_en, name_ja FROM ${table} WHERE id = ?`,
    [id]
  )
  return r ? loc(r, "name") : emptyText()
}

function identifierOf(table: NamedTable | "types", id: number | null): string {
  if (id === null) return ""
  const [r] = select(`SELECT identifier FROM ${table} WHERE id = ?`, [id])
  return r ? str(r.identifier) : ""
}

function conditionOf(r: Row): EvolutionCondition {
  const itemId = numOrNull(r.item_id)
  const heldItemId = numOrNull(r.held_item_id)
  const locationId = numOrNull(r.location_id)
  const knownMoveId = numOrNull(r.known_move_id)
  const relativeStats = numOrNull(r.relative_stats)
  const itemIdentifier = identifierOf("items", itemId)
  const heldItemIdentifier = identifierOf("items", heldItemId)
  const knownMove = identifierOf("moves", knownMoveId)
  // 도구 · 기술 이름도 보충 사전으로 채운다(Qt판은 안 했다)
  return {
    trigger: num(r.trigger),
    minLevel: num(r.min_level),
    item: supplement("items", itemIdentifier, nameOf("items", itemId)),
    itemIdentifier,
    heldItem: supplement(
      "items",
      heldItemIdentifier,
      nameOf("items", heldItemId)
    ),
    heldItemIdentifier,
    gender: num(r.gender),
    location: identifierOf("locations", locationId),
    locationName: nameOf("locations", locationId),
    timeOfDay: str(r.time_of_day),
    knownMove: supplement("moves", knownMove, nameOf("moves", knownMoveId)),
    knownMoveType: identifierOf("types", numOrNull(r.known_move_type_id)),
    minHappiness: num(r.min_happiness),
    minBeauty: num(r.min_beauty),
    minAffection: num(r.min_affection),
    relativeStats: relativeStats ?? NO_RELATIVE_STATS,
    partySpecies: nameOf("species", numOrNull(r.party_species_id)),
    partyType: identifierOf("types", numOrNull(r.party_type_id)),
    tradeSpecies: nameOf("species", numOrNull(r.trade_species_id)),
    needsRain: num(r.needs_rain) !== 0,
    upsideDown: num(r.upside_down) !== 0,
  }
}

/** 그 세대 특성(칸 순). 1 · 2번 칸이 같은 특성이면 한 번만, 숨겨진 특성은 같아도 남긴다 */
function fillAbilities(detail: PokemonDetail): void {
  const g = detail.generation
  const all: AbilityEntry[] = select(
    `SELECT pa.slot, pa.is_hidden, a.id, a.name_ko, a.name_en, a.name_ja, a.identifier
     FROM pokemon_abilities pa JOIN abilities a ON a.id = pa.ability_id
     WHERE pa.pokemon_id = ? AND pa.gen_from <= ? AND (pa.gen_to IS NULL OR pa.gen_to >= ?)
     ORDER BY pa.slot`,
    [detail.pokemonId, g, g]
  ).map((r) => {
    const identifier = str(r.identifier)
    return {
      abilityId: num(r.id),
      identifier,
      slot: num(r.slot),
      hidden: num(r.is_hidden) !== 0,
      name: supplement("abilities", identifier, loc(r, "name")),
      effect: emptyText(),
    }
  })
  if (all.length === 0) return // 1–2세대는 구간이 3세대부터라 늘 빈다

  // 효과 문구는 특성 id별로 구해 모든 칸에 넣는다(Qt판은 같은 특성이 두 칸이면 한 칸에만 넣었다)
  const effects = effectRowsBy(
    select(
      `SELECT ability_id, generation, text_ko, text_en, text_ja FROM ability_effects
       WHERE ability_id IN (${idList(all.map((a) => a.abilityId))}) ORDER BY generation`
    ),
    "ability_id"
  )
  const seen = new Set<number>()
  for (const ability of all) {
    if (seen.has(ability.abilityId) && !ability.hidden) continue
    seen.add(ability.abilityId)
    ability.effect = supplement(
      "ability-effects",
      ability.identifier,
      pickNearest(effects.get(ability.abilityId) ?? [], g)
    )
    detail.abilities.push(ability)
  }
}
