// 세이브 바이트 도우미 — DS는 리틀 엔디언.
// 범위 밖 읽기는 0, 범위 밖 쓰기는 아무것도 안 한다(DataView처럼 던지지 않는다)

function inRange(data: Uint8Array, offset: number, size: number): boolean {
  return Number.isInteger(offset) && offset >= 0 && offset + size <= data.length
}

export function readU8(data: Uint8Array, offset: number): number {
  return inRange(data, offset, 1) ? data[offset] : 0
}

export function readU16(data: Uint8Array, offset: number): number {
  if (!inRange(data, offset, 2)) return 0
  return data[offset] | (data[offset + 1] << 8)
}

export function readU32(data: Uint8Array, offset: number): number {
  if (!inRange(data, offset, 4)) return 0
  // >>> 0: 31번 비트가 켜져도 양수로
  return (readU16(data, offset) | (readU16(data, offset + 2) << 16)) >>> 0
}

export function writeU16(
  data: Uint8Array,
  offset: number,
  value: number
): void {
  if (!inRange(data, offset, 2)) return
  data[offset] = value & 0xff
  data[offset + 1] = (value >>> 8) & 0xff
}

export function writeU32(
  data: Uint8Array,
  offset: number,
  value: number
): void {
  if (!inRange(data, offset, 4)) return
  writeU16(data, offset, value & 0xffff)
  writeU16(data, offset + 2, (value >>> 16) & 0xffff)
}

// CRC-16/CCITT-FALSE(다항식 0x1021, 초기값 0xFFFF, 반사 · 마지막 XOR 없음)
export function crc16Ccitt(data: Uint8Array): number {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc
}
