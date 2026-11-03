/**
 * 저장소(repository)가 읽는 DB 연결. 앱은 db/database.ts가 bindDatabase(database)로 이어 주고,
 * 테스트는 픽스처로 만든 DB를 직접 넘긴다. DB 객체가 바뀌면(데이터 받기 끝) 캐시를 비운다.
 */
import type { Database, SqlValue } from "sql.js"

import { SCHEMA_VERSION } from "../pipeline/schema.ts"
import type { LocalizedText } from "../text/localizedText.ts"
import { clearCaches } from "./cache.ts"

export type Row = Record<string, SqlValue>

const MISSING = "game database is missing or has another schema version"

let provider: () => Database | null = () => null
let lastDb: Database | null = null
let lastUsable = false
let lastError = ""

// 스키마 버전이 맞는 DB만 읽는다(옛 표를 읽어 빈 이름 · 잘못된 분류를 보여 주지 않게)
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

/** 저장소가 읽을 DB를 정한다(앱: database, 테스트: () => db) */
export function bindDatabase(source: () => Database | null): void {
  provider = source
  clearRepositoryCaches()
}

/** 캐시를 비우고 다음 질의 때 DB를 다시 확인한다 — DB를 바꿔 끼운 뒤 부른다(Qt close()) */
export function clearRepositoryCaches(): void {
  clearCaches()
  lastDb = null
  lastUsable = false
}

/** 마지막 오류 문자열(없으면 "") */
export const repositoryError = (): string => lastError

/** 열린(쓸 수 있는) DB. 없으면 null + 오류. 이전과 다른 DB면 캐시를 비운다 */
export function currentDatabase(): Database | null {
  const db = provider()
  if (db !== lastDb) {
    clearCaches()
    lastDb = db
    lastUsable = db !== null && isUsable(db)
  }
  if (!db || !lastUsable) {
    lastError = MISSING
    return null
  }
  return db
}

/** SELECT → 열 이름 → 값. DB가 없거나 질의가 실패하면 빈 배열(오류는 repositoryError) */
export function select(sql: string, params: SqlValue[] = []): Row[] {
  const db = currentDatabase()
  if (!db) return []
  try {
    const stmt = db.prepare(sql)
    try {
      stmt.bind(params)
      const out: Row[] = []
      while (stmt.step()) out.push(stmt.getAsObject())
      return out
    } finally {
      stmt.free()
    }
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error)
    console.warn("repository query failed:", lastError)
    return []
  }
}

// 값 하나 좁히기 — DB 값도 믿지 않는다. NULL은 0 / ""(C++ toInt · toString과 같다)
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

/** 열 `${prefix}_ko` · `_en` · `_ja` → LocalizedText */
export const loc = (row: Row, prefix: string): LocalizedText => ({
  ko: str(row[`${prefix}_ko`]),
  en: str(row[`${prefix}_en`]),
  ja: str(row[`${prefix}_ja`]),
})

/** IN (…)에 이어 붙일 정수 목록 — DB에서 읽은 정수만 넣는다(사용자 입력은 늘 바인딩) */
export const idList = (ids: Iterable<number>): string =>
  [...new Set(ids)].filter((id) => Number.isInteger(id)).join(",")

/** 숨기는 버전: 국제판과 겹치는 1세대 일본판. versions 별칭 v인 질의에 AND로 붙인다 */
export const VISIBLE_VERSIONS =
  "v.identifier NOT IN ('red-japan', 'blue-japan')"
