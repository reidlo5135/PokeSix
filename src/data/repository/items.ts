/**
 * 아이템 대백과 · 기술머신 · 진화 아이템.
 */
import { emptyText, type LocalizedText } from "../text/localizedText.ts"
import { supplement } from "../text/namebook.ts"
import { currentDatabase, loc, num, select, str } from "./db.ts"
import { effectRowsBy } from "./moves.ts"
import { pickNearest } from "./rules.ts"
import {
  emptyStats,
  type ItemEvolution,
  type ItemRow,
  type SpeciesRow,
} from "./types.ts"

interface MachineContent {
  moveId: number
  moveIdentifier: string
}

/**
 * 어느 세대에든 있었던 아이템 전부(id 순). 세대별 존재 비트는 전부, 효과 문구 · 기술머신 내용은
 * g(또는 고른 게임) 기준. 그 세대에 없는 아이템도 넣는다 — 화면이 흐리게 보일지 뺄지 정한다.
 * versionGroup을 주면 기술머신 내용을 그 게임 것으로, 그 게임 표에 없는 기술머신은 뺀다
 */
export function itemsForGeneration(
  generation: number,
  versionGroup = ""
): ItemRow[] {
  if (!currentDatabase()) return []
  const g = generation

  // 1) 아이템 + 분류
  const rows: ItemRow[] = select(
    `SELECT i.id, i.identifier, c.identifier AS category, c.pocket,
            i.name_ko, i.name_en, i.name_ja, i.cost
     FROM items i JOIN item_categories c ON c.id = i.category_id
     WHERE EXISTS (SELECT 1 FROM item_generations g WHERE g.item_id = i.id)
     ORDER BY i.id`
  ).map((r) => {
    const identifier = str(r.identifier)
    return {
      id: num(r.id),
      identifier,
      category: str(r.category),
      pocket: str(r.pocket),
      name: supplement("items", identifier, loc(r, "name")),
      generations: 0,
      effect: emptyText(),
      cost: num(r.cost),
      machineMove: emptyText(),
      machineType: "",
    }
  })
  if (rows.length === 0) return rows
  const byId = new Map(rows.map((row) => [row.id, row]))

  // 2) 세대별 존재 비트
  for (const r of select("SELECT item_id, generation FROM item_generations")) {
    const row = byId.get(num(r.item_id))
    const gen = num(r.generation)
    if (row && gen >= 1 && gen <= 16) row.generations |= 1 << (gen - 1)
  }

  // 3) 기술머신에 담긴 기술 + 그 세대 타입. 여기 들어간 아이템이 "기술머신"이다
  const source =
    versionGroup === ""
      ? "(SELECT item_id, move_id FROM item_machines WHERE generation = ?)"
      : `(SELECT ma.item_id, ma.move_id FROM machines ma
          JOIN version_groups vg ON vg.id = ma.version_group_id WHERE vg.identifier = ?)`
  const machineOf = new Map<number, MachineContent>()
  for (const r of select(
    `SELECT im.item_id, m.name_ko, m.name_en, m.name_ja, t.identifier AS type, im.move_id,
            m.identifier AS move
     FROM ${source} im
     JOIN moves m ON m.id = im.move_id
     LEFT JOIN move_types mt ON mt.move_id = m.id
       AND mt.gen_from <= ? AND (mt.gen_to IS NULL OR mt.gen_to >= ?)
     LEFT JOIN types t ON t.id = mt.type_id`,
    [versionGroup === "" ? g : versionGroup, g, g]
  )) {
    const row = byId.get(num(r.item_id))
    if (!row) continue
    const move = str(r.move)
    row.machineMove = supplement("moves", move, loc(r, "name"))
    row.machineType = str(r.type)
    machineOf.set(row.id, { moveId: num(r.move_id), moveIdentifier: move })
  }

  // 4) 효과 문구: 기술머신이 아니면 아이템 문구, 기술머신은 담긴 기술의 설명문
  // (아이템 문구를 다른 세대에서 빌리면 기술과 설명이 어긋난다)
  const itemEffects = effectRowsBy(
    select(
      "SELECT item_id, generation, text_ko, text_en, text_ja FROM item_effects ORDER BY generation"
    ),
    "item_id"
  )
  const moveEffects = effectRowsBy(
    select(
      "SELECT move_id, generation, text_ko, text_en, text_ja FROM move_effects ORDER BY generation"
    ),
    "move_id"
  )
  const moveEffectCache = new Map<number, LocalizedText>()
  for (const row of rows) {
    const machine = machineOf.get(row.id)
    if (!machine) {
      row.effect = supplement(
        "item-effects",
        row.identifier,
        pickNearest(itemEffects.get(row.id) ?? [], g)
      )
      continue
    }
    let effect = moveEffectCache.get(machine.moveId)
    if (!effect) {
      // 9세대 신규 기술도 한국어가 비지 않게 기술 설명 사전으로 보충한다(Qt판은 안 했다)
      effect = supplement(
        "move-effects",
        machine.moveIdentifier,
        pickNearest(moveEffects.get(machine.moveId) ?? [], g)
      )
      moveEffectCache.set(machine.moveId, effect)
    }
    row.effect = { ...effect }
  }

  // 5) 게임을 골랐으면 그 게임 표에 없는 기술머신 주머니 행을 뺀다(레츠고는 60개뿐)
  if (versionGroup === "") return rows
  return rows.filter(
    (row) => row.pocket !== "machines" || machineOf.has(row.id)
  )
}

/**
 * 이 아이템으로 진화하는 포켓몬(사용 · 지님 모두). g 이하의 모든 규칙 · g까지 나온 진화형만.
 * onlyVersions는 비워 둔다 — 화면이 채운다
 */
export function evolutionsWithItem(
  itemId: number,
  generation: number
): ItemEvolution[] {
  return select(
    `SELECT DISTINCT f.name_ko AS from_ko, f.name_en AS from_en, f.name_ja AS from_ja,
            t.name_ko AS to_ko, t.name_en AS to_en, t.name_ja AS to_ja,
            e.held_item_id = ? AS held, t.id AS species_id,
            pf.id AS from_pokemon_id, pt.id AS to_pokemon_id
     FROM evolutions e
     JOIN species t ON t.id = e.evolved_species_id
     LEFT JOIN species f ON f.id = t.evolves_from
     LEFT JOIN pokemon pt ON pt.species_id = t.id AND pt.is_default = 1
     LEFT JOIN pokemon pf ON pf.species_id = f.id AND pf.is_default = 1
     WHERE (e.item_id = ? OR e.held_item_id = ?)
       AND e.generation <= ? AND t.intro_gen <= ?
     ORDER BY t.id`,
    [itemId, itemId, itemId, generation, generation]
  ).map((r) => ({
    from: loc(r, "from"),
    to: loc(r, "to"),
    held: num(r.held) === 1,
    speciesId: num(r.species_id),
    fromPokemonId: num(r.from_pokemon_id),
    toPokemonId: num(r.to_pokemon_id),
    onlyVersions: [],
  }))
}

/**
 * 그 게임 묶음에서 이 기술머신("tm26")으로 기술을 배우는 종(기본 모습, 종 번호 순).
 * 타입 · 종족값은 채우지 않는다. 기술머신이 아니거나 그 게임에 없으면 []
 */
export function machineLearners(
  item: string,
  versionGroup: string
): SpeciesRow[] {
  return select(
    `SELECT DISTINCT s.id AS species_id, p.id AS pokemon_id, s.name_ko, s.name_en, s.name_ja
     FROM machines m
     JOIN items i ON i.id = m.item_id
     JOIN version_groups vg ON vg.id = m.version_group_id
     JOIN pokemon_moves pm ON pm.version_group_id = vg.id AND pm.move_id = m.move_id
       AND pm.method = 4
     JOIN pokemon p ON p.id = pm.pokemon_id AND p.is_default = 1
     JOIN species s ON s.id = p.species_id
     WHERE i.identifier = ? AND vg.identifier = ? ORDER BY s.id`,
    [item, versionGroup]
  ).map((r) => ({
    speciesId: num(r.species_id),
    dexNumber: num(r.species_id),
    pokemonId: num(r.pokemon_id),
    name: loc(r, "name"),
    types: [],
    stats: emptyStats(),
    total: 0,
    legendary: false,
    finalEvolution: true,
  }))
}

/**
 * 세대별 게임 속 아이템 번호 → items.id. 없으면 0.
 * 같은 (세대, 번호)에 아이템이 둘인 경우가 있어 가장 작은 id로 고정한다. 8세대는 신뢰할 수 없다
 */
export function itemIdForGameIndex(
  generation: number,
  gameIndex: number
): number {
  const [row] = select(
    `SELECT item_id FROM item_generations WHERE generation = ? AND game_index = ?
     ORDER BY item_id LIMIT 1`,
    [generation, gameIndex]
  )
  return row ? num(row.item_id) : 0
}
