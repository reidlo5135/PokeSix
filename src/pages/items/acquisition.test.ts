import { describe, expect, it } from "vitest"

import { translate, type TFunction } from "../../i18n/index.ts"
import {
  allowedItems,
  costText,
  hasItemBook,
  itemSources,
  parseBook,
  parseSource,
  sourceText,
  type AcquisitionSource,
} from "./acquisition.ts"

const ko: TFunction = (key, ...args) => translate("ko", key, ...args)
const en: TFunction = (key, ...args) => translate("en", key, ...args)

const PLACES: Record<string, string> = {
  "sinnoh-route-216": "216번 도로",
  "veilstone-city": "장막시티",
  "unova-route-13": "13번 도로",
  "plasma-frigate": "플라스마 프리깃",
}
const placeOf = (where: string) => PLACES[where] ?? where
const SHORT: Record<string, string> = { "black-2": "B2", "white-2": "W2" }
const shortOf = (v: string) => SHORT[v] ?? ""

const options = { language: "ko" as const, t: ko, placeOf, shortOf }

const source = (raw: unknown): AcquisitionSource => {
  const s = parseSource(raw)
  if (!s) throw new Error("bad source")
  return s
}

describe("비용 글자", () => {
  it("단위마다 · 천 단위 쉼표", () => {
    expect(costText(10000, "coins", ko)).toBe("코인 10,000")
    expect(costText(1200, "money", ko)).toBe("1,200원")
    expect(costText(32, "bp", ko)).toBe("32BP")
    expect(costText(2, "red-shard", ko)).toBe("빨강조각 2개")
    expect(costText(5, "mystery", ko)).toBe("5 mystery")
    expect(costText(1200, "money", en)).toBe("₽1,200")
  })
})

describe("입수처 한 줄 (sourceText)", () => {
  it("방법 · 장소 · 컨텐츠 비용 (조건)", () => {
    const line = sourceText(
      source({
        how: "prize",
        place: "금빛시티",
        content: { ko: "게임코너", en: "Game Corner", ja: "ゲームコーナー" },
        cost: [{ amount: 10000, unit: "coins" }],
        region: "johto",
      }),
      options
    )
    expect(line).toBe("경품 · 금빛시티 · 게임코너 코인 10,000")
  })

  it("place가 없으면 where를 장소 이름으로", () => {
    expect(
      sourceText(source({ how: "field", where: "sinnoh-route-216" }), options)
    ).toBe("필드 · 216번 도로")
  })

  it("모르는 방법 · other는 방법 없이, 장소 = 컨텐츠면 한 번만", () => {
    expect(
      sourceText(
        source({
          how: "other",
          place: "배틀프런티어",
          content: "배틀프런티어",
          cost: [{ amount: 48, unit: "bp" }],
        }),
        options
      )
    ).toBe("배틀프런티어 48BP")
    expect(
      sourceText(
        source({ how: "wat", where: "x", detail: "다우징머신" }),
        options
      )
    ).toBe("x (다우징머신)")
  })

  it("비용 여럿은 + 로", () => {
    expect(
      sourceText(
        source({
          how: "tutor",
          place: "212번 도로 민가",
          cost: [
            { amount: 2, unit: "red-shard" },
            { amount: 4, unit: "blue-shard" },
          ],
        }),
        { ...options, omitHow: true }
      )
    ).toBe("212번 도로 민가 · 빨강조각 2개 + 파랑조각 4개")
  })
})

describe("사전 읽기는 관대하게", () => {
  it("틀린 칸은 빈 값, 모르는 칸은 무시", () => {
    const s = source({
      how: 3,
      where: ["x"],
      place: 7,
      cost: [{ amount: "10", unit: "money" }, { amount: 5 }, "x"],
      versions: "white-2",
      note: "불확실",
      confidence: "high",
    })
    expect(s.how).toBe("")
    expect(s.where).toBe("")
    expect(s.place).toEqual({ ko: "", en: "", ja: "" })
    expect(s.cost).toEqual([])
    expect(s.versions).toEqual([])
    expect(parseSource("x")).toBeNull()
  })

  it("파일 키 = versionGroup 칸, 없으면 파일 이름 · 객체가 아닌 줄은 버린다", () => {
    const book = parseBook(
      {
        _comment: ["x"],
        items: { tm13: [{ how: "field" }, 5, null], _x: [], bad: "x" },
        tutors: { dive: [{ how: "tutor" }] },
        pokemon: { abra: [] },
      },
      "platinum"
    )
    expect(book.versionGroup).toBe("platinum")
    expect([...book.items.keys()]).toEqual(["tm13"])
    expect(book.items.get("tm13")).toHaveLength(1)
    expect(book.tutors.get("dive")).toHaveLength(1)
    expect(parseBook({ versionGroup: "x-y" }, "file").versionGroup).toBe("x-y")
    expect(parseBook(null, "file").items.size).toBe(0)
  })

  it("완전 목록 사전일 때만 게임별로 거른다", () => {
    const partial = parseBook({ items: { a: [{}] } }, "g")
    expect(hasItemBook(partial)).toBe(false)
    expect(allowedItems(partial).size).toBe(0)
    const complete = parseBook(
      { completeItemList: true, items: { a: [{}], b: [] } },
      "g"
    )
    expect(hasItemBook(complete)).toBe(true)
    expect([...allowedItems(complete)].sort()).toEqual(["a", "b"])
    expect(hasItemBook(null)).toBe(false)
  })
})

describe("아이템 입수처 (itemSources)", () => {
  const book = parseBook(
    {
      items: {
        "power-band": [
          { where: "unova-route-13", versions: ["white-2"] },
          { where: "plasma-frigate", versions: ["black-2"] },
        ],
        "power-lens": [{ where: "plasma-frigate", versions: ["black-2"] }],
        "choice-band": [],
      },
    },
    "black-2-white-2"
  )

  it("버전 없이: 버전 한정 줄은 약칭 접두", () => {
    expect(itemSources(book, "power-band", options)).toEqual([
      "W2 — 13번 도로",
      "B2 — 플라스마 프리깃",
    ])
  })

  it("버전을 주면 그 버전 줄만, 없으면 '다른 버전 한정'", () => {
    expect(
      itemSources(book, "power-band", { ...options, version: "white-2" })
    ).toEqual(["13번 도로"])
    expect(
      itemSources(book, "power-lens", { ...options, version: "white-2" })
    ).toEqual(["이 버전에서는 얻을 수 없어요(다른 버전 한정)"])
  })

  it("항목이 없거나 사전이 없으면 []", () => {
    expect(itemSources(book, "choice-band", options)).toEqual([])
    expect(itemSources(book, "nothing", options)).toEqual([])
    expect(itemSources(null, "power-band", options)).toEqual([])
  })
})

// 묶어 둔 실제 사전 파일이 모두 읽힌다(다른 작업이 채우는 중이어도 모양은 지킨다)
const FILES = import.meta.glob<unknown>(
  "../../data/bundled/acquisition/*.json",
  { import: "default", eager: true }
)

describe("묶어 둔 사전", () => {
  it("30개 파일 모두 읽히고, 줄마다 글자를 만든다", () => {
    const entries = Object.entries(FILES)
    expect(entries.length).toBeGreaterThanOrEqual(30)
    for (const [path, raw] of entries) {
      const key = path.replace(/^.*\//, "").replace(/\.json$/, "")
      const book = parseBook(raw, key)
      expect(book.versionGroup).toBe(key)
      for (const [item] of book.items)
        for (const line of itemSources(book, item, options))
          expect(typeof line).toBe("string")
    }
  })
})
