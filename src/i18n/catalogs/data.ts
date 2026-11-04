/** 데이터 받기 — 첫 실행 창 · 진행 단계 (Qt FirstRunPanel · DataUpdater 번역 그대로) */
import type { Catalog } from "../types.ts"

export default {
  "도감 데이터가 아직 없어요": {
    en: "No Pokédex data yet",
    ja: "ずかんデータがまだありません",
  },
  "PokéAPI에서 포켓몬 · 기술 · 아이템 정보를 받아 와요. 한 번만 받으면 인터넷 없이도 써요.":
    {
      en: "Downloads Pokémon, move and item data from PokéAPI. After the first download it works offline.",
      ja: "PokéAPI からポケモン・わざ・どうぐのデータを取得します。一度取得すればオフラインで使えます。",
    },
  "예상 크기 약 %1 MB": { en: "About %1 MB", ja: "約 %1 MB" },
  "데이터 받기": { en: "Download data", ja: "データを取得" },
  "데이터 받는 중…": { en: "Downloading…", ja: "ダウンロード中…" },
  "창을 닫아도 다음에 이어서 받아요.": {
    en: "You can close the window; it resumes next time.",
    ja: "閉じても次回つづきから取得します。",
  },
  "데이터를 받지 못했어요": {
    en: "Download failed",
    ja: "データを取得できませんでした",
  },
  "네트워크 연결을 확인하고 다시 시도해 주세요. 받은 부분은 남아 있어요.": {
    en: "Check your connection and try again. What was downloaded is kept.",
    ja: "ネットワークを確認して再試行してください。取得済みの分は残っています。",
  },
  "다시 시도": { en: "Retry", ja: "再試行" },
  "데이터 받는 중": { en: "Downloading data", ja: "データをダウンロード中" },
  "데이터 정리하는 중": { en: "Preparing data", ja: "データを準備中" },
  "준비 완료": { en: "Ready", ja: "準備完了" },
} satisfies Catalog
