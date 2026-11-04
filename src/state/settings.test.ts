import { describe, expect, it } from "vitest"

import {
  createSettingsStore,
  DEFAULT_SETTINGS,
  parseSettings,
  type SettingsStorage,
} from "./settings.ts"

function memory(
  initial: string | null = null
): SettingsStorage & { value: string | null; writes: number } {
  const m = {
    value: initial,
    writes: 0,
    read: () => m.value,
    write: (v: string) => {
      m.value = v
      m.writes++
    },
  }
  return m
}

describe("parseSettings", () => {
  it("쓰레기 값은 기본값", () => {
    for (const raw of [null, undefined, 42, "x", [], true])
      expect(parseSettings(raw)).toEqual(DEFAULT_SETTINGS)
  })

  it("일부만 있으면 나머지는 기본값", () => {
    const s = parseSettings({ generation: 2, theme: "dark" })
    expect(s.generation).toBe(2)
    expect(s.theme).toBe("dark")
    expect(s.nameLanguage).toBe("ko")
    expect(s.hideFairyBeforeGen6).toBe(true)
  })

  it("세대가 1–9 밖이거나 정수가 아니면 4", () => {
    for (const g of [0, 10, -1, 4.5, "5", null])
      expect(parseSettings({ generation: g }).generation).toBe(4)
    expect(parseSettings({ generation: 9 }).generation).toBe(9)
  })

  it("모르는 테마는 system, 모르는 언어는 ko", () => {
    expect(parseSettings({ theme: "sepia" }).theme).toBe("system")
    expect(
      parseSettings({ uiLanguage: "de", nameLanguage: "KO" })
    ).toMatchObject({ uiLanguage: "ko", nameLanguage: "ko" })
    expect(
      parseSettings({ uiLanguage: "ja", nameLanguage: "en" })
    ).toMatchObject({ uiLanguage: "ja", nameLanguage: "en" })
  })

  it("games는 1–9 키 + 소문자 · 숫자 · 하이픈 값만", () => {
    const s = parseSettings({
      games: {
        "4": "platinum",
        "2": "",
        "10": "x",
        "0": "red",
        "3": "Ruby",
        "5": "black-2",
        a: "b",
        "6": 7,
      },
    })
    expect(s.games).toEqual({ 4: "platinum", 5: "black-2" })
  })

  it("불린이 아닌 토글은 기본값", () => {
    expect(
      parseSettings({ showOriginalName: "yes", steelLegacyResist: false })
    ).toMatchObject({
      showOriginalName: false,
      steelLegacyResist: false,
    })
  })

  it("밀도 · 판정 규칙", () => {
    expect(
      parseSettings({ density: "compact", splitRule: "move" })
    ).toMatchObject({ density: "compact", splitRule: "move" })
    expect(parseSettings({ density: "tiny", splitRule: "x" })).toMatchObject({
      density: "standard",
      splitRule: "auto",
    })
  })
})

describe("설정 저장소", () => {
  it("깨진 JSON이면 기본값으로 시작한다", () => {
    const store = createSettingsStore(memory("{not json"))
    expect(store.getState().generation).toBe(4)
  })

  it("저장값을 읽어 시작한다", () => {
    const store = createSettingsStore(
      memory(JSON.stringify({ generation: 7, theme: "light" }))
    )
    expect(store.getState()).toMatchObject({ generation: 7, theme: "light" })
  })

  it("setGeneration: 범위 밖 · 같은 값은 무시, 바뀌면 바로 저장", () => {
    const storage = memory()
    const store = createSettingsStore(storage)
    const s = store.getState()
    s.setGeneration(0)
    s.setGeneration(10)
    s.setGeneration(4)
    s.setGeneration(2.5)
    expect(storage.writes).toBe(0)
    store.getState().setGeneration(6)
    expect(store.getState().generation).toBe(6)
    expect(storage.writes).toBe(1)
    expect(JSON.parse(storage.value ?? "{}")).toMatchObject({ generation: 6 })
  })

  it("setGame은 지금 세대에 저장하고 빈 값 · 같은 값은 무시", () => {
    const storage = memory()
    const store = createSettingsStore(storage)
    store.getState().setGame("")
    store.getState().setGame("platinum")
    store.getState().setGame("platinum")
    expect(store.getState().games).toEqual({ 4: "platinum" })
    expect(storage.writes).toBe(1)
    store.getState().setGameFor(2, "crystal")
    expect(store.getState().games).toEqual({ 4: "platinum", 2: "crystal" })
  })

  it("테마 · 언어 · 토글도 같은 값이면 쓰지 않는다", () => {
    const storage = memory()
    const store = createSettingsStore(storage)
    store.getState().setTheme("system")
    store.getState().setNameLanguage("ko")
    store.getState().setFlag("checkOnStart", true)
    expect(storage.writes).toBe(0)
    store.getState().setTheme("dark")
    store.getState().setUiLanguage("en")
    store.getState().setFlag("checkOnStart", false)
    expect(storage.writes).toBe(3)
    expect(parseSettings(JSON.parse(storage.value ?? "{}"))).toMatchObject({
      theme: "dark",
      uiLanguage: "en",
      checkOnStart: false,
    })
  })
})
