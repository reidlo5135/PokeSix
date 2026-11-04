import { describe, expect, it } from "vitest"

import { frontKey, itemIconKey, spriteUrls } from "./sprites.ts"

const BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/"

describe("spriteUrls", () => {
  it("포켓몬 아이콘: 8세대 아이콘 → 기본 그림", () => {
    expect(spriteUrls("pokemonIcon", "445")).toEqual([
      `${BASE}pokemon/versions/generation-viii/icons/445.png`,
      `${BASE}pokemon/445.png`,
    ])
  })
  it("정면 그림: 세대 폴더 → 마지막 조각", () => {
    expect(spriteUrls("pokemonFront", "generation-iv/platinum/445")).toEqual([
      `${BASE}pokemon/versions/generation-iv/platinum/445.png`,
      `${BASE}pokemon/445.png`,
    ])
  })
  it("아이템: 폴더 없는 키면 1 · 2번 후보가 같아 하나로", () => {
    expect(spriteUrls("item", "potion")).toEqual([
      `${BASE}items/potion.png`,
      `${BASE}items/gen9/potion.png`,
      `${BASE}items/gen8/potion.png`,
    ])
    expect(spriteUrls("item", "gen5/potion")).toHaveLength(4)
  })
  it("타운맵은 Serebii", () => {
    expect(spriteUrls("townMap", "johto")).toEqual([
      "https://www.serebii.net/pokearth/johto.png",
    ])
  })
})

describe("frontKey", () => {
  it("7 · 8세대는 폴더가 없다", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => frontKey(g, 25))).toEqual([
      "generation-i/yellow/25",
      "generation-ii/crystal/25",
      "generation-iii/emerald/25",
      "generation-iv/platinum/25",
      "generation-v/black-white/25",
      "generation-vi/x-y/25",
      "default/25",
      "default/25",
      "generation-ix/scarlet-violet/25",
    ])
    expect(frontKey(0, 1)).toBe("default/1")
  })
})

describe("itemIconKey", () => {
  it("기술머신 · 비전머신 · 레코드", () => {
    expect(itemIconKey("tm01", "fire", 4)).toBe("gen5/tm-fire")
    expect(itemIconKey("hm03", "water", 6)).toBe("hm-water")
    expect(itemIconKey("tm50", null, 7)).toBe("tm-normal")
    expect(itemIconKey("tr12", "dragon", 8)).toBe("tm-dragon")
  })
  it("보통 아이템: 1–5세대는 gen5/", () => {
    expect(itemIconKey("potion", null, 3)).toBe("gen5/potion")
    expect(itemIconKey("potion", null, 6)).toBe("potion")
  })
})
