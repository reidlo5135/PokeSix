# H10 — 에디터 완성: 세이브를 스쿼드 카드처럼 보고, 고쳐서 저장한다

> 브랜치: `feat/h10-save-editor` (Claude가 만들어 둠) · 커밋 footer `Refs: H10a`(단계마다 H10a … H10f)
> 결정: [ADR 0022](../decisions/0022-writing-saves.md) — 원본은 두고 **다른 이름으로만** 쓴다, 다시 읽어 확인한 뒤 쓴다
> 사용자 결정(2026-10-20): 범위는 "sav 버전의 스쿼드 페이지"까지 전부, 4 · 5세대, **core부터 화면까지 전부 직접 구현**

---

## 이 가이드를 읽는 법 (H9 진행 중 지적받은 것을 고쳤다)

H9에서는 "카드를 openFile에서"처럼 **만들기와 채우기를 섞어** 말하거나, `loaded`처럼 **같은 이름이 두 곳에서 다른 것**을
가리키는데 말하지 않아서 코드가 꼬였다. 이번에는 모든 미션을 같은 틀로 쓴다.

| 칸 | 담는 것 |
|---|---|
| **목적** | 왜 만드는가. 이게 없으면 무엇이 불편한가 |
| **기능** | 다 만들면 사용자가 화면에서 보는 것 · 할 수 있는 것 |
| **화면 전 / 후** | 약도 두 장 |
| **위젯 트리** | 이 미션이 끝났을 때의 트리. 이번에 새로 생기는 줄에는 `← 새로` |
| **값이 오는 길** | 화면의 글자 하나가 세이브의 어느 칸에서 출발해 어떤 함수를 거쳐 오는가 |
| **할 일 표** | `무엇을` · `어디서(파일 · 함수)` · **`언제 실행되나`** |
| **코드 모양** | 짧은 조각. 표시 규칙은 아래 |
| **흔한 실수** | 이 미션에서 생기기 쉬운 꼬임과 그 원인 |
| **완료 조건** | 눈으로 확인할 것 |

**"언제 실행되나" 칸의 말은 세 가지뿐이다.**

| 말 | 뜻 | 들어가는 함수 |
|---|---|---|
| **한 번** | 앱이 켜지며 페이지 · 카드가 생길 때 딱 한 번 | 생성자, `build…()` |
| **매번(○○ 때)** | ○○가 일어날 때마다. ○○를 꼭 적는다(세이브 열 때 · 아이콘 도착 때 · 언어 바뀔 때) | `fill…()`, `set…()`, 이벤트 함수 |
| **—** | 실행되는 코드가 아니다(선언 · 구조체 · include) | 헤더 |

**만들기와 채우기는 다른 줄에 쓴다.**

- **만들기** = `new` · `addWidget` · `addLayout` · `append` · `connect` → **한 번** 칸에만 나온다
- **채우기** = `setText` · `setPixmap` · `setType` · `show` · `hide` → **매번** 칸에만 나온다
- 그래서 `fill…()` · `set…()` 안에 `new`가 보이면 그 자체가 버그 신호다

**코드 조각의 표시**

```cpp
existing();                 // (그대로)   이미 있는 줄 — 위치를 알려 주려고 보인다
added();                    // ← 새로     새로 쓰는 줄
view.nature = nature.name.text(/* ? */);   // /* ? */   직접 채울 칸 — 무엇이 들어가는지 주석에 말로 적는다
```

빈칸을 남길 때는 **무엇과 무엇을 비교하는지 · 그 값이 무슨 뜻인지**를 말로 먼저 적는다. 연산자 모양만 남기지 않는다.

**같은 이름이 두 곳에서 다른 것을 가리키면 ⚠로 표시한다.** 예) ⚠ `openFile`의 지역 변수 `loaded`(세이브 데이터) ≠
`buildBody`의 `loaded`(화면 상자). 이번 가이드는 화면 상자 쪽을 **`loadedPage`** 로 부른다 — 코드도 그렇게 바꿔 두면 좋다.

---

## 전체 지도 (H10a → H10f)

단계마다 **눈에 보이는 결과**가 하나씩 생긴다. 앞 단계가 완료 조건을 통과해야 다음으로 간다.
**상세(미션)는 그 단계를 시작할 때 이 문서에 덧붙인다** — 지금은 H10a · H10b만 상세가 있다(CLAUDE.md: 단계 가이드는 시작할 때).

| 단계 | 목적 | 다 하면 보이는 것 | 손대는 레이어 | 배우는 것 |
|---|---|---|---|---|
| **H10a** 카드 완성 | 에디터 카드를 스쿼드 카드 수준으로 — 세이브를 "읽는" 화면부터 끝낸다 | 아이콘 · 타입 칩 · 특성 · 성격 · 물건 · 기술 타입 · 실능력치 | ui | 값 묶음 구조체 · `paintEvent` 작은 위젯 · 비동기 아이콘으로 다시 채우기 |
| **H10b** 세이브 문서 | 쓰려면 원본 바이트와 **모든 칸**(PID · 개체값 · 노력치 · 경험치)이 필요한데, 지금 에디터가 든 `Portable`은 스쿼드용 요약이라 없다 | 화면은 거의 그대로 + 카드에 개체값 · 노력치(선택) | data | 레이어 경계의 값 객체 · 원본 보존 |
| **H10c** 쓰기 엔진 | 읽기의 역순(값 → 체크섬 → 섞기 → 암호화 → 블록 CRC)을 core에 | 화면 변화 없음 — **테스트**가 "읽기 → 쓰기 → 다시 읽기" 왕복을 확인 | core | 역연산 · `std::visit` · 왕복 테스트 |
| **H10d** 기술 · 물건 편집 + 저장 | 처음으로 실제로 고친다 | 기술 · 물건을 바꾸고 [다른 이름으로 저장] → 에뮬레이터에서 바뀐 값 | ui · data | 편집 상태(고침 표시) · 고르기 창 · `QSaveFile` |
| **H10e** 레벨 · 개체값 · 노력치 · 성격(5세대) · 특성 | 능력치가 바뀌는 편집 — 실능력치를 공식으로 다시 계산 | 게임 '능력치 보기'와 같은 숫자 | core · data(스키마) · ui | 능력치 공식 · 스키마 이전 |
| **H10f** 별명(5세대) | 5세대 별명은 UTF-16이라 바로 쓸 수 있다 | 게임에서 바뀐 별명 | core · ui | 고정 길이 문자열 · 종료 문자 |

4세대 성격 · 별명은 하지 않는다 — 이유는 ADR 0022 결정 5.

---

## H10a — 카드 완성 (읽기만)

### 먼저 읽을 것 (30분)

| 문서 | 어느 미션 | 왜 |
|---|---|---|
| [QWidget::paintEvent](https://doc.qt.io/qt-6/qwidget.html#paintEvent) · [update()](https://doc.qt.io/qt-6/qwidget.html#update) | A2 | 그림은 `paintEvent` 안에서만 그린다. `update()`는 "다시 그려 달라"는 **예약**이다 |
| [QWidget::sizeHint](https://doc.qt.io/qt-6/qwidget.html#sizeHint-prop) · [updateGeometry()](https://doc.qt.io/qt-6/qwidget.html#updateGeometry) | A2 | 직접 그리는 위젯은 레이아웃에 "나는 이만큼 크다"를 알려야 자리를 받는다 |
| [QLabel::setPixmap](https://doc.qt.io/qt-6/qlabel.html#pixmap-prop) | A1 · A3 | 아이콘은 글자 대신 그림을 넣은 라벨이다 |
| [QGridLayout::addLayout](https://doc.qt.io/qt-6/qgridlayout.html#addLayout) | A4 | 그리드 한 칸에 위젯 대신 레이아웃(칩 + 이름)을 넣는다 |
| [스타일시트 — 동적 속성](https://doc.qt.io/qt-6/stylesheet-examples.html#customizing-using-dynamic-properties) | A5(선택) | 실행 중에 글자색을 바꾸는 QSS 방법 |

### 목표 화면

```
지금 (H9)                                   H10a 끝
┌──────────────────────────┐               ┌──────────────────────────────────────────┐
│ 샤비                      │               │ [아이콘] 샤비                      Lv 23  │ ← A1
│ Lv 23                     │               │ [풀]                                      │ ← A2
│ 그래스믹서  성장           │      →        │ 특성 심록 · 성격 고집 · [■] 기적의씨      │ ← A3
│ 씨뿌리기    김밥말이       │               │ [풀] 그래스믹서     [노말] 성장           │ ← A4
└──────────────────────────┘               │ [풀] 씨뿌리기       [노말] 김밥말이       │
                                            │ HP 68 · 공격 45 · 방어 52 · 특공 40 · …   │ ← A5
                                            └──────────────────────────────────────────┘
```

배치(한 줄로 둘지, 위아래로 둘지, 글자 크기)는 직접 정한다. 약도는 예시다.

### H10a가 끝났을 때의 위젯 트리

```
PartyCard (QFrame#editorCard)
└ layout (QVBoxLayout) ─────────────────────── 카드에 붙음: new QVBoxLayout(this)
   ├ head (QHBoxLayout)                         ← A1  layout->addLayout(head)
   │  ├ m_icon     QLabel (68×56 고정)          ← A1  setPixmap
   │  ├ m_name     QLabel#editorCardName        (H9에서 위치만 head 안으로)
   │  ├ (stretch)
   │  └ m_level    QLabel#editorCardLevel       (H9에서 위치만 head 안으로)
   ├ typesRow (QHBoxLayout)                     ← A2
   │  ├ m_types[0] TypeChipWidget               ← A2  새 위젯 클래스
   │  ├ m_types[1] TypeChipWidget
   │  └ (stretch)
   ├ infoRow (QHBoxLayout)                      ← A3
   │  ├ m_ability  QLabel
   │  ├ m_nature   QLabel
   │  ├ m_itemIcon QLabel (30×30 고정)
   │  ├ m_item     QLabel
   │  └ (stretch)
   ├ movesLayout (QGridLayout 2×2)              (H9)
   │  └ 칸 ×4 — cell (QHBoxLayout)              ← A4  movesLayout->addLayout(cell, i / 2, i % 2)
   │       ├ m_moveTypes[i] TypeChipWidget      ← A4
   │       └ m_moves[i]     QLabel              (H9)
   └ statsRow (QHBoxLayout)                     ← A5
      └ m_stats[0..5] QLabel                    ← A5
```

### H10a가 끝났을 때 "값이 오는 길"

모든 값은 `m_loaded`(세이브에서 읽어 둔 `Portable`)에서 출발한다.

```
m_loaded                                  std::optional<squadfile::Portable>  (EditorPage 멤버)
├ generation · game ─▶ versionGroupOf(gamesForGeneration(generation), game) ─▶ group
└ squad.members[i]                        SquadMember
   ├ pokemonId ─▶ pokemonDetail(pokemonId, generation, group) ─▶ detail
   │                ├ detail.name.text(언어)                   → 이름        (H9)
   │                ├ detail.types                             → 타입 칩     (A2)
   │                └ detail.abilities 중 abilityId가 같은 것   → 특성 이름   (A3)
   ├ pokemonId ─▶ QString::number(...) ─▶ m_pokemonIcons->path(key)          → 아이콘      (A1)
   ├ level                                                     → Lv          (H9)
   ├ abilityId ─(위 detail.abilities에서 찾기)
   ├ natureId  ─▶ natures() 중 id가 같은 것                     → 성격 이름   (A3)
   ├ itemId    ─▶ itemsForGeneration(generation, group) 중 id가 같은 것
   │                ├ .name.text(언어)                          → 물건 이름   (A3)
   │                └ .identifier ─▶ ItemRowDelegate::iconKey ─▶ m_itemIcons → 물건 아이콘 (A3)
   ├ moves[4]  ─▶ 0이 아닌 것만 ids ─▶ moves(ids, generation)
   │                └ 각 MoveEntry의 .name · .type             → 기술 칸     (A4)
   └ stats[6]                                                  → 실능력치    (A5)
```

---

### 미션 A0 — 카드에 넘길 값을 상자 하나로 (`PartyCardView`) · 채우기 함수 분리

**목적**
- 앞으로 카드에 넘길 값이 10개 가까이로 는다. `setMember(name, level, moves, types, ability, nature, …)`처럼 인자를
  계속 늘리면 순서를 틀리기 쉽고, 칸 하나 더할 때마다 헤더 · cpp · 부르는 곳 세 군데를 고쳐야 한다
- 그리고 A1부터는 **세이브를 다시 열지 않아도** 카드를 다시 채워야 할 때가 생긴다(아이콘이 늦게 도착할 때).
  지금은 채우는 코드가 `openFile` 안에 있어서 "파일 열기" 없이는 채울 수 없다

**기능**: 화면은 **그대로**다. 코드 구조만 바꾸는 미션(리팩터링)이다.

**바꾸는 것 두 가지**

1. 값 묶음 구조체 `PartyCardView` — 카드가 그릴 글자 · 숫자만 담는다. 카드는 여전히 Repository를 모른다
2. 채우기 함수 `fillCards()` — `openFile`에서 루프를 떼어 낸다. `m_loaded`(멤버)만 보고 6장을 채운다

**함수마다 맡는 일 (A0 끝)**

| 함수 | 맡는 일 | 언제 | 하지 않는 일 |
|---|---|---|---|
| `openFile(path)` | **파일 → 데이터**: 읽기 · 실패 경고 · `m_loaded`와 `m_fileName` 저장 · `fillInfo()` · `fillCards()` · `setCurrentIndex(1)` | 매번(세이브 열 때) | 화면 글자를 직접 쓰지 않는다 |
| `fillInfo()` | **정보 줄**: 파일 이름 · 게임 이름 · 세대 · 마리 수 → `m_fileInfo` | 매번(세이브 열 때 · 언어 바뀔 때) | 파일을 읽지 않는다 |
| `fillCards()` | **카드 6장**: `m_loaded` → `PartyCardView` → `setMember` | 매번(세이브 열 때 · 아이콘 도착 때 · 언어 바뀔 때) | 파일을 읽지 않는다 |

`path`는 `openFile`에만 있으므로 파일 이름은 멤버 `QString m_fileName;`에 기억해 둔다. 정보 줄이 필요 없다고
정하면 `m_fileInfo`와 `fillInfo`를 통째로 지워도 된다(화면 설계는 직접 정한다).

**언제 무엇이 실행되나 (H10a 끝 기준)**

```
시간 ─────────────────────────────────────────────────────────────────────────▶

앱 켜짐        EditorPage 생성자 ─ buildTopbar · buildBody(카드 6장 new)   [한 번]
                                └ connect(아이콘 캐시 ready → fillCards)      [한 번 · A1]

세이브 열기    openFile(path) ─ load → m_loaded · m_fileName에 저장
                              ├ fillInfo()                                   [매번: 세이브 열 때]
                              └ fillCards()                                  [매번: 세이브 열 때]

아이콘 도착    SpriteCache::ready ─▶ fillCards()                              [매번: 아이콘 도착 때 · A1]

언어 바뀜      AppState::languageChanged ─▶ fillInfo() · fillCards()          [매번: 언어 바뀔 때 · 선택]
```

**할 일 표**

| # | 무엇을 | 어디서 | 언제 |
|---|---|---|---|
| ① | `struct PartyCardView` 선언 — 지금은 `name` · `level` · `moves`(QStringList) 세 칸만 | `partycard.h`, `class PartyCard` **위** | — |
| ② | `setMember(const PartyCardView &view)`로 인자 바꾸기. 본문은 `name` → `view.name`처럼만 고친다 | `partycard.h/.cpp` | 매번(채울 때) |
| ③ | `void fillCards();` 선언(private) | `editorpage.h` | — |
| ④ | `openFile`의 `for (int i = 0; i < 6; ++i)` 루프와 그 위의 `games` · `group` 계산을 `fillCards()` 본문으로 **옮긴다** | `editorpage.cpp` | 매번(세이브 열 때 · 아이콘 도착 때) |
| ⑤ | `openFile`의 루프가 있던 자리에 `fillCards();` 한 줄 | `openFile` | 매번(세이브 열 때) |

**⚠ 같은 이름 주의**: `openFile` 안의 `loaded`는 **지역 변수**라 `fillCards`에는 없다. `fillCards`는 멤버
`m_loaded`만 쓴다. 옮긴 코드의 `loaded->`를 전부 `m_loaded->`로 바꾼다.

**코드 모양**

```cpp
// partycard.h — class PartyCard 위
struct PartyCardView                       // ← 새로
{
    QString name;
    int level = 0;
    QStringList moves;                     // A4에서 타입이 붙은 모양으로 바뀐다
};
```

```cpp
// editorpage.cpp
void EditorPage::fillCards()               // ← 새로
{
    if (!m_loaded)                         // ← 새로  세이브를 열기 전에 불릴 수도 있다(아이콘 · 언어)
        return;
    // openFile에서 옮겨 온 games · group 계산과 for 루프 (loaded-> 를 m_loaded-> 로)
    // 루프 안: PartyCardView view; view.name = …; view.level = …; view.moves = …;
    //          m_cards[i]->setMember(view);
}
```

**흔한 실수**

| 증상 | 원인 |
|---|---|
| 빌드 에러 `'loaded' was not declared` | 옮긴 코드에 `loaded->`가 남았다 → `m_loaded->` |
| 세이브를 열어도 카드가 비어 있다 | `openFile`에서 `fillCards()`를 `m_loaded = *loaded;` **보다 먼저** 불렀다 — 채울 때 아직 이전 값(또는 빈 값) |

**✅ 완료 조건**: 화면이 H9와 똑같다. 다른 세이브를 이어서 열어도 카드가 맞게 바뀐다.

---

### 미션 A1 — 머리 줄: 박스 아이콘 + 이름 + 레벨

**목적**: 이름 글자만으로는 6장을 훑어보기 어렵다. 스쿼드 카드처럼 아이콘으로 한눈에 알아보게 한다.

**기능**
- 카드 맨 위 한 줄에 `[아이콘] 이름 ········ Lv 23`
- 한 번도 본 적 없는 포켓몬은 아이콘이 잠깐 비었다가, 받아지면 **세이브를 다시 열지 않아도** 나타난다

**화면 전 / 후**

```
전                         후
┌───────────────┐          ┌──────────────────────────────┐
│ 샤비           │    →     │ [아이콘] 샤비          Lv 23  │
│ Lv 23          │          │ …                             │
```

**위젯 트리 (이 미션 끝)**

```
layout (QVBoxLayout)
├ head (QHBoxLayout)        ← 새로   layout->addLayout(head)   — layout의 맨 처음
│  ├ m_icon  QLabel         ← 새로   setFixedSize(68, 56) — 아이콘이 오기 전에도 줄 높이가 같게
│  ├ m_name  QLabel                  (layout->addWidget 대신 head->addWidget으로 옮긴다)
│  ├ (stretch)              ← 새로   Lv를 오른쪽 끝으로 민다
│  └ m_level QLabel                  (위와 같이 head로 옮긴다)
└ movesLayout …                      (그대로)
```

**값이 오는 길**

```
member.pokemonId (392)
 └ QString::number(...) → key "392"
    └ m_pokemonIcons->path(key)
       ├ "…/392.png"  → QPixmap(경로) → view.icon → 카드가 m_icon->setPixmap
       └ ""(아직 없음) → m_pokemonIcons->request(key) → (나중에) ready("392") → fillCards() → 위로 다시
```

**누가 무엇을 갖나**

- 아이콘 캐시(`SpriteCache`)는 **페이지**가 하나 갖는다. 카드 6장이 같이 쓴다
- 카드는 캐시를 모른다. 페이지가 건네준 **그림(`QPixmap`)** 만 받는다(카드는 받은 것을 그리기만 — H9와 같은 원칙)

**할 일 표**

| # | 무엇을 | 어디서 | 언제 |
|---|---|---|---|
| ① | `SpriteCache *m_pokemonIcons = nullptr;` 멤버 | `editorpage.h` | — |
| ② | `m_pokemonIcons = new SpriteCache(SpriteCache::Kind::PokemonIcon, this);` | `EditorPage` 생성자, `buildBody()` **전** | 한 번 |
| ③ | `connect(m_pokemonIcons, &SpriteCache::ready, this, &EditorPage::fillCards);` | `EditorPage` 생성자 | 한 번(연결). 불리는 건 매번(아이콘 도착 때) |
| ④ | `PartyCardView`에 `QPixmap icon;` 칸 | `partycard.h` | — |
| ⑤ | 아이콘 찾기(아래 코드 모양) → `view.icon` | `fillCards()` 루프 안 | 매번(세이브 열 때 · 아이콘 도착 때) |
| ⑥ | `head` · `m_icon` 만들고 `m_name` · `m_level`을 head로 옮기기 | `PartyCard` 생성자 | 한 번 |
| ⑦ | `m_icon->setPixmap(view.icon);` | `setMember` | 매번 |
| ⑧ | `m_icon->clear();` | `setEmpty` | 매번 |

**코드 모양**

```cpp
// fillCards() 루프 안 — 이름을 찾은 뒤
const QString key = QString::number(member.pokemonId);   // ← 새로
const QString file = m_pokemonIcons->path(key);          // ← 새로
if (file.isEmpty())                                      // ← 새로
    m_pokemonIcons->request(key);   // 받으면 ready → fillCards가 다시 불린다. 그때는 file이 있다
else
    view.icon = QPixmap(file);
```

include: `editorpage.cpp`에 `"data/sprites/spritecache.h"`, `partycard.h`에 `<QPixmap>`.
참고 코드: [squadpage.cpp:1157](../../src/ui/squad/squadpage.cpp#L1157) — 비전셔틀 버튼이 같은 순서로 아이콘을 얻는다.

**흔한 실수**

| 증상 | 원인 |
|---|---|
| 아이콘이 영영 안 나온다 | ③ 연결이 없다 — 받기는 끝났는데 아무도 다시 채우지 않는다 |
| 아이콘이 매번 새로 받아진다 / 안 나온다 | `SpriteCache`를 `fillCards` 안에서 `new` — 채울 때마다 새 캐시라 받은 것을 잊는다(**채우기에 `new` = 버그 신호**) |
| 한 번 도착에 `fillCards`가 여러 번 불린다 | ③ `connect`를 `fillCards`나 `openFile` 안에 둠 — 열 때마다 연결이 하나씩 쌓인다 |
| 아이콘이 오는 순간 카드 높이가 튄다 | `m_icon->setFixedSize(68, 56)` 빠짐 |

**✅ 완료 조건**
- 6장 모두 머리 줄에 아이콘 · 이름 · Lv
- 처음 보는 포켓몬이 있는 세이브를 열면, 아이콘이 잠시 뒤 **저절로** 나타난다(다시 열지 않음)

---

### 미션 A2 — 타입 칩 위젯 (`TypeChipWidget`)

**목적**
- 타입 색은 도감 · 스쿼드와 **같은 칩**이어야 한다. 색 · 글자 대비 규칙은 이미 `typechip::paint`에 있다
  (색 하드코딩 금지 규칙 — 새 색을 만들지 않는다)
- 그런데 `typechip`은 위젯이 아니라 **그리기 함수**다([typechip.h](../../src/ui/widgets/typechip.h), ADR 0007).
  라벨에 넣을 수 없으니, 그 함수를 부르기만 하는 **아주 작은 위젯**을 만든다. A4 기술 칸에서도 다시 쓴다

**기능**: 이름 아래에 `[풀][독]` 칩. 타입이 하나면 칩도 하나. 라이트 · 다크에서 도감과 같은 색.

**새 파일**: `src/ui/widgets/typechipwidget.h/.cpp` → [src/ui/CMakeLists.txt](../../src/ui/CMakeLists.txt)에 두 줄.
여러 화면이 쓸 수 있는 부품이라 `ui/editor/`가 아니라 `ui/widgets/`에 둔다.

**이 위젯이 그려지는 순서 (H9의 "생성자에서 QPainter → 아무것도 안 나옴"과 같은 원리)**

```
카드의 setMember ─ chip->setType("grass", 언어)
                    ├ m_type = 찾은 색표      값만 저장한다(여기서 그리지 않는다)
                    ├ updateGeometry()        "내 크기가 바뀌었다" → 레이아웃이 sizeHint()를 다시 묻는다
                    └ update()                "다시 그려 달라" 예약 → 바로 그리지 않는다

(조금 뒤, Qt가 화면을 그릴 차례에)
Qt ─ chip->paintEvent()  ← 여기서만 QPainter를 만들고 typechip::paint를 부른다
```

**클래스 모양**

```cpp
class TypeChipWidget : public QWidget
{
    Q_OBJECT
public:
    explicit TypeChipWidget(QWidget *parent = nullptr);
    void setType(const QString &identifier, Language language);  // 빈 identifier = 칩 없음
    QSize sizeHint() const override;

protected:
    void paintEvent(QPaintEvent *event) override;

private:
    const tok::TypeColor *m_type = nullptr;  // typechip::find(identifier) — 모르는 타입이면 nullptr
    Language m_language = Language::Korean;
};
```

**할 일 표**

| # | 무엇을 | 어디서 | 언제 |
|---|---|---|---|
| ① | 위 클래스 선언 | `typechipwidget.h` | — |
| ② | `setSizePolicy(QSizePolicy::Fixed, QSizePolicy::Fixed);` — 레이아웃이 칩을 늘리지 않게 | 생성자 | 한 번 |
| ③ | `setType`: `m_type = typechip::find(identifier);` `m_language = language;` `updateGeometry();` `update();` | `setType` | 매번(카드를 채울 때) |
| ④ | `sizeHint`: `m_type`이 없으면 `QSize(0, 0)`, 있으면 폭 `typechip::width(*m_type, m_language)` · 높이 `typechip::kHeight`(둘 다 `qCeil`로 올림) | `sizeHint` | Qt가 물을 때마다 |
| ⑤ | `paintEvent`(아래) | `paintEvent` | Qt가 그릴 때마다 |
| ⑥ | `PartyCardView`에 `QStringList types;` · `Language language = Language::Korean;` | `partycard.h` | — |
| ⑦ | `typesRow` + 칩 2개 만들고 `QList<TypeChipWidget *> m_types`에 담기 | `PartyCard` 생성자 | 한 번 |
| ⑧ | 칩 2개 채우기: `i < view.types.size()`면 그 타입, 아니면 `QString()` | `setMember` | 매번 |
| ⑨ | `view.types = detail.types;` `view.language = 언어;` | `fillCards` | 매번 |

```cpp
void TypeChipWidget::paintEvent(QPaintEvent *)
{
    if (!m_type)
        return;
    QPainter painter(this);                          // 그리기는 여기서만
    painter.setRenderHint(QPainter::Antialiasing);
    typechip::paint(painter, QPointF(0, 0), *m_type, m_language);
}
```

참고 코드: [slotcard.cpp:547](../../src/ui/squad/slotcard.cpp#L547) — 스쿼드 카드가 타입 칩을 그리는 곳.

**흔한 실수**

| 증상 | 원인 |
|---|---|
| 칩이 안 보인다(자리도 없음) | `sizeHint` 없음 → 크기 0 |
| 다른 세이브를 열어도 옛 타입 칩 | `setType`에 `update()` 빠짐 — 값은 바뀌었는데 다시 그리지 않음 |
| 칩이 카드 폭만큼 늘어난다 | ② 크기 정책이 없다 |
| 링크 에러 `vtable for TypeChipWidget` | CMakeLists에 새 파일을 안 넣음 → moc가 안 돈다 |

**✅ 완료 조건**: 6마리 타입 칩이 도감 상세의 칩과 같은 색 · 글자. 다크로 바꿔도 읽힌다.

---

### 미션 A3 — 특성 · 성격 · 물건 줄

**목적**: 배틀 전에 확인하는 세 가지. 스쿼드 카드의 `[특성][성격][물건]` 줄에 해당한다.

**기능**: `특성 심록 · 성격 고집 · [■] 기적의씨`. 물건이 없으면 물건 칸은 비우거나 "—"(직접 정함).

**위젯 트리 (이 미션 끝)**

```
layout
├ head …
├ typesRow …
├ infoRow (QHBoxLayout)        ← 새로
│  ├ m_ability  QLabel         ← 새로
│  ├ m_nature   QLabel         ← 새로
│  ├ m_itemIcon QLabel         ← 새로  setFixedSize(30, 30)
│  ├ m_item     QLabel         ← 새로
│  └ (stretch)
└ movesLayout …
```

**값이 오는 길 — 세 값 모두 "목록에서 id가 같은 것 찾기"다**

| 칸 | 세이브의 값 | 찾을 목록 | 목록을 언제 가져오나 |
|---|---|---|---|
| 특성 | `member.abilityId` | `detail.abilities` (`AbilityEntry::abilityId`) | 루프 안 — 포켓몬마다 다르다(이미 받은 `detail`) |
| 성격 | `member.natureId` | `m_repository->natures()` (`Nature::id`) | **루프 밖 한 번** |
| 물건 | `member.itemId` (0 = 없음) | `m_repository->itemsForGeneration(generation, group)` (`ItemRow::id`) | **루프 밖 한 번** |

`natures()` · `itemsForGeneration()`은 DB를 읽는다. 루프 안에서 부르면 6번 읽는다 → 루프 **밖**에서 한 번 받아 두고,
루프 **안**에서는 받아 둔 목록만 뒤진다.

**물건 아이콘**은 A1과 같은 방식이다. 캐시만 종류가 다르다.

| # | 무엇을 | 어디서 | 언제 |
|---|---|---|---|
| ① | `SpriteCache *m_itemIcons` 멤버 + `new SpriteCache(SpriteCache::Kind::Item, this)` + `ready → fillCards` 연결 | `editorpage.h` · 생성자 | 한 번 |
| ② | `PartyCardView`에 `QString ability, nature, item;` `QPixmap itemIcon;` | `partycard.h` | — |
| ③ | `natures`, `items` 목록 받기 | `fillCards`, `for` **위** | 매번(채울 때) — 루프 밖 |
| ④ | 세 값 찾기 → `view.ability` · `view.nature` · `view.item` | `fillCards` 루프 안 | 매번 |
| ⑤ | 물건 아이콘: `key = ItemRowDelegate::iconKey(item.identifier, item.machineType, generation)` → A1과 같은 `path` / `request` | `fillCards` 루프 안 | 매번 |
| ⑥ | `infoRow`와 라벨 4개 만들기 | `PartyCard` 생성자 | 한 번 |
| ⑦ | 라벨 4개 채우기 / `setEmpty`에서 비우기 | `setMember` · `setEmpty` | 매번 |

**코드 모양 (성격 — 특성 · 물건도 같은 모양)**

```cpp
const QList<Nature> natures = m_repository->natures();       // ← 새로  for 위, 한 번
for (int i = 0; i < 6; ++i) {                                 // (그대로)
    ...
    for (const Nature &nature : natures)                      // ← 새로  for 안
        if (nature.id == member.natureId)
            view.nature = nature.name.text(/* ? */);          // 지금 언어
}
```

include: `"ui/items/itemrowdelegate.h"`(아이콘 키 함수만 쓴다 — 페이지가 아니라서 include해도 규칙 위반이 아니다).
참고 코드: [slotcard.cpp:39](../../src/ui/squad/slotcard.cpp#L39) `itemPixmap` — 물건 아이콘을 얻는 같은 순서.

**흔한 실수**

| 증상 | 원인 |
|---|---|
| 물건 없는 포켓몬에 엉뚱한 물건 | 루프를 돌 때 `view`를 루프 **밖**에 선언해서 앞 포켓몬 값이 남았다 — `PartyCardView view;`는 루프 안 첫 줄 |
| 특성이 비어 있다 | `abilityId`를 `natures`처럼 바꾸려 했다 — 특성 id는 이미 PokéAPI id(H2가 바꿔 둠), 그대로 비교 |

**✅ 완료 조건**: 6마리의 특성 · 성격 · 물건(아이콘 포함)이 게임 화면과 같다.

---

### 미션 A4 — 기술 칸에 타입 칩

**목적**: 기술 이름만으로는 어떤 타입을 견제하는지 안 보인다. A2에서 만든 칩을 다시 쓴다.

**기능**: `[풀] 그래스믹서   [노말] 성장` — 칸마다 칩 + 이름. 빈 칸은 둘 다 비움.

**위젯 트리 (바뀌는 부분)**

```
movesLayout (QGridLayout)
└ 칸 i (0–3): cell (QHBoxLayout)     ← 새로   movesLayout->addLayout(cell, i / 2, i % 2)
   ├ m_moveTypes[i] TypeChipWidget   ← 새로
   └ m_moves[i]     QLabel           (그대로 — addWidget 대상만 movesLayout → cell)
```

**`PartyCardView`의 기술 칸이 바뀐다**: 이름만 있던 `QStringList moves`를 이름 + 타입 쌍으로.

```cpp
struct PartyMoveView                  // ← 새로  PartyCardView 위
{
    QString name;
    QString type;                     // "grass" — 칩 색을 찾는 키. ??? 타입이면 빈 칸
};
// PartyCardView 안:  QList<PartyMoveView> moves;   (QStringList moves를 바꾼다)
```

**H9의 "기술마다 `moves()` 4번" 정리도 여기서 한다**: 0이 아닌 id를 먼저 모으고 **한 번** 부른다.

`member.moves`는 기술 칸 4개의 **기술 id**다. 빈 칸은 0이다 — 예) `{337, 225, 0, 0}` = 기술 2개.
아래 루프는 4칸을 하나씩 `moveId`에 꺼내서, **0이 아닌 칸(진짜 기술)만** `ids`에 모은다 → `{337, 225}`.
그다음 `moves()`를 한 번만 불러 이름 · 타입을 받는다.

```cpp
QList<int> ids;                                              // ← 새로
for (const int moveId : member.moves)                        // 지금 보는 칸의 기술 id: 337 → 225 → 0 → 0
    if (moveId != 0)                                         // 빈 칸(0)이 아니면
        ids.append(moveId);
for (const MoveEntry &move : m_repository->moves(ids, generation))
    view.moves.append({move.name.text(language), move.type});
```

| # | 무엇을 | 어디서 | 언제 |
|---|---|---|---|
| ① | `PartyMoveView` · `moves` 칸 바꾸기 | `partycard.h` | — |
| ② | 칸 4개를 `cell` 레이아웃(칩 + 라벨)으로 만들고 `m_moveTypes`에 담기 | `PartyCard` 생성자 | 한 번 |
| ③ | `i < view.moves.size()`면 칩 · 이름, 아니면 둘 다 비움 | `setMember` | 매번 |
| ④ | 위 코드 모양으로 `view.moves` 채우기 | `fillCards` | 매번 |

**✅ 완료 조건**: 기술 칸마다 타입 칩이 붙고, 기술이 3개인 포켓몬은 넷째 칸이 깨끗하게 빈다.

---

### 미션 A5 — 실능력치 6개

**목적**: 세이브만 아는 정보(H8) — 게임 '능력치 보기'의 숫자. 스쿼드의 구상 카드에는 없는, 에디터만의 값이다.

**기능**: `HP 168 · 공격 112 · 방어 90 · 특공 85 · 특방 95 · 스피드 100`.
(선택) 성격으로 오른 능력치는 빨강, 내린 능력치는 파랑.

**값이 오는 길**

```
member.stats[6]   DB 순서: [0] HP · [1] 공격 · [2] 방어 · [3] 특공 · [4] 특방 · [5] 스피드
                  (H2가 게임 순서 … 방어 · 스피드 · 특공 … 를 이 순서로 바꿔 두었다)
(선택) 성격 색:  Nature::increasedStat · decreasedStat = stats.id (2 공격 … 6 스피드)
                  → 칸 번호 = statId − 1     (같으면 무보정 — isNeutral())
```

| # | 무엇을 | 어디서 | 언제 |
|---|---|---|---|
| ① | `PartyCardView`에 `std::array<int, 6> stats {};` | `partycard.h` | — |
| ② | `statsRow` + 라벨 6개 → `QList<QLabel *> m_stats` | `PartyCard` 생성자 | 한 번 |
| ③ | `tr("HP %1")` · `tr("공격 %1")` …로 채우기 / `setEmpty`에서 비우기 | `setMember` · `setEmpty` | 매번 |
| ④ | `view.stats = member.stats;` | `fillCards` | 매번 |

**(선택) 성격 색 — QSS 동적 속성**

색을 C++에서 고르지 않고(하드코딩 금지) QSS에 맡긴다. 라벨에 "표시"만 달아 두면 QSS가 색을 고른다.

```cpp
label->setProperty("nature", QStringLiteral("up"));   // "up" · "down" · "" 중 하나
label->style()->unpolish(label);                       // 속성이 바뀐 뒤 QSS를 다시 입히라는 두 줄
label->style()->polish(label);
```
```css
QLabel[nature="up"]   { color: @red; }
QLabel[nature="down"] { color: @blue; }
```
이러면 `PartyCardView`에 "몇 번 칸이 오르고 내렸나"(예: `int natureUp = -1, natureDown = -1;`)도 넘겨야 한다.

**✅ 완료 조건**: 6마리 능력치가 게임 '능력치 보기'와 같다.

---

### 미션 A6 (선택) — 창이 낮으면 스크롤

카드가 길어져서 창 높이가 모자라면 카드가 눌리거나 잘린다. `loadedPage`를 `QScrollArea`에 넣는다(CSS `overflow: auto`).

```
m_body (QStackedWidget)
├ [0] empty
└ [1] scroll (QScrollArea)       ← 새로  setWidgetResizable(true) · setFrameShape(QFrame::NoFrame)
   └ loadedPage                         scroll->setWidget(loadedPage)  — body->addWidget(scroll)
```

참고 코드: [squadpage.cpp:180](../../src/ui/squad/squadpage.cpp#L180) 근처 — 스쿼드의 카드 · 분석 창이 한 장으로 스크롤된다.

---

### H10a 완료 조건

- [ ] 본인 세이브 둘(4세대 · 5세대)의 카드가 게임 화면과 같다: 이름 · 레벨 · 아이콘 · 타입 · 특성 · 성격 · 물건 · 기술(+타입) · 능력치
- [ ] 아이콘은 처음에 비어도 다시 열지 않고 저절로 나타난다
- [ ] 라이트 · 다크 · 좁은 창에서 겹치거나 잘리지 않는다
- [ ] (언어 연결을 했다면) 언어를 바꾸면 카드 글자가 그 언어로
- [ ] 테스트 183개 그대로 통과
- [ ] 새 `tr()` 문구가 있으면 말해 주기 → Claude가 `update_translations` · en/ja

### 막히면 붙여 넣을 것

1. 미션 번호(A0 … A6)
2. 지금 코드 — `git diff` 또는 해당 함수
3. 화면 스크린샷(그림이 있으면 커밋하지 않는다 — 진단용)

---

## H10b — 세이브 문서 (`SaveFile`)

> 커밋 footer `Refs: H10b`. **화면은 거의 바뀌지 않는 단계다.** 바뀌는 것은 에디터가 들고 있는 데이터의 모양이다.

### 왜 필요한가 (목적)

지금 에디터의 `m_loaded`는 `squadfile::Portable`이다. 이건 **스쿼드 파일(.pks)의 모양**이라, 세이브를 읽을 때
스쿼드에 필요 없는 것은 버린다([saveimport.cpp](../../src/data/store/saveimport.cpp) ④). H10c부터 세이브에 **쓰려면**
버린 것들이 필요하다.

```
세이브 파일 ─ saveimport::load ─▶ Portable (지금)              SaveFile (H10b 끝)
                                  ├ generation                  ├ generation · game
                                  ├ game                        ├ versionGroup        ← 쓰기 때 시리즈 표를 찾는 열쇠
                                  └ squad.members[6]            ├ partyOffset         ← 파티가 파일의 어디 있나
                                     └ 앱 id들(이름 찾기용)     ├ bytes               ← 파일 바이트 전부(원본 사본)
                                                                └ members[1–6]
                                  ✗ 버려짐: 원본 바이트 ·           ├ squad   = 앱 id들   (H10a 카드가 쓰는 것 — 그대로)
                                     PID · 개체값 · 노력치 ·         └ raw     = 게임 원본 값(PID · 개체값 · 노력치 ·
                                     게임 번호 · 알 · 위치                        게임 번호 · 알) — core의 ReadMember
```

**기능(사용자가 보는 것)**: B0–B4는 화면 변화가 없다(테스트로 확인한다). B5에서 에디터가 새 문서를 쓰도록 바꿔도 화면은
**H10a와 똑같아야** 한다. B6(선택)에서 처음으로 새 정보(개체값 · 노력치)가 카드에 보인다.

### 함수마다 맡는 일 (H10b 끝)

| 함수 | 맡는 일 | 언제 | 하지 않는 일 |
|---|---|---|---|
| `savefile::open(path, repository, &error)` | **파일 → SaveFile**: 읽기 · `readParty` · 버전 고르기 · 멤버마다 앱 id로 바꾸기 + 원본 값 보관 | 매번(세이브 열 때) | 화면을 모른다(data 레이어) |
| `saveimport::load(path, repository, &error)` | **SaveFile → Portable**: `open`을 부르고 결과를 스쿼드 모양으로 줄인다 | 테스트 · (나중에) 스쿼드로 옮길 때 | 파일을 직접 읽지 않는다 — `open`에 맡긴다 |
| `EditorPage::openFile(path)` | `savefile::open` 결과를 `m_loaded`에 담고 채우기 함수들을 부른다 | 매번(세이브 열 때) | 세이브 해석을 하지 않는다 |
| `EditorPage::fillCards()` | `m_loaded->members[i].squad`로 카드를 채운다(H10a와 같은 일) | 매번 | 파일을 읽지 않는다 |

### 새 파일 · 옮겨지는 코드

```
src/data/store/
├ savefile.h    ← 새로  SaveMember · SaveFile · savefile::open · dexOrder
├ savefile.cpp  ← 새로  open 본문 = saveimport::load의 ①–④를 옮겨 와서 "버리지 않게" 고친 것
├ saveimport.h      (그대로 — load 선언 · isSaveFile · versionOfOriginGame)
└ saveimport.cpp    load 본문이 짧아진다: open → Portable로 줄이기
tests/data/
└ savefile_test.cpp  ← 새로  B4
```

`src/data/CMakeLists.txt`의 `store/saveimport.cpp` 아래에 `store/savefile.h` · `store/savefile.cpp` 두 줄,
`tests/data/CMakeLists.txt`에 `savefile_test.cpp` 한 줄.

---

### 미션 B1 — 구조체 선언 (`savefile.h`)

**목적**: "세이브 한 개를 연 결과"를 담는 상자를 정한다. 아직 채우는 코드는 없다.

**코드 모양**

```cpp
#pragma once

#include "core/save/partyreader.h"   // save::ReadMember — data는 core를 include해도 된다(의존 방향 data → core)
#include "data/store/squad.h"        // SquadMember

#include <QByteArray>
#include <QList>
#include <QString>

#include <array>
#include <optional>

namespace com::yamada::studio {
class Repository;

// 세이브 파티의 한 마리. 같은 개체를 두 가지 말로 든다
struct SaveMember
{
    SquadMember squad;       // 앱 id로 바꾼 값 — 카드 · 이름 찾기가 쓴다(H10a의 fillCards가 보던 것)
    save::ReadMember raw;    // 게임이 저장한 원래 값 — PID · 개체값 · 노력치 · 게임 번호 · 알(쓰기의 재료)
};

// 세이브 파일 하나를 연 결과
struct SaveFile
{
    QString path;             // 연 파일
    QByteArray bytes;         // 파일 바이트 전부. 원본 파일은 건드리지 않고, 고칠 때는 이 사본을 고쳐 새 파일로 쓴다
    int generation = 0;       // 4 · 5
    QString versionGroup;     // "black-2-white-2" — H10c에서 시리즈 표(kNdsSeries)를 찾는 열쇠
    QString game;             // 버전 "white-2"
    std::size_t partyOffset = 0; // 첫 포켓몬이 파일에서 시작하는 위치(ReadParty::partyOffset)
    QList<SaveMember> members;   // 세이브의 파티 순서 그대로, 1–6마리. 알도 자리를 지킨다(squad는 빈 자리)
};

// 게임 순서(HP · 공격 · 방어 · 스피드 · 특공 · 특방) → 앱(DB) 순서(… 방어 · 특공 · 특방 · 스피드)
std::array<int, 6> dexOrder(const std::array<int, 6> &gameOrder);
} // namespace com::yamada::studio

namespace com::yamada::studio::savefile {
// 실패하면 std::nullopt — error에 사람이 읽을 한 줄
std::optional<SaveFile> open(const QString &path, Repository &repository,
                                 QString *error = nullptr);
} // namespace com::yamada::studio::savefile
```

| # | 무엇을 | 어디서 | 언제 |
|---|---|---|---|
| ① | 위 헤더 | `src/data/store/savefile.h` | — |
| ② | CMake 두 줄 | `src/data/CMakeLists.txt` | — |

**⚠ 같은 이름 주의**: `SaveMember::squad`(멤버 **한 마리**의 `SquadMember`) ≠ `Portable::squad`(**여섯 자리**를 담은 `Squad`).
이름이 같지만 모양이 다르다.

**✅ 완료 조건**: 빈 `savefile.cpp`(include 한 줄)로 빌드가 된다.

---

### 미션 B2 — `savefile::open` 본문

> **2026-10-21: B2 · B3 · B4는 Claude가 구현했다(사용자 요청).** 아래 표가 핵심을 빠뜨렸다 —
> 옛 `load`의 루프는 `Portable::squad.members`(**처음부터 6칸인 배열**, `squad.h`의 `Squad`)에 `[i]`로 써 넣었지만,
> `SaveFile::members`는 **처음엔 0칸인 목록**이고 `SaveMember::squad`는 **한 마리**(`SquadMember`)다.
> 그래서 루프 모양 자체가 "한 마리마다 `SaveMember`를 만들어 `append`"로 바뀐다. 결과 코드: `savefile.cpp`의
> `open` · `toSquadMember` · `chooseVersion`, `saveimport.cpp`의 `load`, `tests/data/savefile_test.cpp`.

**목적**: 세이브를 읽는 코드를 `saveimport::load`에서 이쪽으로 **옮긴다**. 옮기면서 "버리던 것"을 버리지 않게 고친다.

**어떻게**: [saveimport.cpp](../../src/data/store/saveimport.cpp)의 `load` 본문 ①–④를 복사해 와서 아래 표대로 고친다.
`load`의 ⑤(Portable 만들기)는 가져오지 않는다 — B3에서 `load`가 할 일이다.

| `load`의 단계 | `open`에서 바꿀 것 |
|---|---|
| ① 파일 → 바이트 | 그대로. 단 `file.readAll()`을 **`saveFile.bytes`에 담는다**(지역 변수 `raw` 대신) |
| ② 바이트 → 파티 | `save::Bytes`를 `saveFile.bytes`로 만든다. `saveFile.partyOffset = party->partyOffset;` · `saveFile.versionGroup = …`(이미 만드는 `versionGroup` 그대로) |
| ③ 버전 고르기 | 그대로. 결과를 `saveFile.game`에 |
| ④ 멤버 → SquadMember | 알을 `continue`로 **건너뛰지 않는다** — 알도 `SaveMember`를 하나 만들어 `raw`만 채우고 `squad`는 비워 둔다. 알이 아니면 지금 코드 그대로 `squad`를 채운다. 어느 쪽이든 `raw = member;`를 넣고 `saveFile.members.append(...)` |
| (능력치 순서) | `out.stats = {stats[0], stats[1], …}` 한 줄을 `dexOrder(member.stats)`로. `dexOrder` 본문은 이 순서 그대로 |

`isSaveFile` · `versionOfOriginGame` · `versionsOfGroup`(익명 namespace)은 `open`도 쓴다:
앞의 둘은 `#include "data/store/saveimport.h"`로 부르고, `versionsOfGroup`은 `savefile.cpp`로 **옮긴다**(B3 뒤에는
`load`가 쓰지 않는다).

**⚠ 수명 주의 (②)**: `save::Bytes`는 바이트를 **빌려 보는 창**(`std::span`)이라 원본이 살아 있어야 한다. 지금은
`saveFile.bytes`가 함수 끝까지 살아 있으니 괜찮다. 창을 만든 뒤 `saveFile.bytes`에 다른 값을 넣으면 창이 엉뚱한 곳을 본다 —
`bytes`를 다 채운 **뒤에** 창을 만든다.

**✅ 완료 조건**: 빌드가 된다(아직 아무도 `open`을 부르지 않는다 — B3 · B4에서 부른다).

---

### 미션 B3 — `saveimport::load`를 `open` 위에 다시 세우기

**목적**: 같은 일을 하는 코드를 두 군데 두지 않는다. `load`는 이제 "`open`의 결과를 스쿼드 모양으로 줄이기"만 한다.

**코드 모양**

```cpp
std::optional<squadfile::Portable> load(const QString &path, Repository &repository, QString *error)
{
    const std::optional<SaveFile> saveFile = savefile::open(path, repository, error);
    if (!saveFile)
        return std::nullopt;               // error는 open이 이미 채웠다
    squadfile::Portable portable;
    portable.generation = saveFile->generation;
    portable.game = saveFile->game;
    // members[i].squad → portable.squad.members[i]   (i는 0부터 members.size()와 6 중 작은 쪽까지)
    return portable;
}
```

| # | 무엇을 | 어디서 | 언제 |
|---|---|---|---|
| ① | `load` 본문을 위 모양으로 바꾸고, ①–④와 `versionsOfGroup`을 지운다 | `saveimport.cpp` | 매번(불릴 때) |
| ② | 테스트 돌리기 `ctest --preset linux-debug -R SaveImport` | 터미널 | — |

**이 미션의 핵심 = 테스트가 안전망이다.** `-R SaveImport`로 도는 테스트 11개는 "세이브 → Portable"의 결과를 확인한다(알은 빈 자리 · 버전
고르기 · 능력치 순서 …). 코드를 옮겼어도 **결과가 같으면** 11개가 그대로 통과한다. 하나라도 실패하면 옮기다 동작이 바뀐 것이다 —
실패 메시지가 무엇이 바뀌었는지 알려 준다.

**흔한 실수**

| 증상 | 원인 |
|---|---|
| `LeavesEggsOutOfTheSquad` 실패 | 알의 `squad`를 채웠다 — 알은 `raw`만 |
| `CarriesTheLevelAndStatsInDexOrder` 실패 | `dexOrder` 순서가 틀렸다(스피드가 게임 순서 넷째 → 앱 순서 여섯째) |
| 링크 에러 `undefined reference to savefile::open` | B1 ②의 CMake 줄이 빠졌다 |

**✅ 완료 조건**: 테스트 183개 그대로 통과.

---

### 미션 B4 — `SaveFile`만의 테스트 3개

**목적**: B3의 테스트는 `Portable`만 본다. **새로 들고 있게 된 것**(원본 바이트 · 원본 값 · 알 자리)은 아무도 확인하지 않으니 직접 확인한다.

**새 파일**: `tests/data/savefile_test.cpp`. 픽스처는 [saveimport_test.cpp](../../tests/data/saveimport_test.cpp)의
`SaveImportTest` 클래스(임시 폴더 · 픽스처 DB · `writeSave` · `member`)를 **복사해 이름만 `SaveFileTest`로** 바꿔 쓴다
(공용으로 빼는 건 H11 거리).

| 테스트 이름 | 만들 세이브 | 확인할 것 |
|---|---|---|
| `KeepsTheWholeFile` | Pt 세이브(`synth::buildSave`) 하나 | `saveFile->bytes.size()`가 파일 크기(`synth`가 만든 벡터 크기)와 같다 · 첫 바이트 몇 개가 같다 |
| `KeepsTheGameValues` | 개체값 · PID를 정한 멤버 하나(`MemberSpec::pid`, `iv32`) | `members[0].raw.pid`가 정한 PID · `raw.ivs[0]`(HP)가 정한 값 |
| `KeepsTheEggSlot` | 멤버 둘, 둘째가 알 — `egg.iv32 = 1u << 30;`(알 표시는 개체값 묶음의 비트 30, `LeavesEggsOutOfTheSquad`와 같다) | `members.size() == 2` · `members[1].raw.egg`가 참 · `members[1].squad.isEmpty()`가 참 |

`iv32`는 개체값 6개를 5비트씩 묶은 u32다(비트 0–4 = HP). HP 개체값 31만 넣으려면 `spec.iv32 = 31;`.

**✅ 완료 조건**: `ctest --preset linux-debug -R SaveFile` 3개 통과 · 전체 186개 통과.

---

### 미션 B5 — 에디터가 `SaveFile`를 쓰게

**목적**: 에디터의 데이터를 바꾼다. H10c부터 이 문서를 고치고 쓰게 된다.

**기능**: 화면은 H10a와 **똑같다**. 다른 게 보이면 옮기다 틀린 것이다.

| # | 무엇을 | 어디서 | 언제 |
|---|---|---|---|
| ① | `std::optional<squadfile::Portable> m_loaded` → `std::optional<SaveFile> m_loaded` · include를 `savefile.h`로 | `editorpage.h` | — |
| ② | `saveimport::load(...)` → `savefile::open(...)` | `openFile` | 매번(세이브 열 때) |
| ③ | 멤버 꺼내는 줄 바꾸기(아래) | `fillCards` | 매번 |
| ④ | 정보 줄의 마리 수: `m_loaded->squad.filled()` → 직접 세기(알이 아닌 멤버 수) | `fillCards` | 매번 |

**③ 멤버 꺼내기** — 지금은 `m_loaded->squad.members[i]`(6자리가 늘 있다)를 본다. 문서는 **파티 수만큼만**(1–6) 있다.

```cpp
for (int i = 0; i < 6; ++i) {
    // members는 파티 수만큼만 있다 — 그 뒤 자리 · 알은 빈 카드
    if (i >= m_loaded->members.size() || m_loaded->members[i].squad.isEmpty()) {   // ← 바꿈
        m_cards[i]->setEmpty();
        continue;
    }
    const SquadMember &member = m_loaded->members[i].squad;                          // ← 바꿈
    // 아래는 H10a 그대로
```

`m_loaded->generation` · `m_loaded->game`은 이름이 같아서 그대로 둔다.

**흔한 실수**

| 증상 | 원인 |
|---|---|
| 3마리 세이브를 열면 앱이 죽는다 | `members[i]`를 크기 확인 없이 꺼냈다 — `QList`는 범위 밖이면 죽는다(Debug에서 assert) |
| 정보 줄이 "6마리"로 나온다 | `members.size()`를 그대로 썼다 — 알도 센다 |

**✅ 완료 조건**: HGSS(3마리) · Pt · W2 세이브가 H10a 스크린샷과 같은 화면.

---

### 미션 B6 (선택) — 개체값 · 노력치를 카드에

**목적**: `raw`에 들어 있는 "세이브만 아는 값"을 처음으로 보여 준다. H10e(개체값 · 노력치 편집)의 자리를 미리 만든다.

**기능**(예): 능력치 줄 아래에 `개체값 31 · 20 · 15 · 31 · 8 · 25` / `노력치 252 · 0 · …`. 펼치기 버튼으로 숨길지는 직접 정한다.

**값이 오는 길**

```
m_loaded->members[i].raw.ivs   게임 순서(HP · 공격 · 방어 · 스피드 · 특공 · 특방)
      └ dexOrder(...)  ─▶ 앱 순서 ─▶ view.ivs ─▶ 카드 라벨      (능력치 줄과 같은 순서로 맞춘다)
m_loaded->members[i].raw.evs   (같은 길)
```

`PartyCardView`에 `std::array<int, 6> ivs {}, evs {};` → 카드에 라벨 줄 둘(만들기는 생성자, 채우기는 `setMember`,
비우기는 `setEmpty`) — H10a A5와 같은 순서다.

---

### H10b 완료 조건

- [ ] 테스트 186개 통과(기존 183 + B4의 3)
- [ ] 에디터 화면이 H10a와 같다(세 세이브)
- [ ] (B6을 했다면) 개체값 · 노력치가 게임 안 "능력 판정" / 노력치 확인 수단과 맞다
- [ ] 새 `tr()` 문구가 있으면 말해 주기 → 번역은 Claude
