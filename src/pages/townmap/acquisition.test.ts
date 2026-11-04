import { describe, expect, it } from "vitest"

import { emptyText } from "../../data/text/localizedText.ts"
import { translate, type TFunction } from "../../i18n/index.ts"
import {
  costText,
  emptySource,
  groupItemsHere,
  itemsAt,
  loadAcquisitionBook,
  parseAcquisitionBook,
  pokemonAt,
  sourceText,
  sourceTextHere,
  type ItemInfo,
  type Source,
} from "./acquisition.ts"

const t: TFunction = (key, ...args) => translate("ko", key, ...args)
const src = (patch: Partial<Source>): Source => ({ ...emptySource(), ...patch })
const ko = (s: string) => ({ ko: s, en: "", ja: "" })

describe("sourceText", () => {
  it("방법 · 내용 비용 (조건)", () => {
    expect(
      sourceText(
        src({
          how: "exchange",
          content: ko("배틀프런티어"),
          cost: [{ amount: 32, unit: "bp" }],
          detail: ko("BP 교환 · 변화 기술"),
        }),
        "ko",
        t
      )
    ).toBe("교환 · 배틀프런티어 32BP (BP 교환 · 변화 기술)")
  })
  it("숨겨진 아이템 · 빈 줄 · other", () => {
    expect(
      sourceText(src({ how: "hidden", detail: ko("다우징머신") }), "ko", t)
    ).toBe("숨겨진 아이템 (다우징머신)")
    expect(sourceText(src({}), "ko", t)).toBe("")
    expect(sourceText(src({ how: "other", detail: ko("x") }), "ko", t)).toBe(
      " (x)"
    )
  })
  it("타운맵 줄은 장소를 지운다", () => {
    const s = src({
      how: "field",
      where: "johto-route-34",
      place: ko("어딘가"),
    })
    expect(sourceText(s, "ko", t)).toBe("필드 · 34번 도로")
    expect(sourceTextHere(s, "ko", t)).toBe("필드")
  })
  it("비용: 천 단위 쉼표 · 모르는 단위", () => {
    expect(costText({ amount: 10000, unit: "money" }, t)).toBe("10,000원")
    expect(costText({ amount: 4000, unit: "coins" }, t)).toBe("코인 4,000")
    expect(costText({ amount: 3, unit: "pebbles" }, t)).toBe("3 pebbles")
    expect(translate("en", "%1원", "10,000")).toBe("₽10,000")
  })
})

describe("사전 읽기", () => {
  const book = parseAcquisitionBook(
    {
      versionGroup: "black-2-white-2",
      items: {
        "rare-candy": [
          { how: "field", where: "a-town" },
          { how: "hidden", where: "a-town", versions: ["white-2"] },
          { how: "gift", where: "b-town", cost: [{ amount: "x", unit: "bp" }] },
          "junk",
        ],
        tm13: [{ where: "a-town", how: "shop", unknownField: 1 }],
        broken: "not a list",
      },
      pokemon: {
        abra: [
          { how: "prize", where: "a-town", minLevel: 15, replaces: "gift" },
        ],
        mew: [{ how: "event", where: "a-town" }],
        mareep: [{ how: "transfer", versionsFrom: ["gold"] }],
      },
    },
    "fallback"
  )
  it("모양이 틀린 칸은 버리고 나머지를 읽는다", () => {
    expect(book.versionGroup).toBe("black-2-white-2")
    expect(book.items.get("rare-candy")).toHaveLength(3)
    expect(book.items.get("rare-candy")?.[2].cost).toEqual([])
    expect(book.items.has("broken")).toBe(false)
    expect(parseAcquisitionBook(42, "vg").items.size).toBe(0)
  })
  it("itemsAt: 버전 한정은 그 버전에서만", () => {
    expect(itemsAt(book, "a-town", "black-2").map((e) => e.item)).toEqual([
      "rare-candy",
      "tm13",
    ])
    expect(itemsAt(book, "a-town", "white-2")).toHaveLength(3)
  })
  it("pokemonAt: 데려오기 · 배포는 목록 줄이 아니다", () => {
    const here = pokemonAt(book, "a-town", "black-2")
    expect(here.map((e) => e.species)).toEqual(["abra"])
    expect(here[0].source).toMatchObject({
      minLevel: 15,
      maxLevel: null,
      replaces: "gift",
    })
  })
  it("앱에 든 사전을 게임 묶음으로 읽는다", async () => {
    const hgss = await loadAcquisitionBook("heartgold-soulsilver")
    expect(hgss?.items.size).toBeGreaterThan(100)
    expect(await loadAcquisitionBook("no-such-game")).toBeNull()
  })
})

describe("groupItemsHere", () => {
  const info = (name: string, move = ""): ItemInfo => ({
    id: 1,
    name: ko(name),
    machineMove: move ? ko(move) : emptyText(),
    machineType: "",
  })
  it("제목(이름 — 기술) 순, 같은 제목은 줄을 모은다, 표에 없는 아이템은 뺀다", () => {
    const rows: Record<string, ItemInfo> = {
      "rare-candy": info("이상한사탕"),
      tm45: info("기술머신45", "헤롱헤롱"),
      potion: info("상처약"),
    }
    const out = groupItemsHere(
      [
        { item: "rare-candy", source: src({ how: "field" }) },
        { item: "rare-candy", source: src({ how: "hidden" }) },
        { item: "tm45", source: src({ how: "shop" }) },
        { item: "potion", source: src({}) },
        { item: "lapoke-ball", source: src({ how: "field" }) },
      ],
      (id) => rows[id] ?? null,
      "ko",
      t
    )
    expect(out.map((o) => [o.title, o.lines])).toEqual([
      ["기술머신45 — 헤롱헤롱", ["상점"]],
      ["상처약", []],
      ["이상한사탕", ["필드", "숨겨진 아이템"]],
    ])
  })
})
