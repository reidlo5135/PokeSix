/**
 * 스쿼드 편집 창구(Qt SquadSession) — 지금 세대 · 게임의 스쿼드를 읽고, 편집을 커밋하고, 되돌리기 기록을 든다.
 * 스쿼드 자체는 squads 저장소에 있다(화면은 저장소를 구독해 다시 그린다). 여기는 되돌리기 기록만.
 *
 * - 커밋 한 번 = 한 단계(무변화는 쌓지 않는다), 최대 50단계
 * - 기록은 스쿼드(세대 · 버전)마다 따로 — 게임을 바꾸면 처음부터
 * - 메모는 커밋하지 않는다(저장만) — 다음 커밋의 직전 상태에 섞여 들어간다(Qt 그대로)
 */
import { useStore } from "zustand"
import { createStore } from "zustand/vanilla"

import type { Generation } from "../../shared/generations.ts"
import {
  emptySquad,
  squadStore,
  type Squad,
  type SquadStoreApi,
} from "../../state/squads.ts"
import { MAX_UNDO, sameSquad } from "./squadEdits.ts"

export interface SquadContext {
  generation: Generation
  /** 버전("soulsilver") — 저장 키 */
  version: string
  /** 그 버전의 게임 묶음 — 기술 · 사전의 기준, 옛 묶음 키 스쿼드의 출발점 */
  versionGroup: string
}

export const contextKey = (c: SquadContext): string =>
  `${c.generation}/${c.version}`

const EMPTY = emptySquad()

/** 버전 키 스쿼드가 있으면 그것, 없으면 옛 묶음 키 스쿼드(없으면 빈 스쿼드) */
export function squadOf(
  c: SquadContext,
  api: SquadStoreApi = squadStore.api
): Squad {
  if (api.hasSquad(c.generation, c.version))
    return api.squad(c.generation, c.version)
  if (c.versionGroup !== "" && api.hasSquad(c.generation, c.versionGroup))
    return api.squad(c.generation, c.versionGroup)
  return EMPTY
}

interface HistoryState {
  key: string
  committed: Squad
  undo: Squad[]
  redo: Squad[]
}

export function createSession(api: SquadStoreApi = squadStore.api) {
  const history = createStore<HistoryState>()(() => ({
    key: "",
    committed: EMPTY,
    undo: [],
    redo: [],
  }))

  /** 다른 스쿼드로 왔으면 기록을 비운다 */
  const ensure = (c: SquadContext) => {
    const key = contextKey(c)
    if (history.getState().key !== key)
      history.setState({ key, committed: squadOf(c, api), undo: [], redo: [] })
  }

  const save = (c: SquadContext, s: Squad) =>
    api.setSquad(c.generation, c.version, s)

  /** 편집 한 번 — 바뀌었으면 기록에 쌓고, 언제나 버전 키로 저장 */
  const commit = (c: SquadContext, next: Squad) => {
    ensure(c)
    const h = history.getState()
    if (!sameSquad(next, h.committed))
      history.setState({
        committed: next,
        undo: [...h.undo, h.committed].slice(-MAX_UNDO),
        redo: [],
      })
    save(c, next)
  }

  return {
    history,
    ensure,
    commit,
    current: (c: SquadContext) => squadOf(c, api),

    /** 기록 없이 저장만(메모) */
    store(c: SquadContext, next: Squad) {
      ensure(c)
      save(c, next)
    },

    edit(c: SquadContext, change: (s: Squad) => Squad) {
      const before = squadOf(c, api)
      const next = change(before)
      if (next !== before) commit(c, next)
    },

    undo(c: SquadContext) {
      ensure(c)
      const h = history.getState()
      const prev = h.undo.at(-1)
      if (!prev) return
      history.setState({
        committed: prev,
        undo: h.undo.slice(0, -1),
        redo: [...h.redo, squadOf(c, api)],
      })
      save(c, prev)
    },

    redo(c: SquadContext) {
      ensure(c)
      const h = history.getState()
      const next = h.redo.at(-1)
      if (!next) return
      history.setState({
        committed: next,
        redo: h.redo.slice(0, -1),
        undo: [...h.undo, squadOf(c, api)].slice(-MAX_UNDO),
      })
      save(c, next)
    },
  }
}

export type SquadSession = ReturnType<typeof createSession>

/** 앱 전체가 쓰는 창구 하나 */
export const session: SquadSession = createSession()

export function useUndoState(c: SquadContext): {
  canUndo: boolean
  canRedo: boolean
} {
  const key = contextKey(c)
  const canUndo = useStore(
    session.history,
    (h) => h.key === key && h.undo.length > 0
  )
  const canRedo = useStore(
    session.history,
    (h) => h.key === key && h.redo.length > 0
  )
  return { canUndo, canRedo }
}
