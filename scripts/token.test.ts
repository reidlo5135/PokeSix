import { describe, expect, it } from "vitest"
import { buildTokenCss, toCssName, type Tokens } from "./token.ts"

describe("toCssName", () => {
  it("점은 하이픈, 대문자는 하이픈 + 소문자", () => {
    expect(toCssName("color", "red.deep")).toBe("--color-red-deep")
    expect(toCssName("size", "appBar")).toBe("--size-app-bar")
  })
})

describe("buildTokenCss", () => {
  const tiny: Tokens = {
    color: {
      light: { red: "#D8322B" },
      darkOverrides: { red: "#B8241D" },
      lightStates: {},
      darkStates: {},
    },
    type: [{ key: "fire", fill: "#CC4A22", text: "#FFFFFF" }],
    size: { appBar: 60 },
    space: [4, 8],
  }
  it("라이트는 :root, 다크는 [data-theme] 안에", () => {
    const css = buildTokenCss(tiny)
    expect(css).toContain("--color-red: #D8322B;")
    expect(css).toContain("--type-fire-text: #FFFFFF;")
    expect(css).toContain("--size-app-bar: 60px;")
    expect(css).toContain("--space-2: 8px;")
    expect(css).toContain('[data-theme="dark"] {\n  --color-red: #B8241D;')
  })
})
