// 테스트용 합성 세이브(독립 오라클). 진짜 세이브는 리포에 넣지 않으므로 알려진 포켓몬으로 직접 만든다.
// 제품 코드의 encodePkm · shuffle · writeU16은 쓰지 않는다 — 제품 버그가 오라클에 숨지 않게.
// 외부 검증 값이 있는 crc16Ccitt · cryptArray · pkmChecksum · BLOCK_POSITION만 빌린다
import { crc16Ccitt } from "../../src/core/save/bytes.ts"
import type { ChecksumTable, FooterSlots } from "../../src/core/save/block.ts"
import { NDS_SERIES, type NdsSeries } from "../../src/core/save/party.ts"
import {
  BLOCK_POSITION,
  cryptArray,
  pkmChecksum,
} from "../../src/core/save/pkm.ts"

export function putU16(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff
  data[offset + 1] = (value >>> 8) & 0xff
}

export function putU32(data: Uint8Array, offset: number, value: number): void {
  putU16(data, offset, value & 0xffff)
  putU16(data, offset + 2, (value >>> 16) & 0xffff)
}

export type MemberSpec = {
  pid: number
  species: number
  heldItem: number
  ability: number
  formByte: number // 비트 0 운명 · 1–2 성별 · 3–7 폼
  moves: [number, number, number, number]
  evs: [number, number, number, number, number, number]
  iv32: number
  level: number
  hp: number
  maxHp: number
  battleStats: [number, number, number, number, number] // 0x92: 공격 · 방어 · 스피드 · 특공 · 특방
  originGame: number // 0x5F
  natureByte: number // 0x41 — 5세대 성격
  hiddenAbility: boolean // 0x42 비트 0 — 5세대
}

export function memberSpec(over: Partial<MemberSpec> = {}): MemberSpec {
  return {
    pid: 0x12345678,
    species: 392, // 초염몽
    heldItem: 0,
    ability: 66, // 맹화
    formByte: 0,
    moves: [7, 53, 394, 0],
    evs: [0, 0, 0, 0, 0, 0],
    iv32: 0,
    level: 50,
    hp: 100,
    maxHp: 120,
    battleStats: [101, 102, 103, 104, 105],
    originGame: 8, // 소울실버
    natureByte: 0,
    hiddenAbility: false,
    ...over,
  }
}

// 평문 PKM(A · B · C · D 순서, 체크섬 포함)
export function plainPkm(over: Partial<MemberSpec> = {}): Uint8Array {
  const m = memberSpec(over)
  const p = new Uint8Array(236)
  putU32(p, 0x00, m.pid)
  putU16(p, 0x08, m.species)
  putU16(p, 0x0a, m.heldItem)
  p[0x15] = m.ability
  for (let k = 0; k < 6; k++) p[0x18 + k] = m.evs[k]
  for (let k = 0; k < 4; k++) putU16(p, 0x28 + 2 * k, m.moves[k])
  putU32(p, 0x38, m.iv32)
  p[0x40] = m.formByte
  p[0x41] = m.natureByte
  p[0x42] = m.hiddenAbility ? 1 : 0
  p[0x5f] = m.originGame
  p[0x8c] = m.level
  putU16(p, 0x8e, m.hp)
  putU16(p, 0x90, m.maxHp)
  for (let k = 0; k < 5; k++) putU16(p, 0x92 + 2 * k, m.battleStats[k])
  putU16(p, 0x06, pkmChecksum(p))
  return p
}

// 세이브 안의 모양(늘 236바이트): 블록을 PID 순서로 섞고 두 영역을 암호화
export function synthEncodePkm(plain: Uint8Array): Uint8Array {
  const out = plain.slice()
  const pid =
    (plain[0] | (plain[1] << 8) | (plain[2] << 16) | (plain[3] << 24)) >>> 0
  const checksum = plain[6] | (plain[7] << 8)
  const s = ((pid >>> 13) & 0x1f) % 24 // 파서의 shuffleIndex와 따로 계산
  for (let i = 0; i < 4; i++) {
    const pos = BLOCK_POSITION[s][i]
    out.set(plain.subarray(8 + 32 * i, 8 + 32 * i + 32), 8 + 32 * pos)
  }
  cryptArray(out.subarray(8, 136), checksum)
  cryptArray(out.subarray(136, 236), pid)
  return out
}

export function seriesOf(versionGroup: string): NdsSeries {
  return (
    NDS_SERIES.find((s) => s.versionGroup === versionGroup) ?? NDS_SERIES[0]
  )
}

export function footerSlotsOf(series: NdsSeries): FooterSlots {
  if (series.check.kind !== "footerSlots") throw new Error("not footerSlots")
  return series.check
}

export function checksumTableOf(series: NdsSeries): ChecksumTable {
  if (series.check.kind !== "checksumTable") {
    throw new Error("not checksumTable")
  }
  return series.check
}

// ── 4세대식(FooterSlots) ────────────────────────────────────

export type SlotSpec = {
  major?: number
  minor?: number
  party?: Partial<MemberSpec>[]
  corrupt?: boolean // CRC를 쓴 뒤 데이터 한 바이트를 바꾼다
}

function writeSlot(
  save: Uint8Array,
  start: number,
  series: NdsSeries,
  slot: SlotSpec
): void {
  const check = footerSlotsOf(series)
  const block = save.subarray(start, start + check.generalSize)
  block.fill(0)
  const party = slot.party ?? []
  block[series.partyCountOffset] = party.length
  party.forEach((m, i) => {
    block.set(synthEncodePkm(plainPkm(m)), series.partyOffset + i * 236)
  })
  const end = check.generalSize
  putU32(block, end - 0x14, slot.major ?? 1)
  putU32(block, end - 0x10, slot.minor ?? 0)
  putU32(block, end - 0x0c, check.generalSize)
  putU32(block, end - 0x08, 0x20060623)
  putU16(
    block,
    end - 0x02,
    crc16Ccitt(block.subarray(0, check.generalSize - check.footerSize))
  )
  if (slot.corrupt) block[0x10] ^= 0xff
}

// 4세대 시리즈의 세이브. 슬롯이 null이면 한 번도 안 쓴 플래시처럼 0xFF로 남는다
export function buildSave(
  series: NdsSeries,
  slot0: SlotSpec | null,
  slot1: SlotSpec | null = null
): Uint8Array {
  const save = new Uint8Array(0x80000).fill(0xff)
  if (slot0) writeSlot(save, 0, series, slot0)
  if (slot1) writeSlot(save, 0x40000, series, slot1)
  return save
}

// ── 5세대식(ChecksumTable) ──────────────────────────────────

export type TableSaveSpec = {
  party?: Partial<MemberSpec>[]
  corruptTable?: boolean // 모음 블록 CRC를 쓴 뒤 그 안의 한 바이트를 바꾼다
  corruptParty?: boolean // 파티 블록 CRC를 쓴 뒤 파티 블록 한 바이트를 바꾼다
}

// 파티 블록 + 체크섬 모음 블록만 채운 세이브(나머지 0).
// 파티 CRC를 두 곳에 먼저 쓰고, 그 사본이 든 모음 블록의 CRC를 마지막에 쓴다
export function buildTableSave(
  series: NdsSeries,
  spec: TableSaveSpec
): Uint8Array {
  const check = checksumTableOf(series)
  const size = series.pkm.partySize
  const save = new Uint8Array(0x80000)
  const party = spec.party ?? []
  save[series.partyCountOffset] = party.length
  party.forEach((m, i) => {
    // 220바이트 = 236바이트 암호문의 앞부분(스트림이 앞에서부터 같다)
    save.set(
      synthEncodePkm(plainPkm(m)).subarray(0, size),
      series.partyOffset + i * size
    )
  })
  const partyCrc = crc16Ccitt(
    save.subarray(check.partyBlock, check.partyBlock + check.partyBlockSize)
  )
  putU16(save, check.partyCrcAt, partyCrc)
  const table = check.mainSize - 0x100
  putU16(save, table + check.partyCrcMirror, partyCrc)
  putU16(
    save,
    table + check.tableLength + 0x0e,
    crc16Ccitt(save.subarray(table, table + check.tableLength))
  )
  if (spec.corruptTable) save[table + 0x10] ^= 0xff
  if (spec.corruptParty) save[series.partyOffset + 0x20] ^= 0xff
  return save
}

// 시리즈에 맞는 빌더로 한 마리짜리 세이브
export function buildAnySave(
  series: NdsSeries,
  party: Partial<MemberSpec>[] = [{}]
): Uint8Array {
  return series.check.kind === "footerSlots"
    ? buildSave(series, { party })
    : buildTableSave(series, { party })
}

// 16진수 덤프(공백 구분) → 바이트
export function hex(text: string): Uint8Array {
  const parts = text.split(/\s+/).filter((t) => t.length > 0)
  return Uint8Array.from(parts.map((t) => parseInt(t, 16)))
}

// 큰 배열 비교(toEqual은 512 KiB에서 몇 초 걸린다)
export function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i])
}
