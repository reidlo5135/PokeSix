import { describe, expect, it } from "vitest"

import { resolveTheme } from "./theme.ts"

describe("resolveTheme", () => {
  it.each([
    ["light", false, "light"],
    ["light", true, "light"],
    ["dark", false, "dark"],
    ["dark", true, "dark"],
    ["system", false, "light"],
    ["system", true, "dark"],
  ] as const)("%s + 시스템 다크 %s → %s", (choice, systemDark, expected) => {
    expect(resolveTheme(choice, systemDark)).toBe(expected)
  })
})
