/** 스쿼드 (SCR-04) · 분석 글 · 선택 창 · 불러오기 */
import type { Catalog } from "../types.ts"

export default {
  // 분석 — 문제 · 제안 (core/analysis)
  "%1 — 효과가 굉장한 기술 없음": {
    en: "%1 — no super-effective move",
    ja: "%1 — 効果抜群の技がない",
  },
  "%1 타입 공격 기술이 스쿼드에 없어요": {
    en: "No %1-type attacks in the squad",
    ja: "%1タイプの攻撃技がスクワッドにありません",
  },
  "%1 — 약점 %2, 받아낼 포켓몬 %3": {
    en: "%1 — %2 weak, %3 can take it",
    ja: "%1 — 弱点%2、受けられるポケモン%3",
  },
  "%1 — 약점 %2, 받아낼 포켓몬 없음": {
    en: "%1 — %2 weak, nobody can take it",
    ja: "%1 — 弱点%2、受けられるポケモンなし",
  },
  "%1 — 4배 약점": { en: "%1 — 4× weakness", ja: "%1 — 4倍弱点" },
  "받아낼 포켓몬이 없어요": {
    en: "Nobody can take it",
    ja: "受けられるポケモンがいません",
  },
  "받아냄: %1": { en: "Takes it: %1", ja: "受けられる: %1" },
  "%1 공격에 강하고 %2 기술을 가진 포켓몬이면 문제 %3건이 함께 풀려요.": {
    en: "A Pokémon that resists %1 and knows %2 moves would solve %3 problems at once.",
    ja: "%1に強く%2の技を持つポケモンなら、問題%3件がまとめて解決します。",
  },
  "%1 공격에 강한 포켓몬이면 문제 %2건이 풀려요.": {
    en: "A Pokémon that resists %1 would solve %2 problems.",
    ja: "%1に強いポケモンなら、問題%2件が解決します。",
  },
  "%1 기술을 가진 포켓몬이면 문제 %2건이 풀려요.": {
    en: "A Pokémon with %1 moves would solve %2 problems.",
    ja: "%1の技を持つポケモンなら、問題%2件が解決します。",
  },
  "이 세대의 포켓몬만 고를 수 있어요.": {
    en: "Only Pokémon from this generation can be picked.",
    ja: "この世代のポケモンだけ選べます。",
  },
  "빈 자리에 포켓몬을 더해 보세요.": {
    en: "Add a Pokémon to the empty slot.",
    ja: "空いている枠にポケモンを加えてみましょう。",
  },
  "%1 약점 %2": { en: "%1 weak %2", ja: "%1弱点 %2" },
  "%1 약점 %2 · 내성 없음": {
    en: "%1 weak %2 · no resist",
    ja: "%1弱点 %2・耐性なし",
  },
  "%1 ×4": { en: "%1 ×4", ja: "%1 ×4" },
  "%1 공격 없음": { en: "No %1 attack", ja: "%1攻撃なし" },
  "%1 ×%2": { en: "%1 ×%2", ja: "%1 ×%2" },
  "%1 약점": { en: "%1 weak", ja: "%1弱点" },

  // 리소스 투자
  "이 게임에 %1개뿐이에요": {
    en: "Only %1 in this game",
    ja: "このゲームに%1個しかありません",
  },
  "%1개는 더 구해요": { en: "Get %1 more", ja: "あと%1個必要です" },
  "%1개는 더 구해요 (%2)": {
    en: "Get %1 more (%2)",
    ja: "あと%1個必要です (%2)",
  },
  "관동 — 엔딩 후": { en: "Kanto — post-game", ja: "カントー — クリア後" },
  "%1 — 가르침 %2": { en: "%1 — tutor %2", ja: "%1 — 教え %2" },
  "리소스 투자": { en: "Resources", ja: "リソース投資" },

  // 분석 창
  "%1세대 상성표 · %2타입": {
    en: "Gen %1 type chart · %2 types",
    ja: "第%1世代の相性表・%2タイプ",
  },
  "✓ 문제 없음": { en: "✓ No problems", ja: "✓ 問題なし" },
  "실시간 분석": { en: "Live analysis", ja: "リアルタイム分析" },
  "첫 포켓몬을 추가하면 분석이 시작돼요": {
    en: "Add a first Pokémon to start the analysis",
    ja: "最初のポケモンを追加すると分析が始まります",
  },
  문제: { en: "Problems", ja: "問題" },
  히트맵: { en: "Heatmap", ja: "ヒートマップ" },
  "물리 · 특수": { en: "Phys. · Spec.", ja: "物理・特殊" },
  "문제 %1 — %2": { en: "%1 problems — %2", ja: "問題 %1 — %2" },
  "문제가 없어요 — 약점이 고르게 나뉘어 있어요": {
    en: "No problems — weaknesses are well spread",
    ja: "問題なし — 弱点がうまく分散しています",
  },
  "방어 상성 히트맵": { en: "Defense heatmap", ja: "防御相性ヒートマップ" },
  "행 = 포켓몬 · 열 = 공격 타입 · 숫자 = 받는 배율": {
    en: "Rows = Pokémon · columns = attacking type · number = damage taken",
    ja: "行 = ポケモン・列 = 攻撃タイプ・数字 = 受ける倍率",
  },
  "빈 슬롯": { en: "Empty slot", ja: "空き枠" },
  "약점 수": { en: "Weak", ja: "弱点数" },
  "내성 · 무효": { en: "Resist · immune", ja: "耐性・無効" },
  "공격 커버": { en: "Coverage", ja: "攻撃範囲" },
  무효: { en: "Immune", ja: "無効" },
  "문제 열": { en: "Problem column", ja: "問題の列" },
  "포켓몬 이름을 누르면 행이 노랗게 강조돼요": {
    en: "Click a Pokémon name to highlight its row",
    ja: "ポケモン名を押すと行が黄色く強調されます",
  },
  빈칸: { en: "Empty", ja: "空き" },
  "물리 · 특수 분포": {
    en: "Physical · special split",
    ja: "物理・特殊の分布",
  },
  "4세대~ 기술마다 판정": {
    en: "Gen 4+: per move",
    ja: "第4世代~ 技ごとに判定",
  },
  "1–3세대 타입마다 판정": {
    en: "Gen 1–3: per type",
    ja: "第1–3世代 タイプごとに判定",
  },
  "기술 %1 / %2": { en: "Moves %1 / %2", ja: "技 %1 / %2" },
  "1–3세대 규칙(타입 기준)이면": {
    en: "Under Gen 1–3 rules (by type):",
    ja: "第1–3世代のルール(タイプ基準)なら",
  },
  "4세대 이후 규칙(기술 기준)이면": {
    en: "Under Gen 4+ rules (by move):",
    ja: "第4世代以降のルール(技基準)なら",
  },
  "물리 %1 · 특수 %2": {
    en: "physical %1 · special %2",
    ja: "物理 %1・特殊 %2",
  },

  // 선택 창 · 창
  검색: { en: "Search", ja: "検索" },
  "이름으로 찾기": { en: "Search by name", ja: "名前で探す" },
  "찾는 결과가 없어요": { en: "No results", ja: "見つかりません" },
  "자세히 보기": { en: "Details", ja: "詳しく見る" },
  "멤버 자세히 보기": { en: "Member details", ja: "メンバーの詳細" },
  닫기: { en: "Close", ja: "閉じる" },
  아니요: { en: "No", ja: "いいえ" },
  예: { en: "Yes", ja: "はい" },
  확인: { en: "OK", ja: "OK" },
  "비전셔틀 고르기": { en: "Choose an HM slave", ja: "秘伝要員を選ぶ" },
  "%1세대 포켓몬 고르기": {
    en: "Choose a Gen %1 Pokémon",
    ja: "第%1世代のポケモンを選ぶ",
  },
  "포켓몬 고르기 · %1마리": {
    en: "Choose a Pokémon · %1",
    ja: "ポケモンを選ぶ・%1匹",
  },
  "%1의 기술 · %2개": { en: "%1's moves · %2", ja: "%1の技・%2個" },
  "기술 비우기": { en: "Clear move", ja: "技を外す" },
  "배우는 방법": { en: "How it's learned", ja: "覚え方" },
  "지닌 물건 고르기 · %1개": {
    en: "Choose a held item · %1",
    ja: "持ち物を選ぶ・%1個",
  },
  "물건 없음": { en: "No item", ja: "持ち物なし" },
  "이미 멤버에 있어요(%1번 자리)": {
    en: "Already in the squad (slot %1)",
    ja: "すでにメンバーにいます(%1番)",
  },
  "진화한 모습(%1)이 이미 있어요": {
    en: "Its evolution (%1) is already in",
    ja: "進化後(%1)がすでにいます",
  },
  "진화 전 모습(%1)이 이미 있어요": {
    en: "Its pre-evolution (%1) is already in",
    ja: "進化前(%1)がすでにいます",
  },
  "이미 스타팅 포켓몬(%1)이 있어요": {
    en: "A starter (%1) is already in",
    ja: "すでに御三家(%1)がいます",
  },
  "자력(%1 %2레벨)": { en: "Level-up (%1 Lv %2)", ja: "自力(%1 Lv%2)" },
  "자력(%1레벨)": { en: "Level-up (Lv %1)", ja: "自力(Lv%1)" },
  "NPC 가르침(%1)": { en: "Move tutor (%1)", ja: "教え技(%1)" },
  알: { en: "Egg", ja: "タマゴ" },

  // 비전셔틀
  비전셔틀: { en: "HM slave", ja: "秘伝要員" },
  "비전셔틀 · %1": { en: "HM slave · %1", ja: "秘伝要員・%1" },
  "+ 비전셔틀": { en: "+ HM slave", ja: "+ 秘伝要員" },
  "셔틀 비우기": { en: "Remove", ja: "外す" },
  "셔틀 바꾸기": { en: "Change", ja: "入れ替える" },
  "셔틀 고르기": { en: "Choose", ja: "選ぶ" },
  "비전머신 기술만 대신 드는 7번째 멤버예요. 분석에는 넣지 않아요.": {
    en: "A 7th member that only carries HM moves. It isn't analyzed.",
    ja: "秘伝技だけを受け持つ7匹目です。分析には入れません。",
  },
  "아직 셔틀이 없어요.": {
    en: "No HM slave yet.",
    ja: "まだ秘伝要員がいません。",
  },
  비전머신: { en: "HM", ja: "ひでんマシン" },
  셔틀: { en: "Slave", ja: "要員" },
  "배우는 멤버": { en: "Members who learn it", ja: "覚えるメンバー" },
  "배울 수 있어요": { en: "Can learn", ja: "覚えられます" },

  // 슬롯 카드
  "%1 선택": { en: "Select %1", ja: "%1を選択" },
  "누르면 선택, 끌면 순서를 바꿔요": {
    en: "Click to select, drag to reorder",
    ja: "押すと選択、ドラッグで並べ替え",
  },
  "슬롯 메뉴": { en: "Slot menu", ja: "枠メニュー" },
  "역할 메모 (예: 선봉 · 고속 스위퍼)": {
    en: "Role note (e.g. lead · fast sweeper)",
    ja: "役割メモ (例: 先発・高速アタッカー)",
  },
  "%1 역할 메모": { en: "%1 role note", ja: "%1の役割メモ" },
  약점: { en: "Weak", ja: "弱点" },
  없음: { en: "None", ja: "なし" },
  "1세대에는 특성 · 성격 · 지닌 물건이 없어요": {
    en: "Gen 1 has no abilities, natures or held items",
    ja: "第1世代には特性・せいかく・持ち物がありません",
  },
  물건: { en: "Item", ja: "持ち物" },
  "기술 추가": { en: "Add move", ja: "技を追加" },
  "기술 %1 추가": { en: "Add move %1", ja: "技%1を追加" },
  "위력 %1 · 명중 %2 · PP %3": {
    en: "Power %1 · Accuracy %2 · PP %3",
    ja: "威力 %1・命中 %2・PP %3",
  },
  "이 게임에서는 배울 수 없는 기술이에요. 다시 골라 주세요.": {
    en: "This move can't be learned in this game. Please pick again.",
    ja: "このゲームでは覚えられない技です。選び直してください。",
  },
  "개체 추가": { en: "Add Pokémon", ja: "ポケモンを追加" },
  "포켓몬 바꾸기": { en: "Change Pokémon", ja: "ポケモンを入れ替える" },
  "슬롯 비우기": { en: "Clear slot", ja: "枠を空ける" },

  // 상단 줄 · 불러오기 · 내보내기
  "스쿼드 이름": { en: "Squad name", ja: "スクワッド名" },
  "스쿼드 이름 변경": { en: "Rename squad", ja: "スクワッド名を変更" },
  "분석이 이 세대의 규칙을 따라요 — 상성표(페어리는 6세대부터),\n물리·특수 구분(3세대까지 타입, 4세대부터 기술),\n특성·성격(3세대부터) · 지닌 물건(2세대부터)":
    {
      en: "The analysis follows this generation's rules — type chart (Fairy from Gen 6),\nphysical/special split (by type until Gen 3, by move from Gen 4),\nabilities and natures (Gen 3+) · held items (Gen 2+)",
      ja: "分析はこの世代のルールに従います — 相性表(フェアリーは第6世代から)、\n物理・特殊の区分(第3世代までタイプ、第4世代から技)、\n特性・せいかく(第3世代から)・持ち物(第2世代から)",
    },
  되돌리기: { en: "Undo", ja: "元に戻す" },
  "다시 실행": { en: "Redo", ja: "やり直す" },
  "일괄 비우기": { en: "Clear all", ja: "すべて空ける" },
  "되돌리기 (Ctrl+Z)": { en: "Undo (Ctrl+Z)", ja: "元に戻す (Ctrl+Z)" },
  "다시 실행 (Ctrl+Shift+Z)": {
    en: "Redo (Ctrl+Shift+Z)",
    ja: "やり直す (Ctrl+Shift+Z)",
  },
  "일괄 비우기 — 되돌리기로 복구할 수 있어요": {
    en: "Clear all — you can undo it",
    ja: "すべて空ける — 元に戻せます",
  },
  "더 보기 (불러오기 · 내보내기)": {
    en: "More (import · export)",
    ja: "もっと見る (読み込み・書き出し)",
  },
  저장됨: { en: "Saved", ja: "保存済み" },
  "저장 중…": { en: "Saving…", ja: "保存中…" },
  "저장하지 못했어요": { en: "Couldn't save", ja: "保存できませんでした" },
  불러오기: { en: "Import", ja: "読み込み" },
  내보내기: { en: "Export", ja: "書き出し" },
  "스쿼드 불러오기": { en: "Import squad", ja: "スクワッドの読み込み" },
  "%1세대는 아직 준비되지 않았어요": {
    en: "Gen %1 isn't ready yet",
    ja: "第%1世代はまだ準備できていません",
  },
  "불러온 스쿼드": { en: "Imported squad", ja: "読み込んだスクワッド" },
  "지금 저장된 스쿼드를 '%1'(으)로 바꿔요. 계속할까요?": {
    en: "This replaces the saved squad with '%1'. Continue?",
    ja: "保存中のスクワッドを「%1」に置き換えます。続けますか?",
  },
  "✓ 세이브에서 파티를 불러왔어요": {
    en: "✓ Imported the party from the save",
    ja: "✓ セーブから手持ちを読み込みました",
  },
  "✓ 스쿼드를 불러왔어요": {
    en: "✓ Squad imported",
    ja: "✓ スクワッドを読み込みました",
  },
  "✓ 스쿼드 파일을 내보냈어요": {
    en: "✓ Squad file exported",
    ja: "✓ スクワッドファイルを書き出しました",
  },

  // 불러오기 오류(파일 · 세이브 파서가 키로 돌려준다)
  "파일을 열 수 없어요: %1": {
    en: "Can't open the file: %1",
    ja: "ファイルを開けません: %1",
  },
  "JSON이 아니에요: %1": { en: "Not JSON: %1", ja: "JSONではありません: %1" },
  "PokeSix 스쿼드 파일이 아니에요": {
    en: "Not a PokeSix squad file",
    ja: "PokeSixのスクワッドファイルではありません",
  },
  "세대 값이 이상해요: %1": {
    en: "Invalid generation: %1",
    ja: "世代の値がおかしいです: %1",
  },
  "4세대(DP · Pt · HGSS) · 5세대(BW · B2W2) 세이브가 아니에요": {
    en: "Not a Gen 4 (DP · Pt · HGSS) or Gen 5 (BW · B2W2) save",
    ja: "第4世代(DP・Pt・HGSS)・第5世代(BW・B2W2)のセーブではありません",
  },
} satisfies Catalog
