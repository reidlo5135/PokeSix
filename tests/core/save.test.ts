// 세이브 파서 낮은 층 — 바이트 도우미 · PKM 코덱 · 필드 해석 (Qt savebytes · pkmcodec · partyreader 테스트)
import { describe, expect, it } from "vitest"

import {
  crc16Ccitt,
  readU16,
  readU32,
  writeU16,
  writeU32,
} from "../../src/core/save/bytes.ts"
import {
  PK5,
  cryptArray,
  decodePkm,
  encodePkm,
  pkmChecksum,
  pkmOk,
  shuffle,
  shuffleIndex,
  unshuffle,
} from "../../src/core/save/pkm.ts"
import {
  PARTY_READERS,
  parseMember,
  readParty,
  type ReadMember,
} from "../../src/core/save/party.ts"
import {
  buildSave,
  buildTableSave,
  hex,
  plainPkm,
  putU16,
  seriesOf,
  synthEncodePkm,
  type MemberSpec,
} from "./syntheticSave.ts"

const bytes = (...values: number[]) => Uint8Array.from(values)

describe("바이트 도우미", () => {
  it("리틀 엔디언으로 읽는다", () => {
    const data = bytes(0x34, 0x12, 0x78, 0x56)
    expect(readU16(data, 0)).toBe(0x1234)
    expect(readU16(data, 2)).toBe(0x5678)
    expect(readU32(data, 0)).toBe(0x56781234)
  })
  it("최상위 비트가 켜져도 양수", () => {
    const data = bytes(0xff, 0xfe, 0xfd, 0xfc)
    expect(readU16(data, 0)).toBe(0xfeff)
    expect(readU32(data, 0)).toBe(0xfcfdfeff)
  })
  it("범위 밖은 0", () => {
    const data = bytes(1, 2, 3, 4)
    expect(readU16(data, 3)).toBe(0)
    expect(readU32(data, 1)).toBe(0)
    expect(readU16(data, -1)).toBe(0)
  })
  it('CRC-16/CCITT-FALSE 검사값 "123456789" → 0x29B1', () => {
    expect(crc16Ccitt(new TextEncoder().encode("123456789"))).toBe(0x29b1)
  })
  it("빈 입력의 CRC는 초기값", () => {
    expect(crc16Ccitt(new Uint8Array(0))).toBe(0xffff)
  })
  it("Pt 일반 블록 크기의 0 · 0xFF CRC", () => {
    expect(crc16Ccitt(new Uint8Array(0xcf18))).toBe(0xd224)
    expect(crc16Ccitt(new Uint8Array(0xcf18).fill(0xff))).toBe(0xda79)
  })
  it("리틀 엔디언으로 쓰고, 범위 밖 쓰기는 무시한다", () => {
    const data = new Uint8Array(6)
    writeU16(data, 0, 0x1234)
    writeU32(data, 2, 0xcafebabe)
    writeU16(data, 5, 0xffff)
    expect(data[0]).toBe(0x34)
    expect(data[1]).toBe(0x12)
    expect(readU32(data, 2)).toBe(0xcafebabe)
    expect(data[5]).toBe(0xca)
  })
})

describe("PKM 코덱", () => {
  it("알려진 LCRNG 스트림으로 XOR", () => {
    const data = new Uint8Array(8)
    cryptArray(data, 0x1234)
    expect(data).toEqual(hex("CB 4D 61 E1 40 43 F1 FF"))
  })
  it("첫 워드 전에 한 칸 나아간다", () => {
    const data = new Uint8Array(4)
    cryptArray(data, 0)
    expect(data).toEqual(hex("00 00 7E E9"))
  })
  it("두 번 하면 원래대로", () => {
    const original = Uint8Array.from({ length: 16 }, (_, i) => (i * 17) & 0xff)
    const data = original.slice()
    cryptArray(data, 0xcafebabe)
    expect(data).toEqual(hex("4F A9 A9 A3 30 4D D5 78 70 F5 E4 40 6C 2D 8D B0"))
    cryptArray(data, 0xcafebabe)
    expect(data).toEqual(original)
  })
  it("섞기 인덱스는 PID 비트 13–17", () => {
    expect(shuffleIndex(0)).toBe(0)
    expect(shuffleIndex(3 << 13)).toBe(3)
    expect(shuffleIndex(27 << 13)).toBe(3)
    expect(shuffleIndex(0x1fff)).toBe(0)
    expect(shuffleIndex(0xffffffff)).toBe(7)
  })
  it("PID 도우미 값(섞기 · %25)", () => {
    const cases: [number, number, number][] = [
      [0x12345678, 2, 21],
      [0x00000000, 0, 0],
      [0xffffffff, 7, 20],
      [0x0003e000, 7, 2],
      [0x8f3a21c7, 17, 23],
      [0x2313, 1, 4],
      [0x0badf00d, 15, 7],
      [0x7777aaaa, 5, 3],
      [0xcafebabe, 21, 7],
      [0xfb788992, 4, 4],
    ]
    for (const [pid, s, nature] of cases) {
      expect(shuffleIndex(pid)).toBe(s)
      expect(pid % 25).toBe(nature)
    }
  })
  it("Bulbapedia의 24가지 저장 순서를 모두 되섞는다", () => {
    const orders =
      "ABCD ABDC ACBD ACDB ADBC ADCB BACD BADC BCAD BCDA BDAC BDCA CABD CADB CBAD CBDA CDAB CDBA DABC DACB DBAC DBCA DCAB DCBA".split(
        " "
      )
    const expected = Uint8Array.from(
      { length: 128 },
      (_, i) => 65 + Math.floor(i / 32)
    )
    orders.forEach((order, s) => {
      const shuffled = Uint8Array.from({ length: 128 }, (_, i) =>
        order.charCodeAt(Math.floor(i / 32))
      )
      expect(unshuffle(shuffled, s)).toEqual(expected)
    })
  })
  it("섞기를 되섞으면 원래대로(24가지 모두)", () => {
    const blocks = Uint8Array.from({ length: 128 }, (_, i) => i)
    for (let s = 0; s < 24; s++) {
      expect(unshuffle(shuffle(blocks, s), s)).toEqual(blocks)
    }
  })
  it("크기 · 인덱스가 틀리면 0 128바이트", () => {
    expect(unshuffle(new Uint8Array(127).fill(1), 0)).toEqual(
      new Uint8Array(128)
    )
    expect(shuffle(new Uint8Array(128).fill(1), 24)).toEqual(
      new Uint8Array(128)
    )
  })
  it("체크섬은 블록 워드의 합", () => {
    const data = new Uint8Array(236)
    data.fill(0x01, 8, 136)
    expect(pkmChecksum(data)).toBe(0x4040)
    data.fill(0xff, 8, 136)
    expect(pkmChecksum(data)).toBe(0xffc0)
  })
  it("체크섬은 헤더 · 배틀 스탯을 빼고 센다", () => {
    const data = new Uint8Array(236)
    data[0x00] = data[0x06] = data[0x88] = data[0xeb] = 0xff
    expect(pkmChecksum(data)).toBe(0)
  })
  it("24가지 섞기 모두 풀어낸다", () => {
    for (let s = 0; s < 24; s++) {
      const pid = ((s << 13) | (0x01234abc & ~(0x1f << 13))) >>> 0
      const plain = plainPkm({ pid })
      const encrypted = synthEncodePkm(plain)
      expect(encrypted).not.toEqual(plain)
      const pkm = decodePkm(encrypted)
      expect(pkmOk(pkm)).toBe(true)
      expect(pkm.pid).toBe(pid)
      expect(pkm.shuffle).toBe(s)
      expect(pkm.data).toEqual(plain)
    }
  })
  it("입력 버퍼를 바꾸지 않는다", () => {
    const encrypted = synthEncodePkm(plainPkm())
    const before = encrypted.slice()
    decodePkm(encrypted)
    expect(encrypted).toEqual(before)
  })
  it("한 바이트만 바꿔도 체크섬이 틀린다", () => {
    const encrypted = synthEncodePkm(plainPkm())
    encrypted[0x20] ^= 1
    expect(pkmOk(decodePkm(encrypted))).toBe(false)
  })
  it("크기가 틀리면 절대 OK가 아니다", () => {
    const pkm = decodePkm(new Uint8Array(136))
    expect(pkmOk(pkm)).toBe(false)
    expect(pkm.decoded).toBe(false)
    expect(pkm.data.length).toBe(236)
  })
  it("220바이트 PK5도 푼다", () => {
    const pkm = decodePkm(synthEncodePkm(plainPkm()).subarray(0, 220))
    expect(pkmOk(pkm)).toBe(true)
    expect(readU16(pkm.data, 8)).toBe(392)
    expect(pkm.data[0x8c]).toBe(50)
  })
  it("독립 인코더와 바이트까지 같게 암호화한다", () => {
    for (const pid of [0x12345678, 0, 0xffffffff, 0x0003e000]) {
      const plain = plainPkm({ pid })
      expect(encodePkm(plain, 236)).toEqual(synthEncodePkm(plain))
    }
  })
  it("PK5 왕복", () => {
    const plain = plainPkm()
    const pkm = decodePkm(encodePkm(plain, 220).subarray(0, 220))
    expect(pkmOk(pkm)).toBe(true)
    expect(pkm.data.subarray(0, 220)).toEqual(plain.subarray(0, 220))
  })
})

// Qt 코드를 컴파일해 뽑은 덤프
const DEFAULT_ENCRYPTED = hex(`
  78 56 34 12 00 00 4E 4D 8B B1 7B 1F 83 4A E3 AB
  20 DC 65 B6 FD 41 92 79 EA 10 40 52 AD A1 DD 2F
  C6 01 61 CF C4 DA 54 EC 73 65 76 C5 5F 2B 0C 6F
  82 F0 EA 82 1C 56 A2 5E 04 83 8C 5A EF 6A 80 C0
  84 7D 72 27 35 67 5E 61 30 71 2E 2B 83 C2 0B 4A
  71 9F D3 A9 D6 7F 6D 5C 5B FC 5B E9 2D 8C C6 44
  E2 A8 C8 75 D8 90 38 EB F2 17 AA D0 2F 7B 8A F1
  E4 52 71 EE A9 58 2C 49 34 11 0C 26 B5 57 78 25
  77 97 D3 76 CA 01 3A CE 71 0B EA 84 B8 D9 84 F4
  FC 26 52 98 CA 91 E2 05 74 73 66 62 52 C4 E8 10
  87 76 5A 98 22 24 3A B5 CD BF 18 40 E1 BA 75 AE
  4C E6 5D 2A 26 5C 0C 85 84 DD 9B 3D 50 8F C3 82
  2F B2 27 0F BA 24 DA 11 95 04 F5 90 2C EA 70 EA
  1D D4 A6 D7 93 32 26 B2 26 70 C4 3C F4 24 03 F2
  17 A2 4B 61 9E 06 97 86 B4 64 6B D4`)

const EVERY_FIELD_ENCRYPTED = hex(`
  C7 21 3A 8F 00 00 CB A0 44 19 F0 E0 16 CC 42 00
  4C 34 82 99 F1 16 40 E8 E5 F0 C1 45 9A 04 7B 81
  1C 4F A8 21 05 44 73 4E 52 1C 8E 01 33 EA 35 ED
  43 14 E0 98 D8 64 38 AF 44 0E 10 78 3D F3 69 62
  CB BA CD F5 67 C9 84 47 61 B5 83 77 15 41 A5 91
  C1 ED C5 CC 56 BF 1E 4B FD 93 C3 AE 89 2A 8A B3
  A3 C8 53 D2 69 22 22 6B 0D 90 3F 4C 78 50 4E FF
  41 E4 B5 2D 0C 67 7F AC CE 37 0D 11 CD 4A 3B 69
  78 72 5F 9B CC B8 78 8E F5 58 96 CE AB 45 A0 57
  40 F3 B3 FF 68 D0 F6 93 1F 4F 1D 68 50 8C E0 4D
  B0 B9 8A E5 1B 8D BC D5 AC 75 F0 3C 7B 8A 48 13
  0F 16 AB 0D 1B 9B 89 EF E2 AE A2 53 E7 1F 39 A1
  DD 23 97 72 F2 C5 DA F2 E8 16 54 FC 9A C2 0D D6
  DF 3A 24 A6 EA AD 23 D8 95 0E 84 21 3F 9F F4 4B
  1B 44 1A CC 2D 70 EF 3C 41 58 E6 6A`)

const EVERY_FIELD: Partial<MemberSpec> = {
  pid: 0x8f3a21c7,
  species: 479, // 로토무
  heldItem: 0x00ea,
  ability: 26,
  formByte: (2 << 3) | 4,
  moves: [85, 247, 109, 0],
  evs: [4, 0, 252, 0, 252, 0],
  iv32: 31 | (0 << 5) | (15 << 10) | (20 << 15) | (1 << 20) | (30 << 25),
  level: 47,
  hp: 88,
  maxHp: 131,
}

describe("Qt 골든 바이트", () => {
  it("기본 멤버의 평문(체크섬 0x4D4E)", () => {
    const plain = plainPkm()
    expect(plain.length).toBe(236)
    expect(plain.subarray(0, 0x10)).toEqual(
      hex("78 56 34 12 00 00 4E 4D 88 01 00 00 00 00 00 00")
    )
    expect(plain[0x15]).toBe(0x42)
    expect(plain.subarray(0x28, 0x2e)).toEqual(hex("07 00 35 00 8A 01"))
    expect(plain[0x5f]).toBe(0x08)
    expect(plain.subarray(0x8c, 0xa0)).toEqual(
      hex("32 00 64 00 78 00 65 00 66 00 67 00 68 00 69 00 00 00 00 00")
    )
    expect(shuffleIndex(readU32(plain, 0))).toBe(2)
  })
  it("기본 멤버의 암호문 = 독립 인코더 = 제품 인코더", () => {
    expect(synthEncodePkm(plainPkm())).toEqual(DEFAULT_ENCRYPTED)
    expect(encodePkm(plainPkm(), 236)).toEqual(DEFAULT_ENCRYPTED)
  })
  it("모든 필드 멤버의 암호문(체크섬 0xA0CB, 섞기 17)", () => {
    const plain = plainPkm(EVERY_FIELD)
    expect(readU32(plain, 0x38)).toBe(0x3c1a3c1f)
    expect(readU16(plain, 6)).toBe(0xa0cb)
    expect(synthEncodePkm(plain)).toEqual(EVERY_FIELD_ENCRYPTED)
    expect(decodePkm(EVERY_FIELD_ENCRYPTED).shuffle).toBe(17)
  })
})

const roundTrip = (spec: Partial<MemberSpec>): ReadMember =>
  parseMember(decodePkm(synthEncodePkm(plainPkm(spec))))
const roundTripPk5 = (spec: Partial<MemberSpec>): ReadMember =>
  parseMember(decodePkm(synthEncodePkm(plainPkm(spec)).subarray(0, 220)), PK5)

describe("필드 해석", () => {
  it("모든 필드를 읽는다", () => {
    const m = roundTrip(EVERY_FIELD)
    expect(m.checksumOk).toBe(true)
    expect(m.pid).toBe(0x8f3a21c7)
    expect(m.species).toBe(479)
    expect(m.heldItem).toBe(234)
    expect(m.ability).toBe(26)
    expect(m.form).toBe(2)
    expect(m.nature).toBe(23)
    expect(m.moves).toEqual([85, 247, 109, 0])
    expect(m.evs).toEqual([4, 0, 252, 0, 252, 0])
    expect(m.ivs).toEqual([31, 0, 15, 20, 1, 30])
    expect(m.egg).toBe(false)
    expect(m.level).toBe(47)
    expect(m.hp).toBe(88)
    expect(m.maxHp).toBe(131)
  })
  it("출신 게임을 읽는다", () => {
    expect(roundTrip({ originGame: 12 }).originGame).toBe(12)
  })
  it("알 비트를 개체값과 따로 읽는다", () => {
    const m = roundTrip({ iv32: ((1 << 30) | 0x3fffffff) >>> 0 })
    expect(m.egg).toBe(true)
    expect(m.ivs).toEqual([31, 31, 31, 31, 31, 31])
  })
  it("PK4에서는 5세대 바이트를 무시한다", () => {
    const m = roundTrip({ pid: 0x2313, natureByte: 9, hiddenAbility: true })
    expect(m.nature).toBe(4)
    expect(m.hiddenAbility).toBe(false)
  })
  it("PK5의 성격 · 숨겨진 특성을 읽는다", () => {
    const m = roundTripPk5({
      species: 571,
      pid: 0x2313,
      natureByte: 9,
      hiddenAbility: true,
    })
    expect(m.checksumOk).toBe(true)
    expect(m.species).toBe(571)
    expect(m.nature).toBe(9)
    expect(m.hiddenAbility).toBe(true)
    expect(m.level).toBe(50)
  })
  it("숨겨진 특성은 비트 0만", () => {
    const plain = plainPkm()
    plain[0x42] = 0x02
    putU16(plain, 6, pkmChecksum(plain))
    const m = parseMember(
      decodePkm(synthEncodePkm(plain).subarray(0, 220)),
      PK5
    )
    expect(m.checksumOk).toBe(true)
    expect(m.hiddenAbility).toBe(false)
  })
  it("저장된 능력치(게임 순서)", () => {
    const m = roundTrip({ maxHp: 151, battleStats: [139, 88, 152, 75, 74] })
    expect(m.stats).toEqual([151, 139, 88, 152, 75, 74])
  })
  it("PK5의 저장된 능력치", () => {
    expect(roundTripPk5({}).stats).toEqual([120, 101, 102, 103, 104, 105])
  })
  it("부호 없는 PID로 성격을 센다", () => {
    expect(roundTrip({ pid: 0xffffffff }).nature).toBe(20)
  })
})

describe("파티 읽기", () => {
  it("NDS 읽기 하나", () => {
    expect(PARTY_READERS.length).toBe(1)
    expect(PARTY_READERS[0].platform).toBe("nds")
  })
  it("4세대 세이브", () => {
    const party = readParty(
      buildSave(seriesOf("heartgold-soulsilver"), { party: [{}] })
    )
    expect(party?.generation).toBe(4)
    expect(party?.versionGroup).toBe("heartgold-soulsilver")
  })
  it("5세대 세이브", () => {
    const party = readParty(
      buildTableSave(seriesOf("black-2-white-2"), { party: [{}] })
    )
    expect(party?.generation).toBe(5)
    expect(party?.versionGroup).toBe("black-2-white-2")
  })
  it("아무도 못 읽는 것", () => {
    expect(readParty(new Uint8Array(0x80000))).toBeNull()
    expect(readParty(new Uint8Array(0x80000).fill(0xff))).toBeNull()
    expect(readParty(new Uint8Array(100))).toBeNull()
  })
})
