/**
 * 스쿼드 불러오기 — 스쿼드 파일(.pks · .json)과 게임 세이브(.sav · .dsv)가 같은 길(Qt 0.5.1 importFile).
 * 파일 → Portable 또는 오류. 확인 창 · 세대 전환 · 바꿔 넣기는 화면이 한다.
 */
import {
  fileKindOf,
  NOT_A_SAVE_ERROR,
  openSave,
  STATIC_SAVE_LOOKUPS,
  toSquadImport,
  type FileKind,
  type SquadImport,
} from "../../core/save/index.ts"
import {
  emptyMember,
  emptySquad,
  MEMO_LENGTH,
  type Squad,
} from "../../state/squads.ts"
import { parsePortable, type FileError, type Portable } from "./squadFile.ts"

export const IMPORT_EXTENSIONS = [".pks", ".json", ".sav", ".dsv"] as const

export type ImportResult =
  | { ok: true; kind: "save" | "squad"; portable: Portable }
  | { ok: false; error: FileError }

/** 세이브 파티 → 스쿼드(i번째 = i번째, 알 · 빈 칸은 빈 자리, 이름 "" · 셔틀 비움) */
export function squadFromSaveImport(imported: SquadImport): Portable {
  const squad: Squad = emptySquad()
  squad.members = imported.members.map((m) =>
    m
      ? {
          ...emptyMember(),
          pokemonId: m.pokemonId,
          memo: m.memo.slice(0, MEMO_LENGTH),
          moves: [...m.moves],
          abilityId: m.abilityId,
          natureId: m.natureId,
          itemId: m.itemId,
          level: m.level,
          stats: [...m.stats],
        }
      : emptyMember()
  )
  return { generation: imported.generation, game: imported.game, squad }
}

/** 바이트 → 결과(파일을 읽는 일은 부르는 쪽이) */
export function importBytes(
  bytes: Uint8Array,
  fileName: string,
  kind: FileKind = fileKindOf(fileName)
): ImportResult {
  if (kind === "save") {
    const opened = openSave(bytes, fileName)
    if (!opened.ok)
      return {
        ok: false,
        error:
          opened.error === NOT_A_SAVE_ERROR
            ? { key: NOT_A_SAVE_ERROR }
            : { key: "파일을 열 수 없어요: %1", arg: opened.error },
      }
    const imported = toSquadImport(opened.save, STATIC_SAVE_LOOKUPS)
    for (const w of imported.warnings) console.warn(w)
    return { ok: true, kind: "save", portable: squadFromSaveImport(imported) }
  }
  const parsed = parsePortable(new TextDecoder().decode(bytes))
  return parsed.ok
    ? { ok: true, kind: "squad", portable: parsed.portable }
    : parsed
}

export async function importFile(file: File): Promise<ImportResult> {
  let bytes: Uint8Array
  try {
    bytes = new Uint8Array(await file.arrayBuffer())
  } catch (e) {
    return {
      ok: false,
      error: {
        key: "파일을 열 수 없어요: %1",
        arg: e instanceof Error ? e.message : String(e),
      },
    }
  }
  return importBytes(bytes, file.name)
}

/** 받을 수 있는 파일 이름인가 */
export const isImportable = (name: string): boolean =>
  fileKindOf(name) !== "unknown"
