import { describe, expect, it } from "vitest"

import {
  filterCorpus,
  isEmptyResult,
  type SearchCorpus,
} from "./searchCorpus.ts"

const text = (ko: string, en: string, ja: string) => ({ ko, en, ja })
const hay = (...parts: (string | number)[]) => parts.join(" ").toLowerCase()

const corpus: SearchCorpus = {
  pokemon: [
    {
      kind: "pokemon",
      id: 25,
      dexNumber: 25,
      name: text("피카츄", "Pikachu", "ピカチュウ"),
      types: ["electric"],
      hay: hay(25, 25, "피카츄 Pikachu ピカチュウ"),
    },
    {
      kind: "pokemon",
      id: 26,
      dexNumber: 26,
      name: text("라이츄", "Raichu", "ライチュウ"),
      types: ["electric"],
      hay: hay(26, 26, "라이츄 Raichu ライチュウ"),
    },
    {
      kind: "pokemon",
      id: 445,
      dexNumber: 445,
      name: text("한카리아스", "Garchomp", "ガブリアス"),
      types: ["dragon", "ground"],
      hay: hay(445, 445, "한카리아스 Garchomp ガブリアス"),
    },
  ],
  moves: [
    {
      kind: "move",
      id: 85,
      name: text("10만볼트", "Thunderbolt", "10まんボルト"),
      type: "electric",
      damageClass: 3,
      power: 90,
      hay: hay("10만볼트 Thunderbolt 10まんボルト"),
    },
  ],
  items: [
    {
      kind: "item",
      id: 83,
      identifier: "thunder-stone",
      machineType: "",
      name: text("천둥의돌", "Thunder Stone", "かみなりのいし"),
      hay: hay("천둥의돌 Thunder Stone かみなりのいし"),
    },
  ],
}

describe("filterCorpus", () => {
  it("세 언어 · 번호 어느 것으로도 찾는다 (대소문자 무시)", () => {
    expect(filterCorpus(corpus, "PIKA").pokemon.rows.map((p) => p.id)).toEqual([
      25,
    ])
    expect(filterCorpus(corpus, "카리").pokemon.rows.map((p) => p.id)).toEqual([
      445,
    ])
    expect(filterCorpus(corpus, "ガブ").pokemon.rows.map((p) => p.id)).toEqual([
      445,
    ])
    expect(filterCorpus(corpus, "445").pokemon.total).toBe(1)
  })
  it("묶음마다 따로 센다", () => {
    const r = filterCorpus(corpus, "thunder")
    expect(r.pokemon.total).toBe(0)
    expect(r.moves.total).toBe(1)
    expect(r.items.total).toBe(1)
  })
  it("limit을 넘으면 total은 그대로, rows만 자른다", () => {
    const r = filterCorpus(corpus, "츄", 1)
    expect(r.pokemon.rows).toHaveLength(1)
    expect(r.pokemon.total).toBe(2)
  })
  it("빈 질의 · 없는 글은 빈 결과", () => {
    expect(isEmptyResult(filterCorpus(corpus, "  "))).toBe(true)
    expect(isEmptyResult(filterCorpus(corpus, "zzz"))).toBe(true)
  })
})
