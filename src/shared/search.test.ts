import { describe, expect, it } from "vitest"

import { effectiveQuery, matchesQuery } from "./search.ts"

describe("effectiveQuery (한글 조합 규칙)", () => {
  it("자모만 조합 중이면 뺀다", () => {
    expect(effectiveQuery("ㅇ", true)).toBe("")
    expect(effectiveQuery("피카ㅊ", true)).toBe("피카")
    expect(effectiveQuery("ㄱㄴ", true)).toBe("")
  })
  it("완성된 음절은 조합 중이어도 바로 쓴다", () => {
    expect(effectiveQuery("이", true)).toBe("이")
    expect(effectiveQuery("피카", true)).toBe("피카")
  })
  it("조합 중이 아니면 그대로", () => {
    expect(effectiveQuery("ㅇ", false)).toBe("ㅇ")
    expect(effectiveQuery("pika", false)).toBe("pika")
  })
})

describe("matchesQuery", () => {
  it("대소문자 무시 부분 일치", () => {
    expect(matchesQuery("445 Garchomp 한카리아스 ガブリアス", "garch")).toBe(
      true
    )
    expect(matchesQuery("445 Garchomp 한카리아스", "카리")).toBe(true)
    expect(matchesQuery("445 Garchomp", "  445 ")).toBe(true)
  })
  it("빈 질의는 맞지 않는다", () => {
    expect(matchesQuery("abc", "   ")).toBe(false)
  })
})
