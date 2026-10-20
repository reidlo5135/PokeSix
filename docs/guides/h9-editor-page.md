# H9 — [에디터] 페이지: 세이브는 여기서, 스쿼드는 구상만

> 브랜치: `feat/h9-editor-page` (Claude가 만들어 둠) · 커밋 footer `Refs: H9`
> 결정: [ADR 0021](../decisions/0021-editor-page-for-saves.md) (ADR 0018 결정 1 대체)
> 핸드오프에 없는 화면이다 — **배치 · 카드 모양 · 빈 상태는 직접 정한다.** 이 문서의 약도와 트리는 예시다

## 이번 가이드는 이렇게 읽는다

지난 가이드들과 다르게 **빈칸(`/* ? */`) 채우기가 아니다.** 미션마다 다음만 준다.

- **만들 것**: 화면에 무엇이 보이고 무엇이 동작해야 하는지
- **지킬 조건**: 어기면 진단 때 지적하는 규칙
- **참고 코드**: 같은 일을 이미 하고 있는 곳
- **완료 조건**: 눈으로 확인할 것

클래스를 어떻게 나눌지, 위젯을 어떻게 배치할지, 파일을 몇 개로 할지는 직접 정한다.
막히면 미션 번호와 지금 코드를 붙여 넣으면 된다. 정답이 하나인 미션은 없다.

## 목표

```
지금                                              H9 이후
┌─ 스쿼드 ──────────────────────────┐             ┌─ 스쿼드 ──────────┐   ┌─ 에디터 ─────────────────┐
│ 불러오기: .pks · .json · .sav     │             │ 불러오기: .pks만  │   │ 받기: .sav · .dsv         │
│ 끌어다 놓기: 같음                 │     →       │ 구상만 한다       │ ◀─│ 파티 6마리를 그대로 본다  │
│ → 구상과 현황이 서로 덮어쓴다      │             └──────────────────┘   │ [스쿼드로 보내기] ────────┘
└──────────────────────────────────┘                    (고를 때만 옮긴다)
```

세이브를 열어도 스쿼드는 그대로다. "스쿼드로 보내기"를 눌렀을 때만 지금의 불러오기처럼 옮겨진다.

## 먼저 읽을 것 (30분)

| 문서 | 왜 |
|---|---|
| [Drag and Drop](https://doc.qt.io/qt-6/dnd.html) — "Dropping" 절 | `setAcceptDrops` · `dragEnterEvent` · `dropEvent` 세 개가 짝이다 |
| [QStackedWidget](https://doc.qt.io/qt-6/qstackedwidget.html) | 빈 상태 ↔ 불러온 상태를 한 자리에서 바꿔 끼운다 |
| [QGridLayout](https://doc.qt.io/qt-6/qgridlayout.html) | 카드 6장을 3×2로 |
| [Signals & Slots](https://doc.qt.io/qt-6/signalsandslots.html) — "A Small Example" | 미션 4: 페이지끼리 말 걸기 |

ROS 2로 빗대면: 페이지는 노드, `MainWindow`는 launch 파일이다. 에디터 노드는 "보내 달라"를
publish만 하고, 스쿼드 노드가 그걸 subscribe하는지는 모른다. 둘을 잇는 건 launch 파일(`MainWindow`의
`connect`)이다. 그래서 에디터 파일에 `#include "ui/squad/squadpage.h"`가 들어가면 규칙 위반이다.

## 직접 정할 것 (시작 전에 메모해 두면 좋다)

| 결정 | 선택지 예 | Claude 추천 (참고만) |
|---|---|---|
| 탭 자리 | 스쿼드 뒤 · 설정 앞 / 맨 끝 | 스쿼드 바로 뒤 — "구상 → 현황"이 이어 보인다 |
| 탭 아이콘 | 직접 그린 SVG(24 격자 · 선 2.2 · `currentColor`) | 연필 · 플로피 · 게임기 중 하나 |
| 인트로 메뉴에도 넣을지 | 넣는다 / 안 넣는다 | 안 넣는다(메뉴 4줄 유지) — 나중에 |
| 세이브를 열면 앱 세대도 바꿀지 | 바꾼다 / 에디터 안에서만 그 세대로 보여 준다 | 안 바꾼다 — 보내기 때만 바뀐다(구상을 건드리지 않는다는 약속) |
| 스쿼드에 `.sav`를 끌어 놓으면 | 무시 / 안내 문구 / 에디터를 열어 거기서 연다 | 에디터로 넘겨 준다 — 사용자가 헤매지 않는다 |
| 카드에 보일 것 | 아이콘 · 이름 · 레벨 · 기술 4 · 물건 · 성격 · 능력치 … | 스쿼드 카드보다 "숫자"가 많은 쪽 — 현황이니까 |

## 지킬 조건 (모든 미션 공통)

1. **에디터는 `ui/editor/` 아래 새 파일로.** 네임스페이스 `com::yamada::studio`, 파일명은 클래스명 소문자
2. **새 `.cpp`는 `src/ui/CMakeLists.txt`의 소스 목록에 더한다.** 빠지면 moc가 안 돌아 링크 에러가 난다
3. **색 · 글꼴은 토큰에서만**: `tok::palette().x`, `theme::font(…)`. `QColor("#…")`, 숫자 색 금지
4. **보이는 글자는 `tr()`**, 한국어 해요체. 다 쓰면 `update_translations` 타깃을 돌린다(en/ja는 Claude가 채운다)
5. **`connect`는 함수 포인터 문법만**(`&EditorPage::…`). `SIGNAL()` 문자열 금지
6. **세이브 읽기는 이미 있는 함수로**: `saveimport::load(path, repository, &error)`. core · data 쪽은 고치지 않는다
7. **에디터는 세이브에 쓰지 않는다**(H10 전까지). 스쿼드 저장소(`SquadStore`)도 직접 만지지 않는다
8. **페이지끼리 include하지 않는다.** 서로 잇는 건 `MainWindow`에서만

## 참고 코드 지도

| 하고 싶은 것 | 이미 하고 있는 곳 |
|---|---|
| 페이지를 앱 막대에 등록 | `src/ui/shell/page.h` · `mainwindow.cpp`(`m_pages->addWidget` · 단축키 루프) · `apptabbar.cpp`(`kTabs` · `labels`) |
| `--screenshot editor` 이름 | `src/app/application.cpp`의 `kScreens` |
| 끌어다 놓기 + 안내 덮개 | `SquadPage::dragEnterEvent` · `dropEvent`(`src/ui/squad/squadpage.cpp`), `DropOverlay`(`src/ui/squad/dropoverlay.h`) |
| 열기 대화상자 | `SquadPage::importSquad` — `QFileDialog::getOpenFileName` |
| 세이브 → 파티 | `saveimport::load` → `squadfile::Portable { generation, game, squad }` (`src/data/store/saveimport.h`) |
| 이름 찾기 | 포켓몬 `Repository::pokemonDetail(id, gen, versionGroup).name`, 기술 `Repository::moves(ids, gen)`, 성격 `Repository::natures()`, 물건 `Repository::itemsForGeneration(gen)` |
| 게임 → 버전 묶음 | `Repository::resolveVersion` · `gamesForGeneration` + `versionGroupOf`(`repository.h`) |
| 포켓몬 아이콘 | `SpriteCache(SpriteCache::Kind::PokemonIcon)` — `path(key)`가 비면 `request(key)`, `ready` 시그널 뒤 다시 그리기 (`src/data/sprites/spritecache.h` 맨 위 주석) |
| 창 모양(먹선 · 그림자 · 머리 띠) | `PanelFrame`(`src/ui/widgets/panelframe.h`), 버튼 `ShadowButton`(`src/ui/widgets/shadowbutton.h` — Qt가 아니라 이 저장소의 위젯, include 필요) · 보통 버튼 `QPushButton`(app.qss가 꾸민다) |
| 타입 칩 | `typechip::paint`(`src/ui/widgets/typechip.h`) |
| 능력치 레이더 | `StatRadar`(`src/ui/dex/statradar.h`) — `setTrainedStats`로 파랑 겹치기 |

---

## 미션 1 — 빈 [에디터] 탭이 앱 막대에 뜬다

**만들 것**

```
┌───────────────────────────────────────────────────────────────────────────┐
│ ◉ POKESIX  [도감][아이템][타운맵][스쿼드][에디터][설정]    ☀☾🖥  [GEN 4 ▾] │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│                         에디터 — 준비 중이에요                              │  ← 일단 이것만
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

- `EditorPage` 클래스(빈 `QWidget` + 가운데 글자 하나면 충분)
- 탭을 누르거나 Ctrl+숫자로 열린다. 다른 탭들도 지금처럼 열린다

**힌트** — 등록하는 곳은 다섯 군데이고, 순서가 서로 맞아야 한다.

1. `page.h`의 `enum class Page`에 값 추가 — **이 순서 = `m_pages`의 인덱스 = 탭 순서**
2. `mainwindow.cpp`에서 `m_pages->addWidget`을 같은 순서 자리에
3. `apptabbar.cpp`의 `kTabs`(아이콘)와 `labels`(글자) 두 배열에 같은 자리로
4. `mainwindow.cpp` 단축키: `pages[]` 배열과 `for (int i = 0; i < 5; ++i)`의 **5**
5. `application.cpp`의 `kScreens`에 `{"editor", Page::…}`

**지킬 조건**: 위 공통 조건 + 기존 탭이 엉뚱한 페이지를 열면 안 된다.

**✅ 완료 조건**

- 앱 막대에 탭 6개, 에디터 탭에 직접 고른 아이콘
- 탭 6개를 하나씩 눌러 각각 맞는 페이지가 열린다 (순서가 어긋나면 여기서 들킨다)
- `scripts/linux/run.sh -- --screenshot editor 1440x900 /tmp/editor.png`가 에디터를 찍는다

## 미션 2 — 세이브를 받는다 (끌어다 놓기 · 열기)

**만들 것**

```
빈 상태                                                불러온 상태
┌─ 에디터 ─────────────────────── [세이브 열기] ┐      ┌─ 에디터 ─────────── [세이브 열기] ┐
│                                              │      │ 포켓몬스터 소울실버(K).sav         │
│   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐       │      │ 소울실버 · 4세대 · 6마리            │
│     세이브 파일을 여기에 끌어다 놓아요         │  →   │                                   │
│   │ .sav · .dsv                        │       │      │ (미션 3에서 카드 6장)               │
│   └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘       │      │                                   │
└──────────────────────────────────────────────┘      └───────────────────────────────────┘
```

- 끌어다 놓기: `.sav` · `.dsv` 하나일 때만 받는다(스쿼드와 같은 규칙)
- [세이브 열기] 버튼: 열기 대화상자, 필터는 게임 세이브만
- 성공하면 파일 이름 · 게임 · 세대 · 마릿수를 보여 준다. 실패하면 `error` 문구를 경고 창으로

**위젯 트리 (예시 — 바꿔도 된다)**

```
EditorPage (QWidget, setAcceptDrops(true))
└── QVBoxLayout
    ├── 머리 줄 (QHBoxLayout): 제목 QLabel · stretch · [세이브 열기] ShadowButton
    └── QStackedWidget m_body
        ├── [0] 빈 상태: 점선 안내 상자
        └── [1] 불러온 상태: 파일 정보 줄 (+ 미션 3의 카드 자리)
```

**힌트**

- 불러온 결과(`squadfile::Portable`)와 파일 경로는 **멤버로 들고 있어야** 미션 3 · 4에서 쓴다.
  "아직 안 불러옴"을 표현하려면 `std::optional`이 어울린다(H8에서 써 봤다)
- `dropEvent`에서 바로 경고 창을 띄우면 파일 관리자가 멈춘다. 스쿼드가 `QTimer::singleShot(0, …)`으로
  미루는 이유가 `SquadPage::dropEvent` 주석에 있다
- 게임 이름(소울실버)은 `Portable::game`(버전 identifier)을 `gamesForGeneration`의 `versionNames`에서 찾으면 나온다
- 안내 덮개를 쓰고 싶으면 `DropOverlay`를 그대로 쓸 수 있지만 문구가 스쿼드용이다. 문구를 생성자로 받게 바꿀지,
  에디터 전용 그리기를 할지는 선택

**✅ 완료 조건**

- 본인 소울실버(또는 Pt · 화이트) 세이브를 끌어다 놓으면 정보 줄이 바뀐다
- `.pks` · `.txt`를 끌어 오면 커서가 "안 됨" 모양이고, 놓아도 아무 일 없다
- 세이브가 아닌 `.sav`(빈 파일 등)를 열면 경고 창에 이유 한 줄
- 열어도 **스쿼드 탭은 그대로**(세대 버튼도 그대로 — 직접 정한 결정대로)

## 미션 3 — 파티 6마리를 본다

**만들 것**: 불러온 상태에 카드 6장. 카드 모양과 담을 값은 직접 정한다.

```
예시 (3×2)
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ [아이콘] 메가니움 │ │ [아이콘] 리자몽   │ │ …                 │
│ Lv 52 · 고집      │ │ Lv 50 · 조심      │ │                   │
│ 물건: 기적의씨    │ │ 물건: 목탄        │ │                   │
│ ─────────────── │ │ ─────────────── │ │                   │
│ 잎날가르기 · 지진 │ │ 화염방사 · …      │ │                   │
│ HP 168 공 112 …   │ │ HP 153 …          │ │                   │
└───────────────────┘ └───────────────────┘ └───────────────────┘
```

**카드에 쓸 수 있는 값** — 전부 `Portable::squad.members[i]`(`SquadMember`, `src/data/store/squad.h`)에 있다.

| 값 | 필드 | 이름으로 바꾸려면 |
|---|---|---|
| 포켓몬 | `pokemonId` | `pokemonDetail(id, gen, versionGroup).name` (타입 · 종족값도 같이 온다) |
| 레벨 · 인게임 능력치 | `level` · `stats`(HP · 공격 · 방어 · 특공 · 특방 · 스피드) | 숫자 그대로 |
| 기술 4 | `moves` (0 = 빈 칸) | `moves(ids, gen)` |
| 성격 | `natureId` | `natures()`에서 id로 |
| 물건 | `itemId` (0 = 없음) | `itemsForGeneration(gen)`에서 id로 |
| 특성 | `abilityId` | `pokemonDetail(…).abilities`에서 id로 |

**지킬 조건**

- 이름 조회는 **세이브의 세대 · 게임 기준**(`Portable::generation` · `game`)이다. 앱이 지금 3세대여도 4세대 세이브는 4세대 이름으로
- 빈 자리(`isEmpty()`)는 카드를 숨기거나 "빈 자리"로 — 파티가 3마리인 세이브도 있다
- 카드 하나는 위젯 하나로(예: `PartyCard`). 카드가 Repository를 직접 부르지 않고, **페이지가 조회해서 카드에 값을 넘기는 쪽**이 테스트 · 재사용에 낫다(`ItemDetailPane` 주석의 "조회는 ItemsPage가 한다 — 여기는 받은 것을 그리기만"과 같은 원칙)

**✅ 완료 조건**

- 본인 세이브의 6마리가 게임 화면의 순서 · 레벨 · 기술과 같다
- 라이트 · 다크 둘 다에서 글자가 읽힌다(테마 스위치로 바로 확인)
- 창을 좁혀도 카드가 겹치거나 잘리지 않는다

## 미션 4 — [스쿼드로 보내기] (하지 않음)

> **2026-10-20 사용자 결정으로 뺐다**: "에디터는 그냥 에디터" — [ADR 0021](../decisions/0021-editor-page-for-saves.md) 결정 3 개정.
> 아래는 나중에 되살릴 때를 위한 기록이다. H9 완료 조건에서 빠진다.


**만들 것**: 불러온 상태에 [스쿼드로 보내기] 버튼. 누르면 지금의 스쿼드 불러오기와 같은 일이 일어나고
스쿼드 탭이 열린다.

```
EditorPage ──sendToSquadRequested(Portable)──▶ MainWindow ──▶ SquadPage::(받는 함수)(Portable)
                                                    └──▶ open(Page::Squad)
```

**힌트**

- 받는 쪽은 이미 거의 있다. `SquadPage::importFile(path)`의 **뒷부분**(덮어쓰기 확인 → 세대 · 게임 전환 →
  `replaceSquad` → 상태 글자)이 바로 "Portable을 받아 적용하기"다. 앞부분은 "파일 → Portable"이다.
  이 함수를 **둘로 나눠서** 뒷부분을 public으로 열면, 파일 불러오기와 에디터 보내기가 같은 코드를 쓴다
- 시그널 인자로 구조체를 넘겨도 된다(같은 스레드의 직접 연결이라 복사만 일어난다). `const squadfile::Portable &`로
- 확인 창에서 "아니요"를 고르면 스쿼드 탭으로 넘어가지 않는 게 자연스럽다. 그러려면 받는 함수가 "적용했나"를
  돌려줘야 한다(`bool`) — 이것도 직접 정할 것

> 이 미션은 Claude가 짠 `squadpage.cpp`를 고친다. 함수 나누기가 부담스러우면 "미션 4의 SquadPage 쪽은 네가 해"라고
> 하면 받는 함수만 만들어 둔다. 시그널 · 버튼 · `MainWindow` 연결은 직접 한다.

**✅ 완료 조건**

- 보내기 → 덮어쓰기 확인 → 예 → 스쿼드 탭에 그 파티(레벨 · 파랑 능력치까지 H8 그대로)
- 아니요 → 아무것도 안 바뀌고 에디터에 머문다
- 세이브의 세대가 지금과 달라도(3세대 화면에서 4세대 세이브 보내기) 세대 · 게임이 맞게 바뀐다

## 미션 5 — 스쿼드에서 `.sav`를 뺀다

**만들 것**: 스쿼드 페이지가 더는 세이브를 받지 않는다. 사람들이 헤매지 않게 처리한다.

바꿀 곳 (전부 `src/ui/squad/`):

1. `SquadPage::dragEnterEvent`의 `kAccepted`
2. `SquadPage::importSquad`의 대화상자 필터
3. `DropOverlay`의 둘째 줄 문구(".sav"를 말하고 있다)
4. `SquadPage::importFile`에서 `saveimport` 갈래 — 에디터만 쓰게 되면 지운다
5. 스쿼드에 `.sav`를 끌어 놓았을 때의 동작 — "직접 정할 것" 표에서 고른 대로

에디터로 넘겨 주기로 했다면 미션 4의 반대 방향이다: 스쿼드가 "이 파일은 에디터에서 열어 달라"는 시그널을 내고
`MainWindow`가 에디터에 잇는다.

**✅ 완료 조건**

- 스쿼드의 [불러오기] 대화상자에 세이브 형식이 없다
- 스쿼드에 `.sav`를 끌어 오면 정한 대로 동작한다
- `.pks` 불러오기 · 내보내기는 예전과 똑같다
- 테스트 183개 그대로 통과 (`scripts/linux/build.sh`)

---

## 흔한 문제와 원인

| 증상 | 원인 |
|---|---|
| 링크 에러 `undefined reference to vtable for EditorPage` | 새 `.cpp`를 `src/ui/CMakeLists.txt`에 안 넣음 → moc가 안 돈다 |
| 탭을 눌렀는데 다른 페이지가 열림 | `Page` 순서 ≠ `addWidget` 순서 ≠ `kTabs` 순서 |
| Ctrl+6이 안 됨 | 단축키 루프의 `i < 5`를 안 고침 |
| 파일을 끌어 와도 금지 커서 | `setAcceptDrops(true)` 빠짐, 또는 `dragEnterEvent`에서 `acceptProposedAction()`을 안 부름 — enter에서 받아야 drop이 온다 |
| 놓으면 파일 관리자가 경고 창이 닫힐 때까지 멈춤 | `dropEvent` 안에서 바로 `QMessageBox` — `QTimer::singleShot(0, …)`으로 미룬다 |
| 아이콘이 안 나오다가 탭을 옮기면 나옴 | `SpriteCache::ready`를 받아 다시 그리지(`update()`) 않음 |
| 다크에서 카드 글자가 안 보임 | `QColor(Qt::black)` 같은 고정 색 — `tok::palette().text1` 등으로 |
| 에디터에서 연 세이브가 스쿼드를 바꿔 버림 | 미션 2에서 `SquadPage`처럼 `replaceSquad`까지 따라 함 — 에디터는 들고만 있는다 |

## 완료 조건 (H9 전체)

- [ ] 미션 1 · 2 · 3 · 5의 완료 조건 (미션 4는 뺐다)
- [ ] `update_translations` 돌림
- [ ] 라이트 · 다크에서 에디터를 눈으로 확인(테마 스위치). 캡처는 진단용이라 커밋하지 않는다

## 끝나면 붙여넣어 줄 것

미션마다 진단을 받아도 되고, 한 번에 받아도 된다.

1. `git diff main...feat/h9-editor-page`
2. 에디터 화면 스크린샷(빈 상태 · 불러온 상태)

→ 진단을 통과하면 Claude가 커밋 · merge · CHANGELOG. 새 화면이라 **v0.6.0(MINOR)** 후보다.
그다음은 H10(편집 · 쓰기) 범위 정하기다.
