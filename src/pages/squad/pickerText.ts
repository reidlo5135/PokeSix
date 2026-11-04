/**
 * 선택 창 글 · 순서 — 멤버 경고 글, 기술의 배우는 방법 글, 지닌 물건 후보 순서.
 * (컴포넌트 파일은 컴포넌트만 내보낸다 — 빠른 새로고침 규칙)
 */
import type { MemberWarning } from "../../core/analysis/memberWarning.ts"
import {
  cachedAcquisitionBook,
  tutorCostText,
} from "../../core/rules/acquisition.ts"
import type { LearnableMove } from "../../core/rules/learn.ts"
import type { ItemRow } from "../../data/repository/index.ts"
import { text, type Language } from "../../data/text/localizedText.ts"
import type { TFunction } from "../../i18n/index.ts"

export function warningText(t: TFunction, w: MemberWarning | null): string {
  if (!w) return ""
  switch (w.kind) {
    case "same":
      return t("이미 멤버에 있어요(%1번 자리)", w.slot + 1)
    case "evolved":
      return t("진화한 모습(%1)이 이미 있어요", w.name)
    case "preEvolution":
      return t("진화 전 모습(%1)이 이미 있어요", w.name)
    case "starter":
      return t("이미 스타팅 포켓몬(%1)이 있어요", w.name)
  }
}

/** "자력(43레벨) · TM26 · NPC 가르침 · 알" */
export function learnMethodText(
  t: TFunction,
  row: LearnableMove,
  versionGroup: string,
  lang: Language
): string {
  const parts: string[] = []
  if (row.level >= 0 && row.move.fromPokemonId > 0)
    parts.push(t("자력(%1 %2레벨)", text(row.move.fromName, lang), row.level))
  else if (row.level >= 0) parts.push(t("자력(%1레벨)", row.level))
  if (row.machine) parts.push(row.machine)
  if (row.tutor) {
    const book = cachedAcquisitionBook(versionGroup)
    const cost = book ? tutorCostText(t, book, row.move.identifier, lang) : ""
    parts.push(cost ? t("NPC 가르침(%1)", cost) : t("NPC 가르침"))
  }
  if (row.egg) parts.push(t("알"))
  return parts.join(" · ")
}

// 지닌 물건 후보 순서: 지닌 물건다운 분류 → 나무열매 → 나머지 → 몬스터볼 · 메일
const HELD_FIRST = [
  "held-items",
  "choice",
  "type-enhancement",
  "bad-held-items",
  "plates",
  "species-specific",
  "effort-training",
  "jewels",
  "mega-stones",
  "z-crystals",
  "memories",
  "type-protection",
  "in-a-pinch",
  "picky-healing",
]
const HIDDEN_CATEGORIES = new Set([
  "unused",
  "dynamax-crystals",
  "data-cards",
  "curry-ingredients",
  "sandwich-ingredients",
  "picnic",
  "tm-materials",
  "species-candies",
])

export function heldItemCandidates(items: readonly ItemRow[]): ItemRow[] {
  const rank = (i: ItemRow) => {
    const held = HELD_FIRST.indexOf(i.category)
    if (held >= 0) return held
    if (i.pocket === "berries") return 100
    if (i.pocket === "pokeballs" || i.pocket === "mail") return 300
    return 200
  }
  return items
    .filter(
      (i) =>
        i.pocket !== "key" &&
        i.pocket !== "machines" &&
        !HIDDEN_CATEGORIES.has(i.category)
    )
    .map((item, index) => ({ item, index, rank: rank(item) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((x) => x.item)
}
