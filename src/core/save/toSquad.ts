// 세이브 파티 → 스쿼드 멤버(앱 id). DB를 직접 부르지 않고 조회 함수를 주입받는다
import type { Moves4, ReadMember, Stat6 } from "./party.ts"
import type { SaveFile } from "./saveFile.ts"

export type SaveLookups = {
  defaultPokemonId(speciesId: number): number // 0 = 없음
  itemIdForGameIndex(generation: number, gameIndex: number): number // 0 = 없음
  natureIdForGameIndex(gameIndex: number): number // 0 = 없음
}

export type SquadMemberData = {
  pokemonId: number
  memo: string
  moves: Moves4 // move id, 0 = 빈칸
  abilityId: number
  natureId: number
  itemId: number // 0 = 없음
  level: number // 세이브에서 온 멤버는 > 0
  stats: Stat6 // 게임 안 능력치, 앱 순서(HP · 공격 · 방어 · 특공 · 특방 · 스피드)
}

// 게임 순서(HP · 공격 · 방어 · 스피드 · 특공 · 특방) → 앱 순서(PokéAPI stat id 1–6)
export function dexOrder(g: Stat6): Stat6 {
  return [g[0], g[1], g[2], g[4], g[5], g[3]]
}

// 알이면 null(빈 자리). 폼은 아직 표가 없어 기본 폼으로
export function toSquadMember(
  member: ReadMember,
  generation: number,
  lookups: SaveLookups
): SquadMemberData | null {
  if (member.egg) return null
  return {
    pokemonId: lookups.defaultPokemonId(member.species),
    memo: "",
    moves: [...member.moves],
    abilityId: member.ability,
    natureId: lookups.natureIdForGameIndex(member.nature),
    itemId:
      member.heldItem === 0
        ? 0
        : lookups.itemIdForGameIndex(generation, member.heldItem),
    level: member.level,
    stats: dexOrder(member.stats),
  }
}

export const SQUAD_SIZE = 6

export type SquadImport = {
  generation: 4 | 5
  game: string // 버전, 예: "soulsilver"
  members: (SquadMemberData | null)[] // 늘 6칸, 세이브 순서. 알 · 빈 칸은 null
  warnings: string[] // 로그용(영어)
}

// v0.5.1 스쿼드 불러오기: 파티 i번째 → 스쿼드 i번째
export function toSquadImport(
  save: SaveFile,
  lookups: SaveLookups
): SquadImport {
  const members: (SquadMemberData | null)[] = Array.from(
    { length: SQUAD_SIZE },
    () => null
  )
  const warnings: string[] = []
  save.members.slice(0, SQUAD_SIZE).forEach((member, i) => {
    if (!member.egg && member.form !== 0) {
      warnings.push(
        `save import: species ${member.species} form ${member.form} has no form table yet — using the default form`
      )
    }
    members[i] = toSquadMember(member, save.generation, lookups)
  })
  return { generation: save.generation, game: save.game, members, warnings }
}
