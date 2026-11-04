/**
 * 게임 데이터 상태 — DB가 있는지, 받는 중인지, 몇 번째로 바뀌었는지(dataVersion).
 * 데이터 워커(src/data/pipeline/worker.ts)를 띄우고 진행을 받아 홈 첫 실행 창 · 설정 > 데이터가 같이 쓴다.
 * 받기가 끝나면 DB를 다시 열고 dataVersion을 올린다 → 화면은 이 값을 의존성에 넣어 다시 묻는다.
 */
import { useStore } from "zustand"
import { createStore } from "zustand/vanilla"

import {
  database,
  reloadDatabase,
  select,
  str,
  wasmUrl,
} from "../data/db/database.ts"
import { CSV_TOTAL_SIZE } from "../data/pipeline/manifest.ts"
import type { FromWorker, ToWorker } from "../data/pipeline/protocol.ts"
import { bindDatabase, clearRepositoryCaches } from "../data/repository/db.ts"

export type DataStatus = "checking" | "missing" | "ready"
export type UpdatePhase = "idle" | "running" | "failed"
export type UpdateStage = "download" | "import" | "done"

export interface DataInfo {
  /** PokéAPI 원본 커밋 */
  sourceCommit: string
  /** 가져온 때 (UTC ISO 8601) */
  importedAt: string
}

export interface DataUpdate {
  phase: UpdatePhase
  percent: number
  stage: UpdateStage
  /** 실패 글(워커가 보낸 그대로) */
  error: string
}

export interface DataState {
  status: DataStatus
  /** DB를 다시 열 때마다 1씩 오른다 */
  version: number
  info: DataInfo | null
  update: DataUpdate
}

const IDLE: DataUpdate = {
  phase: "idle",
  percent: 0,
  stage: "download",
  error: "",
}

export const dataStore = createStore<DataState>()(() => ({
  status: "checking",
  version: 0,
  info: null,
  update: IDLE,
}))

/** 첫 실행 창에 보일 예상 크기(MB, 소수 한 자리) */
export const expectedDownloadMb = (): string =>
  (CSV_TOTAL_SIZE / 1_000_000).toFixed(1)

function readInfo(): DataInfo | null {
  const rows = select("SELECT key, value FROM meta")
  if (rows.length === 0) return null
  const meta = new Map(rows.map((r) => [str(r.key), str(r.value)]))
  return {
    sourceCommit: meta.get("source_commit") ?? "",
    importedAt: meta.get("imported_at") ?? "",
  }
}

let bound = false

/** DB를 (다시) 열고 상태를 갱신한다 */
export async function reloadData(): Promise<boolean> {
  if (!bound) {
    bindDatabase(database)
    bound = true
  }
  let ok = false
  try {
    ok = await reloadDatabase()
  } catch {
    ok = false
  }
  clearRepositoryCaches()
  dataStore.setState((s) => ({
    status: ok ? "ready" : "missing",
    version: s.version + 1,
    info: ok ? readInfo() : null,
  }))
  return ok
}

let started = false

/** 앱 시작 때 한 번 */
export function initData(): void {
  if (started) return
  started = true
  void reloadData()
}

let worker: Worker | null = null

function finish(update: DataUpdate): void {
  worker?.terminate()
  worker = null
  dataStore.setState({ update })
}

function onMessage(message: FromWorker): void {
  switch (message.type) {
    case "progress":
      dataStore.setState({
        update: {
          phase: "running",
          percent: message.percent,
          stage: message.stage,
          error: "",
        },
      })
      break
    case "finished":
      dataStore.setState({
        update: { phase: "running", percent: 100, stage: "done", error: "" },
      })
      void reloadData().then(() => finish(IDLE))
      break
    case "failed":
      finish({
        phase: "failed",
        percent: dataStore.getState().update.percent,
        stage: "download",
        error: message.message,
      })
      break
    case "cancelled":
      finish(IDLE)
      break
  }
}

/** 데이터 받기(또는 다시 받기)를 시작한다. 이미 받는 중이면 무시 */
export function startDataUpdate(): void {
  if (worker) return
  dataStore.setState({
    update: { phase: "running", percent: 0, stage: "download", error: "" },
  })
  try {
    worker = new Worker(
      new URL("../data/pipeline/worker.ts", import.meta.url),
      { type: "module" }
    )
  } catch (error) {
    finish({
      ...IDLE,
      phase: "failed",
      error: error instanceof Error ? error.message : String(error),
    })
    return
  }
  worker.onmessage = (e: MessageEvent<FromWorker>) => onMessage(e.data)
  worker.onerror = (e) =>
    finish({ ...IDLE, phase: "failed", error: e.message || "worker error" })
  const start: ToWorker = { type: "start", wasmUrl }
  worker.postMessage(start)
}

/** 받기를 그만둔다(가져오기 단계에서는 효과 없음) */
export function cancelDataUpdate(): void {
  const cancel: ToWorker = { type: "cancel" }
  worker?.postMessage(cancel)
}

export const useDataStatus = (): DataStatus =>
  useStore(dataStore, (s) => s.status)
/** 데이터가 바뀔 때마다 오르는 번호 — useMemo/useEffect 의존성에 넣는다 */
export const useDataVersion = (): number =>
  useStore(dataStore, (s) => s.version)
export const useDataInfo = (): DataInfo | null =>
  useStore(dataStore, (s) => s.info)
export const useDataUpdate = (): DataUpdate =>
  useStore(dataStore, (s) => s.update)
