import { describe, expect, it } from "vitest"

import type { EncounterSpot } from "../../data/repository/types.ts"
import { translate, type TFunction } from "../../i18n/index.ts"
import { emptySource, type PokemonSource } from "./acquisition.ts"
import { spotInfo, wildGroups, type SpeciesRef } from "./wild.ts"

const t: TFunction = (key, ...args) => translate("ko", key, ...args)
const name = (ko: string) => ({ ko, en: "", ja: "" })

const spot = (
  speciesId: number,
  method: string,
  min: number,
  max: number,
  rarity: number
): EncounterSpot => ({
  speciesId,
  pokemonId: speciesId,
  name: name(`#${speciesId}`),
  method,
  minLevel: min,
  maxLevel: max,
  rarity,
})

const book = (patch: Partial<PokemonSource>): PokemonSource => ({
  ...emptySource(),
  minLevel: null,
  maxLevel: null,
  versionsFrom: [],
  replaces: "",
  ...patch,
})

describe("spotInfo", () => {
  it("레벨 · 확률", () => {
    expect(spotInfo(5, 5, 100, t)).toBe("Lv.5 · 100%")
    expect(spotInfo(2, 4, 110, t)).toBe("Lv.2–4 · 110%")
    expect(spotInfo(5, 5, 0, t)).toBe("Lv.5")
    expect(spotInfo(null, null, 0, t)).toBe("")
  })
})

describe("wildGroups", () => {
  const species: Record<string, SpeciesRef> = {
    abra: { speciesId: 63, pokemonId: 63, name: name("캐이시") },
  }
  const speciesOf = (id: string) => species[id] ?? null

  it("PokéAPI 순서대로 방법별로 묶는다", () => {
    const groups = wildGroups(
      [
        spot(16, "walk", 2, 4, 110),
        spot(19, "walk", 2, 4, 25),
        spot(1, "gift", 5, 5, 100),
      ],
      [],
      speciesOf
    )
    expect(
      groups.map((g) => [g.method, g.rows.map((r) => r.speciesId)])
    ).toEqual([
      ["walk", [16, 19]],
      ["gift", [1]],
    ])
  })
  it("사전 줄은 replaces로 같은 종의 PokéAPI 줄을 가리고 끝에 붙는다", () => {
    const groups = wildGroups(
      [spot(63, "gift", 5, 5, 100), spot(147, "gift", 15, 15, 100)],
      [
        {
          species: "abra",
          source: book({ how: "prize", minLevel: 15, replaces: "gift" }),
        },
        { species: "unknown", source: book({ how: "prize" }) },
      ],
      speciesOf
    )
    expect(
      groups.map((g) => [
        g.method,
        g.rows.map((r) => [r.speciesId, r.minLevel, r.maxLevel]),
      ])
    ).toEqual([
      ["gift", [[147, 15, 15]]],
      ["prize", [[63, 15, 15]]],
    ])
    expect(groups[1].rows[0].source?.how).toBe("prize")
  })
})
