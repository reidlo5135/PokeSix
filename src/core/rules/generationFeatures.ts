/**
 * 세대 기능 표(Qt core/rules/generationfeatures) — `if (g >= n)`을 흩뿌리지 않고 여기서 읽는다.
 */
export interface GenerationFeatures {
  heldItems: boolean
  specialSplit: boolean
  abilities: boolean
  natures: boolean
  hiddenAbilities: boolean
  darkAndSteel: boolean
  fairy: boolean
  /** 4세대~: 기술마다 물리/특수 */
  splitByMove: boolean
  /** 1–6세대: 비전머신(7세대~ 포켓라이드 · 라이드가 대신) */
  hiddenMachines: boolean
}

const ROWS: readonly GenerationFeatures[] = [
  row(0, 0, 0, 0, 0, 0, 0, 0, 1),
  row(1, 1, 0, 0, 0, 1, 0, 0, 1),
  row(1, 1, 1, 1, 0, 1, 0, 0, 1),
  row(1, 1, 1, 1, 0, 1, 0, 1, 1),
  row(1, 1, 1, 1, 1, 1, 0, 1, 1),
  row(1, 1, 1, 1, 1, 1, 1, 1, 1),
  row(1, 1, 1, 1, 1, 1, 1, 1, 0),
]

function row(...f: number[]): GenerationFeatures {
  const [
    heldItems,
    specialSplit,
    abilities,
    natures,
    hiddenAbilities,
    darkAndSteel,
    fairy,
    splitByMove,
    hiddenMachines,
  ] = f.map((v) => v === 1)
  return {
    heldItems,
    specialSplit,
    abilities,
    natures,
    hiddenAbilities,
    darkAndSteel,
    fairy,
    splitByMove,
    hiddenMachines,
  }
}

/** 1 미만 = 1세대, 7 이상 = 마지막 행 */
export function featuresOf(generation: number): GenerationFeatures {
  const i = Math.min(Math.max(Math.trunc(generation), 1), ROWS.length) - 1
  return ROWS[i]
}

export function typeExistsInGeneration(type: string, generation: number) {
  const f = featuresOf(generation)
  if (type === "dark" || type === "steel") return f.darkAndSteel
  if (type === "fairy") return f.fairy
  return true
}
