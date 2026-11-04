/**
 * 스쿼드 내보내기 파일(.pks) — Qt data/store/squadfile과 같은 모양 · 같은 서식.
 * { "game": "heartgold", "generation": 4, "pokesix-squad": 1, "squad": {…squads.json의 스쿼드…} }
 * 형식 판정은 "pokesix-squad" 키로 한다(초기 내보내기 .json도 읽힌다).
 */
import { squadFromJson, squadToJson, type Squad } from "../../state/squads.ts"

export const PKS_FORMAT = 1

export interface Portable {
  generation: number
  /** 버전("heartgold"). 옛 파일은 게임 묶음 키일 수 있다 */
  game: string
  squad: Squad
}

/** 읽기 실패 — key는 번역할 한국어 원문, arg는 %1 */
export interface FileError {
  key: string
  arg?: string | number
}

export type ParseResult =
  { ok: true; portable: Portable } | { ok: false; error: FileError }

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)
const int = (v: unknown): number =>
  typeof v === "number" && Number.isInteger(v) ? v : 0

/** 키를 사전순으로(Qt QJsonObject 순서) */
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (!isRecord(v)) return v
  return Object.fromEntries(
    Object.keys(v)
      .sort()
      .map((k) => [k, sortKeys(v[k])])
  )
}

/** 파일 글: 4칸 들여쓰기 · 키 정렬 · 끝 줄바꿈 */
export function serializePortable(p: Portable): string {
  return (
    JSON.stringify(
      sortKeys({
        game: p.game,
        generation: p.generation,
        "pokesix-squad": PKS_FORMAT,
        squad: squadToJson(p.squad),
      }),
      null,
      4
    ) + "\n"
  )
}

export function parsePortable(textContent: string): ParseResult {
  let root: unknown
  try {
    root = JSON.parse(textContent) as unknown
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e)
    return { ok: false, error: { key: "JSON이 아니에요: %1", arg: reason } }
  }
  if (!isRecord(root))
    return {
      ok: false,
      error: { key: "JSON이 아니에요: %1", arg: "not an object" },
    }
  if (int(root["pokesix-squad"]) < 1)
    return { ok: false, error: { key: "PokeSix 스쿼드 파일이 아니에요" } }
  const generation = int(root.generation)
  if (generation < 1)
    return {
      ok: false,
      error: { key: "세대 값이 이상해요: %1", arg: generation },
    }
  return {
    ok: true,
    portable: {
      generation,
      game: typeof root.game === "string" ? root.game : "",
      squad: squadFromJson(root.squad),
    },
  }
}

/** 기본 파일 이름: pokesix-squad-{세대}-{게임}.pks (ASCII만 — 이름은 파일 안에 있다) */
export function portableFileName(p: Pick<Portable, "generation" | "game">) {
  const game = p.game.replace(/[^A-Za-z0-9-]/g, "") || "squad"
  return `pokesix-squad-${p.generation}-${game}.pks`
}
