/**
 * 아이템 화면의 순수 로직 — 거르기 · 정렬 · 버전 한정 · 진화 보조 글자 · 키보드 이동.
 * 거르기 규칙 자체는 data/models(acceptsItem)를 쓰고, 여기서는 화면 묶음 · 정렬 메뉴를 얹는다.
 */
import { acceptsItem, type ItemFilter } from "../../data/models/items.ts"
import {
  introGeneration,
  type GameInfo,
  type ItemRow,
} from "../../data/repository/types.ts"
import { text, type Language } from "../../data/text/localizedText.ts"
import { tKey } from "../../i18n/index.ts"

export type ItemSortKey = "name" | "priceAsc" | "priceDesc" | "intro"

export const SORT_OPTIONS: readonly { value: ItemSortKey; label: string }[] = [
  { value: "name", label: tKey("가나다순") },
  { value: "priceAsc", label: tKey("가격 낮은 순") },
  { value: "priceDesc", label: tKey("가격 높은 순") },
  { value: "intro", label: tKey("등장 세대순") },
]

export const isSortKey = (v: string): v is ItemSortKey =>
  SORT_OPTIONS.some((o) => o.value === v)

const collators = new Map<Language, Intl.Collator>()

/** 기술머신100이 10과 11 사이에 끼지 않게 숫자 비교 */
function collatorFor(language: Language): Intl.Collator {
  let c = collators.get(language)
  if (!c) {
    c = new Intl.Collator(language, { numeric: true })
    collators.set(language, c)
  }
  return c
}

/** 정렬한 새 배열. 비매품(0)은 가격순에서 늘 맨 뒤, 마지막 동률은 id 순 */
export function sortItems(
  rows: readonly ItemRow[],
  key: ItemSortKey,
  language: Language
): ItemRow[] {
  const collator = collatorFor(language)
  const byName = (a: ItemRow, b: ItemRow) =>
    collator.compare(text(a.name, language), text(b.name, language))
  const compare = (a: ItemRow, b: ItemRow): number => {
    if (key === "priceAsc" || key === "priceDesc") {
      const freeA = a.cost <= 0
      const freeB = b.cost <= 0
      if (freeA !== freeB) return freeA ? 1 : -1
      if (!freeA && a.cost !== b.cost)
        return key === "priceAsc" ? a.cost - b.cost : b.cost - a.cost
      return 0
    }
    if (key === "intro") {
      const d = introGeneration(a) - introGeneration(b)
      return d !== 0 ? d : byName(a, b)
    }
    return byName(a, b)
  }
  return [...rows].sort((a, b) => compare(a, b) || a.id - b.id)
}

export interface ItemQuery {
  generation: number
  onlyThisGeneration: boolean
  /** 묶음 거르기(itemGroups.groupFilter) */
  group: (category: string, pocket: string) => boolean
  /** 게임별 존재(완전 목록 사전). 비면 거르지 않음 */
  allowed: ReadonlySet<string>
  search: string
  sort: ItemSortKey
  language: Language
}

/** 화면에 보일 줄(거르기 → 정렬) */
export function visibleItems(
  rows: readonly ItemRow[],
  query: ItemQuery
): ItemRow[] {
  const filter: ItemFilter = {
    search: query.search,
    category: query.group,
    onlyInGeneration: query.onlyThisGeneration,
    allowed: query.allowed,
  }
  const kept = rows.filter((row) =>
    acceptsItem(row, filter, query.generation, query.language)
  )
  return sortItems(kept, query.sort, query.language)
}

/**
 * 같은 묶음 안에서 이 종을 얻을 수 있는 버전들. 모든 버전에서 되면(또는 버전이 하나뿐이면) [].
 * otherVersion(v) = v에서는 못 얻고 같은 묶음의 다른 버전에서만 얻는 종
 */
export function onlyIn(
  game: GameInfo | undefined,
  speciesId: number,
  otherVersion: (version: string) => ReadonlySet<number>
): string[] {
  if (!game || game.versions.length < 2) return []
  const able = game.versions.filter((v) => !otherVersion(v).has(speciesId))
  return able.length === game.versions.length ? [] : able
}

/** 진화 줄의 보조 글자 재료. 화면이 t()로 이어 붙인다 */
export interface EvolutionNoteParts {
  gender: "male" | "female" | null
  held: "trade" | "levelUp" | "other" | null
  versions: string[] // 약칭
}

/** gender: 1 암컷 · 2 수컷. trigger: 1 레벨업 · 2 교환 */
export function evolutionNoteParts(
  held: boolean,
  gender: number,
  trigger: number,
  versionShorts: readonly string[]
): EvolutionNoteParts {
  return {
    gender: gender === 2 ? "male" : gender === 1 ? "female" : null,
    held: !held
      ? null
      : trigger === 2
        ? "trade"
        : trigger === 1
          ? "levelUp"
          : "other",
    versions: versionShorts.filter((s) => s !== ""),
  }
}

/** ↑↓ · PageUp/Down · Home/End로 옮길 다음 줄 번호. 못 옮기면 null */
export function nextIndex(
  key: string,
  current: number,
  count: number,
  pageSize: number
): number | null {
  if (count === 0) return null
  const last = count - 1
  const page = Math.max(1, pageSize)
  let next: number
  switch (key) {
    case "ArrowDown":
      next = current < 0 ? 0 : current + 1
      break
    case "ArrowUp":
      next = current < 0 ? 0 : current - 1
      break
    case "PageDown":
      next = current < 0 ? 0 : current + page
      break
    case "PageUp":
      next = current < 0 ? 0 : current - page
      break
    case "Home":
      next = 0
      break
    case "End":
      next = last
      break
    default:
      return null
  }
  return Math.min(last, Math.max(0, next))
}

/** 가상 스크롤: 보이는 줄 구간 [start, end) (위아래 덤 overscan줄) */
export function windowRange(
  scrollTop: number,
  viewport: number,
  rowHeight: number,
  count: number,
  overscan = 8
): [number, number] {
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const end = Math.min(
    count,
    Math.ceil((scrollTop + viewport) / rowHeight) + overscan
  )
  return [start, Math.max(start, end)]
}

/** 고른 줄이 보이게 할 새 scrollTop (가장자리에 맞춤). 이미 보이면 null */
export function scrollToReveal(
  index: number,
  scrollTop: number,
  viewport: number,
  rowHeight: number
): number | null {
  const top = index * rowHeight
  const bottom = top + rowHeight
  if (top < scrollTop) return top
  if (bottom > scrollTop + viewport) return Math.max(0, bottom - viewport)
  return null
}
