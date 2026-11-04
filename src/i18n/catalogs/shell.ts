/** 앱 막대 · 탭 · 전체 검색 · 테마 메뉴 */
import { ctx } from "../keys.ts"
import type { Catalog } from "../types.ts"

export default {
  홈: { en: "Home", ja: "ホーム" },
  도감: { en: "Pokédex", ja: "ずかん" },
  아이템: { en: "Items", ja: "どうぐ" },
  스쿼드: { en: "Squad", ja: "スクワッド" },
  에디터: { en: "Editor", ja: "エディター" },
  타운맵: { en: "Town Map", ja: "タウンマップ" },
  설정: { en: "Settings", ja: "設定" },
  "주 메뉴": { en: "Main menu", ja: "メインメニュー" },
  "PokeSix 홈": { en: "PokeSix home", ja: "PokeSix ホーム" },
  홈으로: { en: "Go home", ja: "ホームへ" },
  "세대 선택: %1": { en: "Choose generation: %1", ja: "世代を選ぶ: %1" },
  "세대 선택": { en: "Choose generation", ja: "世代を選ぶ" },
  "전체 검색": { en: "Search everything", ja: "全体検索" },
  "전체 검색 (%1)": { en: "Search everything (%1)", ja: "全体検索 (%1)" },
  "포켓몬 · 기술 · 아이템": {
    en: "Pokémon · moves · items",
    ja: "ポケモン・わざ・どうぐ",
  },
  "검색 결과": { en: "Search results", ja: "検索結果" },
  "검색 결과가 없어요": { en: "No results", ja: "見つかりませんでした" },
  "%1개 더 보기": { en: "%1 more", ja: "ほか %1 件" },
  [ctx("기술", "GlobalSearch")]: { en: "Moves", ja: "わざ" },
  "테마: 라이트 (클릭해 변경)": {
    en: "Theme: light (click to change)",
    ja: "テーマ: ライト(クリックで変更)",
  },
  "테마: 다크 (클릭해 변경)": {
    en: "Theme: dark (click to change)",
    ja: "テーマ: ダーク(クリックで変更)",
  },
  "테마: 시스템 (클릭해 변경)": {
    en: "Theme: system (click to change)",
    ja: "テーマ: システム(クリックで変更)",
  },
  "테마 선택 열림": {
    en: "Theme menu open",
    ja: "テーマメニューを開いています",
  },
  "테마 선택": { en: "Choose theme", ja: "テーマを選ぶ" },
  라이트: { en: "Light", ja: "ライト" },
  다크: { en: "Dark", ja: "ダーク" },
  시스템: { en: "System", ja: "システム" },
  "시스템 설정 따르기": { en: "Follow system", ja: "システム設定に合わせる" },
} satisfies Catalog
