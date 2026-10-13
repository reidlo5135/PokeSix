# F3a — 런타임 팔레트와 앱 막대의 테마 스위치

> 학습 루프 ① 가이드. 브랜치: `feat/f3a-runtime-palette` (Claude가 만들어 둠)
> 뼈대 · 테스트 · **기계적 치환(552곳)은 끝나 있다.** `// TODO(F3a-CPn)`만 채우면 된다. 빈칸이 있어도 빌드된다.
> 결정 근거: [ADR 0020](../decisions/0020-runtime-palette.md). 다음: F3b(빠진 다크 값)

## 무엇을 만드나

```
 앱 막대                                              ┌────┬────┬────┐ ┌────────┐
 [◉ POKESIX] [도감] [아이템] [타운맵] [스쿼드] [설정]   │ ☀  │ ☾  │ 🖥 │ │ 4세대 ▾ │
                                                     └────┴────┴────┘ └────────┘
                                                      라이트 다크 시스템
```

세대 버튼 바로 왼쪽의 세 칸으로 **실행 중에** 라이트 · 다크 · 시스템(OS 설정을 따름)을 바꾼다. 고른 값은 저장돼서 다음 실행도 그 테마로 뜬다.

### 이미 바뀐 것 (Claude)

```
전:  painter.setPen(QColor(tok::kText1));            ← 컴파일 때 박힌 라이트 값
후:  painter.setPen(QColor(tok::palette().text1));   ← 그릴 때마다 "지금 테마"의 값
```

| | 무엇 | 어디 |
|---|---|---|
| `tok::Palette` | 테마 하나의 색 전부(필드 54개). 이름 = 토큰에서 `k`를 뗀 것 | `src/ui/theme/tokens.h` |
| `tok::kLight` | 핸드오프의 라이트 값 그대로 | 〃 |
| `tok::palette()` | 지금 테마의 팔레트를 돌려준다 — **이번에 채울 곳** | `src/ui/theme/theme.cpp` |
| `onColor` | 색 위의 흰 글자 전용 칸(빨강 버튼 글자, 패널 머리 제목). `white`는 이제 "바탕"만 | tokens.h · `app.qss`의 `@on.color` |
| `tok::Color` | `PanelStyle`처럼 색을 오래 들고 있는 곳이 담는 것 — 값이 아니라 "팔레트의 어느 칸" | tokens.h |
| `AppState::Theme` | 고른 테마(라이트 · 다크 · 시스템) 저장 · `themeChanged` — 세대와 같은 방식 | `src/data/state/appstate.*` |
| `ThemeSwitch` | 앱 막대의 세 칸 위젯. 칸 자리 · 아이콘 · 툴팁 · hover는 됨, **그리기와 누르기가 이번에 채울 곳** | `src/ui/shell/themeswitch.*` |
| 연결 | 스위치 → AppState → 스위치 표시 + `theme::applyTheme`, OS 설정이 바뀌면(시스템일 때) 다시 | `mainwindow.cpp` |
| 굳은 아이콘 | 색을 입혀 만든 아이콘(탭 · 스쿼드 도구 · 검색 · ⚠)이 테마를 따라 다시 칠해지게 | 각 위젯 `changeEvent(StyleChange)` |

라이트 화면은 하나도 안 바뀌었다(0.4.1과 픽셀 비교로 확인).

## 흐름

```
 시작할 때                                         실행 중
 theme::apply(app)                                 [☾] 클릭 ─▶ ThemeSwitch::themeSelected   (CP5)
  └ applyTheme(app, AppState::savedTheme())  (CP6)        ─▶ AppState::setTheme (저장)
                                                          ─▶ themeChanged ─▶ theme::applyTheme   (CP6)

 applyTheme(app, 고른 테마)                                                                  (CP6)
  ├ 색 구성표: 라이트 · 다크는 고정 / 시스템은 풀고 OS 값을 읽는다
  ├ setMode(라이트 | 다크) ──▶ tok::palette() ──▶ kLight | kDark               (CP2 · CP1)
  └ applyColors(app): 앱 QPalette · app.qss(@이름 → 지금 팔레트 값)            (CP4 · CP3)
       └ app.setStyleSheet → 모든 위젯이 다시 다듬어지고 다시 그려진다 → paintEvent가 새 팔레트를 읽는다
```

| | 체크포인트 | 파일 | 배우는 것 |
|---|---|---|---|
| ⬜ | **CP1 다크 팔레트** | `tokens.h` | `constexpr` 람다로 "복사 + 몇 칸 덮어쓰기" |
| ⬜ | **CP2 지금 모드** | `theme.cpp` | 파일 안에만 보이는 상태(익명 namespace), 모드 → 팔레트 |
| ⬜ | **CP3 역할로 읽기** | `theme.cpp` · `tokens.h` | 멤버 포인터 `.*` |
| ⬜ | **CP4 색 입히기 떼어 내기** | `theme.cpp` | `QPalette` · QSS 다시 입히기 |
| ⬜ | **CP5 테마 스위치 그리기 · 누르기** | `src/ui/shell/themeswitch.cpp` | (복습) `paintEvent` · 클리핑, 마우스 이벤트 → 시그널 |
| ⬜ | **CP6 고른 테마 입히기** | `theme.cpp` | `QStyleHints` 색 구성표(고정 ↔ 시스템 따르기) |

지금 상태: `tests/ui/theme_test.cpp`의 4개가 빨강.

```bash
cmake --build --preset linux-debug
ctest --preset linux-debug -R "Theme\." --output-on-failure
```

---

## CP1 — 다크 팔레트 (`TODO(F3a-CP1)`, tokens.h)

### 아이디어

핸드오프에는 다크 값이 **11개뿐**이다(`tok::dark::` 안). 나머지 40여 칸은 아직 없다 → 일단 **라이트 값을 그대로 쓰고**, 11칸만 바꾼다(빠진 칸은 F3b).

```
kLight  ┌ red ┬ redDeep ┬ white ┬ paper ┬ … ┬ text1 ┬ … ┐
        └─────┴─────────┴───────┴───────┴───┴───────┴───┘
           ↓ 통째로 복사
kDark   ┌ red*┬ redDeep ┬ white*┬ paper*┬ … ┬ text1*┬ … ┐     * = dark:: 값으로 덮어씀
```

### 알아 둘 것

- **즉시 실행 람다**: `[] { … }()` — 만들자마자 부른다. 여러 줄 계산 결과로 상수를 초기화할 때 쓴다.
  `constexpr` 변수의 초기값이면 람다 몸통도 컴파일 때 돈다(C++17부터 람다는 저절로 constexpr 가능)
- 구조체 복사(`Palette p = kLight;`)는 constexpr 안에서도 된다
- `dark::kRaised`는 대응하는 칸이 없다 → 건너뛴다

### 시작 코드

```cpp
inline constexpr Palette kDark = [] {
    Palette p = kLight;
    p.paper = dark::kPaper;
    /* ? 나머지 9개 */
    return p;
}();
```

### 확인

`Theme.DarkPaletteTakesTheHandoffOverrides` 초록. (`OnColorStaysWhite…`는 이미 초록 — onColor는 덮어쓰지 않는다)

---

## CP2 — 지금 모드 (`TODO(F3a-CP2)`, theme.cpp)

### 아이디어

"지금 라이트냐 다크냐"를 **앱에 하나만** 둔다. 모두가 `tok::palette()`로 묻고, 바꾸는 건 `theme::setMode` 한 곳뿐이다.

```
 setMode(Dark) ──▶ [ g_mode = Dark ] ◀── mode()
                          │
                   palette(): g_mode가 Dark면 kDark, 아니면 kLight
```

ROS 2로 치면 노드 하나가 들고 있는 파라미터 — 읽는 쪽은 많고, 쓰는 쪽은 하나다.

### 알아 둘 것

- 익명 namespace(`namespace { … }`) 안의 변수는 **이 .cpp 안에서만** 보인다. 다른 파일은 `mode()` · `setMode()`로만 만진다
- 스레드: 색은 UI 스레드에서만 읽고 쓴다(그림은 UI 스레드에서만 그린다) → 잠금이 필요 없다
- `palette()`는 `tok` namespace, `mode()`는 `theme` namespace에 있다. `palette()` 안에서는 `theme::mode()`로 부른다
- **참조를 돌려준다**: `const Palette &`. `kLight` · `kDark`는 프로그램 끝까지 사는 상수라 안전하다

### 시작 코드

```cpp
namespace {
Mode g_mode = /* ? */;
}
// mode(): return g_mode;   setMode(): g_mode = mode;
// palette(): return /* ? g_mode가 Dark면 */ ? kDark : kLight;
```

### 확인

`Theme.SetModeSwitchesThePalette` 초록.

---

## CP3 — 역할로 읽기 (`TODO(F3a-CP3)`, theme.cpp · tokens.h)

### 아이디어

QSS 이름표와 `tok::Color`는 색 **값**이 아니라 **팔레트의 어느 칸**(역할)을 들고 있다:

```cpp
{"red.deep", &tok::Palette::redDeep}     // "Palette의 redDeep 칸" — 어느 팔레트인지는 아직 모름
```

값은 읽을 때 정한다: **"지금 팔레트의 그 칸"**. 그래서 표 하나로 라이트 · 다크가 다 된다.

```
 역할 &Palette::redDeep ─┐
                         ├─▶  tok::palette().*role  ─▶  지금 테마의 redDeep 값
 지금 팔레트 ────────────┘
```

뼈대는 지금 `tok::kLight.*role` — 늘 라이트에서 읽는다. 이것을 **지금 팔레트**에서 읽게 바꾼다. 두 곳:

1. `substituteTokens` 안의 `QColor(…)` 한 줄 (theme.cpp)
2. `tok::Color::rgb()` 한 줄 (tokens.h)

### 알아 둘 것

- **멤버 포인터**(`QRgb Palette::*`): "어느 객체"는 빼고 "어느 칸"만 기억하는 포인터. 객체와 합칠 때 `.*`(객체) · `->*`(포인터)
  ```cpp
  tok::Role role = &tok::Palette::paper;   // 칸만
  QRgb v = tok::kDark.*role;               // 다크 팔레트의 paper 칸
  ```
- `tok::Color`는 역할이 없으면(`nullptr`) 고정 색을 돌려준다 — 타입 색처럼 테마와 무관한 색

### 확인

`Theme.TokensFollowTheMode` · `Theme.ColorReadsItsRoleFromTheCurrentPalette` 초록. 여기까지면 `Theme.*` 6개 모두 초록.

---

## CP4 — 색 입히기 떼어 내기 (`TODO(F3a-CP4)`, theme.cpp)

### 아이디어

`theme::apply`는 두 가지를 한다: 글꼴 등록(한 번만 하면 됨) + 색 입히기(테마가 바뀔 때마다 다시). 둘을 나눈다:

```
apply(app)            ── 시작할 때 한 번
 ├ loadBundledFonts()
 └ applyColors(app)   ── F2'에서 테마를 바꿀 때 이것만 다시 부른다
     ├ 앱 QPalette (tok::palette()로)
     └ app.qss 다시 읽어 치환 → setStyleSheet
```

### 알아 둘 것

- **`QStyleHints::setColorScheme`**: Qt에게 "이 앱은 라이트/다크다"라고 알린다. 파일 대화상자 같은 **OS가 그리는 창**과
  Windows의 기본 팔레트가 이걸 따른다. → 이 줄은 CP6에서 `applyTheme`으로 옮긴다(시스템을 고르면 고정을 풀어야 해서)
- **`app.setStyleSheet(…)`를 다시 부르면** 모든 위젯이 새 스타일로 다시 다듬어진다(polish). 같은 문자열이면 아무 일도 안 한다
- 팔레트 색 줄(`palette.setColor(…, QColor(tok::palette().paper))`)은 이미 `tok::palette()`를 읽는다 — 옮기기만 하면 된다

### 시작 코드

```cpp
void apply(QApplication &app)
{
    loadBundledFonts();
    applyColors(app);
}
// applyColors: setColorScheme(/* ? mode()가 Dark면 */ ? Qt::ColorScheme::Dark : Qt::ColorScheme::Light);
//              그 아래는 apply에 있던 색 부분 그대로
```

### 확인

빌드 · 테스트 그대로 초록, 라이트로 띄운 앱이 전과 같다(다크로 띄우는 건 CP5 · CP6 뒤).

---

## CP5 — 테마 스위치 그리기 · 누르기 (`TODO(F3a-CP5)`, themeswitch.cpp)

### 아이디어

세 칸이 붙은 버튼 하나다. 칸 자리(`segmentRect`), 아이콘(`icon(i, 색)`), 마우스 위치의 칸(`segmentAt`), 툴팁 · hover(`m_hover`)는
준비돼 있다. **그리기와 누르기만** 채운다.

```
 kBorder 2 ┌──────────┬──────────┬──────────┐
           │    ☀     │▓▓▓ ☾ ▓▓▓│    🖥    │   ▓ = 고른 칸(m_theme) — 바탕을 칠하고 아이콘 색을 바꾼다
           │          │▓▓▓▓▓▓▓▓▓│          │   ░ = 마우스가 올라간 칸(m_hover) — 옅게
           └──────────┴──────────┴──────────┘
             칸 0        칸 1        칸 2       segmentRect(i) = 먹선 안쪽의 한 칸(34 × 32)
```

모양은 자유. 참고: 사진처럼 **고른 칸만 진하게**(예: 바탕 `ink` + 아이콘 `onColor`), 나머지는 바탕 `white` + 아이콘 `text2`,
hover는 `yellowTint`. 색은 모두 `tok::palette()`에서 — 그래야 다크로 바뀌면 스위치도 같이 바뀐다.

누르면: 스위치는 **고름만 알린다**(`themeSelected`). `m_theme`을 직접 바꾸지 않는다 — AppState가 저장한 뒤
`themeChanged`가 돌아와 `setTheme`이 표시를 바꾼다. 세대 버튼과 같은 말투다(ROS 2로 치면 요청 토픽 → 노드 → 상태 토픽).

### 알아 둘 것

- 틀 모양: `drawRoundedRect` + 먹선. 테 두께의 반만큼 안으로 들여 그려야 선이 잘리지 않는다(`QRectF(rect()).adjusted(1, 1, -1, -1)`)
- 고른 칸을 칠하면 모서리가 틀 밖으로 삐져나온다 → `setClipPath`(틀 안쪽 둥근 네모)로 자른 뒤 칠한다
- `icon()`이 주는 pixmap은 논리 크기 `kIconSize`(18). 가운데: `r.center() - QPointF(kIconSize / 2.0, kIconSize / 2.0)`
- `event->button() == Qt::LeftButton`, 위치는 `event->position().toPoint()`

### 시작 코드

```cpp
const tok::Palette &c = tok::palette();   // 긴 이름을 한 번만
const int selected = indexOf(m_theme);
for (int i = 0; i < kSegments; ++i) {
    const QRect r = segmentRect(i);
    if (i == selected) { /* ? 바탕 */ }
    painter.drawPixmap(/* ? 가운데 */, icon(i, /* ? 고른 칸이면 … */));
}
```

### 확인

앱을 띄우면 세대 버튼 왼쪽에 세 칸, 처음에는 🖥(시스템)가 골라져 있다. 칸 위에 마우스 → 옅게 + 툴팁.
누르면 아직 아무 일도 안 일어난다 — 저장은 되지만(`~/.config/YamadaStudio/PokeSix.ini`의 `theme=`) 색을 입히는 CP6가 비어 있다.
(스위치 표시는 바뀐다: `themeChanged` → `setTheme`)

---

## CP6 — 고른 테마 입히기 (`TODO(F3a-CP6)`, theme.cpp)

### 아이디어

"고른 것"(라이트 · 다크 · 시스템)과 "칠할 것"(라이트 · 다크)은 다르다. 시스템이면 **지금 OS가 어느 쪽인지** 물어서 정한다.

```
 고른 테마 ──┬─ 라이트 ─▶ 색 구성표 Light 고정 ─────────────┐
            ├─ 다크  ─▶ 색 구성표 Dark 고정 ──────────────┼─▶ setMode(모드) ─▶ applyColors(app)
            └─ 시스템 ─▶ 고정을 풂 → OS 값(colorScheme()) ─┘
```

시스템을 고른 채로 OS 설정을 바꾸면 Qt가 `QStyleHints::colorSchemeChanged`를 보낸다 → MainWindow가 `applyTheme(System)`을 다시 부른다(연결은 돼 있다).

할 일 둘:

1. `applyTheme` 몸통 (TODO 순서대로)
2. `apply`의 `applyColors(app)` 한 줄을 `applyTheme(app, AppState::savedTheme())`로 — 시작할 때부터 저장된 테마로.
   그리고 CP4에서 `applyColors`에 넣은 `setColorScheme` 줄은 지운다(1이 대신한다)

### 알아 둘 것

- **`setColorScheme(x)`는 OS 값을 덮어쓴다.** 덮어쓴 동안 `colorScheme()`은 x를 돌려준다 → 시스템일 때는 먼저
  `unsetColorScheme()`(Qt 6.8)으로 풀어야 OS 값을 읽을 수 있다
- 되먹임 걱정 없음: 라이트 · 다크에서 `setColorScheme`이 `colorSchemeChanged`를 보내도 MainWindow는 "지금 시스템인가"를 보고 무시한다
- 시작할 때(`apply`)는 위젯이 아직 없다 → 생성자에서 색을 굳히는 곳까지 처음부터 맞다. 실행 중 전환은 `app.setStyleSheet`가
  모든 위젯에 `QEvent::StyleChange`를 보내 다시 그리게 한다. 색을 입혀 만든 아이콘은 그 이벤트에서 다시 만든다(Claude가 해 둠)

### 시작 코드

```cpp
QStyleHints *hints = QGuiApplication::styleHints();
Mode mode = /* ? theme이 Dark면 Dark, 아니면 Light */;
if (theme == AppState::Theme::System) {
    /* ? 풀고 → OS 값으로 mode */
} else {
    hints->setColorScheme(/* ? */);
}
/* ? setMode → applyColors */
```

### 확인

- 클릭: ☾ → 화면 전체가 바로 어두워진다, ☀ → 돌아온다. 앱을 끄고 다시 켜면 마지막에 고른 테마로 뜬다
- 🖥: OS 설정(Ubuntu: 설정 → 모양 → 어둡게 · Windows: 개인 설정 → 색 → 모드)을 바꾸면 앱이 따라간다
- **아직 어색한 것(정상 — F3b 몫)**: 세대 버튼 · "4세대 규칙" 알약 · 버전 칩처럼 연한 색 위의 글자, 필터 타입 칩, 히트맵 연한 칸.
  라이트 값 그대로인 40여 칸이 어두운 바탕 위에 있기 때문이다

---

## 끝나면

"F3a 진단해줘" → Claude가 확인한다: 테스트 · 라이트 픽셀 비교 · "시작할 때 다크"와 "실행 중 다크로 전환"의 캡처가 같은지 · 시스템 모드.
그다음 F3b(빠진 다크 값 제안 → 캡처로 같이 보기).
