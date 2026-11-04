import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  createSquadStore,
  emptySquad,
  memberFromJson,
  parseSquadsDocument,
  recentSquads,
  serializeSquadsDocument,
  squadEntries,
  squadFromJson,
  type Squad,
  type SquadEntry,
  type SquadStorage,
} from "./squads.ts"

const squadWith = (ids: number[], name = ""): Squad => {
  const s = emptySquad()
  s.name = name
  ids.forEach((id, i) => {
    s.members[i].pokemonId = id
  })
  return s
}

const entry = (
  generation: SquadEntry["generation"],
  game: string,
  squad: Squad,
  updatedAt: number
): SquadEntry => ({
  generation,
  game,
  squad,
  updatedAt,
})

describe("recentSquads", () => {
  it("최근 고친 순, 최대 3개", () => {
    const all = [
      entry(1, "red", squadWith([25]), 10),
      entry(4, "platinum", squadWith([445]), 30),
      entry(2, "crystal", squadWith([157]), 20),
      entry(3, "emerald", squadWith([254]), 40),
    ]
    expect(recentSquads(all).map((e) => e.game)).toEqual([
      "emerald",
      "platinum",
      "crystal",
    ])
  })
  it("빈 스쿼드(이름도 멤버도 없음)는 뺀다 — 이름만 있으면 넣는다", () => {
    const all = [
      entry(4, "platinum", emptySquad(), 99),
      entry(5, "black", squadWith([], "  이름만 "), 1),
    ]
    expect(recentSquads(all).map((e) => e.game)).toEqual(["black"])
  })
  it("시각이 없으면(0) 뒤로, 같으면 높은 세대 먼저", () => {
    const all = [
      entry(1, "red", squadWith([1]), 0),
      entry(9, "scarlet", squadWith([906]), 0),
      entry(2, "gold", squadWith([152]), 5),
    ]
    expect(recentSquads(all).map((e) => e.game)).toEqual([
      "gold",
      "scarlet",
      "red",
    ])
  })
  it("limit", () => {
    const all = [
      entry(1, "a", squadWith([1]), 1),
      entry(1, "b", squadWith([1]), 2),
    ]
    expect(recentSquads(all, 1).map((e) => e.game)).toEqual(["b"])
  })
})

describe("squads.json 읽기 (Qt 값 하나 규칙)", () => {
  it("정수가 아닌 칸은 0, 글자가 아닌 칸은 빈 글자, 배열은 길이를 맞춘다", () => {
    const m = memberFromJson({
      pokemon: "445",
      memo: 3,
      moves: [89, 2.5, true],
      ability: 8,
      level: 48,
      stats: [1, 2],
    })
    expect(m).toEqual({
      pokemonId: 0,
      memo: "",
      moves: [89, 0, 0, 0],
      abilityId: 8,
      natureId: 0,
      itemId: 0,
      level: 48,
      stats: [1, 2, 0, 0, 0, 0],
    })
  })
  it("메모는 40자로 자르고 멤버는 6칸", () => {
    const s = squadFromJson({
      name: "x",
      members: [{ pokemon: 1, memo: "가".repeat(50) }],
    })
    expect(s.members).toHaveLength(6)
    expect(s.members[0].memo).toHaveLength(40)
    expect(s.shuttle.pokemonId).toBe(0)
  })
  it("version 2: 세대 → 게임 → 스쿼드, 모르는 세대 키는 버린다", () => {
    const doc = parseSquadsDocument({
      version: 2,
      squads: {
        "4": {
          current: "platinum",
          games: { platinum: { name: "신오", members: [{ pokemon: 445 }] } },
        },
        "12": { current: "x", games: {} },
        abc: {},
      },
    })
    expect(Object.keys(doc.squads)).toEqual(["4"])
    expect(doc.squads[4]?.current).toBe("platinum")
    expect(doc.squads[4]?.games.platinum.members[0].pokemonId).toBe(445)
    expect(doc.squads[4]?.updated).toEqual({})
  })
  it("version 1(세대마다 하나)은 그 게임 키로, 없으면 대표 게임으로 옮긴다", () => {
    const doc = parseSquadsDocument({
      squads: {
        "4": { name: "a", versionGroup: "heartgold-soulsilver" },
        "2": { name: "b" },
      },
    })
    expect(doc.squads[4]?.games["heartgold-soulsilver"].name).toBe("a")
    expect(doc.squads[2]?.current).toBe("crystal")
  })
  it("깨진 값은 빈 문서", () => {
    expect(parseSquadsDocument("nope").squads).toEqual({})
    expect(parseSquadsDocument([1, 2]).squads).toEqual({})
  })
})

describe("squads.json 쓰기", () => {
  it("키 정렬 · 4칸 들여쓰기 · 끝 줄바꿈, level 없는 멤버는 stats 키를 쓰지 않는다", () => {
    const doc = parseSquadsDocument({
      version: 2,
      squads: {
        "4": {
          current: "platinum",
          games: { platinum: { name: "n", members: [{ pokemon: 445 }] } },
        },
      },
    })
    const text = serializeSquadsDocument(doc)
    expect(text.endsWith("}\n")).toBe(true)
    expect(text).toContain('\n    "squads": {')
    expect(text.indexOf('"squads"')).toBeLessThan(text.indexOf('"version"'))
    expect(text).not.toContain('"stats"')
    expect(text).not.toContain('"shuttle"')
    // 다시 읽으면 같다
    expect(parseSquadsDocument(JSON.parse(text))).toEqual(doc)
  })
})

describe("스쿼드 저장소", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const memory = (): SquadStorage & {
    value: string | null
    writes: number
  } => {
    const m = {
      value: null as string | null,
      writes: 0,
      read: () => m.value,
      write: (v: string) => {
        m.value = v
        m.writes++
        return true
      },
    }
    return m
  }

  it("600ms 디바운스로 한 번 쓰고, 고친 시각을 남긴다", () => {
    const storage = memory()
    const store = createSquadStore(storage)
    store.api.setSquad(4, "platinum", squadWith([445]), 1000)
    store.api.setSquad(4, "platinum", squadWith([445, 448]), 2000)
    expect(store.getState().saveState).toBe("pending")
    expect(storage.writes).toBe(0)
    vi.advanceTimersByTime(600)
    expect(storage.writes).toBe(1)
    expect(store.getState().saveState).toBe("saved")
    const entries = squadEntries(store.getState().doc)
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      generation: 4,
      game: "platinum",
      updatedAt: 2000,
    })
  })

  it("같은 스쿼드면(키가 있을 때) 아무것도 안 한다 — 키가 없으면 빈 스쿼드도 넣는다", () => {
    const storage = memory()
    const store = createSquadStore(storage)
    store.api.setSquad(4, "soulsilver", emptySquad(), 1)
    expect(store.api.hasSquad(4, "soulsilver")).toBe(true)
    store.api.flush()
    const writes = storage.writes
    store.api.setSquad(4, "soulsilver", emptySquad(), 2)
    expect(store.api.hasPendingSave()).toBe(false)
    expect(storage.writes).toBe(writes)
  })

  it("flush는 기다리던 저장을 바로 쓴다", () => {
    const storage = memory()
    const store = createSquadStore(storage)
    store.api.setCurrentGame(4, "platinum")
    expect(store.api.flush()).toBe(true)
    expect(JSON.parse(storage.value ?? "{}").squads["4"].current).toBe(
      "platinum"
    )
  })
})
