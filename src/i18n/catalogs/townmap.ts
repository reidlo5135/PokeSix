/** 타운맵 (Qt townmappage · mapview · guidebook) */
import type { Catalog } from "../types.ts"

export default {
  "%1 타운맵": { en: "%1 Town Map", ja: "%1タウンマップ" },
  "%1곳": { en: "%1 places", ja: "%1か所" },
  지방: { en: "Region", ja: "地方" },
  게임: { en: "Game", ja: "ゲーム" },
  "이 지방의 지도는 아직 준비 중이에요": {
    en: "The map for this region is not ready yet",
    ja: "この地方のマップは準備中です",
  },
  "지도 그림을 받는 중이에요…": {
    en: "Downloading the map picture…",
    ja: "マップ画像を受信中…",
  },
  "지도 그림을 받지 못했어요": {
    en: "Couldn't download the map picture",
    ja: "マップ画像を受信できませんでした",
  },

  // 상세 패널
  장소: { en: "Location", ja: "場所" },
  "장소 정보": { en: "Location info", ja: "場所の情報" },
  "지도에서 장소를 고르면\n그 게임의 야생 출현이 보여요": {
    en: "Pick a place on the map to see\nthat game's wild encounters",
    ja: "マップで場所を選ぶと\nそのゲームの野生出現が見られます",
  },
  야생: { en: "Wild", ja: "野生" },
  랜드마크: { en: "Landmarks", ja: "ランドマーク" },
  "이 게임에는 이곳의 야생 출현 자료가 없어요": {
    en: "No wild encounter data here in this game",
    ja: "このゲームにはここの野生出現データがありません",
  },
  "이곳의 아이템 자료가 없어요(사전 준비 중)": {
    en: "No item data here yet (book in progress)",
    ja: "ここのどうぐデータはまだありません（辞書準備中）",
  },
  "기록해 둔 랜드마크가 없어요": {
    en: "No landmarks recorded here",
    ja: "記録されたランドマークがありません",
  },
  "불러오는 중이에요…": { en: "Loading…", ja: "読み込み中…" },
  "도감에서 보기": { en: "Show in Pokédex", ja: "図鑑で見る" },
  "아이템 백과에서 보기": { en: "Show in Items", ja: "どうぐで見る" },
  "Lv.%1": { en: "Lv.%1", ja: "Lv.%1" },
  "Lv.%1–%2": { en: "Lv.%1–%2", ja: "Lv.%1–%2" },
  "%1 · %2%": { en: "%1 · %2%", ja: "%1 · %2%" },

  // 입수 방법 · 비용 낱말은 items.ts에 있다(같은 원문 · 같은 번역)
} satisfies Catalog
