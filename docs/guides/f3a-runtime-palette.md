# F3a — 런타임 팔레트: `--theme dark`로 어둡게 띄우기

> 학습 루프 ① 가이드. 브랜치: `feat/f3a-runtime-palette` (Claude가 만들어 둠)
> 뼈대 · 테스트 · **기계적 치환(552곳)은 끝나 있다.** `// TODO(F3a-CPn)`만 채우면 된다. 빈칸이 있어도 빌드된다.
> 결정 근거: [ADR 0020](../decisions/0020-runtime-palette.md). 다음: F3b(빠진 다크 값) → F2'(실행 중 전환 + 앱 막대 3칸)

## 무엇을 만드나

```bash
build/linux-debug/src/PokeSix --theme dark
```
이 한 줄로 앱이 **어두운 테마로 뜨게** 한다. 실행 중에 바꾸는 버튼은 F2'에서 — 이번에는 "색이 한 곳에서 바뀌는 구조"를 완성하는 단계다.

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

라이트 화면은 하나도 안 바뀌었다(0.4.1과 픽셀 비교로 확인).

## 흐름

```
        --theme dark                    시작할 때 한 번
  CP5 ─────────────▶ theme::setMode(Dark) ──▶ theme::apply(app)
                          │  CP2                  │  CP4: applyColors
                          ▼                       ▼
                    tok::palette() ──▶ kDark   앱 QPalette · 색 구성표 · app.qss(@이름 → 값, CP3)
                          │              CP1
                          ▼
              모든 paintEvent: tok::palette().text1 …  → 어두운 화면
```

| | 체크포인트 | 파일 | 배우는 것 |
|---|---|---|---|
| ⬜ | **CP1 다크 팔레트** | `tokens.h` | `constexpr` 람다로 "복사 + 몇 칸 덮어쓰기" |
| ⬜ | **CP2 지금 모드** | `theme.cpp` | 파일 안에만 보이는 상태(익명 namespace), 모드 → 팔레트 |
| ⬜ | **CP3 역할로 읽기** | `theme.cpp` · `tokens.h` | 멤버 포인터 `.*` |
| ⬜ | **CP4 색 입히기 떼어 내기** | `theme.cpp` | `QPalette` · `QStyleHints::setColorScheme` · QSS 다시 입히기 |
| ⬜ | **CP5 `--theme` 옵션** | `src/app/application.cpp` | (복습) `QCommandLineParser` |

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
     ├ 색 구성표(라이트/다크)
     ├ 앱 QPalette (tok::palette()로)
     └ app.qss 다시 읽어 치환 → setStyleSheet
```

### 알아 둘 것

- **`QStyleHints::setColorScheme`**: Qt에게 "이 앱은 라이트/다크다"라고 알린다. 파일 대화상자 같은 **OS가 그리는 창**과
  Windows의 기본 팔레트가 이걸 따른다. 지금은 늘 `Light`로 고정 — `mode()`를 따르게 바꾼다
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

빌드 · 테스트 그대로 초록, 라이트로 띄운 앱이 전과 같다(CP5 전이라 아직 다크로 띄울 방법은 없다).

---

## CP5 — `--theme` 옵션 (`TODO(F3a-CP5)`, application.cpp)

### 아이디어

시작 순서가 중요하다: **모드를 먼저 정하고 → 색을 입히고 → 위젯을 만든다.**

```
run()
 ├ parseArguments()   ← 여기서 setMode(Dark)   (CP5)
 └ buildObjects()
     ├ theme::apply(app)  ← 다크 팔레트로 QSS · QPalette
     └ MainWindow 생성    ← 생성자에서 굳히는 색까지 다크로
```

위젯을 만들기 전에 모드를 정하니, 생성 때 색을 굳혀 두는 곳(아이콘 색칠 등)도 이번에는 문제가 없다. 실행 중 전환(F2')에서 다시 다룬다.

### 알아 둘 것

- 바로 위 `languageOption`과 같은 모양이다(이름 · 설명 · 값 이름 · 기본값)
- 잘못된 값은 `usageError(…)` + `return false` → `run()`이 사용법 오류 코드로 끝낸다(`--screenshot`의 잘못된 화면 이름과 같은 처리)

### 시작 코드

```cpp
const QCommandLineOption themeOption(QStringLiteral("theme"), QStringLiteral(/* ? 설명 */),
                                     QStringLiteral("mode"), QStringLiteral("light"));
// parser.process 뒤:
const QString theme = parser.value(themeOption);
if (theme == QLatin1String("dark")) { /* ? */ }
else if (theme != QLatin1String("light")) { /* ? usageError + return false */ }
```

### 확인

```bash
build/linux-debug/src/PokeSix --theme dark
build/linux-debug/src/PokeSix --theme dark --screenshot squad 1440x900 /tmp/squad-dark.png
build/linux-debug/src/PokeSix --theme blue      # → error: … 종료 코드 2
```

**보이는 것**: 바탕 · 패널 · 표 · 글자가 어둡게, 빨강 · 파랑 머리와 타입 칩은 그대로.
**아직 어색한 것(정상 — F3b 몫)**: 세대 버튼 · "4세대 규칙" 알약 · 버전 칩처럼 연한 색 위의 글자, 필터 타입 칩, 히트맵 연한 칸.
라이트 값 그대로인 40여 칸이 어두운 바탕 위에 있기 때문이다.

---

## 끝나면

"F3a 진단해줘" → Claude가 확인한다: 테스트 · 라이트 픽셀 비교 · 다크 캡처 · `--theme` 오류 처리. 그다음 F3b(빠진 다크 값 제안 → 캡처로 같이 보기).
