import initSqlJs from "sql.js"
import { beforeAll, describe, expect, it } from "vitest"

import { importCsv } from "../../data/pipeline/importer.ts"
import { bindDatabase } from "../../data/repository/index.ts"
import { memberTypes, versionName } from "../../pages/home/homeData.ts"
import { buildCorpus, filterCorpus } from "./searchCorpus.ts"

// 데이터 층 테스트가 쓰는 시드 CSV(이상해씨 · 삐삐 · 픽시 · 식스테일 · 한카리아스 …)
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

describe("검색 대상 (시드 DB)", () => {
  it("그 세대에 있는 포켓몬만, 세 언어 · 번호로 찾는다", () => {
    const g4 = buildCorpus(4)
    expect(g4.pokemon.some((p) => p.id === 445)).toBe(true)
    const hit = filterCorpus(g4, "한카").pokemon.rows
    expect(hit.map((p) => p.id)).toEqual([445])
    expect(hit[0].types).toEqual(["dragon", "ground"])
    expect(filterCorpus(g4, "garchomp").pokemon.total).toBe(1)
    expect(buildCorpus(3).pokemon.some((p) => p.id === 445)).toBe(false)
  })

  it("홈: 멤버 타입은 그 세대 당시 값(삐삐는 6세대 전엔 노말)", () => {
    expect(memberTypes([35], 4, true).get(35)).toEqual(["normal"])
    expect(memberTypes([35], 4, false).get(35)).toEqual(["fairy"])
    expect(memberTypes([], 4, true).size).toBe(0)
  })

  it("홈: 모르는 게임 키는 이름이 없다", () => {
    expect(versionName(4, "no-such-game")).toBeNull()
  })
})
