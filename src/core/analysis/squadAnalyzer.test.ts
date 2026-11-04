import { describe, expect, it } from "vitest"

import { format } from "../../i18n/index.ts"
import { chartFor } from "../typechart/fixtures.ts"
import {
  DISPLAY_ORDER,
  multiplierGlyph,
  weaknessesOf,
} from "../typechart/index.ts"
import { problemSummary, problemText, suggestion } from "./problemText.ts"
import {
  analyzeSquad,
  makeSquadInput,
  problemColumns,
  splitTotal,
  type AnalyzerMember,
} from "./squadAnalyzer.ts"

const t = (key: string, ...args: (string | number)[]) => format(key, ...args)
const KO: Record<string, string> = {
  normal: "노말",
  fire: "불꽃",
  water: "물",
  grass: "풀",
  electric: "전기",
  ice: "얼음",
  fighting: "격투",
  poison: "독",
  ground: "땅",
  flying: "비행",
  psychic: "에스퍼",
  bug: "벌레",
  rock: "바위",
  ghost: "고스트",
  dragon: "드래곤",
  dark: "악",
  steel: "강철",
  fairy: "페어리",
}
const typeName = (k: string) => KO[k] ?? "???"

const P = 2
const S = 3
const X = 1
const mv = (type: string, damageClass: number, otherClass?: number) => ({
  type,
  damageClass,
  otherClass,
})

// T1 — 샘플 스쿼드 "신오 정주행"(4세대). otherClass = 1–3세대 규칙(타입 기준)
const T1: (AnalyzerMember | null)[] = [
  {
    types: ["fire", "fighting"],
    moves: [
      mv("fire", S, S),
      mv("fighting", P, P),
      mv("bug", P, P),
      mv("fighting", P, P),
    ],
  },
  {
    types: ["water", "steel"],
    moves: [
      mv("water", S, S),
      mv("ice", S, S),
      mv("steel", S, P),
      mv("grass", S, S),
    ],
  },
  {
    types: ["dragon", "ground"],
    moves: [
      mv("ground", P, P),
      mv("dragon", P, S),
      mv("rock", P, P),
      mv("normal", X, X),
    ],
  },
  {
    types: ["electric"],
    moves: [mv("electric", P, S), mv("normal", P, P), mv("normal", X, X)],
  },
  {
    types: ["normal", "flying"],
    moves: [
      mv("flying", S, P),
      mv("fighting", S, P),
      mv("rock", S, P),
      mv("electric", X, X),
    ],
  },
  null,
]
const NAMES = ["초염몽", "엠페르트", "한카리아스", "렌트라", "토게키스"]

describe("analyzeSquad — T1", () => {
  const chart = chartFor(4)
  const a = analyzeSquad(makeSquadInput(chart, T1))

  it("받는 배율 · 요약 줄이 기대값과 같다", () => {
    const row = (slot: number) =>
      DISPLAY_ORDER.filter((x) => x !== "fairy")
        .map((x) => multiplierGlyph(a.received[slot][x]))
        .join(" ")
    expect(row(0)).toBe("1 ½ 2 ½ 1 ½ 1 1 2 2 2 ¼ 1 1 1 ½ ½")
    expect(row(1)).toBe("½ 1 ½ 1 2 ¼ 2 0 2 ½ ½ ½ ½ ½ ½ ½ ¼")
    expect(row(2)).toBe("1 ½ 1 1 0 4 1 ½ 1 1 1 1 ½ 1 2 1 1")
    expect(row(3)).toBe("1 1 1 1 ½ 1 1 1 2 ½ 1 1 1 1 1 1 ½")
    expect(row(4)).toBe("1 1 1 ½ 2 2 1 1 0 1 1 ½ 2 0 1 1 1")
    const sums = (rec: Record<string, number>) =>
      DISPLAY_ORDER.filter((x) => x !== "fairy")
        .map((x) => rec[x])
        .join(" ")
    expect(sums(a.weak)).toBe("0 0 1 0 2 2 1 0 3 1 1 0 1 0 1 0 0")
    expect(sums(a.resist)).toBe("1 2 1 2 2 2 0 2 1 2 1 3 2 2 1 2 3")
    expect(a.covered.ghost).toBe(false)
    expect(
      DISPLAY_ORDER.filter((x) => x !== "fairy" && x !== "ghost").every(
        (x) => a.covered[x]
      )
    ).toBe(true)
    expect(a.types).not.toContain("fairy")
  })

  it("문제 3건 — 순서와 관련 슬롯", () => {
    expect(a.filled).toBe(5)
    expect(a.problems).toEqual([
      { kind: "weakStack", type: "ground", members: [0, 1, 3] },
      { kind: "quad", type: "ice", members: [2] },
      { kind: "noCoverage", type: "ghost", members: [] },
    ])
    expect([...problemColumns(a)]).toEqual(["ground"])
  })

  it("문구", () => {
    const deps = { t, typeName, memberName: (s: number) => NAMES[s] }
    expect(problemText(a.problems[0], a, deps)).toEqual({
      title: "땅 — 약점 3, 받아낼 포켓몬 1",
      detail: "초염몽 ×2 · 엠페르트 ×2 · 렌트라 ×2 / 받아냄: 토게키스 ×0",
      tag: "방어",
    })
    expect(problemText(a.problems[1], a, deps)).toEqual({
      title: "얼음 — 4배 약점",
      detail: "한카리아스 ×4 · 토게키스 ×2 / 받아냄: 초염몽 ×½ · 엠페르트 ×¼",
      tag: "방어",
    })
    expect(problemText(a.problems[2], a, deps)).toEqual({
      title: "고스트 — 효과가 굉장한 기술 없음",
      detail: "고스트 · 악 타입 공격 기술이 스쿼드에 없어요",
      tag: "공격",
    })
    expect(suggestion(a, deps)).toBe(
      "땅 · 얼음 공격에 강하고 고스트 · 악 기술을 가진 포켓몬이면 문제 3건이 함께 풀려요."
    )
    expect(a.problems.map((p) => problemSummary(p, a, deps))).toEqual([
      "땅 약점 3",
      "얼음 ×4",
      "고스트 공격 없음",
    ])
  })

  it("물리 · 특수 분포와 반대 규칙", () => {
    expect(a.split).toEqual({ physical: 8, special: 8, status: 3, empty: 1 })
    expect(splitTotal(a.split)).toBe(20)
    expect(a.otherSplit.physical).toBe(10)
    expect(a.otherSplit.special).toBe(6)
  })

  it("카드 약점 칩: ×4 먼저, 그다음 ×2 (표기 순)", () => {
    const chips = (types: string[]) =>
      weaknessesOf(chart, types).map(
        (w) => `${KO[w.type]}${w.multiplier >= 4 ? "×4" : ""}`
      )
    expect(chips(["fire", "fighting"])).toEqual(["물", "땅", "비행", "에스퍼"])
    expect(chips(["water", "steel"])).toEqual(["전기", "격투", "땅"])
    expect(chips(["dragon", "ground"])).toEqual(["얼음×4", "드래곤"])
    expect(chips(["electric"])).toEqual(["땅"])
    expect(chips(["normal", "flying"])).toEqual(["전기", "얼음", "바위"])
  })
})

describe("analyzeSquad — 경계", () => {
  it("빈 스쿼드 → 문제 0", () => {
    const a = analyzeSquad(makeSquadInput(chartFor(4), []))
    expect(a.filled).toBe(0)
    expect(a.problems).toEqual([])
    expect(suggestion(a, { t, typeName })).toBe(
      "이 세대의 포켓몬만 고를 수 있어요."
    )
  })
  it("기술 없는 물 타입 하나 → 공격 문제를 내지 않는다", () => {
    const a = analyzeSquad(
      makeSquadInput(chartFor(4), [{ types: ["water"], moves: [] }])
    )
    expect(a.problems).toEqual([])
    expect(a.split.empty).toBe(4)
    expect(suggestion(a, { t, typeName })).toBe(
      "빈 자리에 포켓몬을 더해 보세요."
    )
  })
  it("약점 2 · 내성 0 → 받아낼 포켓몬 없음", () => {
    const a = analyzeSquad(
      makeSquadInput(chartFor(4), [
        { types: ["fire"], moves: [] },
        { types: ["fire"], moves: [] },
      ])
    )
    const kinds = a.problems.map((p) => `${p.kind}:${p.type}`)
    expect(kinds).toContain("noResist:water")
    expect(kinds).toContain("noResist:ground")
    expect(kinds).toContain("noResist:rock")
  })
  it("모르는 타입(stellar · ???)은 빠진다", () => {
    const chart = chartFor(9)
    const a = analyzeSquad(
      makeSquadInput(
        { types: [...chart.types, "stellar"], multipliers: chart.multipliers },
        [{ types: ["normal"], moves: [mv("", S)] }]
      )
    )
    expect(a.types).not.toContain("stellar")
    expect(a.hasAttackingMove).toBe(false)
  })
})

describe("세대에 따라 바뀌는 값 — T2", () => {
  const glyph = (g: number, attack: string, types: string[]) => {
    const a = analyzeSquad(makeSquadInput(chartFor(g), [{ types, moves: [] }]))
    return a.types.includes(attack)
      ? multiplierGlyph(a.received[0][attack])
      : "—"
  }
  it("T2-1 · T2-2 한카리아스 4세대 · 6세대", () => {
    const garchomp = ["dragon", "ground"]
    expect(glyph(4, "ice", garchomp)).toBe("4")
    expect(glyph(4, "electric", garchomp)).toBe("0")
    expect(glyph(4, "fairy", garchomp)).toBe("—")
    expect(glyph(6, "fairy", garchomp)).toBe("2")
  })
  it("T2-5 엠페르트 고스트 · 악 5세대 ½ → 6세대 1", () => {
    expect(glyph(5, "ghost", ["water", "steel"])).toBe("½")
    expect(glyph(6, "ghost", ["water", "steel"])).toBe("1")
    expect(glyph(5, "dark", ["water", "steel"])).toBe("½")
    expect(glyph(6, "dark", ["water", "steel"])).toBe("1")
  })
  it("T2-6 · T2-7 1세대 · 2세대 표", () => {
    expect(glyph(1, "ghost", ["psychic"])).toBe("0")
    expect(glyph(1, "bug", ["poison"])).toBe("2")
    expect(glyph(1, "poison", ["bug"])).toBe("2")
    expect(glyph(1, "ice", ["fire"])).toBe("1")
    expect(glyph(2, "bug", ["poison"])).toBe("½")
    expect(glyph(2, "poison", ["bug"])).toBe("1")
    expect(glyph(2, "ice", ["fire"])).toBe("½")
    expect(glyph(2, "ghost", ["psychic"])).toBe("2")
  })
  it("T2-8 1세대는 악 · 강철 · 페어리가 없다", () => {
    const a = analyzeSquad(makeSquadInput(chartFor(1), []))
    expect(a.types).toHaveLength(15)
    expect(a.types).not.toContain("dark")
    expect(a.types).not.toContain("steel")
  })
})
