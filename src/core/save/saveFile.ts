// 세이브 파일 열기 — 바이트 → SaveFile. 파일은 읽기만 하고, 받은 바이트도 바꾸지 않는다.
// SaveFile은 원본 바이트 · 원본 값을 그대로 들고 있어 나중에 에디터(R9)가 쓸 수 있다
import { readParty, type ReadMember, type VersionGroup } from "./party.ts"
import { VERSIONS_OF_GROUP, chooseVersion } from "./version.ts"

export type SaveFile = {
  fileName: string // 렌더러에서는 File.name(경로 없음)
  bytes: Uint8Array // 파일 전체의 사본 — 에디터는 이 사본을 고친다
  generation: 4 | 5
  versionGroup: VersionGroup // NDS_SERIES로 돌아가는 열쇠(findSeries)
  game: string // 고른 버전, 예: "white-2"
  partyOffset: number // 멤버 0의 파일 오프셋
  members: ReadMember[] // 1–6, 세이브 순서. 알도 자리를 지킨다
}

export type OpenSaveResult =
  { ok: true; save: SaveFile } | { ok: false; error: string }

export const NOT_A_SAVE_ERROR =
  "4세대(DP · Pt · HGSS) · 5세대(BW · B2W2) 세이브가 아니에요"

// 파일을 못 읽었을 때(브라우저 · OS 오류 문구를 덧붙인다)
export function cannotReadError(reason: string): string {
  return `파일을 열 수 없어요: ${reason}`
}

export function openSave(bytes: Uint8Array, fileName = ""): OpenSaveResult {
  const copy = bytes.slice() // 부르는 쪽 버퍼와 떼어 둔다
  const party = readParty(copy)
  if (!party) return { ok: false, error: NOT_A_SAVE_ERROR }
  return {
    ok: true,
    save: {
      fileName,
      bytes: copy,
      generation: party.generation,
      versionGroup: party.versionGroup,
      game: chooseVersion(VERSIONS_OF_GROUP[party.versionGroup], party.members),
      partyOffset: party.partyOffset,
      members: party.members,
    },
  }
}

export type FileKind = "save" | "squad" | "unknown"

// 파일 이름의 마지막 "." 뒤(소문자)로 종류를 정한다. 점이 없으면 unknown
export function fileKindOf(name: string): FileKind {
  const base = name.split(/[/\\]/).pop() ?? ""
  const dot = base.lastIndexOf(".")
  if (dot < 0) return "unknown"
  const suffix = base.slice(dot + 1).toLowerCase()
  if (suffix === "sav" || suffix === "dsv") return "save"
  if (suffix === "pks" || suffix === "json") return "squad"
  return "unknown"
}
