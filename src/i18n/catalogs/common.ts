/** 여러 화면 · 공용 컴포넌트가 같이 쓰는 글자 */
import type { Catalog } from "../types.ts"

export default {
  지우기: { en: "Clear", ja: "クリア" },
  취소: { en: "Cancel", ja: "キャンセル" },
  "%1 해제": { en: "Remove %1", ja: "%1 を解除" },
  "최솟값 %1": { en: "Minimum %1", ja: "最小値 %1" },
  "최댓값 %1": { en: "Maximum %1", ja: "最大値 %1" },
  "%1개": { en: "%1", ja: "%1件" },
  "%1마리": { en: "%1 Pokémon", ja: "%1匹" },
  "%1세대": { en: "Gen %1", ja: "第%1世代" },
  "%1세대 %2": { en: "Gen %1 %2", ja: "第%1世代 %2" },
  "%1 · %2세대부터": { en: "%1 · from Gen %2", ja: "%1 · 第%2世代から" },
  "%1 · %2세대~": { en: "%1 · Gen %2+", ja: "%1 · 第%2世代~" },
  물: { en: "P", ja: "物" },
  특: { en: "S", ja: "特" },
  변: { en: "St", ja: "変" },
  물리: { en: "Physical", ja: "物理" },
  특수: { en: "Special", ja: "特殊" },
  변화: { en: "Status", ja: "変化" },
  포켓몬: { en: "Pokémon", ja: "ポケモン" },
  기술: { en: "Move", ja: "わざ" },
  "진행 중": { en: "Current", ja: "進行中" },
  "데이터가 필요해요": { en: "Data required", ja: "データが必要です" },
  "홈에서 받기": { en: "Download from Home", ja: "ホームで取得" },
  "처음 한 번 PokéAPI에서 데이터를 받아야 이 화면을 쓸 수 있어요.": {
    en: "Download the data from PokéAPI once to use this screen.",
    ja: "この画面を使うには、最初に一度 PokéAPI からデータを取得してください。",
  },
  "이 화면은 준비 중이에요": {
    en: "This screen is coming soon",
    ja: "この画面は準備中です",
  },
  "v%1": { en: "v%1", ja: "v%1" },
} satisfies Catalog
