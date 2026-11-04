import { describe, expect, it } from "vitest"

import type { DexInfo, GameInfo } from "../../data/repository/types.ts"
import {
  chipLabel,
  DEX_STYLE,
  gameChips,
  parseDexStyle,
  versionBadges,
  versionShort,
} from "./gameChips.ts"

const T = (ko: string, en = "", ja = "") => ({ ko, en, ja })

const dex = (over: Partial<DexInfo>): DexInfo => ({
  pokedexId: 1,
  identifier: "x",
  region: T(""),
  versions: [],
  versionNames: [],
  versionGroups: [],
  ...over,
})

describe("게임 묶음 칩", () => {
  const swsh: GameInfo = {
    versionGroup: "the-isle-of-armor",
    versions: ["sword", "shield"],
    versionNames: [T("소드", "Sword"), T("실드", "Shield")],
  }

  it("도감 이름 바꾸기 → 지방 이름 → 묶음 이름", () => {
    const dexes = [
      dex({
        identifier: "isle-of-armor",
        region: T("가라르"),
        versionGroups: ["the-isle-of-armor"],
      }),
    ]
    expect(chipLabel(swsh, dexes, DEX_STYLE, "ko")).toBe("외딴섬")
    const sinnoh = dex({
      identifier: "extended-sinnoh",
      region: T("신오", "Sinnoh"),
      versionGroups: ["platinum"],
    })
    const pt: GameInfo = {
      versionGroup: "platinum",
      versions: ["platinum"],
      versionNames: [T("Pt")],
    }
    expect(chipLabel(pt, [sinnoh], DEX_STYLE, "en")).toBe("Sinnoh")
    // 숨긴 도감은 건너뛰고, 맞는 도감이 없으면 묶음 이름
    const hidden = dex({
      identifier: "original-melemele",
      region: T("알로라"),
      versionGroups: ["the-teal-mask"],
    })
    const teal: GameInfo = {
      versionGroup: "the-teal-mask",
      versions: [],
      versionNames: [],
    }
    expect(chipLabel(teal, [hidden], DEX_STYLE, "ko")).toBe("벽록의 가면")
    expect(
      chipLabel({ ...teal, versionGroup: "zzz" }, [], DEX_STYLE, "ko")
    ).toBe("")
  })

  it("배지는 같은 약칭을 한 번만, 표에 없는 버전은 영어 이름", () => {
    const badges = versionBadges(
      {
        versionGroup: "g",
        versions: ["red", "red", "mystery"],
        versionNames: [T("레드"), T("레드"), T("미스터리", "Mystery")],
      },
      DEX_STYLE
    )
    expect(badges.map((b) => b.short)).toEqual(["R", "Mystery"])
    expect(badges[1].background).toBe("var(--color-white)")
    expect(versionShort(DEX_STYLE, "white-2")).toBe("W2")
    expect(versionShort(DEX_STYLE, "nope")).toBe("")
  })

  it("툴팁 '이름 — 버전 · 버전'", () => {
    const [chip] = gameChips(
      [swsh],
      [
        dex({
          identifier: "isle-of-armor",
          versionGroups: [swsh.versionGroup],
        }),
      ],
      DEX_STYLE,
      "ko"
    )
    expect(chip.tooltip).toBe("외딴섬 — 소드 · 실드")
  })

  it("깨진 dexstyle은 빈 표", () => {
    const style = parseDexStyle({ versions: { a: 1, b: { short: "" } } })
    expect(style.versions.size).toBe(0)
    expect(parseDexStyle(null).pokedexes.size).toBe(0)
  })
})
