import { describe, expect, it } from "vitest"

import {
  catalogEntry,
  catalogKeys,
  ctx,
  format,
  lookup,
  translate,
} from "./index.ts"
import { CTX_SEPARATOR } from "./types.ts"

describe("format", () => {
  it("%1 … %9를 왼쪽부터 바꾼다", () => {
    expect(format("%1세대 %2", 4, "신오")).toBe("4세대 신오")
    expect(format("%2 / %1", "a", "b")).toBe("b / a")
  })
  it("인자 안의 %n은 다시 바꾸지 않는다 · 없는 인자는 그대로", () => {
    expect(format("%1 %2", "%2", "x")).toBe("%2 x")
    expect(format("%1 %3", "a")).toBe("a %3")
  })
})

describe("lookup", () => {
  it("한국어는 원문 그대로 (맥락은 뗀다)", () => {
    expect(lookup("ko", "홈")).toBe("홈")
    expect(lookup("ko", ctx("기술", "GlobalSearch"))).toBe("기술")
  })
  it("맥락 키 → 맥락 없는 키 → 원문", () => {
    expect(lookup("en", ctx("기술", "GlobalSearch"))).toBe("Moves")
    expect(lookup("en", ctx("기술", "어딘가"))).toBe("Move")
    expect(lookup("en", "사전에 없는 글")).toBe("사전에 없는 글")
  })
  it("번역 + 자리표시자", () => {
    expect(translate("en", "세대 선택: %1", "Gen 4")).toBe(
      "Choose generation: Gen 4"
    )
    expect(translate("ja", "%1마리", 107)).toBe("107匹")
  })
})

// 소스의 t("…") · t(ctx("…", "…")) · tKey("…") 글자가 모두 사전에 있는지 (Qt lupdate 대신)
const SOURCES = import.meta.glob<string>(
  ["/src/**/*.{ts,tsx}", "!/src/**/*.test.{ts,tsx}", "!/src/i18n/**"],
  {
    query: "?raw",
    import: "default",
    eager: true,
  }
)

const STRING = String.raw`"((?:[^"\\]|\\.)*)"`
const unescape = (s: string): string => JSON.parse(`"${s}"`) as string
const PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [new RegExp(String.raw`\bt\(\s*` + STRING, "g"), (m) => unescape(m[1])],
  [new RegExp(String.raw`\btKey\(\s*` + STRING, "g"), (m) => unescape(m[1])],
  [
    new RegExp(
      String.raw`\bt\(\s*ctx\(\s*` + STRING + String.raw`\s*,\s*` + STRING,
      "g"
    ),
    (m) => `${unescape(m[1])}${CTX_SEPARATOR}${unescape(m[2])}`,
  ],
]

function usedKeys(): Map<string, string> {
  const out = new Map<string, string>()
  for (const [file, text] of Object.entries(SOURCES))
    for (const [re, key] of PATTERNS)
      for (const m of text.matchAll(re)) out.set(key(m), file)
  return out
}

describe("사전", () => {
  it("소스를 찾았다", () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(10)
    expect(usedKeys().size).toBeGreaterThan(50)
  })
  it("모든 t() 글자에 en · ja 번역이 있다", () => {
    const missing = [...usedKeys()].filter(([key]) => {
      const e = catalogEntry(key)
      return !e || e.en.trim() === "" || e.ja.trim() === ""
    })
    expect(missing.map(([key, file]) => `${file}: ${key}`)).toEqual([])
  })
  it("번역문의 자리표시자가 원문과 같다", () => {
    const bad = catalogKeys().filter((key) => {
      const source = key.split(CTX_SEPARATOR)[0]
      const want = (source.match(/%[1-9]/g) ?? []).sort().join()
      const e = catalogEntry(key)
      return (
        !e ||
        (e.en.match(/%[1-9]/g) ?? []).sort().join() !== want ||
        (e.ja.match(/%[1-9]/g) ?? []).sort().join() !== want
      )
    })
    expect(bad).toEqual([])
  })
})
