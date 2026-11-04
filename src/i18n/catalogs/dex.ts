/** 도감 대백과 (SCR-02) · 포켓몬 상세 · 기술 표 · 획득법 */
import type { Catalog } from "../types.ts"

export default {
  // 표 머리 · 공통 낱말
  타입: { en: "Type", ja: "タイプ" },
  전국: { en: "National", ja: "全国" },
  "No.": { en: "No.", ja: "No." },
  이름: { en: "Name", ja: "名前" },
  합계: { en: "Total", ja: "合計" },
  분류: { en: "Cat.", ja: "分類" },
  위력: { en: "Pow.", ja: "威力" },
  명중: { en: "Acc.", ja: "命中" },
  PP: { en: "PP", ja: "PP" },
  HP: { en: "HP", ja: "HP" },
  공격: { en: "Attack", ja: "こうげき" },
  방어: { en: "Defense", ja: "ぼうぎょ" },
  특공: { en: "Sp. Atk", ja: "とくこう" },
  특방: { en: "Sp. Def", ja: "とくぼう" },
  스피드: { en: "Speed", ja: "すばやさ" },
  명중률: { en: "Accuracy", ja: "命中率" },
  회피율: { en: "Evasion", ja: "回避率" },
  마비: { en: "paralysis", ja: "まひ" },
  잠듦: { en: "sleep", ja: "ねむり" },
  얼음: { en: "freeze", ja: "こおり" },
  화상: { en: "burn", ja: "やけど" },
  독: { en: "poison", ja: "どく" },
  혼란: { en: "confusion", ja: "こんらん" },
  헤롱헤롱: { en: "infatuation", ja: "メロメロ" },
  "하품(다음 턴 잠듦)": {
    en: "drowsy (sleeps next turn)",
    ja: "ねむけ(次のターンねむる)",
  },
  전부: { en: "all", ja: "すべて" },
  "HP %1 회복": { en: "Restores %1 HP", ja: "HPを%1回復" },
  "HP %1 소모": { en: "Costs %1 HP", ja: "HPを%1消費" },
  상대: { en: "Foe", ja: "相手" },
  변동: { en: "Var.", ja: "変動" },

  // 필터
  "필터 %1": { en: "Filters %1", ja: "フィルター %1" },
  필터: { en: "Filters", ja: "フィルター" },
  "%1개 적용": { en: "%1 applied", ja: "%1件適用" },
  "그 세대까지 나온 포켓몬 전부": {
    en: "Every Pokémon up to this generation",
    ja: "その世代までに登場したポケモンすべて",
  },
  "도감 내 검색": { en: "Search the Pokédex", ja: "図鑑内を検索" },
  "이름 · 번호 · 특성": {
    en: "Name · number · ability",
    ja: "名前・番号・特性",
  },
  세대: { en: "Generation", ja: "世代" },
  전체: { en: "All", ja: "すべて" },
  "%1은(는) %2세대부터 있어요": {
    en: "%1 exists from Gen %2",
    ja: "%1は第%2世代からあります",
  },
  "종족값 합계": { en: "Base stat total", ja: "種族値合計" },
  스탯: { en: "Stat", ja: "ステータス" },
  비교: { en: "Compare", ja: "比較" },
  값: { en: "Value", ja: "値" },
  "조건 삭제": { en: "Remove condition", ja: "条件を削除" },
  "개별 종족값 조건": { en: "Stat condition", ja: "個別の種族値条件" },
  "전설 · 환상 제외": {
    en: "Hide legendary · mythical",
    ja: "伝説・幻を除く",
  },
  "최종 진화만": { en: "Final evolutions only", ja: "最終進化のみ" },
  "필터 초기화": { en: "Reset filters", ja: "フィルターをリセット" },

  // 목록
  보기: { en: "View", ja: "表示" },
  "목록 보기": { en: "List view", ja: "リスト表示" },
  "그리드 보기": { en: "Grid view", ja: "グリッド表示" },
  "포켓몬 목록": { en: "Pokémon list", ja: "ポケモン一覧" },
  "합계 %1": { en: "Total %1", ja: "合計 %1" },
  "%1은(는) %2세대부터 나와요": {
    en: "%1 appears from Gen %2",
    ja: "%1は第%2世代から登場します",
  },
  "세대를 바꾸면 볼 수 있어요.": {
    en: "Switch the generation to see it.",
    ja: "世代を切り替えると見られます。",
  },
  "%1세대로 보기": { en: "View in Gen %1", ja: "第%1世代で見る" },
  "조건에 맞는 포켓몬이 없어요": {
    en: "No Pokémon match these filters",
    ja: "条件に合うポケモンがいません",
  },
  "필터를 줄이거나 초기화해 보세요.": {
    en: "Try fewer filters or reset them.",
    ja: "条件を減らすかリセットしてください。",
  },
  "검색 지우기": { en: "Clear search", ja: "検索をクリア" },
  "스쿼드가 가득 찼어요 (%1/%1)": {
    en: "The squad is full (%1/%1)",
    ja: "スクワッドがいっぱいです (%1/%1)",
  },
  "%1을(를) 스쿼드에 넣었어요 (%2/%3)": {
    en: "Added %1 to the squad (%2/%3)",
    ja: "%1をスクワッドに入れました (%2/%3)",
  },

  // 정렬 · 적용 알약
  "번호 순": { en: "Number", ja: "番号順" },
  "번호 역순": { en: "Number (desc)", ja: "番号の逆順" },
  "이름 순": { en: "Name", ja: "名前順" },
  "이름 역순": { en: "Name (desc)", ja: "名前の逆順" },
  "타입 순": { en: "Type", ja: "タイプ順" },
  "합계 낮은 순": { en: "Total: low to high", ja: "合計の低い順" },
  "합계 높은 순": { en: "Total: high to low", ja: "合計の高い順" },
  "%1 낮은 순": { en: "%1: low to high", ja: "%1の低い順" },
  "%1 높은 순": { en: "%1: high to low", ja: "%1の高い順" },
  번호순: { en: "No.", ja: "番号順" },
  이름순: { en: "Name", ja: "名前順" },
  타입순: { en: "Type", ja: "タイプ順" },
  합계순: { en: "Total", ja: "合計順" },
  "%1순": { en: "%1", ja: "%1順" },
  "%1 도감": { en: "%1 Dex", ja: "%1図鑑" },
  "타입 %1": { en: "%1 types", ja: "タイプ %1" },
  "합계 %1+": { en: "Total %1+", ja: "合計 %1+" },
  "합계 ~%1": { en: "Total ≤%1", ja: "合計 ~%1" },
  "합계 %1–%2": { en: "Total %1–%2", ja: "合計 %1–%2" },
  "전설 제외": { en: "No legendaries", ja: "伝説を除く" },

  // 상세
  특성: { en: "Abilities", ja: "特性" },
  "특성은 3세대부터 있어요.": {
    en: "Abilities exist from Gen 3.",
    ja: "特性は第3世代からあります。",
  },
  "특성 정보가 없어요.": {
    en: "No ability data.",
    ja: "特性の情報がありません。",
  },
  "숨겨진 특성": { en: "Hidden", ja: "隠れ特性" },
  "선택한 포켓몬 상세 (드로어)": {
    en: "Selected Pokémon details (drawer)",
    ja: "選んだポケモンの詳細 (ドロワー)",
  },
  "선택한 포켓몬 상세": {
    en: "Selected Pokémon details",
    ja: "選んだポケモンの詳細",
  },
  "목록에서 포켓몬을 고르면 여기에 자세히 보여요": {
    en: "Pick a Pokémon from the list to see its details here",
    ja: "一覧からポケモンを選ぶとここに詳しく表示されます",
  },
  스쿼드에: { en: "To squad", ja: "スクワッドへ" },
  "스쿼드에 추가": { en: "Add to squad", ja: "スクワッドに追加" },
  "%1 m · %2 kg": { en: "%1 m · %2 kg", ja: "%1 m・%2 kg" },
  "%1 도감 No.%2 · %3세대 첫 등장": {
    en: "%1 Dex No.%2 · debuted in Gen %3",
    ja: "%1図鑑 No.%2・第%3世代初登場",
  },
  "%1 도감 · %2세대 첫 등장": {
    en: "%1 Dex · debuted in Gen %2",
    ja: "%1図鑑・第%2世代初登場",
  },
  "진화:": { en: "Evolution:", ja: "進化:" },
  종족값: { en: "Base stats", ja: "種族値" },
  "%1세대 종족값 기준": {
    en: "Gen %1 base stats",
    ja: "第%1世代の種族値",
  },
  성격: { en: "Nature", ja: "せいかく" },
  "성격 없음": { en: "No nature", ja: "せいかくなし" },
  "방어 상성 · %1세대": {
    en: "Defense · Gen %1",
    ja: "防御相性・第%1世代",
  },
  "방어 상성": { en: "Defense", ja: "防御相性" },
  "%1세대 규칙": { en: "Gen %1 rules", ja: "第%1世代のルール" },
  "자속 기술로 줄 때": {
    en: "Dealt with STAB moves",
    ja: "タイプ一致技で与えるとき",
  },

  // 탭 · 기술 표
  레벨업: { en: "Level-up", ja: "レベルアップ" },
  기술머신: { en: "TM", ja: "わざマシン" },
  교배: { en: "Egg", ja: "タマゴ" },
  가르침: { en: "Tutor", ja: "教え" },
  획득법: { en: "Obtaining", ja: "入手方法" },
  "더 보기": { en: "More", ja: "もっと見る" },
  "습득 기술": { en: "Learnset", ja: "覚える技" },
  기준: { en: "basis", ja: "基準" },
  "이 게임에서는 배울 수 없어요": {
    en: "Can't learn any in this game",
    ja: "このゲームでは覚えません",
  },
  "이 게임의 기술 데이터가 아직 없어요": {
    en: "No move data for this game yet",
    ja: "このゲームの技データはまだありません",
  },
  Lv: { en: "Lv", ja: "Lv" },
  번호: { en: "No.", ja: "番号" },
  "진화 전 단계에서 배우는 기술": {
    en: "Learned by pre-evolutions",
    ja: "進化前に覚える技",
  },
  "빨간 위력 = 자속 보정 (%1)": {
    en: "Red power = STAB (%1)",
    ja: "赤い威力 = タイプ一致 (%1)",
  },
  "획득처 정보 없음": { en: "No source data", ja: "入手先の情報なし" },
  하트비늘: { en: "Heart Scale", ja: "ハートのウロコ" },
  "이 게임에서는 Lv %1부터 얻어요. 얻을 때 갖고 있지 않으면 기술 떠올리기(하트비늘)로 배워요.":
    {
      en: "Obtainable from Lv %1 in this game. If it doesn't know the move by then, use the Move Reminder (Heart Scale).",
      ja: "このゲームではLv %1から手に入ります。その時点で覚えていなければ、技思い出し(ハートのウロコ)で覚えます。",
    },
  "진화 전 단계에서는 배우지 않는 기술이에요. 진화한 뒤 기술 떠올리기(하트비늘)로 배워요.":
    {
      en: "Pre-evolutions don't learn this. After evolving, use the Move Reminder (Heart Scale).",
      ja: "進化前には覚えない技です。進化した後に技思い出し(ハートのウロコ)で覚えます。",
    },

  // 획득법 · 진화
  진화: { en: "Evolution", ja: "進化" },
  "야생 출현": { en: "Wild encounters", ja: "野生の出現" },
  "Lv %1": { en: "Lv %1", ja: "Lv %1" },
  "Lv %1–%2": { en: "Lv %1–%2", ja: "Lv %1–%2" },
  "이 버전에서는 만날 수 없어요. %1에서 만나요(버전 한정).": {
    en: "Not found in this version. Found in %1 (version exclusive).",
    ja: "このバージョンでは出会えません。%1で出会えます(バージョン限定)。",
  },
  "배포 이벤트로만 얻어요.": {
    en: "Only from distribution events.",
    ja: "配信イベントでのみ入手できます。",
  },
  "이 게임에서는 얻을 수 없어요. %1에서 데려와요.": {
    en: "Not obtainable in this game. Transfer it from %1.",
    ja: "このゲームでは入手できません。%1から連れてきます。",
  },
  "이 게임에서는 얻을 수 없어요. 다른 게임에서 데려와요.": {
    en: "Not obtainable in this game. Transfer it from another game.",
    ja: "このゲームでは入手できません。他のゲームから連れてきます。",
  },
  "이 게임의 출현 데이터가 아직 없어요": {
    en: "No encounter data for this game yet",
    ja: "このゲームの出現データはまだありません",
  },
  "야생에서는 만날 수 없어요. 위의 진화 전 단계를 잡아 진화시켜요.": {
    en: "Not found in the wild. Catch a pre-evolution above and evolve it.",
    ja: "野生では出会えません。上の進化前を捕まえて進化させます。",
  },
  "이 세대에는 야생에서 만날 수 없어요. 교배 · 교환 · 이벤트로 얻어요.": {
    en: "Not found in the wild this generation. Get it by breeding, trading or events.",
    ja: "この世代では野生で出会えません。タマゴ・交換・イベントで入手します。",
  },
  "%1 지니고 통신교환": {
    en: "Trade holding %1",
    ja: "%1を持たせて通信交換",
  },
  "%1과(와) 통신교환": { en: "Trade for %1", ja: "%1と通信交換" },
  통신교환: { en: "Trade", ja: "通信交換" },
  "%1 사용": { en: "Use %1", ja: "%1を使う" },
  "파티 빈자리 · 몬스터볼": {
    en: "Empty party slot · Poké Ball",
    ja: "手持ちの空き・モンスターボール",
  },
  "특별한 조건": { en: "Special condition", ja: "特別な条件" },
  "%1 지님": { en: "holding %1", ja: "%1を持たせる" },
  "%1에서": { en: "at %1", ja: "%1で" },
  친밀도: { en: "Friendship", ja: "なつき度" },
  아름다움: { en: "Beauty", ja: "うつくしさ" },
  낮: { en: "Day", ja: "昼" },
  밤: { en: "Night", ja: "夜" },
  황혼: { en: "Dusk", ja: "夕方" },
  "%1 배운 상태": { en: "knowing %1", ja: "%1を覚えている" },
  "%1 타입 기술 배운 상태": {
    en: "knowing a %1-type move",
    ja: "%1タイプの技を覚えている",
  },
  "공격 > 방어": { en: "Atk > Def", ja: "こうげき > ぼうぎょ" },
  "공격 = 방어": { en: "Atk = Def", ja: "こうげき = ぼうぎょ" },
  "공격 < 방어": { en: "Atk < Def", ja: "こうげき < ぼうぎょ" },
  "파티에 %1": { en: "%1 in party", ja: "手持ちに%1" },
  "파티에 %1 타입": { en: "%1 type in party", ja: "手持ちに%1タイプ" },
  "비 오는 날": { en: "Raining", ja: "雨の日" },
  "기기 뒤집기": { en: "Device upside down", ja: "本体を逆さに" },
  "입수 정보가 아직 없어요": {
    en: "No source data yet",
    ja: "入手情報はまだありません",
  },
} satisfies Catalog
