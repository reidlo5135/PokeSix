/**
 * 스쿼드가 DB에서 읽는 것 — 멤버 풀기(포켓몬 상세 · 기술 칸) · 분석 입력 · 홈 문제 수 등록.
 * 저장소 함수는 동기라 렌더 중에 불러도 되지만, 같은 값을 여러 번 읽지 않게 데이터 판(epoch)마다 캐시한다.
 */
import {
  analyzeSquad,
  makeSquadInput,
  type AnalyzerMember,
  type SquadAnalysis,
} from "../../core/analysis/squadAnalyzer.ts"
import { featuresOf } from "../../core/rules/generationFeatures.ts"
import { learnableTable } from "../../core/rules/learn.ts"
import {
  evolvesFrom,
  existsIn,
  gamesForGeneration,
  itemsForGeneration,
  moves as readMoves,
  natures as readNatures,
  pokemonDetail,
  representativeVersionGroup,
  typeBasedClass,
  typeChart,
  versionGroupOf,
  STATUS_CLASS,
  type ItemRow,
  type MoveEntry,
  type Nature,
  type PokemonDetail,
  type TypeChart,
} from "../../data/repository/index.ts"
import { isGeneration } from "../../shared/generations.ts"
import { dataStore } from "../../state/data.ts"
import {
  isEmptyMember,
  registerSquadProblemCounter,
  type Squad,
  type SquadMember,
} from "../../state/squads.ts"

/** 기술 칸 하나. 칸이 비었거나 id가 DB에 없으면 null */
export interface SlotMove {
  move: MoveEntry
  learnable: boolean
}

export interface ResolvedMember {
  /** 그 세대에 없는 포켓몬 · 빈 자리 = null */
  detail: PokemonDetail | null
  moves: (SlotMove | null)[]
}

const EMPTY_RESOLVED: ResolvedMember = {
  detail: null,
  moves: [null, null, null, null],
}

// ── 데이터 판마다 비우는 캐시 ──
let epoch = Number.NaN
const details = new Map<string, PokemonDetail | null>()
const moveCache = new Map<string, MoveEntry | null>()
const ownClass = new Map<number, number>()
const charts = new Map<number, TypeChart>()
const itemLists = new Map<string, ItemRow[]>()
let natureList: Nature[] | null = null
let evolutionMap: Map<number, number> | null = null

/** 데이터가 바뀌었으면(useDataVersion) 캐시를 비운다 */
export function syncDataEpoch(version: number): void {
  if (version === epoch) return
  epoch = version
  details.clear()
  moveCache.clear()
  ownClass.clear()
  charts.clear()
  itemLists.clear()
  natureList = null
  evolutionMap = null
}

export function chartOf(generation: number): TypeChart {
  let c = charts.get(generation)
  if (!c) {
    c = typeChart(generation)
    if (c.types.length > 0) charts.set(generation, c)
  }
  return c
}

/** 그 세대에 있는 포켓몬의 상세. 없거나 그 세대에 없으면 null */
export function detailOf(
  pokemonId: number,
  generation: number,
  versionGroup: string
): PokemonDetail | null {
  if (pokemonId <= 0) return null
  const key = `${generation}/${versionGroup}/${pokemonId}`
  if (details.has(key)) return details.get(key) ?? null
  const d = pokemonDetail(pokemonId, generation, versionGroup)
  const found = d.pokemonId > 0 && d.types.length > 0 ? d : null
  if (d.pokemonId > 0) details.set(key, found)
  return found
}

function movesOf(ids: readonly number[], generation: number) {
  const missing = ids.filter((id) => !moveCache.has(`${generation}/${id}`))
  if (missing.length > 0) {
    const found = new Map(
      readMoves(missing, generation).map((m) => [m.moveId, m])
    )
    for (const id of missing)
      moveCache.set(`${generation}/${id}`, found.get(id) ?? null)
  }
  return new Map(
    ids.map((id) => [id, moveCache.get(`${generation}/${id}`) ?? null])
  )
}

/** 멤버 하나 풀기(Qt resolveMember): 배울 수 있으면 그 목록의 값, 아니면 DB 값 + learnable false */
export function resolveMember(
  member: SquadMember,
  generation: number,
  versionGroup: string
): ResolvedMember {
  if (isEmptyMember(member)) return EMPTY_RESOLVED
  const detail = detailOf(member.pokemonId, generation, versionGroup)
  if (!detail) return EMPTY_RESOLVED
  const table = learnableTable(detail)
  const others = member.moves.filter((id) => id > 0 && !table.has(id))
  const found = others.length > 0 ? movesOf(others, generation) : new Map()
  const slots = member.moves.slice(0, 4).map((id): SlotMove | null => {
    if (id <= 0) return null
    const learn = table.get(id)
    if (learn) return { move: learn, learnable: true }
    const m = found.get(id)
    return m ? { move: m, learnable: false } : null
  })
  while (slots.length < 4) slots.push(null)
  return { detail, moves: slots }
}

export function resolveSquad(
  squad: Squad,
  generation: number,
  versionGroup: string
): ResolvedMember[] {
  return squad.members.map((m) => resolveMember(m, generation, versionGroup))
}

/** 기술의 원래 분류(DB moves.damage_class) — 4세대 이후 규칙으로 읽으면 그대로 나온다 */
function ownDamageClass(move: MoveEntry): number {
  const cached = ownClass.get(move.moveId)
  if (cached !== undefined) return cached
  const [m] = readMoves([move.moveId], 9)
  const c = m ? m.damageClass : move.damageClass
  ownClass.set(move.moveId, c)
  return c
}

/** 반대 규칙이었다면의 분류: 4세대~ → 타입 기준, 1–3세대 → 기술 자체 */
export function otherClassOf(move: MoveEntry, generation: number): number {
  if (move.damageClass === STATUS_CLASS || move.type === "")
    return move.damageClass
  return featuresOf(generation).splitByMove
    ? typeBasedClass(move.type)
    : ownDamageClass(move)
}

/** 분석 입력: 그 세대에 있는 멤버만, 배울 수 있는 기술만 */
export function analyzerMembers(
  resolved: readonly ResolvedMember[],
  generation: number
): (AnalyzerMember | null)[] {
  return resolved.map((r) =>
    r.detail
      ? {
          types: r.detail.types,
          moves: r.moves
            .filter((m): m is SlotMove => m !== null && m.learnable)
            .map(({ move }) => ({
              type: move.type,
              damageClass: move.damageClass,
              otherClass: otherClassOf(move, generation),
            })),
        }
      : null
  )
}

export function analyzeResolved(
  resolved: readonly ResolvedMember[],
  generation: number
): SquadAnalysis {
  return analyzeSquad(
    makeSquadInput(chartOf(generation), analyzerMembers(resolved, generation))
  )
}

export function naturesList(): Nature[] {
  return (natureList ??= readNatures())
}

/** 그 세대에 있는 아이템(지닌 물건 후보의 바탕). 아이템 화면과 같은 질의(같은 캐시)를 쓴다 */
export function itemsIn(generation: number, versionGroup = ""): ItemRow[] {
  const key = `${generation}/${versionGroup}`
  let list = itemLists.get(key)
  if (!list) {
    list = itemsForGeneration(generation, versionGroup).filter((i) =>
      existsIn(i, generation)
    )
    if (list.length > 0) itemLists.set(key, list)
  }
  return list
}

export function evolutionMapOf(): Map<number, number> {
  return (evolutionMap ??= evolvesFrom())
}

/** 게임 키(버전 · 옛 묶음) → 기술 기준 게임 묶음 */
export function versionGroupFor(generation: number, game: string): string {
  const games = gamesForGeneration(generation)
  return (
    versionGroupOf(games, game) ||
    (games.some((g) => g.versionGroup === game) ? game : "") ||
    representativeVersionGroup(generation)
  )
}

// 홈 "최근 스쿼드"의 문제 수
registerSquadProblemCounter((entry) => {
  syncDataEpoch(dataStore.getState().version)
  const g = entry.generation
  if (!isGeneration(g) || chartOf(g).types.length === 0) return null
  const resolved = resolveSquad(entry.squad, g, versionGroupFor(g, entry.game))
  return analyzeResolved(resolved, g).problems.length
})
