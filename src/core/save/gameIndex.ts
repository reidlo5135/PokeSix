// 게임 번호 → PokéAPI id 고정 표(4 · 5세대).
// PokéAPI CSV 168b1e89…(Qt가 고정한 커밋)의 item_game_indices · natures에서 만들었다.
// DB 없이 쓸 수 있는 기본 조회 — toSquad에는 이 표나 DB 조회를 주입한다
import type { SaveLookups } from "./toSquad.ts"

// [첫 인덱스, 끝 인덱스, 더할 값]: first ≤ i ≤ last 이면 item id = i + delta. 없는 인덱스는 0.
// Qt의 SQL과 같은 결과(같은 (item, gen)은 첫 줄만 · 인덱스가 겹치면 작은 item id)
type ItemRun = readonly [first: number, last: number, delta: number]

export const ITEM_RUNS_GEN4: readonly ItemRun[] = [
  [1, 111, 0],
  [112, 112, 330],
  [135, 464, -23],
  [465, 468, -22],
  [469, 469, 2],
  [470, 470, -23],
  [471, 471, -6],
  [472, 476, 0],
  [477, 477, -29],
  [478, 484, -1],
  [485, 485, -27],
  [486, 486, -26],
  [487, 487, -28],
  [488, 491, -27],
  [492, 492, -39],
  [493, 493, -43],
  [494, 494, -45],
  [495, 495, -43],
  [496, 496, -41],
  [497, 497, -43],
  [498, 498, -47],
  [499, 499, -42],
  [500, 500, -44],
  [501, 501, 13],
  [502, 503, -18],
  [504, 504, -38],
  [505, 531, -19],
  [532, 532, -63],
  [533, 533, -20],
  [534, 535, -67],
  [536, 536, -66],
]

export const ITEM_RUNS_GEN5: readonly ItemRun[] = [
  [1, 111, 0],
  [112, 112, 330],
  [116, 119, 447],
  [134, 134, 433],
  [135, 136, -23],
  [137, 148, 431],
  [149, 425, -23],
  [428, 464, -23],
  [465, 468, -22],
  [469, 469, 2],
  [470, 470, -23],
  [471, 471, -6],
  [472, 476, 0],
  [477, 477, -29],
  [478, 484, -1],
  [485, 491, -27],
  [492, 492, -39],
  [493, 493, -43],
  [494, 494, -45],
  [495, 495, -43],
  [496, 496, -41],
  [497, 497, -43],
  [498, 498, -47],
  [499, 499, -42],
  [500, 500, -44],
  [501, 501, 13],
  [502, 503, -18],
  [504, 504, -38],
  [505, 531, -19],
  [532, 532, -63],
  [533, 533, -20],
  [534, 535, -67],
  [536, 536, -66],
  [537, 560, 43],
  [561, 561, 107],
  [562, 563, 42],
  [564, 564, 105],
  [565, 625, 41],
  [626, 626, 296],
  [627, 628, 43],
  [629, 629, 296],
  [630, 636, 43],
  [637, 637, 290],
  [638, 638, 43],
]

export function itemIdForGameIndex(
  generation: number,
  gameIndex: number
): number {
  const runs =
    generation === 4 ? ITEM_RUNS_GEN4 : generation === 5 ? ITEM_RUNS_GEN5 : []
  for (const [first, last, delta] of runs) {
    if (gameIndex >= first && gameIndex <= last) return gameIndex + delta
  }
  return 0
}

// 게임 성격 순서 n(올라가는 능력 = floor(n/5), 내려가는 능력 = n % 5) → PokéAPI nature id
export const NATURE_ID_BY_GAME_INDEX: readonly number[] = [
  1, 6, 21, 11, 17, 2, 7, 22, 12, 18, 5, 10, 25, 16, 20, 3, 8, 23, 13, 15, 4, 9,
  24, 14, 19,
]

export function natureIdForGameIndex(gameIndex: number): number {
  return NATURE_ID_BY_GAME_INDEX[gameIndex] ?? 0
}

// PokéAPI: 종 N의 기본 포켓몬 id는 N(1025종 모두 확인)
export function defaultPokemonId(speciesId: number): number {
  return Number.isInteger(speciesId) && speciesId >= 1 && speciesId <= 1025
    ? speciesId
    : 0
}

export const STATIC_SAVE_LOOKUPS: SaveLookups = {
  defaultPokemonId,
  itemIdForGameIndex,
  natureIdForGameIndex,
}
