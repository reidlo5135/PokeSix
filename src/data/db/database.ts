/**
 * 메인 스레드의 읽기 전용 DB — IndexedDB에 저장된 SQLite 바이트를 sql.js로 연다.
 * 스키마 버전이 다르거나 없으면 "데이터 없음"(첫 실행 패널을 띄운다).
 */
import initSqlJs, { type Database, type SqlValue } from "sql.js"
import wasmUrl from "sql.js/dist/sql-wasm-browser.wasm?url"

import { SCHEMA_VERSION } from "../pipeline/schema.ts"
import { bindDatabase } from "../repository/db.ts"
import { DB_KEY, readBytes } from "./storage.ts"

export { wasmUrl }

let current: Database | null = null

// 저장소(repository) 질의가 이 DB를 읽는다. DB 객체가 바뀌면 저장소 캐시가 저절로 비워진다
bindDatabase(() => current)

export type Row = Record<string, SqlValue>

export function database(): Database | null {
  return current
}

/** 지금 DB를 닫고 저장소에서 다시 연다. 쓸 수 있는 DB면 true. */
export async function reloadDatabase(): Promise<boolean> {
  current?.close()
  current = null
  const bytes = await readBytes(DB_KEY).catch(() => null)
  if (!bytes) return false
  const SQL = await initSqlJs({ locateFile: () => wasmUrl })
  const db = new SQL.Database(bytes)
  if (!isUsable(db)) {
    db.close()
    return false
  }
  current = db
  return true
}

/** 테스트 · 도구용: 이미 연 DB를 쓴다 */
export function setDatabaseForTests(db: Database | null): void {
  current = db
}

function isUsable(db: Database): boolean {
  try {
    const result = db.exec(
      "SELECT value FROM meta WHERE key = 'schema_version'"
    )
    return Number(result[0]?.values[0]?.[0]) === SCHEMA_VERSION
  } catch {
    return false
  }
}

/** SELECT 결과를 열 이름 → 값 객체로. DB가 없으면 빈 배열. */
export function select(sql: string, params: SqlValue[] = []): Row[] {
  const db = current
  if (!db) return []
  const stmt = db.prepare(sql)
  try {
    stmt.bind(params)
    const out: Row[] = []
    while (stmt.step()) out.push(stmt.getAsObject())
    return out
  } finally {
    stmt.free()
  }
}

/** 값 하나 고르기 도우미 — 네트워크 · DB 값은 믿지 않고 좁힌다 */
export const num = (v: SqlValue | undefined): number =>
  typeof v === "number"
    ? v
    : typeof v === "string" && v !== ""
      ? Number(v) || 0
      : 0

export const numOrNull = (v: SqlValue | undefined): number | null =>
  v === null || v === undefined ? null : num(v)

export const str = (v: SqlValue | undefined): string =>
  typeof v === "string" ? v : v === null || v === undefined ? "" : String(v)

export const strOrNull = (v: SqlValue | undefined): string | null =>
  typeof v === "string" ? v : null
