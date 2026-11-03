// 평문 PKM(236바이트, A · B · C · D 순서)의 필드 고치기 — 쓰기 경로
import { writeU16 } from "./bytes.ts"
import type { Moves4 } from "./party.ts"

// 기술 4개 + PP. PP 업은 0으로
export function setMoves(plain: Uint8Array, moves: Moves4, pp: Moves4): void {
  for (let k = 0; k < 4; k++) {
    writeU16(plain, 0x28 + 2 * k, moves[k])
    plain[0x30 + k] = pp[k] & 0xff
    plain[0x34 + k] = 0
  }
}

// 지닌 물건(그 세대의 게임 인덱스). Qt판은 8비트로 잘랐다 — 여기서는 16비트 전부 쓴다
export function setHeldItem(plain: Uint8Array, gameItem: number): void {
  writeU16(plain, 0x0a, gameItem)
}
