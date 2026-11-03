import { describe, expect, it } from "vitest"

import { columns, parseCsv, toInt } from "../../src/data/pipeline/csv.ts"
import { toGenRanges } from "../../src/data/pipeline/genRanges.ts"
import {
  CSV_FILES,
  CSV_TOTAL_SIZE,
  POKEAPI_COMMIT,
} from "../../src/data/pipeline/manifest.ts"

describe("parseCsv", () => {
  it('쉼표로 나누고, 따옴표 없는 빈 칸은 null · ""는 빈 문자열', () => {
    const { header, rows } = parseCsv('a,b,c\n1,,""\n2,x,\n')
    expect(header).toEqual(["a", "b", "c"])
    expect(rows).toEqual([
      ["1", null, ""],
      ["2", "x", null],
    ])
  })
  it('따옴표 안의 쉼표 · "" · 줄바꿈', () => {
    const { rows } = parseCsv('h\n"a,b"\n"say ""hi"""\n"two\nlines"\n')
    expect(rows).toEqual([["a,b"], ['say "hi"'], ["two\nlines"]])
  })
  it("CRLF · 마지막 줄바꿈 없음 · 빈 줄은 건너뛴다", () => {
    const { header, rows } = parseCsv("a,b\r\nc,d\r\n\r\ne,f")
    expect(header).toEqual(["a", "b"])
    expect(rows).toEqual([
      ["c", "d"],
      ["e", "f"],
    ])
  })
  it("BOM을 떼어 낸다", () => {
    const { header, rows } = parseCsv("\uFEFFid,name\n1,이상해씨\n")
    expect(header.indexOf("id")).toBe(0)
    expect(rows[0][1]).toBe("이상해씨")
  })
  it("닫히지 않은 따옴표는 오류", () => {
    expect(() => parseCsv('a\n"open\n')).toThrow(/unterminated/)
  })
  it("없는 열을 찾으면 파일 이름과 함께 오류", () => {
    expect(() => [...columns("moves", "id\n1\n", ["id", "power"])]).toThrow(
      "moves: missing column 'power'"
    )
  })
  it("toInt: null · 빈 칸 · 숫자 아님 → 0", () => {
    expect(toInt(null)).toBe(0)
    expect(toInt("")).toBe(0)
    expect(toInt("abc")).toBe(0)
    expect(toInt(" 42 ")).toBe(42)
  })
})

describe("toGenRanges", () => {
  const plain = <T>(r: { from: number; to: number | null; value: T }[]) =>
    r.map(({ from, to, value }) => [from, to, value])
  it("Qt 테스트 6가지", () => {
    expect(plain(toGenRanges(4, [], 200))).toEqual([[4, null, 200]])
    expect(plain(toGenRanges(1, [[1, 0]], 200))).toEqual([
      [1, 1, 0],
      [2, null, 200],
    ])
    expect(
      plain(
        toGenRanges(
          1,
          [
            [5, 70],
            [2, 50],
          ],
          90
        )
      )
    ).toEqual([
      [1, 2, 50],
      [3, 5, 70],
      [6, null, 90],
    ])
    expect(plain(toGenRanges(1, [[1, 65]], undefined))).toEqual([[1, 1, 65]])
    expect(plain(toGenRanges(2, [[1, 65]], undefined))).toEqual([])
    expect(
      plain(
        toGenRanges(
          1,
          [
            [3, 50],
            [5, 50],
          ],
          50
        )
      )
    ).toEqual([[1, null, 50]])
  })
})

describe("manifest", () => {
  it("이름은 겹치지 않고, 해시는 64자, 크기 합 = 28,955,492", () => {
    expect(new Set(CSV_FILES.map((f) => f.name)).size).toBe(54)
    for (const f of CSV_FILES) {
      expect(f.sha256).toMatch(/^[0-9a-f]{64}$/)
      expect(f.size).toBeGreaterThan(0)
    }
    expect(CSV_TOTAL_SIZE).toBe(28_955_492)
    expect(POKEAPI_COMMIT).toHaveLength(40)
  })
})
