/**
 * 게임마다 처음에 고르는 스타팅 포켓몬(starters.json). 한 정주행에 스타팅은 보통 하나 — 스쿼드 경고용.
 */
import startersJson from "../../data/bundled/starters.json" with { type: "json" }

/** 게임 묶음 → 계통 셋(전국도감 번호, 진화 순) */
export type StarterBook = Map<string, number[][]>

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

/** JSON을 믿지 않고 좁힌다 — 정수 배열이 아닌 계통은 버린다 */
export function parseStarters(root: unknown): StarterBook {
  const book: StarterBook = new Map()
  const table = isRecord(root) ? root.starters : undefined
  if (!isRecord(table)) return book
  for (const [group, lines] of Object.entries(table)) {
    if (!Array.isArray(lines)) continue
    const ok = lines
      .filter(Array.isArray)
      .map((line: unknown[]) =>
        line.filter((n): n is number => Number.isInteger(n))
      )
    book.set(group, ok)
  }
  return book
}

let book: StarterBook | null = null

/** 그 종이 든 계통 번호 0–2, 없으면 −1 */
export function starterLineOf(
  versionGroup: string,
  speciesId: number,
  source: StarterBook = (book ??= parseStarters(startersJson as unknown))
): number {
  const lines = source.get(versionGroup) ?? []
  return lines.findIndex((line) => line.includes(speciesId))
}
