// 블록 검증 · 시리즈 감지 (Qt saveblock · partyndsreader 테스트) + 합성 세이브 교차 확인
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"

import {
  activeGeneralBlock,
  checksumTableStart,
  checksumTableValid,
  crcOk,
  partyBlockValid,
  readFooter,
} from "../../src/core/save/block.ts"
import { readU16 } from "../../src/core/save/bytes.ts"
import { NDS_SERIES, readNds, readSeries } from "../../src/core/save/party.ts"
import {
  buildAnySave,
  buildSave,
  buildTableSave,
  checksumTableOf,
  footerSlotsOf,
  seriesOf,
} from "./syntheticSave.ts"

const pt = seriesOf("platinum")
const hgss = seriesOf("heartgold-soulsilver")
const bw = seriesOf("black-white")
const b2w2 = seriesOf("black-2-white-2")
const sha256 = (data: Uint8Array) =>
  createHash("sha256").update(data).digest("hex")

describe("합성 세이브(오라클) 교차 확인", () => {
  it.each([
    [
      "diamond-pearl",
      "39929fdc54ac05ed31423133ebc3a65c106984d103324630aaef864fa2448c2a",
      0x6f82,
    ],
    [
      "platinum",
      "1fb4f1d4e98bf968cb7e370eb1c54ed58e1f0fa8c3715978d0b981cbe00cbf27",
      0xceef,
    ],
    [
      "heartgold-soulsilver",
      "783b4e887be9e992ef991c30ba415720f84763280533e1af9c7fedf078659104",
      0xbef4,
    ],
  ])("%s 4세대 세이브가 Qt와 같다", (group, hash, crc) => {
    const series = seriesOf(group)
    const save = buildSave(series, { party: [{}] })
    expect(sha256(save)).toBe(hash)
    expect(readFooter(save, 0, footerSlotsOf(series)).storedCrc).toBe(crc)
  })
  it.each([
    [
      "black-white",
      "e6b24641ac63f53d1ff6e28112bfbf79b3550f50f14793fdf8ea0d1a228242f5",
      0x5b3a,
      0x23f9a,
    ],
    [
      "black-2-white-2",
      "249f2b7958f356a56890d5f849ec2bd174246c4c13bcd51e517950f0e58eb639",
      0xb708,
      0x25fa2,
    ],
  ])("%s 5세대 세이브가 Qt와 같다", (group, hash, tableCrc, at) => {
    const series = seriesOf(group)
    const save = buildTableSave(series, { party: [{}] })
    expect(sha256(save)).toBe(hash)
    expect(readU16(save, checksumTableOf(series).partyCrcAt)).toBe(0xdcb7)
    expect(readU16(save, at)).toBe(tableCrc)
  })
})

describe("4세대 footer", () => {
  it("footer 필드를 읽는다", () => {
    const save = buildSave(pt, { major: 7, minor: 3 })
    const footer = readFooter(save, 0, footerSlotsOf(pt))
    expect(footer.major).toBe(7)
    expect(footer.minor).toBe(3)
    expect(footer.size).toBe(0xcf2c)
    expect(footer.magic).toBe(0x20060623)
    expect(crcOk(footer)).toBe(true)
  })
  it("HGSS footer CRC는 major 카운터까지 덮는다", () => {
    const save = buildSave(hgss, { major: 2 })
    expect(crcOk(readFooter(save, 0, footerSlotsOf(hgss)))).toBe(true)
  })
  it("바뀐 블록은 CRC가 틀린다", () => {
    const save = buildSave(pt, { corrupt: true })
    expect(crcOk(readFooter(save, 0, footerSlotsOf(pt)))).toBe(false)
  })
  it("쓴 슬롯이 하나뿐이면 그 슬롯", () => {
    expect(activeGeneralBlock(buildSave(pt, {}), footerSlotsOf(pt))).toBe(0)
    expect(activeGeneralBlock(buildSave(pt, null, {}), footerSlotsOf(pt))).toBe(
      0x40000
    )
  })
  it("major가 큰 슬롯", () => {
    const check = footerSlotsOf(pt)
    expect(
      activeGeneralBlock(buildSave(pt, { major: 5 }, { major: 6 }), check)
    ).toBe(0x40000)
    expect(
      activeGeneralBlock(buildSave(pt, { major: 6 }, { major: 5 }), check)
    ).toBe(0)
  })
  it("major가 같으면 minor", () => {
    const save = buildSave(pt, { major: 4, minor: 9 }, { major: 4, minor: 2 })
    expect(activeGeneralBlock(save, footerSlotsOf(pt))).toBe(0)
  })
  it("카운터는 부호 없는 수로 비교한다", () => {
    const save = buildSave(pt, { major: 0x80000000 }, { major: 1 })
    expect(activeGeneralBlock(save, footerSlotsOf(pt))).toBe(0)
  })
  it("CRC가 틀린 새 슬롯은 무시한다", () => {
    const save = buildSave(pt, { major: 3 }, { major: 4, corrupt: true })
    expect(activeGeneralBlock(save, footerSlotsOf(pt))).toBe(0)
  })
  it("빈 세이브에는 쓸 블록이 없다", () => {
    expect(activeGeneralBlock(buildSave(pt, null), footerSlotsOf(pt))).toBe(
      null
    )
  })
  it("파일 밖의 블록은 절대 맞지 않는다", () => {
    const tiny = new Uint8Array(12)
    expect(crcOk(readFooter(tiny, 0, footerSlotsOf(pt)))).toBe(false)
    expect(activeGeneralBlock(tiny, footerSlotsOf(pt))).toBeNull()
  })
  it("다른 게임 배치로는 검증되지 않는다", () => {
    const save = buildSave(pt, { major: 1 }, { major: 2 })
    for (const series of NDS_SERIES) {
      if (series === pt || series.check.kind !== "footerSlots") continue
      expect(activeGeneralBlock(save, series.check)).toBeNull()
    }
  })
})

describe("5세대 체크섬 모음", () => {
  it("모음 블록은 본 세이브 끝 0x100 앞", () => {
    expect(checksumTableStart(checksumTableOf(bw))).toBe(0x23f00)
    expect(checksumTableStart(checksumTableOf(b2w2))).toBe(0x25f00)
  })
  it("자기 시리즈의 모음 블록만 맞다", () => {
    const bwSave = buildTableSave(bw, { party: [{}] })
    const b2Save = buildTableSave(b2w2, { party: [{}] })
    expect(checksumTableValid(bwSave, checksumTableOf(bw))).toBe(true)
    expect(checksumTableValid(bwSave, checksumTableOf(b2w2))).toBe(false)
    expect(checksumTableValid(b2Save, checksumTableOf(b2w2))).toBe(true)
    expect(checksumTableValid(b2Save, checksumTableOf(bw))).toBe(false)
  })
  it("바뀐 모음 블록은 틀린다", () => {
    const save = buildTableSave(bw, { party: [{}], corruptTable: true })
    expect(checksumTableValid(save, checksumTableOf(bw))).toBe(false)
  })
  it("파일 밖의 모음 블록은 절대 맞지 않는다", () => {
    const tiny = new Uint8Array(16)
    expect(checksumTableValid(tiny, checksumTableOf(bw))).toBe(false)
    expect(partyBlockValid(tiny, checksumTableOf(bw))).toBe(false)
  })
  it("파티 블록 CRC를 두 곳 모두 확인한다", () => {
    expect(
      partyBlockValid(buildTableSave(bw, { party: [{}] }), checksumTableOf(bw))
    ).toBe(true)
    expect(
      partyBlockValid(
        buildTableSave(b2w2, { party: [{}] }),
        checksumTableOf(b2w2)
      )
    ).toBe(true)
    expect(
      partyBlockValid(
        buildTableSave(bw, { party: [{}], corruptParty: true }),
        checksumTableOf(bw)
      )
    ).toBe(false)
    const mirrorBroken = buildTableSave(bw, { party: [{}] })
    mirrorBroken[0x23f00 + 0x34] ^= 0xff
    expect(partyBlockValid(mirrorBroken, checksumTableOf(bw))).toBe(false)
  })
})

describe("NDS 시리즈 감지", () => {
  it("시리즈 표는 4 · 5세대 다섯 줄", () => {
    expect(NDS_SERIES.length).toBe(5)
    for (const series of NDS_SERIES) {
      if (series.generation === 4) {
        expect(series.check.kind).toBe("footerSlots")
        expect(series.pkm.name).toBe("PK4")
      } else {
        expect(series.check.kind).toBe("checksumTable")
        expect(series.pkm.name).toBe("PK5")
      }
    }
  })
  it("Pt 파티를 읽는다", () => {
    const save = buildSave(pt, {
      party: [
        { species: 392 },
        { species: 398, pid: 0x0badf00d },
        { species: 448, pid: 0x7777aaaa },
      ],
    })
    const party = readNds(save)
    expect(party?.generation).toBe(4)
    expect(party?.versionGroup).toBe("platinum")
    expect(party?.partyOffset).toBe(0xa0)
    expect(party?.members.map((m) => m.species)).toEqual([392, 398, 448])
    expect(party?.members.every((m) => m.checksumOk)).toBe(true)
  })
  it("새 슬롯을 읽는다", () => {
    const save = buildSave(
      hgss,
      { major: 10, party: [{ species: 387 }] },
      { major: 11, party: [{ species: 388 }, { species: 16 }] }
    )
    const party = readNds(save)
    expect(party?.partyOffset).toBe(0x40000 + 0x98)
    expect(party?.members.length).toBe(2)
    expect(party?.members[0].species).toBe(388)
  })
  it("DeSmuME footer가 붙어도 읽는다", () => {
    const save = buildSave(pt, { party: [{}] })
    const dsv = new Uint8Array(save.length + 122)
    dsv.set(save)
    expect(readNds(dsv)).not.toBeNull()
  })
  it("세이브가 아닌 것", () => {
    expect(readNds(new Uint8Array(1000))).toBeNull()
    expect(readNds(new Uint8Array(0x80000).fill(0xff))).toBeNull()
    expect(readNds(new Uint8Array(0x80000))).toBeNull()
  })
  it("빈 파티는 받지 않는다", () => {
    expect(readSeries(buildSave(pt, {}), pt)).toBeNull()
    expect(readSeries(buildTableSave(bw, {}), bw)).toBeNull()
  })
  it("BW 파티를 읽는다", () => {
    const save = buildTableSave(bw, {
      party: [
        {
          species: 571, // 조로아크
          pid: 0x2313,
          natureByte: 9,
          hiddenAbility: true,
          originGame: 21,
        },
        { species: 495, pid: 0x0badf00d },
      ],
    })
    const party = readNds(save)
    expect(party?.generation).toBe(5)
    expect(party?.versionGroup).toBe("black-white")
    expect(party?.partyOffset).toBe(0x18e08)
    expect(party?.members.length).toBe(2)
    const [zoroark, second] = party?.members ?? []
    expect(zoroark.species).toBe(571)
    expect(zoroark.nature).toBe(9)
    expect(zoroark.hiddenAbility).toBe(true)
    expect(zoroark.originGame).toBe(21)
    expect(second.species).toBe(495)
    expect(second.hiddenAbility).toBe(false)
    expect(party?.members.every((m) => m.checksumOk)).toBe(true)
  })
  it("파티 블록이 안 맞으면 받지 않는다", () => {
    expect(
      readNds(buildTableSave(bw, { party: [{}], corruptParty: true }))
    ).toBeNull()
  })
  it("모든 시리즈를 알아본다", () => {
    for (const series of NDS_SERIES) {
      const party = readNds(buildAnySave(series))
      expect(party?.generation).toBe(series.generation)
      expect(party?.versionGroup).toBe(series.versionGroup)
    }
  })
  it("어느 시리즈도 다른 시리즈의 세이브를 읽지 않는다", () => {
    for (const written of NDS_SERIES) {
      const save = buildAnySave(written)
      for (const other of NDS_SERIES) {
        if (other === written) continue
        expect(readSeries(save, other)).toBeNull()
      }
    }
  })
})
