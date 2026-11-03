// 쓰기 경로 — CRC 다시 쓰기 · 필드 고치기 · 한 마리 쓰기 (Qt partywriter 테스트)
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"

import {
  checksumTableValid,
  crcOk,
  partyBlockValid,
  readFooter,
  refreshFooter,
  refreshPartyBlock,
} from "../../src/core/save/block.ts"
import { readU16 } from "../../src/core/save/bytes.ts"
import { setHeldItem, setMoves } from "../../src/core/save/fields.ts"
import { findSeries, readParty } from "../../src/core/save/party.ts"
import { decodePkm, pkmOk } from "../../src/core/save/pkm.ts"
import { writeMember } from "../../src/core/save/writer.ts"
import {
  buildSave,
  buildTableSave,
  checksumTableOf,
  footerSlotsOf,
  plainPkm,
  sameBytes,
  seriesOf,
} from "./syntheticSave.ts"

const pt = seriesOf("platinum")
const bw = seriesOf("black-white")

describe("CRC 다시 쓰기", () => {
  it("고친 뒤 footer를 다시 맞춘다", () => {
    const save = buildSave(pt, { party: [{}] })
    save[0x10] ^= 0xff
    expect(crcOk(readFooter(save, 0, footerSlotsOf(pt)))).toBe(false)
    refreshFooter(save, 0, footerSlotsOf(pt))
    expect(crcOk(readFooter(save, 0, footerSlotsOf(pt)))).toBe(true)
  })
  it("파티 블록과 모음 블록을 다시 맞춘다", () => {
    const save = buildTableSave(bw, { party: [{}] })
    save[0x18e08 + 0x20] ^= 0xff
    const check = checksumTableOf(bw)
    expect(partyBlockValid(save, check)).toBe(false)
    refreshPartyBlock(save, check)
    expect(partyBlockValid(save, check)).toBe(true)
    expect(checksumTableValid(save, check)).toBe(true)
  })
  it("파일 밖이면 아무것도 안 한다", () => {
    const tiny = new Uint8Array(16)
    refreshPartyBlock(tiny, checksumTableOf(bw))
    refreshFooter(tiny, 0, footerSlotsOf(pt))
    expect(tiny).toEqual(new Uint8Array(16))
  })
})

describe("필드 고치기", () => {
  it("물건은 16비트를 모두 쓴다(Qt는 8비트로 잘랐다)", () => {
    const plain = plainPkm()
    setHeldItem(plain, 328)
    expect(readU16(plain, 0x0a)).toBe(328)
  })
  it("기술 · PP를 쓰고 PP 업은 0", () => {
    const plain = plainPkm()
    plain.fill(3, 0x34, 0x38)
    setMoves(plain, [33, 45, 0, 0], [35, 40, 0, 0])
    expect(readU16(plain, 0x28)).toBe(33)
    expect(readU16(plain, 0x2a)).toBe(45)
    expect(plain.subarray(0x30, 0x38)).toEqual(
      Uint8Array.from([35, 40, 0, 0, 0, 0, 0, 0])
    )
  })
})

describe("한 마리 쓰기", () => {
  it("Pt 세이브의 한 마리를 바꾼다", () => {
    const save = buildSave(
      pt,
      { party: [{}, { species: 35 }] },
      { major: 0, party: [{}] }
    )
    const before = readParty(save)
    const slot1Before = save.slice(0x40000)
    const at = 0xa0 + 236
    const plain = decodePkm(save.subarray(at, at + 236)).data
    setMoves(plain, [33, 45, 0, 0], [35, 40, 0, 0])
    setHeldItem(plain, 234)
    expect(writeMember(save, pt, 1, plain)).toBe(true)

    const after = readParty(save)
    expect(after?.members[1].moves).toEqual([33, 45, 0, 0])
    expect(after?.members[1].heldItem).toBe(234)
    expect(after?.members[1].checksumOk).toBe(true)
    expect(after?.members[0].moves).toEqual(before?.members[0].moves)
    expect(sameBytes(save.slice(0x40000), slot1Before)).toBe(true) // 다른 슬롯은 그대로
    expect(readFooter(save, 0, footerSlotsOf(pt)).storedCrc).toBe(0x86b0)
    expect(createHash("sha256").update(save).digest("hex")).toBe(
      "db6051b291cc1ec6bae01777d6f571e8e6e9eb521423a30f0c0ec24cc72a0fa3"
    )
  })
  it("BW 세이브의 한 마리를 바꾼다", () => {
    const save = buildTableSave(bw, { party: [{}] })
    const plain = decodePkm(save.subarray(0x18e08, 0x18e08 + 220)).data
    setMoves(plain, [89, 0, 0, 0], [10, 0, 0, 0])
    expect(writeMember(save, bw, 0, plain)).toBe(true)
    const party = readParty(save)
    expect(party?.members[0].moves).toEqual([89, 0, 0, 0])
    expect(party?.members[0].checksumOk).toBe(true)
    expect(pkmOk(decodePkm(save.subarray(0x18e08, 0x18e08 + 220)))).toBe(true)
  })
  it("쓸 수 없는 것은 거절한다", () => {
    const save = buildSave(pt, { party: [{}] })
    const before = save.slice()
    const plain = plainPkm()
    expect(writeMember(save, pt, 1, plain)).toBe(false) // 한 마리뿐
    expect(writeMember(save, pt, -1, plain)).toBe(false)
    expect(writeMember(save, bw, 0, plain)).toBe(false) // 다른 시리즈
    expect(sameBytes(save, before)).toBe(true)
    expect(findSeries("platinum")).toBe(pt)
    expect(findSeries("x-y")).toBeNull()
  })
})
