/// <reference lib="webworker" />
/**
 * 데이터 워커: CSV 받기(0–90%) → SQLite 만들기(90%) → IndexedDB에 저장 → 받은 CSV 지우기.
 * 가져오기는 한 트랜잭션이라 실패하면 예전 DB가 그대로 남는다(반쯤 만든 DB로 바꾸지 않는다).
 */
import initSqlJs from "sql.js"

import {
  DB_KEY,
  csvKey,
  readBytes,
  removeKeys,
  writeBytes,
} from "../db/storage.ts"
import { DownloadError, downloadAll } from "./download.ts"
import { importCsv } from "./importer.ts"
import { CSV_FILES, POKEAPI_COMMIT } from "./manifest.ts"
import type { FromWorker, ToWorker } from "./protocol.ts"

declare const self: DedicatedWorkerGlobalScope

let controller: AbortController | null = null

const post = (message: FromWorker) => self.postMessage(message)

self.onmessage = (event: MessageEvent<ToWorker>) => {
  const message = event.data
  if (message.type === "cancel") {
    controller?.abort()
    return
  }
  if (controller) return
  controller = new AbortController()
  void run(message.wasmUrl, controller.signal).finally(() => {
    controller = null
  })
}

async function run(wasmUrl: string, signal: AbortSignal): Promise<void> {
  post({ type: "progress", percent: 0, stage: "download" })
  try {
    await downloadAll((done, total) => {
      post({
        type: "progress",
        percent: total > 0 ? Math.floor((done * 90) / total) : 0,
        stage: "download",
      })
    }, signal)
  } catch (error) {
    if (error instanceof DownloadError && error.kind === "cancelled") {
      post({ type: "cancelled" })
    } else {
      post({
        type: "failed",
        message: error instanceof Error ? error.message : String(error),
      })
    }
    return
  }
  if (signal.aborted) {
    post({ type: "cancelled" })
    return
  }

  post({ type: "progress", percent: 90, stage: "import" })
  try {
    const files = new Map<string, string>()
    const decoder = new TextDecoder()
    const read = (name: string): string => {
      const text = files.get(name)
      if (text === undefined) throw new Error(`cannot open ${name}.csv`)
      return text
    }
    for (const file of CSV_FILES) {
      const bytes = await readBytes(csvKey(POKEAPI_COMMIT, file.name))
      if (bytes) files.set(file.name, decoder.decode(bytes))
    }
    const SQL = await initSqlJs({ locateFile: () => wasmUrl })
    const db = new SQL.Database()
    try {
      importCsv(db, read)
      await writeBytes(DB_KEY, db.export())
    } finally {
      db.close()
    }
    await removeKeys("csv:")
  } catch (error) {
    post({
      type: "failed",
      message: error instanceof Error ? error.message : String(error),
    })
    return
  }
  post({ type: "progress", percent: 100, stage: "import" })
  post({ type: "finished" })
}
