/**
 * CSV 읽기 — RFC 4180의 부분집합(PokéAPI 파일에 필요한 만큼).
 * 따옴표 없는 빈 칸 = null, 따옴표 친 "" = 빈 문자열. 이 차이가 DB의 NULL / ''로 이어진다.
 */

export type CsvField = string | null
export type CsvRecord = CsvField[]

export class CsvError extends Error {}

export interface CsvTable {
  header: string[]
  rows: CsvRecord[]
}

/** 레코드를 하나씩 꺼낸다(큰 파일도 배열 하나로 다 만들지 않게). */
export function* records(text: string): Generator<CsvRecord> {
  const body = text.startsWith("\uFEFF") ? text.slice(1) : text
  let pos = 0
  let lineNo = 0
  const nextLine = (): string | null => {
    if (pos >= body.length) return null
    let end = body.indexOf("\n", pos)
    if (end < 0) end = body.length
    let line = body.slice(pos, end)
    pos = end + 1
    lineNo += 1
    if (line.endsWith("\r")) line = line.slice(0, -1)
    return line
  }

  for (;;) {
    let line = nextLine()
    if (line === null) return
    if (line === "") continue
    if (!line.includes('"')) {
      yield line.split(",").map((x) => (x === "" ? null : x))
      continue
    }
    const fields: CsvRecord = []
    let field: string | null = null
    let quoted = false
    let k = 0
    for (;;) {
      if (k === line.length) {
        if (quoted) {
          const next = nextLine()
          if (next === null) {
            throw new CsvError(`line ${lineNo}: unterminated quoted field`)
          }
          field = (field ?? "") + "\n"
          line = next
          k = 0
          continue
        }
        fields.push(field)
        break
      }
      const c = line[k]
      if (quoted) {
        if (c === '"') {
          if (line[k + 1] === '"') {
            field += '"'
            k += 2
          } else {
            quoted = false
            k += 1
          }
          continue
        }
        field += c
        k += 1
        continue
      }
      if (c === ",") {
        fields.push(field)
        field = null
        k += 1
        continue
      }
      if (c === '"' && field === null) {
        quoted = true
        field = ""
        k += 1
        continue
      }
      field = (field ?? "") + c
      k += 1
    }
    yield fields
  }
}

export function parseCsv(text: string): CsvTable {
  const [header, ...rows] = records(text)
  return { header: (header ?? []).map((h) => h ?? ""), rows }
}

/** 열 이름으로 고른 값만 줄마다 돌려준다. 열이 없으면 오류(파일 형식이 바뀐 것). */
export function* columns(
  file: string,
  text: string,
  names: readonly string[]
): Generator<CsvRecord> {
  const it = records(text)
  const first = it.next()
  if (first.done) throw new CsvError(`${file}: no header`)
  const header = first.value
  const idx = names.map((name) => {
    const at = header.indexOf(name)
    if (at < 0) throw new CsvError(`${file}: missing column '${name}'`)
    return at
  })
  for (const row of it) {
    yield idx.map((j) => (j < row.length ? row[j] : null))
  }
}

/** QString::toInt처럼: null · "" · 숫자가 아니면 0. */
export function toInt(s: CsvField | undefined): number {
  if (s === null || s === undefined) return 0
  const t = s.trim()
  if (!/^[+-]?\d+$/.test(t)) return 0
  return Number.parseInt(t, 10)
}

export function intOrNull(s: CsvField | undefined): number | null {
  return s === null || s === undefined || s === "" ? null : toInt(s)
}
