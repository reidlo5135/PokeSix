/**
 * 스쿼드 편집 연산 — Qt SquadSession의 편집 함수를 순수 함수로(받은 스쿼드는 고치지 않는다).
 * 슬롯 0–5 = 본편 멤버. 셔틀은 따로.
 */
import {
  emptyMember,
  isEmptyMember,
  MEMO_LENGTH,
  MOVES_PER_MEMBER,
  SQUAD_SIZE,
  type Squad,
  type SquadMember,
} from "../../state/squads.ts"

export const NAME_LENGTH = 24
export const MAX_UNDO = 50

const inRange = (slot: number) =>
  Number.isInteger(slot) && slot >= 0 && slot < SQUAD_SIZE

export const cloneSquad = (s: Squad): Squad => structuredClone(s)

/** 모든 필드 비교 */
export const sameMember = (a: SquadMember, b: SquadMember): boolean =>
  a.pokemonId === b.pokemonId &&
  a.memo === b.memo &&
  a.abilityId === b.abilityId &&
  a.natureId === b.natureId &&
  a.itemId === b.itemId &&
  a.level === b.level &&
  a.moves.length === b.moves.length &&
  a.moves.every((m, i) => m === b.moves[i]) &&
  a.stats.length === b.stats.length &&
  a.stats.every((v, i) => v === b.stats[i])

export const sameSquad = (a: Squad, b: Squad): boolean =>
  a.name === b.name &&
  a.members.length === b.members.length &&
  a.members.every((m, i) => sameMember(m, b.members[i])) &&
  sameMember(a.shuttle, b.shuttle)

function withMember(s: Squad, slot: number, m: SquadMember): Squad {
  const members = s.members.slice()
  members[slot] = m
  return { ...s, members }
}

export function setName(s: Squad, name: string): Squad {
  const n = [...name].slice(0, NAME_LENGTH).join("")
  return n === s.name ? s : { ...s, name: n }
}

/** 그 자리를 새 멤버로(메모 · 기술 · 레벨 등 모두 비움). firstAbility = 미리 고를 특성(0 = 없음) */
export function setPokemon(
  s: Squad,
  slot: number,
  pokemonId: number,
  firstAbility = 0
): Squad {
  if (!inRange(slot)) return s
  return withMember(s, slot, {
    ...emptyMember(),
    pokemonId,
    abilityId: firstAbility,
  })
}

export function clearSlot(s: Squad, slot: number): Squad {
  if (!inRange(slot)) return s
  return withMember(s, slot, emptyMember())
}

/** 빼서 끼우기: from을 to로 옮기고 사이 자리는 한 칸씩 당기거나 민다 */
export function moveSlot(s: Squad, from: number, to: number): Squad {
  if (!inRange(from) || !inRange(to) || from === to) return s
  const members = s.members.slice()
  const [m] = members.splice(from, 1)
  members.splice(to, 0, m)
  return { ...s, members }
}

export function swapSlots(s: Squad, a: number, b: number): Squad {
  if (!inRange(a) || !inRange(b) || a === b) return s
  const members = s.members.slice()
  ;[members[a], members[b]] = [members[b], members[a]]
  return { ...s, members }
}

/** 기술 칸 하나. 다른 칸에 같은 기술이 있으면 그 칸과 맞바꾼다. 0 = 비우기 */
export function setMemberMove(
  m: SquadMember,
  index: number,
  moveId: number
): SquadMember {
  if (index < 0 || index >= MOVES_PER_MEMBER || m.moves[index] === moveId)
    return m
  const moves = m.moves.slice()
  if (moveId > 0) {
    const other = moves.indexOf(moveId)
    if (other >= 0) moves[other] = moves[index] ?? 0
  }
  moves[index] = moveId
  return { ...m, moves }
}

export function setMove(
  s: Squad,
  slot: number,
  index: number,
  moveId: number
): Squad {
  if (!inRange(slot)) return s
  const next = setMemberMove(s.members[slot], index, moveId)
  return next === s.members[slot] ? s : withMember(s, slot, next)
}

export function setMemo(s: Squad, slot: number, memo: string): Squad {
  if (!inRange(slot)) return s
  const text = memo.slice(0, MEMO_LENGTH)
  if (text === s.members[slot].memo) return s
  return withMember(s, slot, { ...s.members[slot], memo: text })
}

type MemberField = "abilityId" | "natureId" | "itemId"

export function setField(
  s: Squad,
  slot: number,
  field: MemberField,
  id: number
): Squad {
  if (!inRange(slot) || s.members[slot][field] === id) return s
  return withMember(s, slot, { ...s.members[slot], [field]: id })
}

/** 이름은 두고 멤버 6 + 셔틀을 비운다 */
export function clearAll(s: Squad): Squad {
  const cleared: Squad = {
    name: s.name,
    members: Array.from({ length: SQUAD_SIZE }, emptyMember),
    shuttle: emptyMember(),
  }
  return sameSquad(cleared, s) ? s : cleared
}

export function setShuttlePokemon(s: Squad, pokemonId: number): Squad {
  return { ...s, shuttle: { ...emptyMember(), pokemonId } }
}

export function setShuttleMove(s: Squad, index: number, moveId: number): Squad {
  const next = setMemberMove(s.shuttle, index, moveId)
  return next === s.shuttle ? s : { ...s, shuttle: next }
}

export function clearShuttle(s: Squad): Squad {
  return isEmptyMember(s.shuttle) && sameMember(s.shuttle, emptyMember())
    ? s
    : { ...s, shuttle: emptyMember() }
}

/** 첫 빈 기술 칸(없으면 −1) */
export const firstEmptyMove = (m: SquadMember): number =>
  m.moves.findIndex((id) => id <= 0)
