/**
 * PokéAPI CSV → SQLite(스키마 v12). Qt판 CsvImporter와 같은 줄을 만든다(표마다 줄 묶음이 같음을 확인한 참조 구현의 이식).
 * DB는 sql.js Database — 워커에서 돌리고, 끝나면 바이트로 꺼내 저장한다.
 */
import type { Database, SqlValue, Statement } from "sql.js"

import { columns, intOrNull, toInt, type CsvField } from "./csv.ts"
import { toGenRanges } from "./genRanges.ts"
import { POKEAPI_COMMIT } from "./manifest.ts"
import { SCHEMA, SCHEMA_VERSION } from "./schema.ts"

/** 파일 이름(.csv 없이) → 내용. 없으면 throw. */
export type CsvSource = (name: string) => string

type Names = [string | null, string | null, string | null]

const FIRST_NON_BATTLE_TYPE = 10000
const FIRST_ABILITY_GENERATION = 3

/** 한국판이 나온 게임(4세대)에 있던 이름만 — PokéAPI에 한국어가 없을 때만 쓴다 */
const ITEM_NAMES_KO: Readonly<Record<string, string>> = {
  "grass-mail": "그래스메일",
  "flame-mail": "플레임메일",
  "bubble-mail": "블루메일",
  "bloom-mail": "블룸메일",
  "tunnel-mail": "터널메일",
  "steel-mail": "스틸메일",
  "heart-mail": "러브러브메일",
  "snow-mail": "블리자드메일",
  "space-mail": "스페이스메일",
  "air-mail": "에어메일",
  "mosaic-mail": "모자이크메일",
  "brick-mail": "브릭메일",
  hm08: "비전머신08",
}

/** PokéAPI 언어 id → 이름 칸(0 ko · 1 en · 2 ja). 1 = 가나 전용 일본어(한자판이 없을 때만) */
function nameColumnOf(language: number): number {
  switch (language) {
    case 3:
      return 0
    case 9:
      return 1
    case 11:
    case 1:
      return 2
    default:
      return -1
  }
}

const halfWidth = (text: string): string => text.normalize("NFKC")

const simplified = (text: string): string =>
  text.split(/\s+/).filter(Boolean).join(" ")

function setName(names: Names, language: number, text: CsvField): void {
  const col = nameColumnOf(language)
  if (col < 0 || (language === 1 && names[col])) return
  names[col] = col === 2 && text !== null ? halfWidth(text) : text
}

function namesOf<K>(map: Map<K, Names>, key: K): Names {
  let names = map.get(key)
  if (!names) {
    names = [null, null, null]
    map.set(key, names)
  }
  return names
}

const noNames = (): Names => [null, null, null]

function isoSeconds(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z")
}

export function importCsv(
  db: Database,
  read: CsvSource,
  now: Date = new Date()
): void {
  const statements = new Map<string, Statement>()
  const insert = (sql: string, values: SqlValue[]): void => {
    let stmt = statements.get(sql)
    if (!stmt) {
      stmt = db.prepare(sql)
      statements.set(sql, stmt)
    }
    stmt.run(values)
  }
  const into = (table: string, values: SqlValue[]): void =>
    insert(
      `INSERT INTO ${table} VALUES (${values.map(() => "?").join(",")})`,
      values
    )
  const each = (file: string, cols: readonly string[]) =>
    columns(file, read(file), cols)

  db.run("PRAGMA journal_mode = OFF")
  db.run("PRAGMA synchronous = OFF")
  db.run("BEGIN")
  try {
    for (const statement of SCHEMA) db.run(statement)

    const typeIntro = new Map<number, number>()
    const speciesIntro = new Map<number, number>()
    const pokemonIntro = new Map<number, number>()
    const vgGen = new Map<number, number>()
    const vgOrder = new Map<number, number>()
    for (const [id, gen, order] of each("version_groups", [
      "id",
      "generation_id",
      "order",
    ])) {
      vgGen.set(toInt(id), toInt(gen))
      vgOrder.set(toInt(id), toInt(order))
    }

    // generations
    for (const [id, ident] of each("generations", ["id", "identifier"])) {
      into("generations", [toInt(id), ident])
    }

    // types
    let names = new Map<number, Names>()
    for (const [t, l, n] of each("type_names", [
      "type_id",
      "local_language_id",
      "name",
    ])) {
      setName(namesOf(names, toInt(t)), toInt(l), n)
    }
    for (const [idText, ident, gen] of each("types", [
      "id",
      "identifier",
      "generation_id",
    ])) {
      const id = toInt(idText)
      if (id >= FIRST_NON_BATTLE_TYPE) continue
      typeIntro.set(id, toInt(gen))
      into("types", [id, ident, toInt(gen), ...(names.get(id) ?? noNames())])
    }

    // type chart
    {
      const current = new Map<string, number>()
      const past = new Map<string, [number, number][]>()
      for (const [a, d, f] of each("type_efficacy", [
        "damage_type_id",
        "target_type_id",
        "damage_factor",
      ])) {
        current.set(`${toInt(a)},${toInt(d)}`, toInt(f))
      }
      for (const [a, d, f, g] of each("type_efficacy_past", [
        "damage_type_id",
        "target_type_id",
        "damage_factor",
        "generation_id",
      ])) {
        const key = `${toInt(a)},${toInt(d)}`
        const list = past.get(key) ?? []
        list.push([toInt(g), toInt(f)])
        past.set(key, list)
      }
      const pairs = [...current.keys()]
        .map((key) => key.split(",").map(Number) as [number, number])
        .sort((x, y) => x[0] - y[0] || x[1] - y[1])
      for (const [atk, def] of pairs) {
        const key = `${atk},${def}`
        const first = Math.max(typeIntro.get(atk) ?? 1, typeIntro.get(def) ?? 1)
        for (const r of toGenRanges(
          first,
          past.get(key) ?? [],
          current.get(key)
        )) {
          into("type_chart", [atk, def, r.value / 100, r.from, r.to])
        }
      }
    }

    // stats
    for (const [id, ident] of each("stats", ["id", "identifier"])) {
      into("stats", [toInt(id), ident])
    }

    // species
    names = new Map()
    const genera = new Map<number, Names>()
    for (const [s, l, n, g] of each("pokemon_species_names", [
      "pokemon_species_id",
      "local_language_id",
      "name",
      "genus",
    ])) {
      setName(namesOf(names, toInt(s)), toInt(l), n)
      setName(namesOf(genera, toInt(s)), toInt(l), g)
    }
    for (const v of each("pokemon_species", [
      "id",
      "identifier",
      "generation_id",
      "evolves_from_species_id",
      "evolution_chain_id",
      "is_baby",
      "is_legendary",
      "is_mythical",
      "order",
    ])) {
      const id = toInt(v[0])
      speciesIntro.set(id, toInt(v[2]))
      into("species", [
        id,
        v[1],
        toInt(v[2]),
        intOrNull(v[3]),
        intOrNull(v[4]),
        toInt(v[5]),
        toInt(v[6]),
        toInt(v[7]),
        intOrNull(v[8]),
        ...(names.get(id) ?? noNames()),
        ...(genera.get(id) ?? noNames()),
      ])
    }

    // pokemon (+ 폼이 처음 나온 세대)
    {
      const formIntro = new Map<number, number>()
      for (const [p, vg] of each("pokemon_forms", [
        "pokemon_id",
        "introduced_in_version_group_id",
      ])) {
        if (!vg) continue
        const id = toInt(p)
        const gen = vgGen.get(toInt(vg)) ?? 0
        const known = formIntro.get(id)
        if (gen > 0 && (known === undefined || gen < known))
          formIntro.set(id, gen)
      }
      for (const v of each("pokemon", [
        "id",
        "identifier",
        "species_id",
        "is_default",
        "height",
        "weight",
        "order",
      ])) {
        const id = toInt(v[0])
        const species = toInt(v[2])
        const speciesGen = speciesIntro.get(species) ?? 1
        const intro = Math.max(speciesGen, formIntro.get(id) ?? speciesGen)
        pokemonIntro.set(id, intro)
        into("pokemon", [
          id,
          v[1],
          species,
          toInt(v[3]),
          intro,
          intOrNull(v[4]),
          intOrNull(v[5]),
          intOrNull(v[6]),
        ])
      }
    }

    // pokemon types — 칸 묶음 전체가 한 값
    {
      type Slots = [number, number][]
      const key = (slots: Slots) => slots.map(([s, t]) => `${s}:${t}`).join(",")
      const sortSlots = (slots: Slots) =>
        [...slots].sort((a, b) => a[0] - b[0] || a[1] - b[1])
      const current = new Map<number, Slots>()
      const pastBy = new Map<number, Map<number, Slots>>()
      for (const [p, t, s] of each("pokemon_types", [
        "pokemon_id",
        "type_id",
        "slot",
      ])) {
        const list = current.get(toInt(p)) ?? []
        list.push([toInt(s), toInt(t)])
        current.set(toInt(p), list)
      }
      for (const [p, g, t, s] of each("pokemon_types_past", [
        "pokemon_id",
        "generation_id",
        "type_id",
        "slot",
      ])) {
        const byGen = pastBy.get(toInt(p)) ?? new Map<number, Slots>()
        const list = byGen.get(toInt(g)) ?? []
        list.push([toInt(s), toInt(t)])
        byGen.set(toInt(g), list)
        pastBy.set(toInt(p), byGen)
      }
      for (const p of [...current.keys()].sort((a, b) => a - b)) {
        const past = [...(pastBy.get(p) ?? new Map<number, Slots>()).entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([g, slots]) => [g, sortSlots(slots)] as const)
        const ranges = toGenRanges(
          pokemonIntro.get(p) ?? 1,
          past,
          sortSlots(current.get(p) ?? []),
          (a, b) => key(a) === key(b)
        )
        for (const r of ranges) {
          for (const [slot, type] of r.value) {
            into("pokemon_types", [p, slot, type, r.from, r.to])
          }
        }
      }
    }

    // pokemon stats — 특수공격 · 특수방어(4 · 5)는 2세대부터
    {
      const current = new Map<string, number>()
      const past = new Map<string, [number, number][]>()
      for (const [p, s, b] of each("pokemon_stats", [
        "pokemon_id",
        "stat_id",
        "base_stat",
      ])) {
        current.set(`${toInt(p)},${toInt(s)}`, toInt(b))
      }
      for (const [p, g, s, b] of each("pokemon_stats_past", [
        "pokemon_id",
        "generation_id",
        "stat_id",
        "base_stat",
      ])) {
        const k = `${toInt(p)},${toInt(s)}`
        const list = past.get(k) ?? []
        list.push([toInt(g), toInt(b)])
        past.set(k, list)
      }
      const keys = [...new Set([...current.keys(), ...past.keys()])]
        .map((k) => k.split(",").map(Number) as [number, number])
        .sort((x, y) => x[0] - y[0] || x[1] - y[1])
      for (const [p, s] of keys) {
        const k = `${p},${s}`
        let first = pokemonIntro.get(p) ?? 1
        if (s === 4 || s === 5) first = Math.max(first, 2)
        for (const r of toGenRanges(first, past.get(k) ?? [], current.get(k))) {
          into("pokemon_stats", [p, s, r.value, r.from, r.to])
        }
      }
    }

    // regions
    names = new Map()
    for (const [r, l, n] of each("region_names", [
      "region_id",
      "local_language_id",
      "name",
    ])) {
      setName(namesOf(names, toInt(r)), toInt(l), n)
    }
    for (const r of [...names.keys()].sort((a, b) => a - b)) {
      into("regions", [r, ...(names.get(r) ?? noNames())])
    }

    // version groups · versions
    for (const v of each("version_groups", [
      "id",
      "identifier",
      "generation_id",
      "order",
    ])) {
      into("version_groups", [toInt(v[0]), v[1], toInt(v[2]), toInt(v[3])])
    }
    names = new Map()
    for (const [r, l, n] of each("version_names", [
      "version_id",
      "local_language_id",
      "name",
    ])) {
      setName(namesOf(names, toInt(r)), toInt(l), n)
    }
    for (const v of each("versions", [
      "id",
      "version_group_id",
      "identifier",
    ])) {
      const id = toInt(v[0])
      into("versions", [id, toInt(v[1]), v[2], ...(names.get(id) ?? noNames())])
    }

    // pokedexes
    for (const v of each("pokedexes", [
      "id",
      "identifier",
      "region_id",
      "is_main_series",
    ])) {
      into("pokedexes", [toInt(v[0]), v[1], intOrNull(v[2]), toInt(v[3])])
    }
    for (const v of each("pokedex_version_groups", [
      "pokedex_id",
      "version_group_id",
    ])) {
      into("pokedex_version_groups", [toInt(v[0]), toInt(v[1])])
    }
    for (const v of each("pokemon_dex_numbers", [
      "pokedex_id",
      "species_id",
      "pokedex_number",
    ])) {
      into("dex_numbers", [toInt(v[0]), toInt(v[1]), toInt(v[2])])
    }

    // items
    {
      const pockets = new Map<number, string>()
      for (const [id, ident] of each("item_pockets", ["id", "identifier"])) {
        pockets.set(toInt(id), ident ?? "")
      }
      for (const v of each("item_categories", [
        "id",
        "identifier",
        "pocket_id",
      ])) {
        into("item_categories", [
          toInt(v[0]),
          v[1],
          pockets.get(toInt(v[2])) ?? "",
        ])
      }
      names = new Map()
      for (const [r, l, n] of each("item_names", [
        "item_id",
        "local_language_id",
        "name",
      ])) {
        setName(namesOf(names, toInt(r)), toInt(l), n)
      }
      for (const v of each("items", [
        "id",
        "identifier",
        "category_id",
        "cost",
      ])) {
        const id = toInt(v[0])
        const n: Names = [...(names.get(id) ?? noNames())]
        if (!n[0]) n[0] = ITEM_NAMES_KO[v[1] ?? ""] ?? null
        into("items", [id, v[1], toInt(v[2]), intOrNull(v[3]), ...n])
      }
      for (const v of each("item_game_indices", [
        "item_id",
        "generation_id",
        "game_index",
      ])) {
        insert("INSERT OR IGNORE INTO item_generations VALUES (?,?,?)", [
          toInt(v[0]),
          toInt(v[1]),
          toInt(v[2]),
        ])
      }
    }

    // 설명문: 세대 · 언어마다 그 세대에서 가장 먼저 나온 게임의 문구
    const flavor = (
      file: string,
      idCol: string,
      table: string,
      idField: string
    ) => {
      const chosen = new Map<string, { order: number[]; text: CsvField[] }>()
      for (const v of each(file, [
        idCol,
        "version_group_id",
        "language_id",
        "flavor_text",
      ])) {
        const language = toInt(v[2])
        const col = nameColumnOf(language)
        if (col < 0) continue
        const vg = toInt(v[1])
        const gen = vgGen.get(vg) ?? 0
        const order = vgOrder.get(vg) ?? 0
        const key = `${toInt(v[0])},${gen}`
        let slot = chosen.get(key)
        if (!slot) {
          slot = { order: [0, 0, 0], text: [null, null, null] }
          chosen.set(key, slot)
        }
        const earlier = slot.order[col] === 0 || order < slot.order[col]
        const sameKana = order === slot.order[col] && language === 1
        if (earlier && !sameKana) {
          slot.order[col] = order
          slot.text[col] = v[3]
        }
      }
      const one = (text: CsvField, spaced: boolean): string | null => {
        if (text === null) return null
        const t = spaced ? text : halfWidth(text.replace(/[\n\f]/g, ""))
        return simplified(t)
      }
      for (const [key, slot] of chosen) {
        const [id, gen] = key.split(",").map(Number)
        insert(
          `INSERT INTO ${table} (${idField}, generation, text_ko, text_en, text_ja) VALUES (?,?,?,?,?)`,
          [
            id,
            gen,
            one(slot.text[0], true),
            one(slot.text[1], true),
            one(slot.text[2], false),
          ]
        )
      }
    }

    flavor("item_flavor_text", "item_id", "item_effects", "item_id")

    // moves (+ 옛 값 · 타입의 세대 구간)
    {
      const pastTypes = new Map<number, [number, number][]>()
      for (const v of each("move_changelog", [
        "move_id",
        "changed_in_version_group_id",
        "type_id",
        "power",
        "pp",
        "accuracy",
      ])) {
        const until = (vgGen.get(toInt(v[1])) ?? 0) - 1
        if (v[2]) {
          const list = pastTypes.get(toInt(v[0])) ?? []
          list.push([until, toInt(v[2])])
          pastTypes.set(toInt(v[0]), list)
        }
        into("move_changelog", [
          toInt(v[0]),
          until,
          intOrNull(v[2]),
          intOrNull(v[3]),
          intOrNull(v[4]),
          intOrNull(v[5]),
        ])
      }
      names = new Map()
      for (const [r, l, n] of each("move_names", [
        "move_id",
        "local_language_id",
        "name",
      ])) {
        setName(namesOf(names, toInt(r)), toInt(l), n)
      }
      for (const v of each("moves", [
        "id",
        "identifier",
        "generation_id",
        "type_id",
        "power",
        "pp",
        "accuracy",
        "damage_class_id",
      ])) {
        const id = toInt(v[0])
        const intro = toInt(v[2])
        into("moves", [
          id,
          v[1],
          intro,
          ...(names.get(id) ?? noNames()),
          intOrNull(v[3]),
          intOrNull(v[4]),
          intOrNull(v[5]),
          intOrNull(v[6]),
          intOrNull(v[7]),
        ])
        for (const r of toGenRanges(
          intro,
          pastTypes.get(id) ?? [],
          toInt(v[3])
        )) {
          if (r.value >= FIRST_NON_BATTLE_TYPE) continue
          into("move_types", [id, r.value, r.from, r.to])
        }
      }
    }

    flavor("move_flavor_text", "move_id", "move_effects", "move_id")

    // move meta
    {
      const targets = new Map<number, number>()
      for (const [id, target] of each("moves", ["id", "target_id"])) {
        targets.set(toInt(id), toInt(target))
      }
      const seen = new Set<number>()
      for (const v of each("move_meta", [
        "move_id",
        "meta_category_id",
        "meta_ailment_id",
        "healing",
      ])) {
        const id = toInt(v[0])
        seen.add(id)
        into("move_meta", [
          id,
          targets.get(id) ?? 0,
          toInt(v[1]),
          toInt(v[2]),
          toInt(v[3]),
        ])
      }
      for (const [id, target] of targets) {
        if (!seen.has(id)) into("move_meta", [id, target, 0, 0, 0])
      }
      for (const v of each("move_meta_stat_changes", [
        "move_id",
        "stat_id",
        "change",
      ])) {
        into("move_stat_changes", [toInt(v[0]), toInt(v[1]), toInt(v[2])])
      }
    }

    // machines — 아이템 · 세대마다 그 세대 첫 게임의 기술
    {
      const chosen = new Map<string, [number, number]>()
      for (const v of each("machines", [
        "item_id",
        "version_group_id",
        "move_id",
        "machine_number",
      ])) {
        const vg = toInt(v[1])
        into("machines", [vg, toInt(v[3]), toInt(v[0]), toInt(v[2])])
        const key = `${toInt(v[0])},${vgGen.get(vg) ?? 0}`
        const order = vgOrder.get(vg) ?? 0
        const known = chosen.get(key)
        if (!known || order < known[0]) chosen.set(key, [order, toInt(v[2])])
      }
      for (const [key, [, move]] of chosen) {
        const [item, gen] = key.split(",").map(Number)
        into("item_machines", [item, gen, move])
      }
    }

    // pokemon moves — 방법 1 레벨업 · 2 교배 · 3 가르침 · 4 기술머신만
    for (const v of each("pokemon_moves", [
      "pokemon_id",
      "version_group_id",
      "move_id",
      "pokemon_move_method_id",
      "level",
      "order",
    ])) {
      const method = toInt(v[3])
      if (method < 1 || method > 4) continue
      into("pokemon_moves", [
        toInt(v[0]),
        toInt(v[1]),
        toInt(v[2]),
        method,
        toInt(v[4]),
        toInt(v[5]),
      ])
    }

    // encounters — (포켓몬, 버전, 장소, 방법)마다 한 줄
    {
      names = new Map()
      for (const [r, l, n] of each("location_names", [
        "location_id",
        "local_language_id",
        "name",
      ])) {
        setName(namesOf(names, toInt(r)), toInt(l), n)
      }
      for (const v of each("locations", ["id", "identifier", "region_id"])) {
        const id = toInt(v[0])
        into("locations", [
          id,
          v[1],
          intOrNull(v[2]),
          ...(names.get(id) ?? noNames()),
        ])
      }
      for (const v of each("encounter_methods", ["id", "identifier"])) {
        into("encounter_methods", [toInt(v[0]), v[1]])
      }
      const areaLocation = new Map<number, number>()
      for (const [a, l] of each("location_areas", ["id", "location_id"])) {
        areaLocation.set(toInt(a), toInt(l))
      }
      const slots = new Map<number, [number, number]>()
      for (const [id, method, rarity] of each("encounter_slots", [
        "id",
        "encounter_method_id",
        "rarity",
      ])) {
        slots.set(toInt(id), [toInt(method), toInt(rarity)])
      }
      const summary = new Map<string, [number[], [number, number, number]]>()
      for (const v of each("encounters", [
        "pokemon_id",
        "version_id",
        "location_area_id",
        "encounter_slot_id",
        "min_level",
        "max_level",
      ])) {
        const [method, rarity] = slots.get(toInt(v[3])) ?? [0, 0]
        const k = [
          toInt(v[0]),
          toInt(v[1]),
          areaLocation.get(toInt(v[2])) ?? 0,
          method,
        ]
        const key = k.join(",")
        let s = summary.get(key)
        if (!s) {
          s = [k, [1000, 0, 0]]
          summary.set(key, s)
        }
        s[1][0] = Math.min(s[1][0], toInt(v[4]))
        s[1][1] = Math.max(s[1][1], toInt(v[5]))
        s[1][2] += rarity
      }
      const sorted = [...summary.values()].sort((a, b) => {
        for (let i = 0; i < 4; i++)
          if (a[0][i] !== b[0][i]) return a[0][i] - b[0][i]
        return 0
      })
      for (const [k, s] of sorted) into("encounters", [...k, ...s])
    }

    // evolutions
    for (const v of each("pokemon_evolution", [
      "evolved_species_id",
      "version_group_id",
      "evolution_trigger_id",
      "trigger_item_id",
      "minimum_level",
      "gender_id",
      "location_id",
      "held_item_id",
      "time_of_day",
      "known_move_id",
      "known_move_type_id",
      "minimum_happiness",
      "minimum_beauty",
      "minimum_affection",
      "relative_physical_stats",
      "party_species_id",
      "party_type_id",
      "trade_species_id",
      "needs_overworld_rain",
      "turn_upside_down",
    ])) {
      const gen = v[1] ? (vgGen.get(toInt(v[1])) ?? 1) : 1
      into("evolutions", [
        toInt(v[0]),
        gen,
        toInt(v[2]),
        ...v.slice(3, 8).map(intOrNull),
        v[8] ? v[8] : null,
        ...v.slice(9, 18).map(intOrNull),
        toInt(v[18]),
        toInt(v[19]),
      ])
    }

    // abilities (3세대부터) — 칸마다 세대 구간
    {
      names = new Map()
      for (const [r, l, n] of each("ability_names", [
        "ability_id",
        "local_language_id",
        "name",
      ])) {
        setName(namesOf(names, toInt(r)), toInt(l), n)
      }
      for (const v of each("abilities", [
        "id",
        "identifier",
        "generation_id",
        "is_main_series",
      ])) {
        if (toInt(v[3]) !== 1) continue
        const id = toInt(v[0])
        into("abilities", [
          id,
          v[1],
          toInt(v[2]),
          ...(names.get(id) ?? noNames()),
        ])
      }
      interface Slot {
        current: number | undefined
        past: [number, number][]
        hidden: boolean
      }
      const slots = new Map<string, Slot>()
      const slotOf = (p: number, s: number): Slot => {
        const key = `${p},${s}`
        let slot = slots.get(key)
        if (!slot) {
          slot = { current: undefined, past: [], hidden: false }
          slots.set(key, slot)
        }
        return slot
      }
      for (const [p, a, h, s] of each("pokemon_abilities", [
        "pokemon_id",
        "ability_id",
        "is_hidden",
        "slot",
      ])) {
        const slot = slotOf(toInt(p), toInt(s))
        slot.current = toInt(a)
        slot.hidden = toInt(h) !== 0
      }
      for (const [p, g, a, h, s] of each("pokemon_abilities_past", [
        "pokemon_id",
        "generation_id",
        "ability_id",
        "is_hidden",
        "slot",
      ])) {
        const slot = slotOf(toInt(p), toInt(s))
        slot.past.push([toInt(g), a ? toInt(a) : 0])
        slot.hidden = slot.hidden || toInt(h) !== 0
      }
      const keys = [...slots.keys()]
        .map((k) => k.split(",").map(Number) as [number, number])
        .sort((x, y) => x[0] - y[0] || x[1] - y[1])
      for (const [p, s] of keys) {
        const slot = slotOf(p, s)
        const first = Math.max(
          FIRST_ABILITY_GENERATION,
          pokemonIntro.get(p) ?? 1
        )
        for (const r of toGenRanges(first, slot.past, slot.current)) {
          if (r.value === 0) continue
          into("pokemon_abilities", [
            p,
            s,
            r.value,
            slot.hidden ? 1 : 0,
            r.from,
            r.to,
          ])
        }
      }
    }

    flavor("ability_flavor_text", "ability_id", "ability_effects", "ability_id")

    // natures
    names = new Map()
    for (const [r, l, n] of each("nature_names", [
      "nature_id",
      "local_language_id",
      "name",
    ])) {
      setName(namesOf(names, toInt(r)), toInt(l), n)
    }
    for (const v of each("natures", [
      "id",
      "identifier",
      "increased_stat_id",
      "decreased_stat_id",
      "game_index",
    ])) {
      const id = toInt(v[0])
      into("natures", [
        id,
        v[1],
        toInt(v[2]),
        toInt(v[3]),
        toInt(v[4]),
        ...(names.get(id) ?? noNames()),
      ])
    }

    into("meta", ["schema_version", String(SCHEMA_VERSION)])
    into("meta", ["source_commit", POKEAPI_COMMIT])
    into("meta", ["imported_at", isoSeconds(now)])

    for (const stmt of statements.values()) stmt.free()
    db.run("COMMIT")
  } catch (error) {
    for (const stmt of statements.values()) stmt.free()
    db.run("ROLLBACK")
    throw error
  }
}
