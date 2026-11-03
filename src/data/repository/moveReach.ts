/**
 * 기술 도달 — 하트비늘 없이 익힐 수 있는 기술.
 * 한 게임 안의 길은 셋: 얻을 때 기본으로 가진 기술 · 얻은 뒤 레벨업 · 진화 전 단계가 익혀 둔 기술.
 * 교배(알)는 정주행 동선이 아니라서 세지 않는다.
 */

export interface LevelMove {
  move: number
  level: number // 0 = 진화할 때
  order: number // 같은 레벨 안 순서
}

export interface Stage {
  learnset: LevelMove[]
  caughtLevel?: number // 이 게임에서 잡기 · 받기로 얻는 가장 낮은 레벨(없으면 undefined — 0과 다르다)
  evolveLevel: number // 앞 단계에서 진화 가능한 가장 낮은 레벨, 조건 없으면 0
}

export interface Reach {
  obtainable: boolean
  earliestLevel: number
  moves: Set<number>
}

export const MOVE_SLOTS = 4

/** 레벨 level로 줄 때 가진 기술: level 이하 레벨업 기술을 (레벨, 순서)대로 익히고 4개를 넘으면 가장 먼저 익힌 것을 잊는다 */
export function defaultMoveset(
  learnset: readonly LevelMove[],
  level: number
): number[] {
  const sorted = [...learnset].sort(
    (a, b) => a.level - b.level || a.order - b.order
  )
  const known: number[] = []
  for (const e of sorted) {
    if (e.level < 1 || e.level > level) continue // 진화 기술(0)은 기본 기술이 아니다
    if (known.includes(e.move)) continue
    known.push(e.move)
    if (known.length > MOVE_SLOTS) known.shift()
  }
  return known
}

/** path: 진화 사슬 뿌리 → 대상. 진화 전 단계는 원하는 레벨까지 키운 뒤 진화시킬 수 있다고 본다 */
export function reachableMoves(path: readonly Stage[]): Reach {
  let reach: Reach = { obtainable: false, earliestLevel: 0, moves: new Set() }
  for (const stage of path) {
    const next: Reach = {
      obtainable: false,
      earliestLevel: 0,
      moves: new Set(),
    }
    if (reach.obtainable) {
      // 진화: 앞 단계 기술을 갖고, 진화한 레벨부터 이 단계 기술을 배운다
      const evolved = Math.max(stage.evolveLevel, reach.earliestLevel)
      next.obtainable = true
      next.earliestLevel = evolved
      next.moves = new Set(reach.moves)
      for (const e of stage.learnset)
        if (e.level === 0 || e.level >= evolved) next.moves.add(e.move)
    }
    if (stage.caughtLevel !== undefined) {
      // 이 단계를 바로 잡기
      const caught = stage.caughtLevel
      next.earliestLevel = next.obtainable
        ? Math.min(next.earliestLevel, caught)
        : caught
      next.obtainable = true
      for (const m of defaultMoveset(stage.learnset, caught)) next.moves.add(m)
      for (const e of stage.learnset)
        if (e.level > caught) next.moves.add(e.move)
    }
    reach = next
  }
  return reach
}
