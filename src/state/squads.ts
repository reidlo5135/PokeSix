/**
 * 스쿼드 저장소 — Qt squads.json(형식 version 2)과 같은 모양을 localStorage["pokesix.squads"]에 둔다.
 * 세대 → 게임(버전 키, 예 "soulsilver") → 스쿼드 하나. 옛 파일의 게임 묶음 키("heartgold-soulsilver")도 그대로 둔다.
 *
 * 새로 더한 칸: 세대 항목의 "updated": { 게임 키: epoch ms } — 홈 "최근 스쿼드" 순서용.
 * Qt는 모르는 키를 무시하므로 파일을 주고받아도 깨지지 않는다(Qt에서 온 스쿼드는 시각 0).
 *
 * 저장값은 믿지 않는다: 값 하나 규칙(정수 칸은 정수만, 아니면 0 · 글자 칸은 글자만, 아니면 "")으로 좁힌다.
 * setSquad는 메모리만 바꾸고 600ms 뒤 한 번 쓴다(디바운스). 창을 닫을 때(pagehide)는 바로 쓴다.
 */
import { useStore } from "zustand"
import { createStore } from "zustand/vanilla"

import {
  isGeneration,
  REPRESENTATIVE_VERSION_GROUP,
  type Generation,
} from "../shared/generations.ts"

export const SQUADS_KEY = "pokesix.squads"
export const SQUAD_FORMAT_VERSION = 2
export const SQUAD_SIZE = 6
export const MOVES_PER_MEMBER = 4
export const MEMO_LENGTH = 40
export const SAVE_DELAY_MS = 600

/** 스쿼드 한 자리. id만 둔다(이름 · 타입은 그 세대 값으로 DB에서 다시 읽는다) */
export interface SquadMember {
  /** 0 = 빈 자리 */
  pokemonId: number
  memo: string
  /** 기술 id 4칸, 0 = 빈 칸 */
  moves: number[]
  abilityId: number
  natureId: number
  itemId: number
  /** 세이브에서 가져온 개체만 (0 = 모름) */
  level: number
  /** 인게임 능력치 HP · 공격 · 방어 · 특공 · 특방 · 스피드 (level > 0일 때만 의미) */
  stats: number[]
}

export interface Squad {
  name: string
  /** 늘 6칸 */
  members: SquadMember[]
  /** 비전셔틀(7번째) — 분석 · 채운 수에 넣지 않는다 */
  shuttle: SquadMember
}

export interface GenerationSquads {
  /** 그 세대에서 마지막에 본 게임 키 ("" = 없음) */
  current: string
  games: Record<string, Squad>
  /** 게임 키 → 마지막으로 고친 때(epoch ms) */
  updated: Record<string, number>
}

export interface SquadsDocument {
  version: 2
  squads: Partial<Record<Generation, GenerationSquads>>
}

export const emptyMember = (): SquadMember => ({
  pokemonId: 0,
  memo: "",
  moves: [0, 0, 0, 0],
  abilityId: 0,
  natureId: 0,
  itemId: 0,
  level: 0,
  stats: [0, 0, 0, 0, 0, 0],
})

export const emptySquad = (): Squad => ({
  name: "",
  members: Array.from({ length: SQUAD_SIZE }, emptyMember),
  shuttle: emptyMember(),
})

export const emptyDocument = (): SquadsDocument => ({ version: 2, squads: {} })

export const isEmptyMember = (m: SquadMember): boolean => m.pokemonId <= 0

/** 채운 자리 수 (셔틀 제외) */
export const filledCount = (s: Squad): number =>
  s.members.filter((m) => !isEmptyMember(m)).length

// ── 값 하나 읽기 (Qt QJsonValue 규칙) ──
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)
const int = (v: unknown): number =>
  typeof v === "number" && Number.isInteger(v) ? v : 0
const string = (v: unknown): string => (typeof v === "string" ? v : "")
const intArray = (v: unknown, length: number): number[] => {
  const src = Array.isArray(v) ? v : []
  return Array.from({ length }, (_, i) => int(src[i]))
}

export function memberFromJson(raw: unknown): SquadMember {
  const o = isRecord(raw) ? raw : {}
  return {
    pokemonId: int(o.pokemon),
    memo: [...string(o.memo)].slice(0, MEMO_LENGTH).join(""),
    moves: intArray(o.moves, MOVES_PER_MEMBER),
    abilityId: int(o.ability),
    natureId: int(o.nature),
    itemId: int(o.item),
    level: int(o.level),
    stats: intArray(o.stats, 6),
  }
}

export function squadFromJson(raw: unknown): Squad {
  const o = isRecord(raw) ? raw : {}
  const list = Array.isArray(o.members) ? o.members : []
  return {
    name: string(o.name),
    members: Array.from({ length: SQUAD_SIZE }, (_, i) =>
      memberFromJson(list[i])
    ),
    shuttle: memberFromJson(o.shuttle),
  }
}

/** Qt와 같은 키. level · stats는 세이브에서 온 개체(level > 0)만 쓴다 */
export function memberToJson(m: SquadMember): Record<string, unknown> {
  const json: Record<string, unknown> = {
    pokemon: m.pokemonId,
    memo: m.memo,
    moves: m.moves.slice(0, MOVES_PER_MEMBER),
    ability: m.abilityId,
    nature: m.natureId,
    item: m.itemId,
  }
  if (m.level > 0) {
    json.level = m.level
    json.stats = m.stats.slice(0, 6)
  }
  return json
}

/** 셔틀은 비어 있지 않을 때만 쓴다 */
export function squadToJson(s: Squad): Record<string, unknown> {
  const json: Record<string, unknown> = {
    name: s.name,
    members: s.members.map(memberToJson),
  }
  if (!isEmptyMember(s.shuttle)) json.shuttle = memberToJson(s.shuttle)
  return json
}

/** 저장값(믿을 수 없음) → 문서. 깨졌으면 빈 문서. version 1(세대마다 스쿼드 하나)은 그 게임 키로 옮긴다 */
export function parseSquadsDocument(raw: unknown): SquadsDocument {
  const doc = emptyDocument()
  if (!isRecord(raw)) return doc
  const version =
    typeof raw.version === "number" && Number.isInteger(raw.version)
      ? raw.version
      : 1
  const squads = isRecord(raw.squads) ? raw.squads : {}
  for (const [key, entry] of Object.entries(squads)) {
    const g = Number(key)
    if (!/^\d+$/.test(key) || !isGeneration(g)) continue
    const e = isRecord(entry) ? entry : {}
    if (version < 2) {
      const game = string(e.versionGroup) || REPRESENTATIVE_VERSION_GROUP[g]
      doc.squads[g] = {
        current: game,
        games: { [game]: squadFromJson(e) },
        updated: {},
      }
      continue
    }
    const games: Record<string, Squad> = {}
    if (isRecord(e.games))
      for (const [game, value] of Object.entries(e.games))
        games[game] = squadFromJson(value)
    const updated: Record<string, number> = {}
    if (isRecord(e.updated))
      for (const [game, t] of Object.entries(e.updated))
        if (typeof t === "number" && Number.isFinite(t) && t >= 0)
          updated[game] = t
    doc.squads[g] = { current: string(e.current), games, updated }
  }
  return doc
}

/** 키를 사전순으로 (Qt QJsonObject와 같은 순서) */
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (!isRecord(v)) return v
  return Object.fromEntries(
    Object.keys(v)
      .sort()
      .map((k) => [k, sortKeys(v[k])])
  )
}

/** 문서 → JSON 글 (Qt 쓰기 서식: 4칸 들여쓰기 · 키 정렬 · 끝 줄바꿈) */
export function serializeSquadsDocument(doc: SquadsDocument): string {
  const squads: Record<string, unknown> = {}
  for (const [g, entry] of Object.entries(doc.squads)) {
    if (!entry) continue
    const games: Record<string, unknown> = {}
    for (const [game, squad] of Object.entries(entry.games))
      games[game] = squadToJson(squad)
    squads[g] = { current: entry.current, games, updated: entry.updated }
  }
  return (
    JSON.stringify(
      sortKeys({ version: SQUAD_FORMAT_VERSION, squads }),
      null,
      4
    ) + "\n"
  )
}

const sameSquad = (a: Squad, b: Squad): boolean =>
  JSON.stringify(squadToJson(a)) === JSON.stringify(squadToJson(b))

// ── 최근 스쿼드 (홈) ──

export interface SquadEntry {
  generation: Generation
  /** 게임 키 (버전 또는 옛 묶음) */
  game: string
  squad: Squad
  /** 0 = 모름(Qt에서 온 스쿼드) */
  updatedAt: number
}

export function squadEntries(doc: SquadsDocument): SquadEntry[] {
  const out: SquadEntry[] = []
  for (const [key, entry] of Object.entries(doc.squads)) {
    const g = Number(key)
    if (!entry || !isGeneration(g)) continue
    for (const [game, squad] of Object.entries(entry.games))
      out.push({
        generation: g,
        game,
        squad,
        updatedAt: entry.updated[game] ?? 0,
      })
  }
  return out
}

/** 이름이 있거나 한 자리라도 채운 스쿼드를 최근 고친 순으로 (같으면 높은 세대 먼저) */
export function recentSquads(
  all: readonly SquadEntry[],
  limit = 3
): SquadEntry[] {
  return all
    .filter(
      (e) =>
        e.squad.members.some((m) => m.pokemonId > 0) ||
        e.squad.name.trim() !== ""
    )
    .slice()
    .sort(
      (a, b) =>
        b.updatedAt - a.updatedAt ||
        b.generation - a.generation ||
        a.game.localeCompare(b.game)
    )
    .slice(0, limit)
}

// ── 문제 수 (스쿼드 분석기가 등록한다) ──

export type SquadProblemCounter = (entry: SquadEntry) => number | null

let problemCounter: SquadProblemCounter | null = null

/** 스쿼드 화면이 분석기를 등록하면 홈 최근 스쿼드에 "문제 n" 알약이 나온다 */
export function registerSquadProblemCounter(
  counter: SquadProblemCounter | null
): void {
  problemCounter = counter
}

/** 등록된 분석기가 없으면 null */
export function squadProblemCount(entry: SquadEntry): number | null {
  if (filledCount(entry.squad) === 0) return null
  try {
    return problemCounter?.(entry) ?? null
  } catch {
    return null
  }
}

// ── 저장소 ──

export interface SquadStorage {
  read(): string | null
  /** 실패하면 false */
  write(value: string): boolean
}

export const localSquadStorage: SquadStorage = {
  read: () => {
    try {
      return localStorage.getItem(SQUADS_KEY)
    } catch {
      return null
    }
  },
  write: (value) => {
    try {
      localStorage.setItem(SQUADS_KEY, value)
      return true
    } catch {
      return false
    }
  },
}

/** pending = 저장 기다림("저장 중…") · saved = "자동 저장됨" · failed = "저장하지 못했어요" */
export type SaveState = "idle" | "pending" | "saved" | "failed"

export interface SquadStoreState {
  doc: SquadsDocument
  saveState: SaveState
}

export interface SquadStoreApi {
  /** 그 게임의 스쿼드(없으면 빈 스쿼드) */
  squad(g: Generation, game: string): Squad
  hasSquad(g: Generation, game: string): boolean
  /** 같은 값이면(키가 있을 때만 비교) 아무것도 안 한다. now = 시각(테스트용) */
  setSquad(g: Generation, game: string, squad: Squad, now?: number): void
  currentGame(g: Generation): string
  setCurrentGame(g: Generation, game: string): void
  /** 기다리는 저장을 지금. 실패하면 false */
  flush(): boolean
  hasPendingSave(): boolean
}

export function loadSquadsDocument(storage: SquadStorage): SquadsDocument {
  const raw = storage.read()
  if (raw === null) return emptyDocument()
  try {
    return parseSquadsDocument(JSON.parse(raw) as unknown)
  } catch {
    return emptyDocument() // 깨진 저장값 — 다음 저장이 새로 덮는다
  }
}

export function createSquadStore(
  storage: SquadStorage,
  delayMs = SAVE_DELAY_MS
) {
  const store = createStore<SquadStoreState>()(() => ({
    doc: loadSquadsDocument(storage),
    saveState: "idle",
  }))
  let timer: ReturnType<typeof setTimeout> | undefined

  const write = (): boolean => {
    const ok = storage.write(serializeSquadsDocument(store.getState().doc))
    store.setState({ saveState: ok ? "saved" : "failed" })
    return ok
  }

  const schedule = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      write()
    }, delayMs)
    store.setState({ saveState: "pending" })
  }

  const entryOf = (doc: SquadsDocument, g: Generation): GenerationSquads =>
    doc.squads[g] ?? { current: "", games: {}, updated: {} }

  const api: SquadStoreApi = {
    squad: (g, game) =>
      store.getState().doc.squads[g]?.games[game] ?? emptySquad(),
    hasSquad: (g, game) =>
      Object.hasOwn(store.getState().doc.squads[g]?.games ?? {}, game),
    setSquad(g, game, squad, now = Date.now()) {
      const doc = store.getState().doc
      const entry = entryOf(doc, g)
      if (
        Object.hasOwn(entry.games, game) &&
        sameSquad(entry.games[game], squad)
      )
        return
      const next: GenerationSquads = {
        current: entry.current,
        games: { ...entry.games, [game]: squad },
        updated: { ...entry.updated, [game]: now },
      }
      store.setState({ doc: { ...doc, squads: { ...doc.squads, [g]: next } } })
      schedule()
    },
    currentGame: (g) => store.getState().doc.squads[g]?.current ?? "",
    setCurrentGame(g, game) {
      const doc = store.getState().doc
      const entry = entryOf(doc, g)
      if (entry.current === game) return
      store.setState({
        doc: {
          ...doc,
          squads: { ...doc.squads, [g]: { ...entry, current: game } },
        },
      })
      schedule()
    },
    flush() {
      if (timer === undefined) return true
      clearTimeout(timer)
      timer = undefined
      return write()
    },
    hasPendingSave: () => timer !== undefined,
  }
  return Object.assign(store, { api })
}

export type SquadStore = ReturnType<typeof createSquadStore>

/** 앱 전체가 쓰는 스쿼드 저장소 */
export const squadStore: SquadStore = createSquadStore(localSquadStorage)

if (typeof window !== "undefined") {
  // 창을 닫거나 숨길 때 기다리던 저장을 바로 쓴다
  window.addEventListener("pagehide", () => squadStore.api.flush())
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") squadStore.api.flush()
  })
}

export const useSquadsDocument = (): SquadsDocument =>
  useStore(squadStore, (s) => s.doc)
export const useSquadSaveState = (): SaveState =>
  useStore(squadStore, (s) => s.saveState)
