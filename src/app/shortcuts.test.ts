import { describe, expect, it } from "vitest"

import { shortcutAction, type KeyLike } from "./shortcuts.ts"
import {
  barVariant,
  dexTabHref,
  iconOnlyTabs,
  tabOfPath,
  TABS,
} from "./tabs.ts"

const key = (code: string, mods: Partial<KeyLike> = {}): KeyLike => ({
  code,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
})

describe("shortcutAction", () => {
  it("Ctrl+1…7 → 홈 · 도감 · 아이템 · 스쿼드 · 에디터 · 타운맵 · 설정", () => {
    const tabs = [1, 2, 3, 4, 5, 6, 7].map((n) =>
      shortcutAction(key(`Digit${n}`, { ctrlKey: true }), false)
    )
    expect(tabs).toEqual(
      ["home", "dex", "items", "squad", "editor", "townmap", "settings"].map(
        (tab) => ({ type: "tab", tab })
      )
    )
  })
  it("숫자 패드도 된다", () => {
    expect(shortcutAction(key("Numpad3", { ctrlKey: true }), false)).toEqual({
      type: "tab",
      tab: "items",
    })
  })
  it("Ctrl+K → 검색 (한글 입력 중에도 code는 KeyK)", () => {
    expect(shortcutAction(key("KeyK", { ctrlKey: true }), false)).toEqual({
      type: "search",
    })
  })
  it("Ctrl+0 · Ctrl+8은 쓰지 않는다", () => {
    expect(shortcutAction(key("Digit0", { ctrlKey: true }), false)).toBeNull()
    expect(shortcutAction(key("Digit8", { ctrlKey: true }), false)).toBeNull()
  })
  it("수식키가 없거나 더 붙으면 무시", () => {
    expect(shortcutAction(key("Digit1"), false)).toBeNull()
    expect(
      shortcutAction(key("Digit1", { ctrlKey: true, shiftKey: true }), false)
    ).toBeNull()
    expect(
      shortcutAction(key("KeyK", { ctrlKey: true, altKey: true }), false)
    ).toBeNull()
  })
  it("macOS는 ⌘, Ctrl은 무시", () => {
    expect(shortcutAction(key("Digit2", { metaKey: true }), true)).toEqual({
      type: "tab",
      tab: "dex",
    })
    expect(shortcutAction(key("Digit2", { ctrlKey: true }), true)).toBeNull()
    expect(shortcutAction(key("Digit2", { metaKey: true }), false)).toBeNull()
  })
})

describe("탭", () => {
  it("v3 순서 7개", () => {
    expect(TABS.map((t) => t.label)).toEqual([
      "홈",
      "도감",
      "아이템",
      "스쿼드",
      "에디터",
      "타운맵",
      "설정",
    ])
  })
  it("경로 → 탭", () => {
    expect(tabOfPath("/")).toBe("home")
    expect(tabOfPath("/dex")).toBe("dex")
    expect(tabOfPath("/dex/445")).toBe("dex")
    expect(tabOfPath("/settings")).toBe("settings")
    expect(tabOfPath("/nope")).toBeNull()
  })
  it("barVariant 경계", () => {
    expect(barVariant(1440)).toBe("wide")
    expect(barVariant(1360)).toBe("wide")
    expect(barVariant(1359)).toBe("medium")
    expect(barVariant(1100)).toBe("medium")
    expect(barVariant(1099)).toBe("narrow")
    expect(barVariant(1024)).toBe("narrow")
    expect(barVariant(1023)).toBe("min")
    expect(barVariant(960)).toBe("min")
  })
  it("아이콘만 남는 탭: 설정 → 타운맵 → 에디터", () => {
    expect([...iconOnlyTabs("wide")]).toEqual([])
    expect([...iconOnlyTabs("medium")]).toEqual([])
    expect([...iconOnlyTabs("narrow")]).toEqual(["settings"])
    expect([...iconOnlyTabs("min")]).toEqual(["settings", "townmap", "editor"])
  })
  it("도감 탭: 도감 안에서 다시 누르면 목록, 밖에서는 마지막 위치", () => {
    expect(dexTabHref("/dex/445", "/dex/445")).toBe("/dex")
    expect(dexTabHref("/dex", "/dex")).toBe("/dex")
    expect(dexTabHref("/items", "/dex/445")).toBe("/dex/445")
  })
})
