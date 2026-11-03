// 세이브 블록 검증 — 두 방식.
// 4세대(DP · Pt · HGSS): 슬롯 두 개 + 일반 블록 끝 footer의 CRC · 저장 횟수
// 5세대(BW · B2W2): 체크섬 모음 블록 + 파티 블록 CRC(두 곳)
import { crc16Ccitt, readU16, readU32, writeU16 } from "./bytes.ts"

export const SAVE_SIZE = 0x80000 // 최소 크기(DeSmuME .dsv는 뒤에 122바이트가 더 붙는다)
export const SLOT_SIZE = 0x40000 // 4세대 슬롯 1의 시작

export type FooterSlots = {
  kind: "footerSlots"
  generalSize: number // 일반 블록 크기(끝에 footer)
  footerSize: number // CRC 범위에서 빠지는 footer 길이
}

export type ChecksumTable = {
  kind: "checksumTable"
  mainSize: number // 본 세이브 크기(BW 0x24000 · B2W2 0x26000)
  tableLength: number // 체크섬 모음 블록 길이(BW 0x8C · B2W2 0x94)
  partyBlock: number // 파티 블록 시작(파일 오프셋)
  partyBlockSize: number // 파티 블록 길이 = CRC 범위
  partyCrcAt: number // 파티 블록 CRC 자리(파일 오프셋)
  partyCrcMirror: number // 모음 블록 안의 파티 CRC 사본(모음 블록 시작 기준)
}

export type BlockCheck = FooterSlots | ChecksumTable

export type BlockFooter = {
  major: number
  minor: number
  size: number // 읽기만 하고 확인하지 않는다
  magic: number // 0x20060623 · 0x20070903(한국판) — 확인하지 않는다
  storedCrc: number
  computedCrc: number
  inFile: boolean // footer가 파일 안에 있나
}

// ── 4세대: footer 슬롯 ──────────────────────────────────────

export function readFooter(
  save: Uint8Array,
  blockStart: number,
  check: FooterSlots
): BlockFooter {
  const end = blockStart + check.generalSize
  if (end > save.length) {
    return {
      major: 0,
      minor: 0,
      size: 0,
      magic: 0,
      storedCrc: 0,
      computedCrc: 0,
      inFile: false,
    }
  }
  return {
    major: readU32(save, end - 0x14),
    minor: readU32(save, end - 0x10),
    size: readU32(save, end - 0x0c),
    magic: readU32(save, end - 0x08),
    storedCrc: readU16(save, end - 0x02),
    computedCrc: crc16Ccitt(save.subarray(blockStart, end - check.footerSize)),
    inFile: true,
  }
}

export function crcOk(footer: BlockFooter): boolean {
  return footer.inFile && footer.storedCrc === footer.computedCrc
}

// 두 슬롯 중 쓸 일반 블록의 시작(0 · 0x40000). 둘 다 CRC가 맞으면 (major, minor)가 큰 쪽,
// 같으면 슬롯 0. 둘 다 틀리면 null
export function activeGeneralBlock(
  save: Uint8Array,
  check: FooterSlots
): number | null {
  const f0 = readFooter(save, 0, check)
  const f1 = readFooter(save, SLOT_SIZE, check)
  const ok0 = crcOk(f0)
  const ok1 = crcOk(f1)
  if (ok0 && ok1) {
    // readU32가 부호 없는 값을 주므로 그대로 비교해도 된다
    if (f0.major !== f1.major) return f0.major > f1.major ? 0 : SLOT_SIZE
    if (f0.minor !== f1.minor) return f0.minor > f1.minor ? 0 : SLOT_SIZE
    return 0
  }
  if (ok1) return SLOT_SIZE
  if (ok0) return 0
  return null
}

// 쓰기 뒤 footer CRC 다시 쓰기. 저장 횟수는 건드리지 않는다
export function refreshFooter(
  save: Uint8Array,
  blockStart: number,
  check: FooterSlots
): void {
  const end = blockStart + check.generalSize
  if (end > save.length) return
  writeU16(
    save,
    end - 0x02,
    crc16Ccitt(save.subarray(blockStart, end - check.footerSize))
  )
}

// ── 5세대: 체크섬 모음 블록 ──────────────────────────────────

// 모음 블록 시작 — 본 세이브 끝에서 0x100 앞(BW 0x23F00 · B2W2 0x25F00)
export function checksumTableStart(check: ChecksumTable): number {
  return check.mainSize - 0x100
}

// 모음 블록 자기 CRC 자리(BW 0x23F9A · B2W2 0x25FA2)
function tableCrcAt(check: ChecksumTable): number {
  return checksumTableStart(check) + check.tableLength + 0x0e
}

export function checksumTableValid(
  save: Uint8Array,
  check: ChecksumTable
): boolean {
  const start = checksumTableStart(check)
  const at = tableCrcAt(check)
  if (at + 2 > save.length) return false // 파일 밖(0 == 0이 "맞는" 일이 없게)
  return (
    crc16Ccitt(save.subarray(start, start + check.tableLength)) ===
    readU16(save, at)
  )
}

function partyCrcPlacesInFile(save: Uint8Array, check: ChecksumTable): boolean {
  const mirror = checksumTableStart(check) + check.partyCrcMirror
  return (
    check.partyCrcAt + 2 <= save.length &&
    mirror + 2 <= save.length &&
    check.partyBlock + check.partyBlockSize <= save.length
  )
}

// 파티 블록 CRC가 두 곳(블록 뒤 · 모음 블록의 사본) 모두와 맞아야 한다
export function partyBlockValid(
  save: Uint8Array,
  check: ChecksumTable
): boolean {
  if (!partyCrcPlacesInFile(save, check)) return false
  const mirror = checksumTableStart(check) + check.partyCrcMirror
  const crc = crc16Ccitt(
    save.subarray(check.partyBlock, check.partyBlock + check.partyBlockSize)
  )
  return (
    crc === readU16(save, check.partyCrcAt) && crc === readU16(save, mirror)
  )
}

// 쓰기 뒤 CRC 다시 쓰기. 순서가 중요하다 — 사본이 모음 블록 안에 있으므로 모음 CRC는 마지막
export function refreshPartyBlock(
  save: Uint8Array,
  check: ChecksumTable
): void {
  if (!partyCrcPlacesInFile(save, check)) return
  if (tableCrcAt(check) + 2 > save.length) return
  const table = checksumTableStart(check)
  const crc = crc16Ccitt(
    save.subarray(check.partyBlock, check.partyBlock + check.partyBlockSize)
  )
  writeU16(save, check.partyCrcAt, crc)
  writeU16(save, table + check.partyCrcMirror, crc)
  writeU16(
    save,
    tableCrcAt(check),
    crc16Ccitt(save.subarray(table, table + check.tableLength))
  )
}
