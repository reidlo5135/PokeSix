// 데이터 층 — openSave · 버전 고르기 · 스쿼드 변환 · 게임 번호 표 (Qt savefile · saveimport 테스트)
import { describe, expect, it } from "vitest"

import {
  STATIC_SAVE_LOOKUPS,
  defaultPokemonId,
  itemIdForGameIndex,
  natureIdForGameIndex,
} from "../../src/core/save/gameIndex.ts"
import {
  NOT_A_SAVE_ERROR,
  cannotReadError,
  fileKindOf,
  openSave,
  type SaveFile,
} from "../../src/core/save/saveFile.ts"
import {
  dexOrder,
  toSquadImport,
  type SaveLookups,
} from "../../src/core/save/toSquad.ts"
import {
  VERSIONS_OF_GROUP,
  chooseVersion,
  versionOfOriginGame,
} from "../../src/core/save/version.ts"
import {
  buildSave,
  buildTableSave,
  sameBytes,
  seriesOf,
  type MemberSpec,
} from "./syntheticSave.ts"

const pt = seriesOf("platinum")
const hgss = seriesOf("heartgold-soulsilver")
const bw = seriesOf("black-white")
const b2w2 = seriesOf("black-2-white-2")

const member = (
  species: number,
  originGame = 12,
  over: Partial<MemberSpec> = {}
): Partial<MemberSpec> => ({ species, originGame, heldItem: 0, ...over })

function open(bytes: Uint8Array): SaveFile {
  const result = openSave(bytes, "test.sav")
  if (!result.ok) throw new Error(result.error)
  return result.save
}

const squadOf = (save: SaveFile) => toSquadImport(save, STATIC_SAVE_LOOKUPS)

describe("openSave", () => {
  it("파일 전체를 그대로 둔다", () => {
    const bytes = buildSave(pt, { party: [member(445)] })
    const before = bytes.slice()
    const save = open(bytes)
    expect(sameBytes(save.bytes, before)).toBe(true)
    expect(sameBytes(bytes, before)).toBe(true) // 받은 버퍼도 그대로
    expect(save.bytes === bytes).toBe(false) // 사본
    expect(save.fileName).toBe("test.sav")
    expect(save.generation).toBe(4)
    expect(save.versionGroup).toBe("platinum")
    expect(save.game).toBe("platinum")
    expect(save.partyOffset).toBe(0xa0)
  })
  it("게임 값을 그대로 둔다(게임 순서)", () => {
    const save = open(
      buildSave(pt, {
        party: [
          member(445, 12, {
            pid: 0xcafebabe,
            iv32: 31,
            evs: [252, 0, 0, 6, 0, 0],
          }),
        ],
      })
    )
    expect(save.members.length).toBe(1)
    const raw = save.members[0]
    expect(raw.pid).toBe(0xcafebabe)
    expect(raw.ivs[0]).toBe(31)
    expect(raw.ivs[1]).toBe(0)
    expect(raw.evs[0]).toBe(252)
    expect(raw.evs[3]).toBe(6)
    expect(squadOf(save).members[0]?.pokemonId).toBe(445)
  })
  it("알은 자리를 지키고 스쿼드에서는 빈칸", () => {
    const save = open(
      buildSave(pt, {
        party: [member(445), member(35, 12, { iv32: 1 << 30 })],
      })
    )
    expect(save.members.length).toBe(2)
    expect(save.members[0].egg).toBe(false)
    expect(save.members[1].egg).toBe(true)
    expect(save.members[1].species).toBe(35)
    const squad = squadOf(save)
    expect(squad.members[0]?.pokemonId).toBe(445)
    expect(squad.members[1]).toBeNull()
  })
  it("세이브가 아니면 오류", () => {
    const result = openSave(new Uint8Array(1000))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe(NOT_A_SAVE_ERROR)
    expect(cannotReadError("권한 없음")).toBe("파일을 열 수 없어요: 권한 없음")
  })
})

describe("스쿼드로 바꾸기", () => {
  it("파티를 스쿼드로", () => {
    const save = open(
      buildSave(pt, {
        party: [
          member(445, 12, {
            pid: 0x2313,
            heldItem: 234,
            ability: 8,
            moves: [89, 337, 0, 0],
          }),
          member(35, 12),
        ],
      })
    )
    const squad = squadOf(save)
    expect(squad.generation).toBe(4)
    expect(squad.game).toBe("platinum")
    expect(squad.members.length).toBe(6)
    const [garchomp, clefairy] = squad.members
    expect(garchomp?.pokemonId).toBe(445)
    expect(garchomp?.itemId).toBe(211)
    expect(garchomp?.natureId).toBe(17)
    expect(garchomp?.abilityId).toBe(8)
    expect(garchomp?.moves).toEqual([89, 337, 0, 0])
    expect(garchomp?.memo).toBe("")
    expect(clefairy?.pokemonId).toBe(35)
    expect(clefairy?.itemId).toBe(0)
    expect(squad.members.filter((m) => m !== null).length).toBe(2)
    expect(squad.warnings).toEqual([])
  })
  it("레벨과 능력치(앱 순서)를 가져온다", () => {
    const save = open(
      buildSave(hgss, {
        party: [
          member(445, 8, {
            level: 48,
            maxHp: 151,
            battleStats: [139, 88, 152, 75, 74],
          }),
        ],
      })
    )
    const m = squadOf(save).members[0]
    expect(m?.level).toBe(48)
    expect(m?.stats).toEqual([151, 139, 88, 75, 74, 152])
  })
  it("물건은 세이브의 세대로 찾는다", () => {
    const calls: [number, number][] = []
    const lookups: SaveLookups = {
      ...STATIC_SAVE_LOOKUPS,
      itemIdForGameIndex: (generation, index) => {
        calls.push([generation, index])
        return 1000 + index
      },
    }
    const save = open(
      buildTableSave(bw, {
        party: [member(445, 21, { heldItem: 300 }), member(35, 21)],
      })
    )
    const squad = toSquadImport(save, lookups)
    expect(calls).toEqual([[5, 300]]) // 물건 없음(0)은 묻지 않는다
    expect(squad.members[0]?.itemId).toBe(1300)
    expect(squad.members[1]?.itemId).toBe(0)
  })
  it("다른 폼은 기본 폼으로 + 경고", () => {
    const save = open(
      buildSave(pt, { party: [member(479, 12, { formByte: 2 << 3 })] })
    )
    const squad = squadOf(save)
    expect(squad.members[0]?.pokemonId).toBe(479)
    expect(squad.warnings).toEqual([
      "save import: species 479 form 2 has no form table yet — using the default form",
    ])
  })
  it("BW 파티를 스쿼드로", () => {
    const save = open(
      buildTableSave(bw, {
        party: [
          member(445, 21, {
            natureByte: 9,
            heldItem: 234,
            moves: [89, 337, 0, 0],
          }),
        ],
      })
    )
    const squad = squadOf(save)
    expect(squad.generation).toBe(5)
    expect(squad.game).toBe("black")
    expect(squad.members[0]?.pokemonId).toBe(445)
    expect(squad.members[0]?.natureId).toBe(18)
    expect(squad.members[0]?.itemId).toBe(211)
    expect(squad.members[0]?.moves).toEqual([89, 337, 0, 0])
  })
  it("스탯을 앱 순서로", () => {
    expect(dexOrder([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3, 5, 6, 4])
  })
})

describe("버전 고르기", () => {
  it("파티 대부분이 온 버전", () => {
    const save = open(
      buildSave(hgss, {
        party: [member(445, 8), member(35, 8), member(36, 7)],
      })
    )
    expect(save.game).toBe("soulsilver")
  })
  it("아무도 안 맞으면 첫 버전", () => {
    expect(open(buildSave(hgss, { party: [member(445, 10)] })).game).toBe(
      "heartgold"
    )
  })
  it("B2 · W2를 출신으로 고른다", () => {
    const save = open(
      buildTableSave(b2w2, {
        party: [member(445, 22), member(35, 22), member(36, 23)],
      })
    )
    expect(save.generation).toBe(5)
    expect(save.game).toBe("white-2")
  })
  it("동점이면 앞 버전", () => {
    const save = open(
      buildSave(hgss, { party: [member(445, 8), member(35, 7)] })
    )
    expect(save.game).toBe("heartgold")
    expect(chooseVersion([], [])).toBe("")
  })
  it("출신 게임 이름", () => {
    const names: [number, string][] = [
      [7, "heartgold"],
      [8, "soulsilver"],
      [10, "diamond"],
      [11, "pearl"],
      [12, "platinum"],
      [20, "white"],
      [21, "black"],
      [22, "white-2"],
      [23, "black-2"],
      [99, ""],
    ]
    for (const [origin, name] of names) {
      expect(versionOfOriginGame(origin)).toBe(name)
    }
  })
  it("묶음의 버전", () => {
    expect(VERSIONS_OF_GROUP["black-white"]).toEqual(["black", "white"])
    expect(VERSIONS_OF_GROUP.platinum).toEqual(["platinum"])
  })
})

describe("파일 종류", () => {
  it("확장자로 세이브를 알아본다", () => {
    expect(fileKindOf("/a/포켓몬스터 소울실버(K).sav")).toBe("save")
    expect(fileKindOf("PLATINUM.SAV")).toBe("save")
    expect(fileKindOf("pt.dsv")).toBe("save")
    expect(fileKindOf("squad.pks")).toBe("squad")
    expect(fileKindOf("squads.json")).toBe("squad")
    expect(fileKindOf("save")).toBe("unknown")
    expect(fileKindOf("dir.sav/save")).toBe("unknown")
  })
})

describe("게임 번호 표", () => {
  it("성격", () => {
    expect(natureIdForGameIndex(0)).toBe(1)
    expect(natureIdForGameIndex(4)).toBe(17)
    expect(natureIdForGameIndex(9)).toBe(18)
    expect(natureIdForGameIndex(24)).toBe(19)
    expect(natureIdForGameIndex(99)).toBe(0)
    expect(natureIdForGameIndex(-1)).toBe(0)
  })
  it("물건", () => {
    const cases: [number, number, number][] = [
      [4, 1, 1],
      [4, 111, 111],
      [4, 112, 442],
      [4, 113, 0],
      [4, 135, 112],
      [4, 217, 194],
      [4, 234, 211],
      [4, 328, 305],
      [4, 536, 470],
      [4, 537, 0],
      [4, 999999, 0],
      [5, 116, 563],
      [5, 226, 203],
      [5, 227, 204],
      [5, 234, 211],
      [5, 356, 333],
      [5, 426, 0],
      [5, 626, 922],
      [5, 638, 681],
      [5, 639, 0],
      [3, 1, 0],
    ]
    for (const [generation, index, id] of cases) {
      expect(itemIdForGameIndex(generation, index)).toBe(id)
    }
  })
  it("표가 덮는 인덱스 수", () => {
    const count = (generation: number) =>
      Array.from({ length: 700 }, (_, i) =>
        itemIdForGameIndex(generation, i)
      ).filter((id) => id !== 0).length
    expect(count(4)).toBe(514)
    expect(count(5)).toBe(619)
  })
  it("종 → 기본 포켓몬", () => {
    expect(defaultPokemonId(445)).toBe(445)
    expect(defaultPokemonId(35)).toBe(35)
    expect(defaultPokemonId(9999)).toBe(0)
    expect(defaultPokemonId(0)).toBe(0)
  })
})
