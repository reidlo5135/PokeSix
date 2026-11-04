/**
 * 그림(스프라이트) 주소 — Qt spritecache · spritekeys 이식.
 * 게임 그림은 커밋하지 않는다: 실행 중에 받아 쓴다. 후보 주소를 차례로 시도한다.
 */

const BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/"

const PATTERNS = {
  pokemonIcon: [
    BASE + "pokemon/versions/generation-viii/icons/%1.png",
    BASE + "pokemon/%1.png",
  ],
  pokemonFront: [BASE + "pokemon/versions/%1.png", BASE + "pokemon/%2.png"],
  item: [
    BASE + "items/%1.png",
    BASE + "items/%2.png",
    BASE + "items/gen9/%2.png",
    BASE + "items/gen8/%2.png",
  ],
  townMap: ["https://www.serebii.net/pokearth/%1.png"],
} as const

export type SpriteKind = keyof typeof PATTERNS

/** 후보 주소(순서대로, 중복 제거). %1 = 키 전체, %2 = 키의 마지막 경로 조각 */
export function spriteUrls(kind: SpriteKind, key: string): string[] {
  const last = key.split("/").at(-1) ?? key
  const urls = PATTERNS[kind].map((p) =>
    p.replaceAll("%1", key).replaceAll("%2", last)
  )
  return urls.filter((u, i) => urls.indexOf(u) === i)
}

// 세대별 정면 그림 폴더. 7 · 8세대는 폴더가 없다 → default/<id>
const FRONT_FOLDERS = [
  "generation-i/yellow",
  "generation-ii/crystal",
  "generation-iii/emerald",
  "generation-iv/platinum",
  "generation-v/black-white",
  "generation-vi/x-y",
  null,
  null,
  "generation-ix/scarlet-violet",
] as const

/** 정면 그림 키 (pokemonFront) */
export function frontKey(generation: number, pokemonId: number): string {
  const folder =
    generation >= 1 && generation <= 9 ? FRONT_FOLDERS[generation - 1] : null
  return folder ? `${folder}/${pokemonId}` : `default/${pokemonId}`
}

/**
 * 아이템 아이콘 키. 기술머신/레코드는 tm-<타입>, 비전머신은 hm-<타입>.
 * 1–5세대는 BW 그림(gen5/)을 쓴다.
 */
export function itemIconKey(
  identifier: string,
  machineType: string | null,
  generation: number
): string {
  let name = identifier
  const isMachine = /^(tm|hm|tr)\d/.test(identifier)
  const type = !machineType && isMachine ? "normal" : (machineType ?? "")
  if (type) name = (identifier.startsWith("hm") ? "hm-" : "tm-") + type
  return generation <= 5 ? `gen5/${name}` : name
}
