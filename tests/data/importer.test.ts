import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import initSqlJs, { type Database } from "sql.js"
import { beforeAll, describe, expect, it } from "vitest"

import { importCsv } from "../../src/data/pipeline/importer.ts"
import { POKEAPI_COMMIT } from "../../src/data/pipeline/manifest.ts"

const FIXTURES = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "pokeapi-csv"
)

let db: Database

const one = (sql: string, params: (string | number)[] = []): unknown => {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const value = stmt.step() ? stmt.get()[0] : undefined
  stmt.free()
  return value
}

const multiplier = (atk: string, def: string, gen: number) =>
  one(
    `SELECT multiplier FROM type_chart c JOIN types a ON a.id = c.atk_type JOIN types d ON d.id = c.def_type
     WHERE a.identifier = ? AND d.identifier = ? AND gen_from <= ? AND (gen_to IS NULL OR gen_to >= ?)`,
    [atk, def, gen, gen]
  )

const typesOf = (pokemon: number, gen: number) =>
  db.exec(
    `SELECT group_concat(t.identifier) FROM (SELECT type_id FROM pokemon_types
       WHERE pokemon_id = ${pokemon} AND gen_from <= ${gen} AND (gen_to IS NULL OR gen_to >= ${gen})
       ORDER BY slot) p JOIN types t ON t.id = p.type_id`
  )[0]?.values[0][0] ?? null

const stat = (pokemon: number, statId: number, gen: number) =>
  one(
    `SELECT value FROM pokemon_stats WHERE pokemon_id = ? AND stat_id = ? AND gen_from <= ? AND (gen_to IS NULL OR gen_to >= ?)`,
    [pokemon, statId, gen, gen]
  )

beforeAll(async () => {
  const SQL = await initSqlJs()
  db = new SQL.Database()
  importCsv(db, (name) =>
    readFileSync(path.join(FIXTURES, `${name}.csv`), "utf8")
  )
})

describe("importCsv (fixtures)", () => {
  it("타입 상성의 세대 구간", () => {
    expect(multiplier("ghost", "psychic", 1)).toBe(0)
    expect(multiplier("ghost", "psychic", 2)).toBe(2)
    expect(multiplier("ghost", "psychic", 9)).toBe(2)
    expect(multiplier("ghost", "steel", 5)).toBe(0.5)
    expect(multiplier("ghost", "steel", 6)).toBe(1)
    expect(multiplier("dark", "steel", 5)).toBe(0.5)
    expect(multiplier("dark", "steel", 6)).toBe(1)
    expect(multiplier("ghost", "steel", 1)).toBeUndefined()
  })
  it("포켓몬 타입의 세대 구간 · 폼의 첫 세대", () => {
    expect(typesOf(35, 5)).toBe("normal")
    expect(typesOf(35, 6)).toBe("fairy")
    expect(typesOf(445, 4)).toBe("dragon,ground")
    expect(one("SELECT intro_gen FROM pokemon WHERE id = 37")).toBe(1)
    expect(one("SELECT intro_gen FROM pokemon WHERE id = 10103")).toBe(7)
    expect(typesOf(10103, 6)).toBeNull()
    expect(typesOf(10103, 7)).toBe("ice")
  })
  it("1세대 특수 · 2세대부터 특수공격", () => {
    expect(stat(1, 9, 1)).toBe(65)
    expect(stat(1, 9, 2)).toBeUndefined()
    expect(stat(1, 4, 1)).toBeUndefined()
    expect(stat(1, 4, 2)).toBe(65)
  })
  it("이름 · 진화 전", () => {
    expect(one("SELECT name_ko FROM species WHERE id = 35")).toBe("삐삐")
    expect(one("SELECT name_en FROM species WHERE id = 35")).toBe("Clefairy")
    expect(one("SELECT name_ko FROM types WHERE id = 18")).toBe("페어리")
    expect(one("SELECT evolves_from FROM species WHERE id = 1")).toBeNull()
    expect(one("SELECT evolves_from FROM species WHERE id = 36")).toBe(35)
  })
  it("meta", () => {
    expect(one("SELECT value FROM meta WHERE key = 'source_commit'")).toBe(
      POKEAPI_COMMIT
    )
    expect(one("SELECT value FROM meta WHERE key = 'schema_version'")).toBe(
      "12"
    )
    expect(one("SELECT value FROM meta WHERE key = 'imported_at'")).toMatch(
      /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/
    )
  })
  it("CSV가 없으면 throw하고 아무것도 남기지 않는다", async () => {
    const SQL = await initSqlJs()
    const empty = new SQL.Database()
    expect(() =>
      importCsv(empty, () => {
        throw new Error("cannot open generations.csv")
      })
    ).toThrow()
    expect(empty.exec("SELECT name FROM sqlite_master")).toEqual([])
  })
})
