/** 설정 (SCR-05) */
import type { Catalog } from "../types.ts"

export default {
  "설정 분류": { en: "Settings sections", ja: "設定の分類" },
  "세대 규칙": { en: "Generation rules", ja: "世代ルール" },
  데이터: { en: "Data", ja: "データ" },
  언어: { en: "Language", ja: "言語" },
  테마: { en: "Theme", ja: "テーマ" },
  단축키: { en: "Shortcuts", ja: "ショートカット" },
  정보: { en: "About", ja: "情報" },
  "모든 화면의 계산에 적용": {
    en: "Applied to every calculation",
    ja: "すべての計算に適用",
  },
  "기준 세대": { en: "Base generation", ja: "基準の世代" },
  "도감 범위와 상성표를 이 세대로 맞춰요": {
    en: "Sets the dex range and type chart",
    ja: "図鑑の範囲と相性表をこの世代に合わせます",
  },
  "물리 · 특수 판정": { en: "Physical / special", ja: "物理・特殊の判定" },
  "1–3세대는 타입 기준, 4세대부터 기술마다 판정": {
    en: "Gens 1–3 by type, from Gen 4 per move",
    ja: "1–3世代はタイプ、4世代からはわざごと",
  },
  "세대 자동": { en: "By generation", ja: "世代に合わせる" },
  "항상 타입 기준": { en: "Always by type", ja: "常にタイプ" },
  "항상 기술 기준": { en: "Always by move", ja: "常にわざ" },
  "페어리 타입": { en: "Fairy type", ja: "フェアリータイプ" },
  "6세대 이전 세대에서는 숨기고 히트맵 열을 비활성으로": {
    en: "Hidden before Gen 6; heatmap column disabled",
    ja: "6世代より前は隠し、ヒートマップの列を無効に",
  },
  "강철 내성 (2–5세대)": {
    en: "Steel resistances (Gens 2–5)",
    ja: "はがねの耐性 (2–5世代)",
  },
  "해당 세대에서 강철이 고스트 · 악을 반감": {
    en: "Steel resists Ghost and Dark in those gens",
    ja: "その世代ではゴースト・あくを半減",
  },
  "당시 타입 사용": { en: "Types of the time", ja: "当時のタイプ" },
  "선택 세대 당시의 타입으로 계산 (타입 변경 이력 반영)": {
    en: "Use each Pokémon's type in that generation",
    ja: "選んだ世代当時のタイプで計算(タイプ変更を反映)",
  },
  "당시 종족값 사용": { en: "Stats of the time", ja: "当時の種族値" },
  "이후 세대에서 조정된 종족값을 선택 세대 기준으로": {
    en: "Use base stats as they were in that generation",
    ja: "後の世代で変わった種族値を選んだ世代の値で",
  },
  "예: 4세대 기준에서 토게키스는 노말/비행, 강철은 고스트 · 악을 반감, 페어리 열은 히트맵에서 비활성으로 표시돼요.":
    {
      en: "e.g. In Gen 4, Togekiss is Normal/Flying, Steel resists Ghost and Dark, and the Fairy column is disabled.",
      ja: "例: 4世代ではトゲキッスはノーマル/ひこう、はがねはゴースト・あくを半減、フェアリーの列は無効になります。",
    },
  "도감 · 기술 · 아이템 데이터": {
    en: "Pokédex, move and item data",
    ja: "ずかん・わざ・どうぐのデータ",
  },
  "버전 %1 · 마지막 확인 %2": {
    en: "Version %1 · Last checked %2",
    ja: "バージョン %1 · 最終確認 %2",
  },
  "지금 갱신": { en: "Update now", ja: "今すぐ更新" },
  "확인하는 중…": { en: "Checking…", ja: "確認中…" },
  "데이터가 아직 없어요": { en: "No data yet", ja: "データがまだありません" },
  "시작할 때 새 데이터 확인": {
    en: "Check for new data at launch",
    ja: "起動時に新しいデータを確認",
  },
  "갱신 중에도 기존 데이터로 계속 쓸 수 있어요": {
    en: "You can keep using the current data while updating",
    ja: "更新中も今のデータで使えます",
  },
  "데이터 갱신 중 — %1": { en: "Updating data — %1", ja: "データ更新中 — %1" },
  "갱신 중에도 기존 데이터로 계속 탐색할 수 있어요.": {
    en: "You can keep browsing while it updates.",
    ja: "更新中も今のデータで閲覧できます。",
  },
  "화면 언어": { en: "Interface language", ja: "画面の言語" },
  "버튼 · 제목 같은 화면 글자의 언어": {
    en: "Language of buttons and titles",
    ja: "ボタンや見出しの言語",
  },
  "포켓몬 · 기술 이름 표기": {
    en: "Pokémon & move names",
    ja: "ポケモン・わざの名前",
  },
  "인터페이스 언어와 따로 정할 수 있어요": {
    en: "Can differ from the interface language",
    ja: "画面の言語とは別に選べます",
  },
  "이름 표기": { en: "Name language", ja: "名前の表記" },
  "원어 이름 함께 보기": { en: "Show original name too", ja: "原語名も表示" },
  "예: 한카리아스 (Garchomp)": {
    en: "e.g. Garchomp (ガブリアス)",
    ja: "例: ガブリアス (Garchomp)",
  },
  "시스템 · 기본": { en: "System · default", ja: "システム・標準" },
  "표 밀도": { en: "Table density", ja: "表の密度" },
  "조밀: 행 높이 30 · 표준: 34": {
    en: "Compact: 30 px rows · Standard: 34",
    ja: "詰める: 行の高さ30 · 標準: 34",
  },
  조밀: { en: "Compact", ja: "詰める" },
  표준: { en: "Standard", ja: "標準" },
  "홈 · 도감 · 아이템 · 스쿼드 · 에디터 · 타운맵 · 설정으로 가요": {
    en: "Go to Home · Pokédex · Items · Squad · Editor · Town Map · Settings",
    ja: "ホーム・ずかん・どうぐ・スクワッド・エディター・タウンマップ・設定へ移動",
  },
  "메뉴 · 상세 · 검색을 닫아요": {
    en: "Close menus, details and search",
    ja: "メニュー・詳細・検索を閉じる",
  },
  "목록에서 고르고 열어요": {
    en: "Pick and open in lists",
    ja: "リストで選んで開く",
  },
  "데이터: PokéAPI · 비공식 팬 도구": {
    en: "Data: PokéAPI · unofficial fan tool",
    ja: "データ: PokéAPI・非公式ファンツール",
  },
  "PokeSix 코드 — MIT": {
    en: "PokeSix code — MIT",
    ja: "PokeSix のコード — MIT",
  },
  "글꼴 — SIL Open Font License 1.1 (Do Hyeon · 나눔고딕 · 나눔고딕코딩 · Silkscreen)":
    {
      en: "Fonts — SIL Open Font License 1.1 (Do Hyeon · Nanum Gothic · Nanum Gothic Coding · Silkscreen)",
      ja: "フォント — SIL Open Font License 1.1 (Do Hyeon · ナヌムゴシック · ナヌムゴシックコーディング · Silkscreen)",
    },
  "게임 데이터 — PokéAPI (BSD-3-Clause)": {
    en: "Game data — PokéAPI (BSD-3-Clause)",
    ja: "ゲームデータ — PokéAPI (BSD-3-Clause)",
  },
  "포켓몬 이름 · 그림은 Nintendo · Creatures · GAME FREAK의 상표예요.": {
    en: "Pokémon names and images are trademarks of Nintendo · Creatures · GAME FREAK.",
    ja: "ポケモンの名前・画像は Nintendo・Creatures・GAME FREAK の商標です。",
  },
  "%1 전문 보기": { en: "Show full text: %1", ja: "全文を見る: %1" },
} satisfies Catalog
