// 파티 한 마리 쓰기 — 읽기의 반대: 평문 → 체크섬 → 섞기 → 암호화 → 블록 CRC.
// save는 늘 사본(SaveFile.bytes.slice())이어야 한다. 원본 파일은 쓰지 않는다
import { refreshFooter, refreshPartyBlock } from "./block.ts"
import { readU8 } from "./bytes.ts"
import { encodePkm } from "./pkm.ts"
import { baseOf, type NdsSeries } from "./party.ts"

export function writeMember(
  save: Uint8Array,
  series: NdsSeries,
  index: number,
  plain: Uint8Array
): boolean {
  const base = baseOf(save, series) // 다른 시리즈의 세이브면 null
  if (base === null) return false
  const count = readU8(save, base + series.partyCountOffset)
  if (!Number.isInteger(index) || index < 0 || index >= count) return false
  const size = series.pkm.partySize
  const at = base + series.partyOffset + index * size
  if (at + size > save.length) return false
  save.set(encodePkm(plain, size).subarray(0, size), at)
  const check = series.check
  // 4세대는 지금 쓰는 슬롯만, 저장 횟수는 그대로
  if (check.kind === "footerSlots") refreshFooter(save, base, check)
  else refreshPartyBlock(save, check)
  return true
}
