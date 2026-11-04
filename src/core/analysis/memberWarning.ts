/**
 * 멤버 경고 — 같은 포켓몬 · 진화 관계 · 스타팅 둘(Qt squadpage.cpp warningFor).
 * 다른 채운 슬롯을 0→5로 보며 처음 걸린 것 하나만. 고르는 것을 막지는 않는다(교환 · 교배로 가능).
 */
export interface OtherMember {
  slot: number
  speciesId: number
  name: string
}

export type MemberWarning =
  | { kind: "same"; slot: number }
  | { kind: "evolved"; name: string }
  | { kind: "preEvolution"; name: string }
  | { kind: "starter"; name: string }

/** species가 ancestor의 후손인가(진화 전 지도를 거슬러 올라간다) */
export function descendsFrom(
  species: number,
  ancestor: number,
  evolvesFrom: ReadonlyMap<number, number>
): boolean {
  let s = evolvesFrom.get(species)
  const seen = new Set<number>()
  while (s !== undefined && !seen.has(s)) {
    if (s === ancestor) return true
    seen.add(s)
    s = evolvesFrom.get(s)
  }
  return false
}

/**
 * slot에 speciesId를 고를 때의 경고. others = 다른 채운 슬롯(0→5).
 * starterLine(species) = 그 게임 스타팅 계통 번호(없으면 −1)
 */
export function memberWarning(
  slot: number,
  speciesId: number,
  others: readonly OtherMember[],
  evolvesFrom: ReadonlyMap<number, number>,
  starterLine: (species: number) => number
): MemberWarning | null {
  const list = others.filter((o) => o.slot !== slot && o.speciesId > 0)
  for (const o of list)
    if (o.speciesId === speciesId) return { kind: "same", slot: o.slot }
  for (const o of list) {
    if (descendsFrom(o.speciesId, speciesId, evolvesFrom))
      return { kind: "evolved", name: o.name }
    if (descendsFrom(speciesId, o.speciesId, evolvesFrom))
      return { kind: "preEvolution", name: o.name }
  }
  if (starterLine(speciesId) >= 0)
    for (const o of list)
      if (starterLine(o.speciesId) >= 0)
        return { kind: "starter", name: o.name }
  return null
}
