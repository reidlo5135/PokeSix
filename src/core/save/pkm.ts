// PKM 한 마리 — 암호화(LCRNG) · 블록 섞기 · 체크섬.
// 게임은 "섞기 → 암호화"로 썼으므로 읽을 때는 "복호화 → 되섞기"
import { readU16, readU32, writeU16 } from "./bytes.ts"

export const PARTY_PKM_SIZE = 236 // PK4 파티 레코드 = 작업 배열 크기
export const STORED_SIZE = 136 // 헤더 8 + 블록 128 (배틀 스탯이 여기서 시작)
export const HEADER_SIZE = 8 // PID u32 · flags u16 · checksum u16
export const BLOCK_SIZE = 32 // A · B · C · D 블록 하나
export const BLOCKS_SIZE = 128

export type PkmFormat = {
  name: "PK4" | "PK5"
  partySize: 236 | 220
  natureAt: number | null // 5세대: 0x41
  hiddenAbilityAt: number | null // 5세대: 0x42 비트 0
}

export const PK4: PkmFormat = {
  name: "PK4",
  partySize: 236,
  natureAt: null,
  hiddenAbilityAt: null,
}

export const PK5: PkmFormat = {
  name: "PK5",
  partySize: 220,
  natureAt: 0x41,
  hiddenAbilityAt: 0x42,
}

// 제자리 XOR — 같은 함수로 암호화 · 복호화. u16마다 먼저 한 칸 나아가고 상위 16비트로 XOR
export function cryptArray(data: Uint8Array, seed: number): void {
  let s = seed >>> 0
  for (let i = 0; i + 1 < data.length; i += 2) {
    s = (Math.imul(s, 0x41c64e6d) + 0x6073) >>> 0 // 그냥 *는 2^53을 넘어 아래 비트를 잃는다
    const key = s >>> 16
    data[i] ^= key & 0xff
    data[i + 1] ^= key >>> 8
  }
}

// PID 비트 13–17 → 0–23
export function shuffleIndex(pid: number): number {
  return ((pid >>> 13) & 0x1f) % 24
}

// BLOCK_POSITION[s][i] = 섞인 데이터에서 논리 블록 i(A=0 … D=3)가 놓인 자리
export const BLOCK_POSITION: readonly (readonly [
  number,
  number,
  number,
  number,
])[] = [
  [0, 1, 2, 3],
  [0, 1, 3, 2],
  [0, 2, 1, 3],
  [0, 3, 1, 2],
  [0, 2, 3, 1],
  [0, 3, 2, 1],
  [1, 0, 2, 3],
  [1, 0, 3, 2],
  [2, 0, 1, 3],
  [3, 0, 1, 2],
  [2, 0, 3, 1],
  [3, 0, 2, 1],
  [1, 2, 0, 3],
  [1, 3, 0, 2],
  [2, 1, 0, 3],
  [3, 1, 0, 2],
  [2, 3, 0, 1],
  [3, 2, 0, 1],
  [1, 2, 3, 0],
  [1, 3, 2, 0],
  [2, 1, 3, 0],
  [3, 1, 2, 0],
  [2, 3, 1, 0],
  [3, 2, 1, 0],
]

function validShuffle(blocks: Uint8Array, s: number): boolean {
  return (
    blocks.length === BLOCKS_SIZE && Number.isInteger(s) && s >= 0 && s < 24
  )
}

// 섞인 128바이트 → A · B · C · D 순서(새 배열). 크기 · 인덱스가 틀리면 0 128바이트
export function unshuffle(shuffled: Uint8Array, s: number): Uint8Array {
  const out = new Uint8Array(BLOCKS_SIZE)
  if (!validShuffle(shuffled, s)) return out
  for (let i = 0; i < 4; i++) {
    const from = BLOCK_POSITION[s][i] * BLOCK_SIZE
    out.set(shuffled.subarray(from, from + BLOCK_SIZE), i * BLOCK_SIZE)
  }
  return out
}

// A · B · C · D 순서 → 섞인 순서(새 배열)
export function shuffle(blocks: Uint8Array, s: number): Uint8Array {
  const out = new Uint8Array(BLOCKS_SIZE)
  if (!validShuffle(blocks, s)) return out
  for (let i = 0; i < 4; i++) {
    const from = i * BLOCK_SIZE
    out.set(
      blocks.subarray(from, from + BLOCK_SIZE),
      BLOCK_POSITION[s][i] * BLOCK_SIZE
    )
  }
  return out
}

// 0x08–0x87의 u16 64개 합(mod 2^16). 헤더 · 배틀 스탯은 빠진다
export function pkmChecksum(plain: Uint8Array): number {
  let sum = 0
  for (let at = HEADER_SIZE; at < STORED_SIZE; at += 2) {
    sum = (sum + readU16(plain, at)) & 0xffff
  }
  return sum
}

export type DecodedPkm = {
  data: Uint8Array // 늘 새 236바이트 평문(A · B · C · D 순서). 220바이트 입력이면 220–235는 0
  pid: number
  shuffle: number // shuffleIndex(pid)
  storedChecksum: number
  computedChecksum: number
  decoded: boolean // 입력 길이가 236도 220도 아니면 false
}

export function pkmOk(pkm: DecodedPkm): boolean {
  return pkm.decoded && pkm.storedChecksum === pkm.computedChecksum
}

export function decodePkm(encrypted: Uint8Array): DecodedPkm {
  const size = encrypted.length
  if (size !== PARTY_PKM_SIZE && size !== PK5.partySize) {
    return {
      data: new Uint8Array(PARTY_PKM_SIZE),
      pid: 0,
      shuffle: 0,
      storedChecksum: 0,
      computedChecksum: 0,
      decoded: false,
    }
  }
  // 복사본에서 작업한다 — 세이브 버퍼를 제자리에서 풀면 파일 바이트가 망가진다
  const data = new Uint8Array(PARTY_PKM_SIZE)
  data.set(encrypted)
  const pid = readU32(data, 0)
  const storedChecksum = readU16(data, 6)
  cryptArray(data.subarray(HEADER_SIZE, STORED_SIZE), storedChecksum)
  cryptArray(data.subarray(STORED_SIZE, size), pid)
  const s = shuffleIndex(pid)
  data.set(unshuffle(data.subarray(HEADER_SIZE, STORED_SIZE), s), HEADER_SIZE)
  return {
    data,
    pid,
    shuffle: s,
    storedChecksum,
    computedChecksum: pkmChecksum(data),
    decoded: true,
  }
}

// 평문 236바이트 → 세이브에 들어갈 모양(236바이트, 앞 size바이트만 의미 있음).
// 체크섬은 다시 계산한다 — 고친 값이 반영되게
export function encodePkm(plain: Uint8Array, size: 236 | 220): Uint8Array {
  const out = new Uint8Array(PARTY_PKM_SIZE)
  out.set(plain.subarray(0, PARTY_PKM_SIZE))
  writeU16(out, 6, pkmChecksum(out))
  const pid = readU32(out, 0)
  const checksum = readU16(out, 6)
  out.set(
    shuffle(out.subarray(HEADER_SIZE, STORED_SIZE), shuffleIndex(pid)),
    HEADER_SIZE
  )
  cryptArray(out.subarray(HEADER_SIZE, STORED_SIZE), checksum)
  cryptArray(out.subarray(STORED_SIZE, size), pid)
  return out
}
