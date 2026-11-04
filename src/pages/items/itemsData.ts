/**
 * 아이템 화면만 쓰는 작은 조회 두 개(저장소 함수 위에 얹는다).
 * - 진화 줄의 성별 · 진화 방법(v1 "킬리아 수컷 → 엘레이드", "지니고 교환/레벨업")
 * - PokéAPI 장소 이름 전부(입수처 장소: 사전에 없는 칼로스 · 알로라 장소도 한국어로 — Qt 버그 수정)
 */
import { loc, num, select, str } from "../../data/repository/db.ts"
import { evolutionsWithItem } from "../../data/repository/index.ts"
import type { ItemEvolution } from "../../data/repository/types.ts"
import type { LocalizedText } from "../../data/text/localizedText.ts"

export interface ItemEvolutionRow extends ItemEvolution {
  gender: number // 1 암컷 · 2 수컷 · 0 무관
  trigger: number // 1 레벨업 · 2 교환 · 3 도구 사용 …
}

interface Extra {
  speciesId: number
  held: boolean
  gender: number
  trigger: number
}

/** evolutionsWithItem + 성별 · 진화 방법. 같은 줄에 성별이 갈리면 0(무관) */
export function itemEvolutions(
  itemId: number,
  generation: number
): ItemEvolutionRow[] {
  const base = evolutionsWithItem(itemId, generation)
  if (base.length === 0) return []
  const extras: Extra[] = select(
    `SELECT DISTINCT e.evolved_species_id AS species_id, e.held_item_id = ? AS held,
            e.gender AS gender, e.trigger AS trigger
     FROM evolutions e JOIN species t ON t.id = e.evolved_species_id
     WHERE (e.item_id = ? OR e.held_item_id = ?) AND e.generation <= ? AND t.intro_gen <= ?`,
    [itemId, itemId, itemId, generation, generation]
  ).map((r) => ({
    speciesId: num(r.species_id),
    held: num(r.held) === 1,
    gender: num(r.gender),
    trigger: num(r.trigger),
  }))
  return base.map((e) => {
    const mine = extras.filter(
      (x) => x.speciesId === e.speciesId && x.held === e.held
    )
    const genders = new Set(mine.map((x) => x.gender))
    return {
      ...e,
      gender: genders.size === 1 ? (mine[0]?.gender ?? 0) : 0,
      trigger: mine[0]?.trigger ?? 0,
    }
  })
}

/** PokéAPI locations.identifier → 이름(세 언어) */
export function pokeapiLocationNames(): Map<string, LocalizedText> {
  return new Map(
    select("SELECT identifier, name_ko, name_en, name_ja FROM locations").map(
      (r) => [str(r.identifier), loc(r, "name")] as const
    )
  )
}
