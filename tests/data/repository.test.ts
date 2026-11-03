import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import initSqlJs, { type Database } from "sql.js"
import { beforeAll, describe, expect, it } from "vitest"

import {
  initialItemFilter,
  initialSpeciesFilter,
  viewItems,
  viewSpecies,
  clearSpeciesFilters,
  type SpeciesFilter,
} from "../../src/data/models/index.ts"
import { importCsv } from "../../src/data/pipeline/importer.ts"
import {
  bindDatabase,
  defaultMoveset,
  defaultPokemonId,
  dexesForGeneration,
  emptyStats,
  evolutionsWithItem,
  evolvesFrom,
  existsIn,
  gameSpecies,
  gamesForGeneration,
  hiddenMachineMoves,
  introGeneration,
  isNeutral,
  isValidDetail,
  itemIdForGameIndex,
  itemsForGeneration,
  machineLabel,
  machineLearners,
  moves,
  natureIdForGameIndex,
  natures,
  otherVersionSpecies,
  pickNearest,
  pokemonDetail,
  reachableMoves,
  repositoryError,
  representativeVersionGroup,
  resolveVersion,
  speciesForDex,
  speciesForGeneration,
  typeChart,
  typeChartAt,
  versionGroupOf,
  type ItemRow,
  type LevelMove,
  type SpeciesRow,
} from "../../src/data/repository/index.ts"
import {
  languageFromCode,
  methodName,
  parseNameBook,
  placeName,
  supplement,
  text,
  type LocalizedText,
} from "../../src/data/text/index.ts"

const FIXTURES = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "pokeapi-csv"
)

let db: Database
let SQL: Awaited<ReturnType<typeof initSqlJs>>

// 시드 CSV(이상해씨 · 삐삐 · 픽시 · 식스테일 · 한카리아스 + 알로라 식스테일)로 DB를 한 번 만든다
beforeAll(async () => {
  SQL = await initSqlJs()
  db = new SQL.Database()
  importCsv(db, (name) =>
    readFileSync(path.join(FIXTURES, `${name}.csv`), "utf8")
  )
  bindDatabase(() => db)
})

const find = (rows: SpeciesRow[], speciesId: number) =>
  rows.find((r) => r.speciesId === speciesId)
const findItem = (rows: ItemRow[], identifier: string) =>
  rows.find((r) => r.identifier === identifier)
const lt = (ko: string, en: string, ja: string): LocalizedText => ({
  ko,
  en,
  ja,
})

describe("LocalizedText", () => {
  it("언어 순서대로 대신 보인다", () => {
    expect(text(lt("", "Orange Mail", ""), "ko")).toBe("Orange Mail")
    expect(text(lt("마스터볼", "", "マスターボール"), "en")).toBe("마스터볼")
    expect(text(lt("마스터볼", "", "マスターボール"), "ja")).toBe(
      "マスターボール"
    )
    expect(text(lt("", "", "ボール"), "en")).toBe("ボール")
    expect(text(lt("", "", ""), "ko")).toBe("")
    expect(text(lt("한", "En", ""), "ja")).toBe("En") // 일본어 → 영어 → 한국어
  })
  it("languageFromCode는 정확히 일치만", () => {
    expect(languageFromCode("ja")).toBe("ja")
    expect(languageFromCode("xx")).toBe("ko")
    expect(languageFromCode("ko-KR", "en")).toBe("en")
  })
})

describe("namebook", () => {
  it("빈 칸만 채우고 fix 항목은 덮는다", () => {
    expect(
      supplement("versions", "champions", lt("", "Champions", "")).ko
    ).toBe("Champions")
    expect(
      supplement("versions", "the-teal-mask-scarlet", lt("", "x", "")).ko
    ).toBe("스칼렛: 벽록의 가면")
    expect(
      supplement(
        "moves",
        "collision-course",
        lt("잘못", "Collision Course", "")
      ).ko
    ).toBe("액셀브레이크")
    const kept = lt("이미 있음", "", "")
    expect(supplement("items", "auroraticket", kept)).toEqual(kept)
    expect(supplement("items", "no-such-item", kept)).toBe(kept)
  })
  it("모양이 틀린 칸은 버린다", () => {
    const book = parseNameBook({
      items: { a: "가", b: 3, c: { en: "C", fix: true } },
      moves: [],
    })
    expect(book.items.get("a")?.text.ko).toBe("가")
    expect(book.items.has("b")).toBe(false)
    expect(book.items.get("c")).toEqual({ text: lt("", "C", ""), fix: true })
    expect(book.moves.size).toBe(0)
  })
})

describe("장소 · 출현 방법 이름", () => {
  it("도로 · 수로 번호 규칙", () => {
    expect(placeName("sinnoh-route-201", lt("", "Route 201", ""), "ko")).toBe(
      "201번 도로"
    )
    expect(placeName("sinnoh-sea-route-220", lt("", "", ""), "ja")).toBe(
      "220ばんすいどう"
    )
    expect(placeName("sinnoh-route-201", lt("", "Route 201", ""), "en")).toBe(
      "Route 201"
    )
  })
  it("사전 · PokéAPI 이름이 없으면 identifier를 읽기 좋게", () => {
    expect(placeName("no-such-place-xyz", lt("", "", ""), "ko")).toBe(
      "No Such Place Xyz"
    )
    expect(placeName("no-such-place-xyz", lt("", "Somewhere", ""), "ko")).toBe(
      "Somewhere"
    )
  })
  it("출현 방법", () => {
    expect(methodName("walk", "ko")).toBe("풀숲 · 동굴")
    expect(methodName("super-rod", "en")).toBe("Super Rod")
    expect(methodName("bubbling-spots", "ko")).toBe("bubbling spots")
  })
})

describe("종 목록", () => {
  it("세대까지 나온 종", () => {
    expect(speciesForGeneration(4)).toHaveLength(5)
    expect(speciesForGeneration(3)).toHaveLength(4) // 한카리아스(4세대)는 빠진다
  })
  it("타입 · 종족값은 세대를 따른다", () => {
    expect(find(speciesForGeneration(5), 35)?.types).toEqual(["normal"])
    expect(find(speciesForGeneration(6), 35)?.types).toEqual(["fairy"])
    expect(find(speciesForGeneration(6), 445)?.types).toEqual([
      "dragon",
      "ground",
    ])
    expect(find(speciesForGeneration(6), 445)?.total).toBe(600)
  })
  it("1세대 특수는 두 칸에 같은 값, 합계는 한 번", () => {
    const bulbasaur = find(speciesForGeneration(1), 1)
    expect(bulbasaur?.stats[3]).toBe(65)
    expect(bulbasaur?.stats[4]).toBe(65)
    expect(bulbasaur?.total).toBe(45 + 49 + 49 + 65 + 45)
  })
  it("전설 · 최종 진화", () => {
    const gen4 = speciesForGeneration(4)
    expect(find(gen4, 35)?.finalEvolution).toBe(false)
    expect(find(gen4, 36)?.finalEvolution).toBe(true)
    expect(find(gen4, 445)?.finalEvolution).toBe(true)
    expect(find(gen4, 445)?.legendary).toBe(false)
  })
  it("지방 도감은 제 번호", () => {
    const sinnoh = speciesForDex(5, 4)
    expect(sinnoh.map((r) => r.dexNumber)).toEqual([100, 101, 111])
    expect(find(sinnoh, 445)?.types).toEqual(["dragon", "ground"])
    expect(find(sinnoh, 445)?.total).toBe(600)
    expect(speciesForDex(7, 4).map((r) => r.dexNumber)).toEqual([
      41, 42, 127, 231,
    ])
    expect(find(speciesForGeneration(4), 445)?.dexNumber).toBe(445)
  })
})

describe("도감 · 게임 · 버전", () => {
  it("세대의 지방 도감", () => {
    const dexes = dexesForGeneration(4)
    expect(dexes.map((d) => d.pokedexId)).toEqual([5, 6, 7])
    expect(dexes[0].region).toMatchObject({ ko: "신오", en: "Sinnoh" })
    expect(dexes[2].region.ko).toBe("성도")
    expect(dexes[0].identifier).toBe("original-sinnoh")
    expect(dexes[0].versions).toEqual(["diamond", "pearl"])
    expect(dexes[0].versionNames[0].en).toBe("Diamond")
    expect(dexes[0].versionNames[1].ko).toBe("펄기아")
    expect(dexes[2].versionNames[0].ko).toBe("하트골드")
    expect(dexes[0].versionGroups).toEqual(["diamond-pearl"])
    expect(dexesForGeneration(8).some((d) => d.pokedexId === 5)).toBe(true)
  })
  it("세대의 게임 묶음", () => {
    const games = gamesForGeneration(4)
    expect(games.map((g) => g.versionGroup)).toEqual([
      "diamond-pearl",
      "platinum",
      "heartgold-soulsilver",
    ])
    expect(versionGroupOf(games, "soulsilver")).toBe("heartgold-soulsilver")
    expect(versionGroupOf(games, "black")).toBe("")
  })
  it("버전 정하기", () => {
    expect(resolveVersion(4, "soulsilver")).toBe("soulsilver")
    expect(resolveVersion(4, "heartgold-soulsilver")).toBe("heartgold")
    expect(resolveVersion(4, "")).toBe("platinum")
    expect(resolveVersion(4, "black")).toBe("platinum")
  })
  it("다른 버전 한정 · 게임에서 만나는 종", () => {
    expect(otherVersionSpecies("heartgold")).toEqual(new Set([37]))
    expect(otherVersionSpecies("soulsilver").size).toBe(0)
    expect(otherVersionSpecies("platinum").size).toBe(0)
    const johto = gameSpecies("heartgold-soulsilver")
    expect(johto.has(1)).toBe(true)
    expect(johto.has(37)).toBe(true)
    expect(johto.has(445)).toBe(false)
    expect(gameSpecies("platinum").has(445)).toBe(true)
  })
  it("캐시된 집합을 고쳐도 다음 결과는 그대로", () => {
    otherVersionSpecies("heartgold").clear()
    expect(otherVersionSpecies("heartgold")).toEqual(new Set([37]))
  })
})

describe("아이템", () => {
  it("세대별 존재 비트", () => {
    const items = itemsForGeneration(4)
    expect(items).toHaveLength(106)
    const dawn = findItem(items, "dawn-stone")
    expect(dawn?.name.ko).toBe("각성의돌")
    expect(dawn?.category).toBe("evolution")
    expect(dawn && existsIn(dawn, 3)).toBe(false)
    expect(dawn && existsIn(dawn, 4)).toBe(true)
    expect(dawn && existsIn(dawn, 9)).toBe(true)
    expect(dawn && introGeneration(dawn)).toBe(4)
    const ice = findItem(items, "ice-stone")
    expect(ice && existsIn(ice, 4)).toBe(false)
    expect(ice && introGeneration(ice)).toBe(7)
    const leftovers = findItem(items, "leftovers")
    expect(leftovers && introGeneration(leftovers)).toBe(2)
  })
  it("기술머신 내용은 게임을 따른다", () => {
    const tm01 = (vg: string) =>
      findItem(itemsForGeneration(7, vg), "tm01")?.machineMove.ko
    expect(tm01("sun-moon")).toBe("분발")
    expect(tm01("lets-go-pikachu-lets-go-eevee")).toBe("박치기")
    for (const row of itemsForGeneration(7, "lets-go-pikachu-lets-go-eevee"))
      if (row.pocket === "machines")
        expect(row.machineMove.ko || row.machineMove.en).not.toBe("")
    expect(findItem(itemsForGeneration(7), "tm01")?.machineMove.ko).toBe("분발")
  })
  it("기술머신에 담긴 기술은 세대를 따른다", () => {
    const tm01 = (g: number) => {
      const row = findItem(itemsForGeneration(g), "tm01")
      return [row?.machineMove.ko, row?.machineType]
    }
    expect(tm01(1)).toEqual(["메가톤펀치", "normal"])
    expect(tm01(4)).toEqual(["힘껏펀치", "fighting"])
    expect(tm01(5)).toEqual(["손톱갈기", "dark"])
    expect(tm01(7)).toEqual(["분발", "normal"])
    const potion = findItem(itemsForGeneration(4), "potion")
    expect(potion?.machineMove).toEqual(lt("", "", ""))
    expect(potion?.cost).toBe(200)
  })
  it("효과 문구는 세대 · 언어마다 가까운 것", () => {
    const tm01 = (g: number) => findItem(itemsForGeneration(g), "tm01")?.effect
    expect(tm01(6)?.ko).toBe(
      "손톱을 갈아 날카롭게 한다. 자신의 공격과 명중률을 올린다."
    )
    expect(tm01(4)?.ko).toBe(
      "정신력을 높여 펀치를 날린다. 기술을 쓰기 전에 공격을 받으면 실패한다."
    )
    expect(tm01(9)?.ko).not.toBe("")
    expect(findItem(itemsForGeneration(4), "dawn-stone")?.effect.ko).toBe(
      "어느 특정 포켓몬을 진화시키는 이상한 돌. 눈동자처럼 아름답다."
    )
    const tm = findItem(itemsForGeneration(4), "tm01")
    expect(tm?.effect.en).not.toBe("")
    expect(tm?.machineMove.en).toBe("Focus Punch")
  })
  it("진화 아이템", () => {
    const moon = evolutionsWithItem(81, 4)
    expect(moon).toHaveLength(1)
    expect(moon[0]).toMatchObject({
      held: false,
      speciesId: 36,
      fromPokemonId: 35,
      toPokemonId: 36,
      onlyVersions: [],
    })
    expect(moon[0].from.en).toBe("Clefairy")
    expect(moon[0].to.en).toBe("Clefable")
    expect(evolutionsWithItem(999, 4)).toEqual([])
  })
  it("기술머신으로 배우는 종", () => {
    const species = (item: string, vg: string) =>
      machineLearners(item, vg).map((r) => r.speciesId)
    expect(species("tm26", "platinum")).toEqual([445])
    expect(species("tm06", "platinum")).toEqual([1, 35, 36, 37, 445])
    expect(species("tm26", "black-white")).toEqual([])
    expect(species("fire-stone", "platinum")).toEqual([])
  })
  it("비전머신 목록", () => {
    const hms = hiddenMachineMoves("platinum", 4)
    expect(hms).toHaveLength(8)
    hms.forEach((m, i) => {
      expect(m.hiddenMachine).toBe(true)
      expect(m.machineNumber).toBe(i + 1)
    })
    expect(hms[2].machineItem).toBe("hm03")
    expect(hms[2].moveId).toBe(57)
    expect(hms[2].name.ko).not.toBe("")
    expect(hiddenMachineMoves("black-white", 5)).toEqual([])
  })
})

describe("포켓몬 상세", () => {
  it("대표 게임 기준", () => {
    expect(representativeVersionGroup(4)).toBe("platinum")
    expect(representativeVersionGroup(0)).toBe("")
    const bulbasaur = pokemonDetail(1, 4)
    expect(isValidDetail(bulbasaur)).toBe(true)
    expect(bulbasaur.genus.ko).toBe("씨앗포켓몬")
    expect(bulbasaur.total).toBe(318)
    expect(bulbasaur.levelMoves).toHaveLength(14)
    expect(bulbasaur.levelMoves[0].level).toBe(1)
    expect(bulbasaur.levelMoves[0].name.ko).toBe("몸통박치기")
    expect(bulbasaur.levelMoves[0].power).toBe(35) // 4세대 위력(지금은 40)
    expect(bulbasaur.machineMoves).toHaveLength(28)
    expect(bulbasaur.machineMoves[0].machineNumber).toBe(6)
    expect(bulbasaur.machineMoves.at(-1)?.hiddenMachine).toBe(true)
    expect(bulbasaur.machineMoves.at(-1)?.machineNumber).toBe(6)
    expect(bulbasaur.encounters[0]).toMatchObject({
      location: "pallet-town",
      method: "gift",
    })
    const vineWhip = bulbasaur.levelMoves.find((m) => m.name.en === "Vine Whip")
    expect(vineWhip?.damageClass).toBe(2)
  })
  it("없는 포켓몬은 빈 상세, 그 세대에 없으면 types가 빈다", () => {
    expect(isValidDetail(pokemonDetail(99999, 4))).toBe(false)
    const garchomp = pokemonDetail(445, 3)
    expect(isValidDetail(garchomp)).toBe(true)
    expect(garchomp.types).toEqual([])
  })
  it("고른 게임 기준", () => {
    const dp = pokemonDetail(1, 4, "diamond-pearl")
    expect(dp.versionGroup).toBe("diamond-pearl")
    expect(dp.groupVersions).toEqual(["diamond", "pearl"])
    expect(dp.levelMoves.length).toBeGreaterThan(0)
    expect(pokemonDetail(1, 4, "sword-shield").versionGroup).toBe("platinum")
  })
  it("진화 트리 · 하트비늘", () => {
    const clefable = pokemonDetail(36, 4)
    expect(clefable.evolution.map((s) => [s.speciesId, s.depth])).toEqual([
      [35, 0],
      [36, 1],
    ])
    expect(clefable.evolution[1].conditions[0].trigger).toBe(3)
    for (const move of clefable.levelMoves)
      expect(move.needsReminder).toBe(false)
    for (const move of pokemonDetail(1, 4).levelMoves)
      expect(move.needsReminder).toBe(false)
    expect(pokemonDetail(445, 4).evolution).toEqual([])
  })
  it("하트비늘은 얻는 레벨을 따른다", () => {
    const clefairy = pokemonDetail(35, 4, "diamond-pearl")
    expect(clefairy.earliestLevel).toBe(16)
    for (const move of clefairy.levelMoves)
      expect([move.moveId, move.needsReminder]).toEqual([
        move.moveId,
        [1, 45, 227].includes(move.moveId),
      ])
    const clefable = pokemonDetail(36, 4, "diamond-pearl")
    expect(clefable.earliestLevel).toBe(16)
    expect(clefable.levelMoves.length).toBeGreaterThan(0)
    for (const move of clefable.levelMoves)
      expect(move.needsReminder).toBe(false)
  })
  it("진화 전 단계의 자력기", () => {
    const clefable = pokemonDetail(36, 4)
    expect(clefable.levelMoves).toHaveLength(4)
    expect(clefable.inheritedMoves).toHaveLength(13)
    const levels = clefable.inheritedMoves.map((m) => m.level)
    expect(levels).toEqual([...levels].sort((a, b) => a - b))
    const meteorMash = clefable.inheritedMoves.find((m) => m.moveId === 309)
    expect(meteorMash).toMatchObject({ level: 43, fromPokemonId: 35 })
    expect(meteorMash?.name.en).toBe("Meteor Mash")
    expect(meteorMash?.fromName.ko).toBe("삐삐")
    expect(clefable.inheritedMoves.some((m) => m.moveId === 47)).toBe(false)
    expect(pokemonDetail(445, 4).inheritedMoves).toEqual([])
  })
  it("알 기술은 사슬 뿌리에서", () => {
    expect(pokemonDetail(35, 4).eggMoves.some((m) => m.moveId === 7)).toBe(true)
    const clefable = pokemonDetail(36, 4)
    expect(clefable.eggMoves.map((m) => m.moveId)).toEqual([7])
    expect(clefable.eggMoves[0].name.en).not.toBe("")
  })
  it("특성은 세대를 따른다", () => {
    const names = (g: number) =>
      pokemonDetail(36, g).abilities.map(
        (a) => (a.hidden ? "*" : "") + a.name.en
      )
    expect(names(2)).toEqual([])
    expect(names(3)).toEqual(["Cute Charm"])
    expect(names(4)).toEqual(["Cute Charm", "Magic Guard"])
    expect(names(5)).toHaveLength(3)
    expect(names(5).at(-1)?.startsWith("*")).toBe(true)
    expect(pokemonDetail(36, 3).abilities[0].effect.ko).not.toBe("")
  })
  it("캐시된 상세를 고쳐도 다음 결과는 그대로", () => {
    const first = pokemonDetail(1, 4)
    first.levelMoves.length = 0
    first.name.ko = "바뀜"
    const again = pokemonDetail(1, 4)
    expect(again.levelMoves).toHaveLength(14)
    expect(again.name.ko).toBe("이상해씨")
  })
})

describe("기술 · 상성 · 성격 · 번호 변환", () => {
  it("3세대까지는 타입이 물리 · 특수를 정한다", () => {
    const classes = (g: number) =>
      moves([7, 200, 53], g).map((m) => m.damageClass)
    expect(classes(3)).toEqual([3, 3, 3])
    expect(classes(4)).toEqual([2, 2, 3])
  })
  it("기술 효과 뼈대", () => {
    const list = moves([14, 86, 174, 74], 4)
    expect(list).toHaveLength(4)
    expect(list[0].identifier).toBe("swords-dance")
    expect(list[0].target).toBe(7)
    expect(list[0].statChanges).toEqual([[2, 2]])
    expect(list[1].ailment).toBe(1)
    expect(list[1].statChanges).toEqual([])
    expect(list[2].statChanges).toEqual([])
    expect(list[3].statChanges).toEqual([
      [2, 1],
      [4, 1],
    ])
    expect(list[0].effect.ko).not.toBe("")
    expect(moves([], 4)).toEqual([])
    expect(moves([999999, 14, 14], 4).map((m) => m.moveId)).toEqual([14, 14])
  })
  it("타입 상성은 세대를 따른다", () => {
    const at = (g: number, a: string, d: string) =>
      typeChartAt(typeChart(g), a, d)
    expect(at(4, "ghost", "steel")).toBe(0.5)
    expect(at(6, "ghost", "steel")).toBe(1)
    expect(typeChart(1).types).toHaveLength(15)
    expect(at(1, "ghost", "psychic")).toBe(0)
    expect(at(2, "ghost", "psychic")).toBe(2)
    expect(at(1, "bug", "poison")).toBe(2)
    expect(at(2, "bug", "poison")).toBe(0.5)
    expect(at(1, "poison", "bug")).toBe(2)
    expect(at(2, "poison", "bug")).toBe(1)
    expect(at(1, "ice", "fire")).toBe(1)
    expect(at(2, "ice", "fire")).toBe(0.5)
    expect(at(5, "dark", "steel")).toBe(0.5)
    expect(at(6, "dark", "steel")).toBe(1)
    expect(typeChart(2).types).toHaveLength(17)
    expect(typeChart(5).types).toHaveLength(17)
    expect(typeChart(6).types).toHaveLength(18)
    expect(typeChart(9).types).toHaveLength(18) // stellar는 넣지 않는다
    expect(at(6, "dragon", "fairy")).toBe(0)
  })
  it("성격", () => {
    const list = natures()
    expect(list).toHaveLength(25)
    expect(list.filter(isNeutral)).toHaveLength(5)
    expect(list.find((n) => n.name.en === "Timid")).toMatchObject({
      increasedStat: 6,
      decreasedStat: 2,
      name: { ko: "겁쟁이" },
    })
  })
  it("세이브 번호 → DB id", () => {
    expect(natureIdForGameIndex(0)).toBe(1)
    expect(natureIdForGameIndex(4)).toBe(17)
    expect(natureIdForGameIndex(99)).toBe(0)
    expect(itemIdForGameIndex(4, 234)).toBe(211)
    expect(itemIdForGameIndex(4, 1)).toBe(1)
    expect(itemIdForGameIndex(4, 999999)).toBe(0)
    expect(defaultPokemonId(445)).toBe(445)
    expect(defaultPokemonId(35)).toBe(35)
    expect(defaultPokemonId(9999)).toBe(0)
  })
  it("진화 전 종", () => {
    const parents = evolvesFrom()
    expect(parents.get(36)).toBe(35)
    expect(parents.has(1)).toBe(false)
  })
})

describe("DB 열기 계약", () => {
  it("스키마 버전이 다른 DB는 읽지 않는다 — 새 DB로 바꾸면 다시 읽는다", () => {
    const old = new SQL.Database(db.export())
    old.run("UPDATE meta SET value = '1' WHERE key = 'schema_version'")
    bindDatabase(() => old)
    expect(speciesForGeneration(4)).toEqual([])
    expect(repositoryError()).not.toBe("")
    bindDatabase(() => db)
    expect(speciesForGeneration(4)).toHaveLength(5)
    old.close()
  })
})

describe("순수 규칙", () => {
  it("pickNearest: g 이하 최신, 없으면 이후 최초, 언어마다 따로", () => {
    const rows = [
      { generation: 3, ko: null, en: "e3", ja: null },
      { generation: 4, ko: null, en: "e4", ja: "j4" },
      { generation: 6, ko: "k6", en: "e6", ja: "j6" },
      { generation: 8, ko: "k8", en: "", ja: "j8" },
    ]
    expect(pickNearest(rows, 4)).toEqual(lt("k6", "e4", "j4"))
    expect(pickNearest(rows, 9)).toEqual(lt("k8", "e6", "j8"))
    expect(pickNearest(rows, 1)).toEqual(lt("k6", "e3", "j4"))
    expect(pickNearest([], 4)).toEqual(lt("", "", ""))
  })
  it("기술머신 라벨", () => {
    expect(machineLabel("tm06", 6)).toBe("TM06")
    expect(machineLabel("hm06", 6)).toBe("HM06")
    expect(machineLabel("tr12", 112)).toBe("TR12")
    expect(machineLabel("tm00", 0)).toBe("TM00")
    expect(machineLabel("hm01", 93)).toBe("TM93") // BDSP
    expect(machineLabel("tm229", 229)).toBe("TM229")
  })
  it("defaultMoveset", () => {
    const pteranodon: LevelMove[] = [
      { move: 46, level: 9, order: 0 },
      { move: 423, level: 1, order: 1 },
      { move: 424, level: 1, order: 2 },
      { move: 422, level: 1, order: 3 },
      { move: 17, level: 1, order: 4 },
      { move: 48, level: 1, order: 5 },
      { move: 44, level: 1, order: 6 },
      { move: 97, level: 17, order: 0 },
      { move: 184, level: 1, order: 7 },
      { move: 246, level: 25, order: 0 },
    ]
    expect(defaultMoveset(pteranodon, 20)).toEqual([44, 184, 46, 97])
    expect(defaultMoveset(pteranodon, 1)).toEqual([17, 48, 44, 184])
    expect(defaultMoveset([], 50)).toEqual([])
    const lm = (move: number, level: number): LevelMove => ({
      move,
      level,
      order: 0,
    })
    expect(
      defaultMoveset([lm(1, 1), lm(2, 5), lm(1, 9), lm(3, 12)], 15)
    ).toEqual([1, 2, 3])

    const fossil = reachableMoves([
      { learnset: pteranodon, caughtLevel: 20, evolveLevel: 0 },
    ])
    expect(fossil.obtainable).toBe(true)
    expect(fossil.earliestLevel).toBe(20)
    for (const m of [44, 184, 46, 97, 246])
      expect(fossil.moves.has(m)).toBe(true)
    for (const m of [423, 424, 422, 17, 48])
      expect(fossil.moves.has(m)).toBe(false)
  })
  it("reachableMoves", () => {
    const lm = (move: number, level: number): LevelMove => ({
      move,
      level,
      order: 0,
    })
    const gyarados = reachableMoves([
      {
        learnset: [lm(150, 1), lm(33, 15), lm(175, 30)],
        caughtLevel: 5,
        evolveLevel: 0,
      },
      { learnset: [lm(37, 1), lm(44, 20), lm(82, 23)], evolveLevel: 20 },
    ])
    expect(gyarados.earliestLevel).toBe(20)
    for (const m of [150, 175, 44]) expect(gyarados.moves.has(m)).toBe(true)
    expect(gyarados.moves.has(37)).toBe(false)
    const cheaper = reachableMoves([
      { learnset: [lm(1, 1)], caughtLevel: 5, evolveLevel: 0 },
      { learnset: [lm(2, 1), lm(3, 12)], caughtLevel: 10, evolveLevel: 30 },
    ])
    expect(cheaper.earliestLevel).toBe(10)
    expect(cheaper.moves.has(2) && cheaper.moves.has(3)).toBe(true)
    expect(
      reachableMoves([{ learnset: [lm(1, 1)], evolveLevel: 0 }]).obtainable
    ).toBe(false)
    expect(reachableMoves([]).obtainable).toBe(false)
    const evolveMove = reachableMoves([
      { learnset: [lm(1, 1)], caughtLevel: 3, evolveLevel: 0 },
      { learnset: [lm(9, 0)], evolveLevel: 0 },
    ])
    expect(evolveMove.moves.has(9)).toBe(true)
  })
})

describe("표 모델 · 필터", () => {
  const row = (
    id: number,
    ko: string,
    types: string[],
    total: number,
    flags: Partial<SpeciesRow> = {}
  ): SpeciesRow => ({
    speciesId: id,
    dexNumber: id,
    pokemonId: id,
    name: lt(ko, "", ""),
    types,
    stats: emptyStats(),
    total,
    legendary: false,
    finalEvolution: true,
    ...flags,
  })
  const handmade = [
    row(149, "망나뇽", ["dragon", "flying"], 600),
    row(147, "미뇽", ["dragon"], 300, { finalEvolution: false }),
    row(483, "디아루가", ["steel", "dragon"], 680, { legendary: true }),
    row(25, "피카츄", ["electric"], 320, { finalEvolution: false }),
  ]
  const count = (filter: SpeciesFilter, rows = handmade) =>
    viewSpecies(rows, { filter, sort: null, language: "ko" }).length

  it("타입 · 합계 · 전설 · 최종 진화(AND)", () => {
    let filter: SpeciesFilter = {
      ...initialSpeciesFilter(),
      types: new Set(["dragon"]),
    }
    expect(count(filter)).toBe(3)
    filter = { ...filter, excludeLegendary: true }
    expect(count(filter)).toBe(2)
    filter = { ...filter, finalOnly: true }
    const only = viewSpecies(handmade, { filter, sort: null, language: "ko" })
    expect(only.map((r) => r.dexNumber)).toEqual([149])
    filter = clearSpeciesFilters({ ...filter, search: "x" })
    expect(filter.search).toBe("x")
    expect(count({ ...filter, search: "" })).toBe(4)
    expect(count({ ...filter, search: "", minTotal: 310, maxTotal: 650 })).toBe(
      2
    )
  })
  it("이름 · 번호로 찾고 숫자는 숫자로 정렬", () => {
    const all = speciesForGeneration(9)
    const search = (s: string) =>
      count({ ...initialSpeciesFilter(), search: s }, all)
    expect(
      viewSpecies(all, {
        filter: { ...initialSpeciesFilter(), search: " 한카 " },
        sort: null,
        language: "ko",
      }).map((r) => r.dexNumber)
    ).toEqual([445])
    expect(search("clef")).toBe(2)
    expect(search("")).toBe(5)
    const sorted = viewSpecies(all, {
      filter: initialSpeciesFilter(),
      sort: { column: "total", direction: "descending" },
      language: "ko",
    })
    expect(sorted[0].dexNumber).toBe(445)
  })
  it("지방 번호와 전국 번호 둘 다로 찾는다", () => {
    const sinnoh = speciesForDex(5, 4)
    expect(sinnoh[0].dexNumber).toBe(100)
    expect(count({ ...initialSpeciesFilter(), search: "111" }, sinnoh)).toBe(1)
    expect(count({ ...initialSpeciesFilter(), search: "445" }, sinnoh)).toBe(1)
  })
  it("아이템: 분류 · 세대 · 문구 검색 · 이름 정렬", () => {
    const items = itemsForGeneration(4)
    const view = (filter = initialItemFilter(), sort: "name" | null = null) =>
      viewItems(items, {
        filter,
        sort: sort ? { column: sort, direction: "ascending" } : null,
        generation: 4,
        language: "ko",
      })
    expect(view()).toHaveLength(106)
    const evolution = {
      ...initialItemFilter(),
      category: (c: string) => c === "evolution",
    }
    expect(view(evolution)).toHaveLength(3)
    expect(view({ ...evolution, onlyInGeneration: true })).toHaveLength(2)
    const notMachines = {
      ...initialItemFilter(),
      category: (_: string, pocket: string) => pocket !== "machines",
    }
    expect(
      view({ ...notMachines, search: "회복" })
        .map((r) => r.identifier)
        .sort()
    ).toEqual(["leftovers", "potion"])
    expect(text(view(initialItemFilter(), "name")[0].name, "ko")).toBe(
      "각성의돌"
    )
    // 게임별 존재: 입수 사전에 있거나 그 게임에 담긴 기술이 있는 기술머신만
    const allowed = view({
      ...initialItemFilter(),
      allowed: new Set(["potion"]),
    })
    expect(allowed.some((r) => r.identifier === "potion")).toBe(true)
    expect(allowed.some((r) => r.identifier === "master-ball")).toBe(false)
    expect(allowed.some((r) => r.identifier === "tm01")).toBe(true)
  })
})
