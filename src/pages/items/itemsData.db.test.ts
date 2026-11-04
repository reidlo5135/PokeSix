import initSqlJs from "sql.js"
import { beforeAll, describe, expect, it } from "vitest"

import { importCsv } from "../../data/pipeline/importer.ts"
import {
  bindDatabase,
  itemsForGeneration,
} from "../../data/repository/index.ts"
import { ALL_GROUP, groupFilter, ITEM_STYLE } from "./itemGroups.ts"
import { itemEvolutions, pokeapiLocationNames } from "./itemsData.ts"
import { visibleItems, type ItemQuery } from "./itemView.ts"

// 데이터 층 테스트가 쓰는 시드 CSV
const CSV = import.meta.glob<string>("/tests/fixtures/pokeapi-csv/*.csv", {
  query: "?raw",
  import: "default",
  eager: true,
})

beforeAll(async () => {
  const SQL = await initSqlJs()
  const db = new SQL.Database()
  importCsv(db, (name) => {
    const text = CSV[`/tests/fixtures/pokeapi-csv/${name}.csv`]
    if (text === undefined) throw new Error(`cannot open ${name}.csv`)
    return text
  })
  bindDatabase(() => db)
})

describe("아이템 화면 조회 (시드 DB)", () => {
  it("진화 줄에 성별 · 진화 방법을 붙인다 (달의돌 → 픽시)", () => {
    const [moon] = itemEvolutions(81, 4)
    expect(moon.to.en).toBe("Clefable")
    expect(moon.from.en).toBe("Clefairy")
    expect(moon.held).toBe(false)
    expect(moon.gender).toBe(0)
    expect(moon.trigger).toBe(3)
    expect(moon.fromPokemonId).toBe(35)
    expect(itemEvolutions(999, 4)).toEqual([])
  })

  it("PokéAPI 장소 이름", () => {
    expect(pokeapiLocationNames().get("mt-coronet")?.en).toBe("Mt. Coronet")
  })

  it("Qt 거르기 테스트: 진화 3줄 → 세대만 2줄 → 검색 '회복' 2줄", () => {
    const rows = itemsForGeneration(4)
    expect(rows).toHaveLength(106)
    const base: ItemQuery = {
      generation: 4,
      onlyThisGeneration: false,
      group: groupFilter(ITEM_STYLE, "evolution"),
      allowed: new Set(),
      search: "",
      sort: "name",
      language: "ko",
    }
    expect(visibleItems(rows, base).map((r) => r.identifier)).toEqual([
      "dawn-stone",
      "fire-stone",
      "ice-stone",
    ])
    expect(
      visibleItems(rows, { ...base, onlyThisGeneration: true }).map(
        (r) => r.identifier
      )
    ).toEqual(["dawn-stone", "fire-stone"])
    const notMachines = visibleItems(rows, {
      ...base,
      group: (category, pocket) =>
        groupFilter(ITEM_STYLE, ALL_GROUP)(category, pocket) &&
        pocket !== "machines",
      search: "회복",
    })
    expect(notMachines.map((r) => r.identifier).sort()).toEqual([
      "leftovers",
      "potion",
    ])
  })
})
