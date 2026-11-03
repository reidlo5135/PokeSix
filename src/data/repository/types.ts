/**
 * 저장소가 돌려주는 구조체. 정수 기본값 0, 문자열 "", 목록 [] — Qt repository.h 그대로.
 */
import { emptyText, type LocalizedText } from "../text/localizedText.ts"

/** [HP, 공격, 방어, 특공, 특방, 스피드] */
export type Stats6 = [
  hp: number,
  attack: number,
  defense: number,
  spAttack: number,
  spDefense: number,
  speed: number,
]

/** 도감 목록 한 줄: 한 종의 기본 모습을 "그 세대 기준"으로 본 값 */
export interface SpeciesRow {
  speciesId: number // 전국도감 번호
  dexNumber: number // 보고 있는 도감의 번호(전국이면 speciesId)
  pokemonId: number // 기본 모습의 pokemon id(아이콘 파일 이름)
  name: LocalizedText
  types: string[] // 타입 identifier(슬롯 순). 그 세대에 없으면 []
  stats: Stats6 // 그 세대 종족값
  total: number // 합계(1세대 특수는 한 번만)
  legendary: boolean // 전설 OR 환상
  finalEvolution: boolean // 그 세대까지 나온 진화형이 없다
}

/** 지방 도감 하나 = 도감 선택 버튼 하나 */
export interface DexInfo {
  pokedexId: number
  identifier: string // "original-sinnoh" — UI 도감 표시 규칙(dexstyle.json)의 키
  region: LocalizedText // 도감 이름은 PokéAPI에 없어서 지방 이름
  versions: string[] // ["diamond", "pearl"]
  versionNames: LocalizedText[] // versions와 같은 순서
  versionGroups: string[] // 이 도감을 쓰는 게임 묶음(그 세대, 나온 순서)
}

/** 아이템 대백과 한 줄. 세대별 존재는 비트 */
export interface ItemRow {
  id: number
  identifier: string // 아이콘 파일 이름
  category: string // item_categories.identifier
  pocket: string // 가방 주머니
  name: LocalizedText
  generations: number // bit (g − 1) = g세대에 있다
  effect: LocalizedText // 조회한 세대의 효과 문구. 기술머신은 담긴 기술의 설명문
  cost: number // 0 = 팔지 않음
  machineMove: LocalizedText // 기술머신이면 조회한 세대/게임에 담긴 기술
  machineType: string // 그 기술의 그 세대 타입. ??? 타입이면 ""
}

export const existsIn = (row: ItemRow, generation: number): boolean =>
  generation >= 1 &&
  generation <= 16 &&
  (row.generations & (1 << (generation - 1))) !== 0

/** 처음 나온 세대. 0 = 어느 세대에도 없음 */
export function introGeneration(row: ItemRow): number {
  for (let g = 1; g <= 16; g++) if (existsIn(row, g)) return g
  return 0
}

/** 상세 화면의 기술 한 줄. 값은 조회한 세대 기준 */
export interface MoveEntry {
  moveId: number
  name: LocalizedText
  type: string // ??? 타입(저주 2–4세대)이면 ""
  damageClass: number // 1 변화 · 2 물리 · 3 특수 — 3세대까지는 타입이 정한다(이미 바꿔 둠)
  power: number // 0 = 없음
  accuracy: number // 0 = 반드시 맞음
  pp: number
  level: number // 레벨업: 배우는 레벨(1 = 처음부터, 0 = 진화할 때)
  machineNumber: number // 기술머신 번호(비전머신은 1–8로 고쳐 둠)
  hiddenMachine: boolean // 비전머신(아이템 identifier가 "hm"으로 시작)
  machineItem: string // 기술머신 아이템 identifier("tm01")
  needsReminder: boolean // 하트비늘(기술 떠올리기)이 있어야 배운다
  identifier: string // "swords-dance" — UI 효과 사전 키
  target: number // move_targets.id
  ailment: number // move_meta_ailments.id
  healing: number // HP 회복 %(음수 = 소모)
  statChanges: [statId: number, stages: number][] // stat_id 오름차순
  effect: LocalizedText // 그 세대 게임 설명문
  fromPokemonId: number // 0 = 제 기술, >0 = 이 진화 전 단계가 배운 기술
  fromName: LocalizedText
}

export const emptyMove = (moveId = 0): MoveEntry => ({
  moveId,
  name: emptyText(),
  type: "",
  damageClass: 0,
  power: 0,
  accuracy: 0,
  pp: 0,
  level: 0,
  machineNumber: 0,
  hiddenMachine: false,
  machineItem: "",
  needsReminder: false,
  identifier: "",
  target: 0,
  ailment: 0,
  healing: 0,
  statChanges: [],
  effect: emptyText(),
  fromPokemonId: 0,
  fromName: emptyText(),
})

/** 야생 출현 한 줄 */
export interface EncounterEntry {
  version: string
  versionName: LocalizedText
  location: string // UI 장소 사전 키
  locationName: LocalizedText // PokéAPI 이름(신오 · 성도 · 관동은 한국어가 없다)
  method: string
  minLevel: number
  maxLevel: number
  rarity: number // 출현 칸 확률(%)의 합 — 100을 넘을 수 있다
}

/** relativeStats가 조건이 아님 */
export const NO_RELATIVE_STATS = 99

/** 진화 조건 하나. 빈 칸은 조건이 아니다 */
export interface EvolutionCondition {
  trigger: number // 1 레벨업 · 2 통신교환 · 3 도구 사용 · 4 빈자리 · 그 밖 특별
  minLevel: number
  item: LocalizedText
  itemIdentifier: string
  heldItem: LocalizedText
  heldItemIdentifier: string
  gender: number // 1 암컷 · 2 수컷 · 0 무관
  location: string
  locationName: LocalizedText
  timeOfDay: string // "day" · "night" · "dusk" · "full-moon" · ""
  knownMove: LocalizedText
  knownMoveType: string
  minHappiness: number
  minBeauty: number
  minAffection: number
  relativeStats: number // 1 공격>방어 · 0 같음 · −1 공격<방어 · 99 = 조건 아님
  partySpecies: LocalizedText
  partyType: string
  tradeSpecies: LocalizedText
  needsRain: boolean
  upsideDown: boolean
}

/** 진화 트리의 한 마디 — 뿌리부터 깊이 우선 순서 */
export interface EvolutionStep {
  speciesId: number
  pokemonId: number // 기본 모습
  fromSpeciesId: number // 진화 전 종(뿌리 0)
  depth: number // 뿌리 0
  name: LocalizedText
  conditions: EvolutionCondition[] // 진화 전 종에서 이 종이 되는 방법(여럿이면 그중 하나)
}

/** 특성 하나 */
export interface AbilityEntry {
  abilityId: number
  identifier: string
  slot: number // 1·2 일반, 3 숨겨진 특성
  hidden: boolean
  name: LocalizedText
  effect: LocalizedText
}

/** 성격. stats.id 2 공격 · 3 방어 · 4 특공 · 5 특방 · 6 스피드 */
export interface Nature {
  id: number
  name: LocalizedText
  increasedStat: number
  decreasedStat: number
}

export const isNeutral = (n: Nature): boolean =>
  n.increasedStat === n.decreasedStat

/** 포켓몬 상세 */
export interface PokemonDetail {
  speciesId: number
  pokemonId: number
  name: LocalizedText
  genus: LocalizedText // 분류 "씨앗포켓몬"
  types: string[] // 비었으면 = 그 세대에 없는 포켓몬
  stats: Stats6
  total: number
  height: number // 10 cm 단위
  weight: number // 100 g 단위
  generation: number
  versionGroup: string // 기술 기준 게임 묶음. 정할 수 없으면 ""
  groupGames: LocalizedText[] // 그 묶음의 버전 이름(보이는 버전만)
  groupVersions: string[]
  encounters: EncounterEntry[] // 그 세대 모든 (보이는) 버전의 야생 출현
  levelMoves: MoveEntry[] // 레벨 순(같은 레벨은 게임이 익히는 순서)
  inheritedMoves: MoveEntry[] // 진화 전 단계의 자력기. 제 자력표에 있는 기술은 제외
  machineMoves: MoveEntry[] // 기술머신 → 기술레코드 → 비전머신, 번호 순
  tutorMoves: MoveEntry[] // 가르침(move id 순)
  eggMoves: MoveEntry[] // 제 것 + 사슬 뿌리 것
  evolution: EvolutionStep[] // 그 세대에 있는 종만. 진화하지 않으면 []
  earliestLevel: number // 이 게임에서 가장 일찍 가질 수 있는 레벨. 0 = 출현 자료로는 못 얻음
  abilities: AbilityEntry[] // 그 세대 특성(칸 순). 1–2세대는 []
}

export const emptyStats = (): Stats6 => [0, 0, 0, 0, 0, 0]

export const emptyDetail = (): PokemonDetail => ({
  speciesId: 0,
  pokemonId: 0,
  name: emptyText(),
  genus: emptyText(),
  types: [],
  stats: emptyStats(),
  total: 0,
  height: 0,
  weight: 0,
  generation: 0,
  versionGroup: "",
  groupGames: [],
  groupVersions: [],
  encounters: [],
  levelMoves: [],
  inheritedMoves: [],
  machineMoves: [],
  tutorMoves: [],
  eggMoves: [],
  evolution: [],
  earliestLevel: 0,
  abilities: [],
})

export const isValidDetail = (d: PokemonDetail): boolean => d.pokemonId > 0

/** 아이템으로 하는 진화 한 줄 */
export interface ItemEvolution {
  from: LocalizedText
  to: LocalizedText
  held: boolean // true = 지니고(통신교환 등), false = 사용
  speciesId: number // 진화한 종
  fromPokemonId: number // 진화 전 기본 모습(없으면 0)
  toPokemonId: number
  onlyVersions: string[] // 저장소는 비워 둔다 — 화면이 채운다
}

/** 세대의 게임 묶음 하나 */
export interface GameInfo {
  versionGroup: string
  versions: string[]
  versionNames: LocalizedText[]
}

/** 버전이 든 게임 묶음. 없으면 "" */
export function versionGroupOf(
  games: readonly GameInfo[],
  version: string
): string {
  for (const game of games)
    if (game.versions.includes(version)) return game.versionGroup
  return ""
}

/** 세대 g의 타입 상성표 */
export interface TypeChart {
  types: string[] // 그 세대에 있는 타입(id 순)
  multipliers: Map<string, number> // key = `${공격}/${방어}`
}

/** 단일 타입 배율. 표에 없는 쌍은 1 */
export const typeChartAt = (
  chart: TypeChart,
  attack: string,
  defense: string
): number => chart.multipliers.get(`${attack}/${defense}`) ?? 1

/** 타운맵: 그 장소 · 버전의 야생 출현 */
export interface EncounterSpot {
  speciesId: number
  pokemonId: number
  name: LocalizedText
  method: string // encounter_methods.identifier
  minLevel: number
  maxLevel: number
  rarity: number
}
