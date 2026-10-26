import { describe, expect, it } from "vitest"
import { formatDexNumber } from "./dex"

describe("formatDexNumber", () => {
  it("세 자리보다 짧으면 앞을 0으로 채운다", () => {
    expect(formatDexNumber(1)).toBe("No.001")
    expect(formatDexNumber(25)).toBe("No.025")
  })
  it("세 자리 이상이면 그대로 둔다", () => {
    expect(formatDexNumber(493)).toBe("No.493")
    expect(formatDexNumber(1025)).toBe("No.1025")
  })
})
