// 파티 읽기 — 필드 해석 · NDS 시리즈 표 · 시리즈 감지.
// 시리즈는 파일 크기가 아니라 체크섬으로 고른다(4 · 5세대 모두 512 KiB)
import {
  SAVE_SIZE,
  activeGeneralBlock,
  checksumTableValid,
  partyBlockValid,
  type BlockCheck,
} from "./block.ts"
import { readU16, readU32, readU8 } from "./bytes.ts"
import {
  PK4,
  PK5,
  decodePkm,
  pkmOk,
  type DecodedPkm,
  type PkmFormat,
} from "./pkm.ts"

export type Stat6 = [number, number, number, number, number, number]
export type Moves4 = [number, number, number, number]

// 게임 번호 그대로의 한 마리. species · moves · ability는 PokéAPI id와 같고,
// heldItem · nature는 게임 번호(앱 id로 바꿔야 한다)
export type ReadMember = {
  pid: number
  species: number
  heldItem: number // 그 세대의 게임 인덱스, 0 = 없음
  ability: number
  form: number // 0 = 기본 폼
  nature: number // 게임 순서 0–24
  moves: Moves4
  evs: Stat6 // 게임 순서: HP · 공격 · 방어 · 스피드 · 특공 · 특방
  ivs: Stat6 // 게임 순서
  egg: boolean
  originGame: number // 7 HG · 8 SS · 10 D · 11 P · 12 Pt · 20 W · 21 B · 22 W2 · 23 B2
  level: number
  hp: number
  maxHp: number
  stats: Stat6 // 게임 순서, stats[0] = maxHp
  checksumOk: boolean
  hiddenAbility: boolean
}

export function parseMember(
  pkm: DecodedPkm,
  format: PkmFormat = PK4
): ReadMember {
  const d = pkm.data
  const iv32 = readU32(d, 0x38)
  const six = (at: (k: number) => number): Stat6 => [
    at(0),
    at(1),
    at(2),
    at(3),
    at(4),
    at(5),
  ]
  return {
    pid: pkm.pid,
    species: readU16(d, 0x08),
    heldItem: readU16(d, 0x0a),
    ability: readU8(d, 0x15),
    form: readU8(d, 0x40) >>> 3,
    // PK4: PID % 25 (0x41은 HGSS 빛나는 잎 자리라 무시) · PK5: 0x41
    nature:
      format.natureAt === null
        ? (pkm.pid >>> 0) % 25
        : readU8(d, format.natureAt),
    moves: [
      readU16(d, 0x28),
      readU16(d, 0x2a),
      readU16(d, 0x2c),
      readU16(d, 0x2e),
    ],
    evs: six((k) => readU8(d, 0x18 + k)),
    ivs: six((k) => (iv32 >>> (5 * k)) & 0x1f),
    egg: ((iv32 >>> 30) & 1) === 1,
    originGame: readU8(d, 0x5f),
    level: readU8(d, 0x8c),
    hp: readU16(d, 0x8e),
    maxHp: readU16(d, 0x90),
    stats: six((k) => readU16(d, 0x90 + 2 * k)),
    checksumOk: pkmOk(pkm),
    hiddenAbility:
      format.hiddenAbilityAt !== null &&
      (readU8(d, format.hiddenAbilityAt) & 0x01) !== 0,
  }
}

export type VersionGroup =
  | "diamond-pearl"
  | "platinum"
  | "heartgold-soulsilver"
  | "black-white"
  | "black-2-white-2"

export type NdsSeries = {
  generation: 4 | 5
  versionGroup: VersionGroup
  check: BlockCheck
  partyCountOffset: number // base 기준
  partyOffset: number // base 기준
  pkm: PkmFormat
}

// 순서 그대로 시도한다. base = 4세대는 고른 슬롯 시작, 5세대는 0
export const NDS_SERIES: readonly NdsSeries[] = [
  {
    generation: 4,
    versionGroup: "diamond-pearl",
    check: { kind: "footerSlots", generalSize: 0xc100, footerSize: 0x14 },
    partyCountOffset: 0x94,
    partyOffset: 0x98,
    pkm: PK4,
  },
  {
    generation: 4,
    versionGroup: "platinum",
    check: { kind: "footerSlots", generalSize: 0xcf2c, footerSize: 0x14 },
    partyCountOffset: 0x9c,
    partyOffset: 0xa0,
    pkm: PK4,
  },
  {
    generation: 4,
    versionGroup: "heartgold-soulsilver",
    check: { kind: "footerSlots", generalSize: 0xf628, footerSize: 0x10 },
    partyCountOffset: 0x94,
    partyOffset: 0x98,
    pkm: PK4,
  },
  {
    generation: 5,
    versionGroup: "black-white",
    check: {
      kind: "checksumTable",
      mainSize: 0x24000,
      tableLength: 0x8c,
      partyBlock: 0x18e00,
      partyBlockSize: 0x534,
      partyCrcAt: 0x19336,
      partyCrcMirror: 0x34,
    },
    partyCountOffset: 0x18e04,
    partyOffset: 0x18e08,
    pkm: PK5,
  },
  {
    generation: 5,
    versionGroup: "black-2-white-2",
    check: {
      kind: "checksumTable",
      mainSize: 0x26000,
      tableLength: 0x94,
      partyBlock: 0x18e00,
      partyBlockSize: 0x534,
      partyCrcAt: 0x19336,
      partyCrcMirror: 0x34,
    },
    partyCountOffset: 0x18e04,
    partyOffset: 0x18e08,
    pkm: PK5,
  },
]

export type ReadParty = {
  generation: 4 | 5
  versionGroup: VersionGroup
  partyOffset: number // 멤버 0의 파일 오프셋
  members: ReadMember[] // 1–6, 세이브 순서
}

// 이 시리즈로 검증되는 블록의 시작. 안 맞으면 null
export function baseOf(save: Uint8Array, series: NdsSeries): number | null {
  const check = series.check
  if (check.kind === "footerSlots") return activeGeneralBlock(save, check)
  return checksumTableValid(save, check) && partyBlockValid(save, check)
    ? 0
    : null
}

export function readSeries(
  save: Uint8Array,
  series: NdsSeries
): ReadParty | null {
  if (save.length < SAVE_SIZE) return null
  const base = baseOf(save, series)
  if (base === null) return null
  const partyOffset = base + series.partyOffset
  const count = readU8(save, base + series.partyCountOffset)
  if (count < 1 || count > 6) return null // 빈 파티는 이 시리즈가 아니라고 본다
  const size = series.pkm.partySize
  const members: ReadMember[] = []
  for (let i = 0; i < count; i++) {
    const at = partyOffset + i * size
    // subarray는 창이지만 decodePkm이 복사한 뒤 푼다
    members.push(
      parseMember(decodePkm(save.subarray(at, at + size)), series.pkm)
    )
  }
  return {
    generation: series.generation,
    versionGroup: series.versionGroup,
    partyOffset,
    members,
  }
}

export function readNds(save: Uint8Array): ReadParty | null {
  for (const series of NDS_SERIES) {
    const party = readSeries(save, series)
    if (party) return party
  }
  return null
}

// 플랫폼별 읽기 — 나중에 GBA · 3DS를 더한다
export type PartyReader = {
  platform: string
  read(save: Uint8Array): ReadParty | null
}

export const PARTY_READERS: readonly PartyReader[] = [
  { platform: "nds", read: readNds },
]

export function readParty(save: Uint8Array): ReadParty | null {
  for (const reader of PARTY_READERS) {
    const party = reader.read(save)
    if (party) return party
  }
  return null
}

export function findSeries(versionGroup: string): NdsSeries | null {
  return NDS_SERIES.find((s) => s.versionGroup === versionGroup) ?? null
}
