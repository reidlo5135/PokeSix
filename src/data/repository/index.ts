/**
 * 읽기 전용 게임 데이터 저장소. 모든 함수는 동기이고, DB가 없거나 질의가 실패하면 빈 결과를
 * 돌려준다(오류는 repositoryError()). 화면은 "빈 목록 = 아직 DB 없음"으로 다시 읽기를 판단한다.
 */
export { bindDatabase, clearRepositoryCaches, repositoryError } from "./db.ts"
export * from "./types.ts"
export * from "./rules.ts"
export * from "./moveReach.ts"
export { speciesForDex, speciesForGeneration } from "./species.ts"
export {
  dexesForGeneration,
  gameSpecies,
  gamesForGeneration,
  otherVersionSpecies,
  resolveVersion,
  resolveVersionIn,
} from "./games.ts"
export {
  evolutionsWithItem,
  itemIdForGameIndex,
  itemsForGeneration,
  machineLearners,
} from "./items.ts"
export { hiddenMachineMoves, moves } from "./moves.ts"
export { pokemonDetail } from "./detail.ts"
export {
  defaultPokemonId,
  evolvesFrom,
  natureIdForGameIndex,
  natures,
  typeChart,
} from "./lookups.ts"
export {
  encounterRegions,
  encountersAt,
  locationNames,
  regionDisplayName,
} from "./townmap.ts"
