/**
 * 앱 설정 · 전역 상태 (Qt AppState 이식). localStorage["pokesix.settings"]에 한 덩어리로 저장한다.
 * 저장값은 믿지 않는다 — parseSettings가 칸마다 좁히고, 틀린 칸만 기본값으로 돌린다.
 */
import { useStore } from "zustand"
import { createStore } from "zustand/vanilla"

import {
  DEFAULT_GENERATION,
  isGeneration,
  MAX_GENERATION,
  MIN_GENERATION,
  type Generation,
} from "../shared/generations.ts"
import { isLang, type Lang } from "../shared/text.ts"

export type ThemeChoice = "light" | "dark" | "system"
export type Density = "compact" | "standard"
export type SplitRule = "auto" | "type" | "move"

export interface Settings {
  schema: 1
  generation: Generation
  /** 세대마다 고른 게임(버전 identifier, 예 "soulsilver"). 없음 = 고르지 않음 */
  games: Partial<Record<Generation, string>>
  /** 화면 글자(버튼 · 제목) 언어 */
  uiLanguage: Lang
  /** 포켓몬 · 기술 · 아이템 이름 표기 언어 */
  nameLanguage: Lang
  showOriginalName: boolean
  theme: ThemeChoice
  density: Density
  splitRule: SplitRule
  hideFairyBeforeGen6: boolean
  steelLegacyResist: boolean
  useHistoricTypes: boolean
  useHistoricStats: boolean
  checkOnStart: boolean
  /** 에디터가 마지막으로 연 폴더 (Electron) */
  editorLastDir?: string
}

export type BooleanSetting =
  | "showOriginalName"
  | "hideFairyBeforeGen6"
  | "steelLegacyResist"
  | "useHistoricTypes"
  | "useHistoricStats"
  | "checkOnStart"

export const SETTINGS_KEY = "pokesix.settings"

export const DEFAULT_SETTINGS: Settings = {
  schema: 1,
  generation: DEFAULT_GENERATION,
  games: {},
  uiLanguage: "ko",
  nameLanguage: "ko",
  showOriginalName: false,
  theme: "system",
  density: "standard",
  splitRule: "auto",
  hideFairyBeforeGen6: true,
  steelLegacyResist: true,
  useHistoricTypes: true,
  useHistoricStats: true,
  checkOnStart: true,
}

const GAME_ID = /^[a-z0-9-]+$/

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

function pickBool(o: Record<string, unknown>, key: BooleanSetting): boolean {
  const v = o[key]
  return typeof v === "boolean" ? v : DEFAULT_SETTINGS[key]
}

function parseGames(v: unknown): Partial<Record<Generation, string>> {
  const out: Partial<Record<Generation, string>> = {}
  if (!isRecord(v)) return out
  for (const [key, value] of Object.entries(v)) {
    const g = Number(key)
    if (!/^[1-9]$/.test(key) || !isGeneration(g)) continue
    if (typeof value === "string" && value !== "" && GAME_ID.test(value))
      out[g] = value
  }
  return out
}

/** 저장값(믿을 수 없음) → Settings. 절대 던지지 않는다 */
export function parseSettings(raw: unknown): Settings {
  if (!isRecord(raw)) return { ...DEFAULT_SETTINGS, games: {} }
  const o = raw
  const theme = o.theme === "light" || o.theme === "dark" ? o.theme : "system"
  const density = o.density === "compact" ? "compact" : "standard"
  const splitRule =
    o.splitRule === "type" || o.splitRule === "move" ? o.splitRule : "auto"
  const settings: Settings = {
    schema: 1,
    generation: isGeneration(o.generation) ? o.generation : DEFAULT_GENERATION,
    games: parseGames(o.games),
    uiLanguage: isLang(o.uiLanguage) ? o.uiLanguage : "ko",
    nameLanguage: isLang(o.nameLanguage) ? o.nameLanguage : "ko",
    showOriginalName: pickBool(o, "showOriginalName"),
    theme,
    density,
    splitRule,
    hideFairyBeforeGen6: pickBool(o, "hideFairyBeforeGen6"),
    steelLegacyResist: pickBool(o, "steelLegacyResist"),
    useHistoricTypes: pickBool(o, "useHistoricTypes"),
    useHistoricStats: pickBool(o, "useHistoricStats"),
    checkOnStart: pickBool(o, "checkOnStart"),
  }
  if (typeof o.editorLastDir === "string" && o.editorLastDir !== "")
    settings.editorLastDir = o.editorLastDir
  return settings
}

/** 저장 칸 — 테스트는 메모리 칸을 넘긴다 */
export interface SettingsStorage {
  read(): string | null
  write(value: string): void
}

export const localSettingsStorage: SettingsStorage = {
  read: () => {
    try {
      return localStorage.getItem(SETTINGS_KEY)
    } catch {
      return null
    }
  },
  write: (value) => {
    try {
      localStorage.setItem(SETTINGS_KEY, value)
    } catch {
      // 저장 못 해도 이번 실행은 계속 쓴다
    }
  },
}

export function loadSettings(storage: SettingsStorage): Settings {
  const raw = storage.read()
  if (raw === null) return parseSettings(null)
  try {
    return parseSettings(JSON.parse(raw) as unknown)
  } catch {
    return parseSettings(null)
  }
}

export interface SettingsActions {
  setGeneration(g: number): void
  /** 지금 세대의 게임(버전)을 고른다 */
  setGame(version: string): void
  /** 세대를 지정해 게임을 고른다(홈의 최근 스쿼드처럼 세대와 함께 바꿀 때) */
  setGameFor(g: Generation, version: string): void
  setUiLanguage(l: Lang): void
  setNameLanguage(l: Lang): void
  setTheme(t: ThemeChoice): void
  setDensity(d: Density): void
  setSplitRule(r: SplitRule): void
  setFlag(key: BooleanSetting, value: boolean): void
  setEditorLastDir(dir: string): void
}

export type SettingsState = Settings & SettingsActions

/** 액션을 뺀 순수 설정 값 */
export function settingsOf(s: SettingsState): Settings {
  const {
    schema,
    generation,
    games,
    uiLanguage,
    nameLanguage,
    showOriginalName,
    theme,
    density,
    splitRule,
  } = s
  const out: Settings = {
    schema,
    generation,
    games,
    uiLanguage,
    nameLanguage,
    showOriginalName,
    theme,
    density,
    splitRule,
    hideFairyBeforeGen6: s.hideFairyBeforeGen6,
    steelLegacyResist: s.steelLegacyResist,
    useHistoricTypes: s.useHistoricTypes,
    useHistoricStats: s.useHistoricStats,
    checkOnStart: s.checkOnStart,
  }
  if (s.editorLastDir) out.editorLastDir = s.editorLastDir
  return out
}

/** 설정 저장소를 만든다. 바뀔 때마다 바로 저장한다(Qt도 set마다 QSettings에 썼다) */
export function createSettingsStore(storage: SettingsStorage) {
  return createStore<SettingsState>()((set, get) => {
    const commit = (patch: Partial<Settings>) => {
      set(patch)
      storage.write(JSON.stringify(settingsOf(get())))
    }
    return {
      ...loadSettings(storage),
      setGeneration(g) {
        if (!Number.isInteger(g) || g < MIN_GENERATION || g > MAX_GENERATION)
          return
        if (g === get().generation || !isGeneration(g)) return
        commit({ generation: g })
      },
      setGame(version) {
        get().setGameFor(get().generation, version)
      },
      setGameFor(g, version) {
        if (
          version === "" ||
          !GAME_ID.test(version) ||
          get().games[g] === version
        )
          return
        commit({ games: { ...get().games, [g]: version } })
      },
      setUiLanguage(l) {
        if (l !== get().uiLanguage && isLang(l)) commit({ uiLanguage: l })
      },
      setNameLanguage(l) {
        if (l !== get().nameLanguage && isLang(l)) commit({ nameLanguage: l })
      },
      setTheme(t) {
        if (t !== get().theme) commit({ theme: t })
      },
      setDensity(d) {
        if (d !== get().density) commit({ density: d })
      },
      setSplitRule(r) {
        if (r !== get().splitRule) commit({ splitRule: r })
      },
      setFlag(key, value) {
        if (get()[key] !== value) commit({ [key]: value })
      },
      setEditorLastDir(dir) {
        if (dir !== "" && dir !== get().editorLastDir)
          commit({ editorLastDir: dir })
      },
    }
  })
}

export type SettingsStore = ReturnType<typeof createSettingsStore>

/** 앱 전체가 쓰는 설정 저장소 하나 */
export const settingsStore: SettingsStore =
  createSettingsStore(localSettingsStorage)

/** 고른 조각만 구독한다: useSettings((s) => s.theme) */
export function useSettings<T>(selector: (s: SettingsState) => T): T {
  return useStore(settingsStore, selector)
}

export const useGeneration = (): Generation => useSettings((s) => s.generation)
/** 지금 세대에서 고른 게임(버전). 없으면 "" */
export const useGame = (): string =>
  useSettings((s) => s.games[s.generation] ?? "")
export const useNameLanguage = (): Lang => useSettings((s) => s.nameLanguage)
export const useUiLanguage = (): Lang => useSettings((s) => s.uiLanguage)

/** 액션 묶음 (렌더와 상관없이 부를 때) */
export const settingsActions = (): SettingsActions => settingsStore.getState()
