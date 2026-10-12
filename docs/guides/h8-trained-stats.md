# H8 — 불러온 개체의 레벨 · 인게임 능력치

> 학습 루프 ① 가이드. 브랜치: `feat/h8-trained-stats` (Claude가 만들어 둠)
> 뼈대 · 테스트는 준비돼 있다. **`// TODO(H8-CPn-m)`만 채우면 된다.** 빈칸이 있어도 빌드된다.
> 앞 단계: [H2](h2-squad-sav-import.md)(세이브 → 스쿼드) · [H6](h6-multigen-save.md)(4 · 5세대)

## 무엇을 만드나

세이브에서 불러온 포켓몬은 게임 속 그 개체의 **레벨**과 **능력치**를 알고 있다. 지금은 그걸 버리고 있다. H8은 그 두 값을 화면까지 가져온다.

```
스쿼드 카드                                   [+] 상세 → 종족값 레이더
┌─────────────────────────────┐                      HP
│ 01 🦇 프테라  LV.48   ⇄ 🗑 + │                     80 · 151
└─────────────────────────────┘             특공 ╱‾‾‾‾‾╲ 공격 ▲
     ↑ 새로: 이름 옆에 레벨                    60 │ ◆◆◆ │ 105
                                             75 │ ◆◆  │ 139      빨강 = 종족값(종마다 고정)
                                                 ╲_____╱          파랑 = 이 개체의 능력치(새로)
                                                  스피드
                                                130 · 152
```

**손으로 넣은 포켓몬은 지금과 똑같다.** 레벨도 파랑도 없다 — 그 값은 세이브에서 온 개체만 안다.

### 종족값과 능력치는 다른 숫자다

| | 종족값 (빨강) | 능력치 (파랑) |
|---|---|---|
| 무엇 | 종마다 정해진 값. 프테라는 누가 키워도 공격 105 | 게임 속 "능력치 보기"에 나오는 숫자 |
| 바뀌나 | 안 바뀐다 | 레벨 · 개체값 · 노력치(도핑) · 성격으로 바뀐다 |
| 어디서 | DB(PokéAPI) | **세이브** — 게임이 계산해서 저장해 둔 값(`0x90–0x9B`) |

그래서 파랑을 직접 계산하지 않는다. **게임이 적어 둔 걸 읽기만 한다.** (공식은 [pk4.md](../data/gen4/pk4.md#능력치-공식-3세대-이후)에 있고, 실파일로 저장값과 같은 걸 확인했다 — 전투 시뮬을 할 때 쓴다.)

레벨 50 근처에서는 능력치가 "종족값 + 수십"이라 두 도형이 비슷한 크기로 겹친다. 레벨이 높으면 파랑이 훨씬 커지고, 200을 넘으면 레이더 눈금이 늘어난다 — 정상이다.

## 값이 흘러가는 길

```
  ① core               ② data                                    ③ ui
  세이브 바이트  ──▶  ReadMember.stats  ──▶  SquadMember.level · stats  ──▶  카드 제목 "LV.48"
  0x90 u16 × 6        (게임 순서)            (DB 순서, squads.json에 저장)   상세 레이더 파랑
     CP1                                 CP2                              CP3 · CP4
```

| | 체크포인트 | 파일 | 배우는 것 |
|---|---|---|---|
| ⬜ | **CP1 저장된 능력치 읽기** | `src/core/save/partyreader.cpp` | (H1 복습) 같은 모양 칸 여러 개 읽기 |
| ⬜ | **CP2 스쿼드에 싣기 · 저장하기** | `squadstore.cpp` · `saveimport.cpp` | "모름"을 표현하는 법, JSON 하위 호환, 레이어 경계의 순서 변환 |
| ⬜ | **CP3 카드에 레벨** | `src/ui/squad/slotcard.cpp` | 글자 폭 재기(`QFontMetrics`), 줄임표와 자리 나누기 |
| ⬜ | **CP4 레이더에 파랑** | `statradar.cpp` · `dexdetailpage.cpp` · `squadpage.cpp` | `std::optional`로 "있을 때만", 그리는 순서, 위젯 사이 데이터 넘기기 |

지금 상태: 새 테스트 4개가 빨강. CP3 · CP4는 화면이라 테스트가 없다 — 앱을 띄워 눈으로 확인한다.

```bash
cmake --build --preset linux-debug
ctest --preset linux-debug -R "PartyReader.ReadsTheStoredStats|SquadStore|SaveImportTest.Carries" --output-on-failure
```

---

## CP1 — 저장된 능력치 읽기 (`partyreader.cpp`)

### 아이디어

파티 포켓몬의 배틀 스탯 영역(H1에서 PID로 푼 그 영역)에는 레벨 · 현재 HP 뒤에 **능력치 6개**가 u16으로 줄지어 있다. 지금 `parseMember`는 그중 최대 HP(`0x90`) 하나만 읽는다. 나머지 다섯을 같이 읽어 `ReadMember::stats`에 담는다.

```
0x8C  레벨 u8
0x8E  현재 HP u16
0x90  최대 HP │ 0x92 공격 │ 0x94 방어 │ 0x96 스피드 │ 0x98 특공 │ 0x9A 특방     ← u16 × 6
```

**순서 주의**: 게임은 **스피드가 넷째**다(HP · 공격 · 방어 · 스피드 · 특공 · 특방). 개체값 · 노력치도 같은 게임 순서다. 여기서는 순서를 바꾸지 않고 **읽은 그대로** 담는다 — 바꾸는 건 CP2의 일이다.

5세대(PK5, 220바이트)도 이 영역의 자리가 같아서 따로 할 일이 없다.

### 시작 코드

바로 위의 기술 4개 읽기와 같은 모양이다. 칸이 2바이트씩이니 위치는 `0x90 + 2 * k`.

```cpp
for (int k = 0; k < 6; ++k)
    member.stats[k] = /* ? */;
```

### 확인

```bash
ctest --preset linux-debug -R "PartyReader.ReadsTheStoredStats" --output-on-failure   # 2개 초록
```

실파일로도 보자 — 6마리의 능력치가 찍히고, 첫 칸이 최대 HP와 같은지 테스트가 확인한다.

```bash
POKESIX_SAVE_HGSS="$HOME/pokesix-saves/포켓몬스터 소울실버(K).sav" \
    ctest --preset linux-debug -R RealSave.HeartGold -V | grep stats
#   stats 151 139 88 152 75 74 (HP 공격 방어 스피드 특공 특방)     ← 프테라 Lv.48
```

게임에서 프테라의 "능력치 보기"를 열면 같은 숫자다.

---

## CP2 — 스쿼드에 싣기 · 저장하기

`SquadMember`에 두 칸이 생겼다(`squad.h`, 완성):

```cpp
int level = 0;               // 0 = 모름(손으로 넣은 개체)
std::array<int, 6> stats {}; // 인게임 능력치, DB 순서
bool hasStats() const { return level > 0; }
```

### 아이디어 ① — "모름"은 0으로

손으로 넣은 포켓몬은 레벨을 모른다. "모름"을 표현하는 방법은 두 가지다:

- `std::optional<int> level` — 타입이 "없을 수 있음"을 말해 준다(H6에서 쓴 그것)
- `int level = 0` + 약속 — "레벨 0인 포켓몬은 없으니 0 = 모름"

여기서는 **0을 골랐다.** 레벨에는 0이 실제로 없어서 헷갈릴 일이 없고, `SquadMember`가 지금처럼 "기본값이 곧 빈 상태"인 단순한 구조체로 남는다(JSON에서도 숫자 하나). 대신 그 약속을 `hasStats()` 한 곳에 이름 붙여 둬서, 쓰는 쪽이 `level > 0`을 여기저기 쓰지 않게 했다.

> 덤: 스쿼드에서 포켓몬을 다른 종으로 바꾸면 `SquadSession::setPokemon`이 `SquadMember`를 **새로 만들어** 끼운다. 그래서 레벨 · 능력치는 저절로 0으로 돌아간다 — 바뀐 종에 옛 개체의 능력치가 남는 일이 없다. 따로 코드를 쓸 필요가 없는 이유다.

### 아이디어 ② — 옛 파일과 사이좋게 (`squadstore.cpp`)

스쿼드는 `squads.json`에 저장된다(스쿼드 파일 `.pks`도 같은 함수를 쓴다). 두 가지를 지킨다:

- **쓸 때**: 아는 값만 쓴다. `hasStats()`가 아니면 `"level"` · `"stats"` 키를 **아예 넣지 않는다.** 손으로 만든 스쿼드의 파일이 지금과 똑같이 깨끗하게 남는다
- **읽을 때**: 키가 없으면 → `QJsonValue::toInt()`가 0을 준다 → level 0 = 모름. **H8 전에 저장한 파일도 분기 없이 그대로 읽힌다**

ROS 2로 치면 메시지에 필드를 더하면서 옛 bag도 읽히게 하는 것과 같다 — 여기서는 "없으면 0"이라는 JSON의 기본값이 그 일을 해 준다.

**시작 코드** (`memberToJson`) — 지금 바로 `return {…};` 하는 것을 변수로 받아 두고, 조건부로 더한다:

```cpp
QJsonObject json { /* 지금 return에 있는 그 목록 그대로 */ };
if (m.hasStats()) {
    json.insert(QStringLiteral("level"), m.level);
    // stats는 정수 배열 — 위의 moves를 QJsonArray로 만든 요령 그대로
}
return json;
```

`memberFromJson`은 거꾸로: `"level"`은 `toInt()`, `"stats"`는 `toArray()` 후 `moves` 읽는 반복문과 같은 모양.

### 아이디어 ③ — 순서는 경계에서 바꾼다 (`saveimport.cpp`)

core는 **게임 순서**(스피드가 넷째)로 읽었다. 앱의 나머지(DB · 레이더 · 종족값)는 **DB 순서**(스피드가 맨 뒤)다. 바꾸는 곳은 둘이 만나는 **data 레이어의 경계** — H2에서 게임 번호를 DB id로 바꾼 바로 그 자리(CLAUDE.md §4)다.

```
게임 순서   [0]HP  [1]공격  [2]방어  [3]스피드  [4]특공  [5]특방
                │       │        │          ╲        │        │
DB 순서     [0]HP  [1]공격  [2]방어  [3]특공   [4]특방  [5]스피드
```

앞 셋은 그대로, 스피드만 맨 뒤로 간다.

**시작 코드**:

```cpp
out.level = member.level;
const auto &g = member.stats;            // 게임 순서
out.stats = {g[0], g[1], g[2], /* ? */}; // DB 순서
```

### 확인

```bash
ctest --preset linux-debug -R "SquadStore|SaveImportTest.Carries" --output-on-failure
```

- `SquadStore.RoundTripsLevelAndStats` — 저장했다 다시 읽으면 같다
- `SquadStore.LeavesOutStatsTheMemberDoesNotHave` — 모르는 값은 파일에 안 쓴다
- `SquadStore.ReadsAFileSavedBeforeStats` — 옛 파일은 level 0
- `SaveImportTest.CarriesTheLevelAndStatsInDexOrder` — 스피드 152가 맨 뒤로 갔나

---

## CP3 — 카드에 레벨 (`slotcard.cpp`)

### 아이디어

카드 머리는 `paintEvent`가 왼쪽부터 x를 옮겨 가며 그린다: `[▶] 01 [아이콘] 이름 …… ⇄ 🗑 +`. 이름은 칸이 모자라면 **줄임표(…)로 잘린다**(`elidedText`). 그 바로 뒤에 레벨을 붙이려면 순서가 중요하다:

1. **레벨 글자의 폭을 먼저 잰다** — `QFontMetrics(글꼴).horizontalAdvance(글자)`
2. 이름에 줄 수 있는 폭에서 그만큼(+ 사이 간격) **뺀 폭으로** 이름을 줄인다
3. 이름을 그리고, **실제로 그려진 이름의 폭**만큼 x를 옮겨 레벨을 그린다

2를 빼먹으면 긴 이름("메가니움 …")일 때 이름이 레벨 자리까지 차지해서 둘이 겹친다. 3에서 "칸 폭"이 아니라 "그려진 이름 폭"을 쓰는 이유: 짧은 이름("왕구리") 뒤에 레벨이 바로 붙어야 한다.

### 알아 둘 것

- `QFontMetrics`는 **글꼴마다** 따로 만든다 — 이름(도현 19)과 레벨(도트 11)은 글꼴이 달라 폭을 재는 측정기도 다르다
- 레벨 글꼴은 번호 "01"과 같은 도트 글꼴(`theme::kFamilyPixel`, 11). 이 글꼴은 **대문자만** 있어서 `Lv.48`이 `LV.48`로 그려진다 — 게임 화면 느낌이라 그대로 둔다
- 글자 색은 머리의 다른 글자와 같은 `headerText`(타입 색 위에서 읽히는 색이 이미 골라져 있다)

### 시작 코드

```cpp
const SquadMember &member = m_session->member(m_slot);
const QString level = member.hasStats() ? QStringLiteral("Lv.%1").arg(member.level) : QString();
const QFont levelFont = theme::font(theme::kFamilyPixel, 11);
// ① 폭 재기 → ② 줄인 이름 → ③ 이름 뒤에 레벨
```

### 확인

이미 저장된 스쿼드에는 레벨이 없다(H8 전에 불러왔으니까). **세이브를 다시 불러온다**:

```bash
scripts/linux/run.sh
# 스쿼드 → [불러오기] → 소울실버 세이브(또는 끌어다 놓기) → 덮어쓰기 확인
```

여섯 카드 머리에 `LV.48 · LV.56 · LV.56 · LV.49 · LV.50 · LV.54`. 손으로 바꾼 자리(종을 다른 걸로)는 레벨이 사라져야 한다. 창을 좁혀서 이름이 잘릴 때 레벨과 겹치지 않는지도 본다.

---

## CP4 — 레이더에 파랑

세 파일이 한 줄로 이어진다:

```
SquadPage::showMemberDetail          DexDetailPage                         StatRadar
  "이 자리 개체가 hasStats()면"  ──▶  setTrainedStats(pokemonId, stats)  ──▶  setTrainedStats(stats 또는 nullopt)
  성격도                          ──▶  presetNature(natureId)                  paintEvent: 파랑 도형 · 숫자 · 눈금
```

### ① `StatRadar` — 그리는 쪽 (`statradar.cpp`)

**아이디어 — "있을 때만"은 `std::optional`로.** 레이더는 파랑이 있을 수도 없을 수도 있다. `std::optional<std::array<int, 6>> m_trained`가 그걸 타입으로 말해 준다. `setTrainedStats(std::nullopt)`이 "지우기"다(H6 CP4에서 `PkmFormat::natureAt`에 쓴 그 모양).

| TODO | 할 일 | 실마리 |
|---|---|---|
| CP4-1 `setTrainedStats` | 담고 다시 그리기 요청 | 바로 위 `setStats`와 같은 두 줄 |
| CP4-2 `scaleMax` | 파랑의 최댓값이 200을 넘으면 그걸 덮는 50의 배수 | 최댓값은 `std::ranges::max(*m_trained)`(`#include <algorithm>`). "50의 배수로 올림"은 정수 나눗셈 한 번으로 된다 — 231 → 250, 250 → 250, 251 → 300이 되는 식을 찾아보자 |
| CP4-3 파랑 도형 | 점 6개 → 채움 · 선 | 바로 아래 "종족값 도형"과 같은 모양. 색만 `kBlue`(채움, 알파 `kFillAlpha`) · `kBlueDeep`(선) |
| CP4-4 파랑 숫자 | 축 이름 · 종족값 아래 한 줄 더 | `box.top() + 34`에 `kBlueDeep`으로 |

`scaleMax()`는 뼈대가 이미 씀 — 눈금 육각형 수(`scale / 50`)와 빨강 도형이 **이 값 하나를 따라** 늘어난다. 그래서 CP4-2만 채우면 눈금 전체가 같이 커진다(한 곳에서 정하고 모두가 따른다).

**아이디어 — 그리는 순서 = 쌓이는 순서.** `QPainter`는 나중에 그린 것이 위에 온다(종이에 물감을 덧칠하듯). 파랑은 대개 빨강보다 커서, 빨강 **다음에** 그리면 반투명 파랑이 빨강을 덮어 보라색으로 탁해진다. 그래서 파랑을 **먼저** 깔고 빨강을 그 위에 그린다 — TODO 자리가 "종족값 도형" 위에 있는 이유다.

**아이디어 — 줄이 늘면 여백도.** 축마다 글자가 2줄(이름 · 종족값)에서 3줄(+ 능력치)이 된다. 위젯 크기는 그대로라 **아래 축(스피드)의 셋째 줄이 위젯 밖으로 잘린다**(Claude가 시험 렌더로 확인). 파랑이 있을 때는 `radius`를 구할 때 빼는 바깥 여백(`kLabelMargin`)을 한 줄(18)만큼 더 준다 — 도형이 조금 작아지고 글자가 들어온다.

### ② `DexDetailPage` — 넘겨받는 쪽 (`dexdetailpage.cpp`)

**아이디어 — 능력치는 "그 포켓몬"의 것이다.** 상세 모달 안에서는 진화 트리를 눌러 다른 포켓몬(예: 프테라 → 다른 종)으로 옮겨 갈 수 있다. 그때 프테라의 파랑이 남아 있으면 틀린 그림이다. 그래서 능력치를 **어느 포켓몬의 것인지(`pokemonId`)와 함께** 받아 두고(`m_trainedFor`), 그릴 때마다 "지금 보이는 포켓몬이 그 포켓몬인가"를 묻는다.

| TODO | 할 일 |
|---|---|
| CP4-5 `setTrainedStats` | 두 멤버(`m_trainedFor` · `m_trained`)에 담기만 — 그리는 건 아래 CP4-7이 |
| CP4-6 `presetNature` | `m_natureId`에 담고 `applyNature()`. 성격표(`m_natures`)가 비어 있으면 먼저 읽기(`showNaturePicker` 첫 줄과 같은 요령) |
| CP4-7 `applyLanguage` | 지금 포켓몬이 `m_trainedFor`면 레이더에 `m_trained`, 아니면 `std::nullopt` |

CP4-7의 삼항 연산자는 두 갈래의 **타입이 같아야** 한다 — 한쪽이 `std::array`, 다른 쪽이 `std::nullopt`면 컴파일러가 못 맞춘다. 한쪽을 `std::optional<std::array<int, 6>>(m_trained)`로 감싸거나, `if`/`else`로 두 번 부르면 된다.

### ③ `SquadPage` — 시작하는 쪽 (`squadpage.cpp`)

- `TODO(H8-CP4-8)` 이 자리의 멤버가 `hasStats()`면 `detail->setTrainedStats(pokemonId, member.stats)`, 성격을 골라 뒀으면(`natureId > 0`) `detail->presetNature(…)`
- **`showPokemon`보다 먼저** 부른다 — `showPokemon` → `reload` → `applyLanguage`가 그 자리에서 레이더를 그리기 때문에, 그 전에 값이 들어가 있어야 첫 화면부터 파랑이 보인다

### 확인

CP3처럼 세이브를 불러온 뒤 → 프테라 카드의 [+] → 상세 모달:

- 빨강(80 · 105 · 65 · 130 · 60 · 75) 아래에 파랑이 깔리고, 축마다 셋째 줄에 파랑 숫자: HP **151** · 공격 **139** · 방어 **88** · 스피드 **152** · 특공 **75** · 특방 **74**
- 성격 버튼이 **개구쟁이**로 미리 골라져 있고, 공격 ▲ · 특방 ▼
- 아래 축(스피드)의 파랑 숫자가 잘리지 않는다
- 모달 안의 진화 트리에서 다른 포켓몬으로 가면 파랑이 **사라진다**
- 도감 화면에서 연 상세(같은 프테라)에는 파랑이 **없다**
- 손으로 넣은 포켓몬의 [+]에도 파랑이 없다

---

## 완료 조건

- [ ] `ctest --preset linux-debug` 전부 통과, 경고 0, `clang-format -i` (바꾼 파일들)
- [ ] RealSave에서 6마리 능력치가 찍히고 첫 칸 = 최대 HP
- [ ] 소울실버 세이브를 불러오면 카드 6개에 레벨, 상세 모달에 파랑 레이더 — 위 CP4 확인 목록 전부
- [ ] 앱을 껐다 켜도 레벨 · 파랑이 남아 있다(squads.json에 저장됨), 손으로 만든 스쿼드는 그대로

다 되면 **"H8 진단해줘"** → Claude가 diff · 빌드 · 테스트를 보고 커밋 · merge한다.

## 다음 — 이 뒤에 할 수 있는 것

- 능력치 공식(`core/rules/statcalc`) — 레벨을 바꿔 보면 능력치가 어떻게 될지(성장 예측), 전투 시뮬의 입력. 이번에 저장한 숫자가 정답지가 된다
- 개체값 · 노력치도 스쿼드에 싣기 — 상세에 "개체값 표"
- 현재 HP · 상태 이상(독 · 마비) 표시 — 세이브의 `0x8E` · `0x88`
