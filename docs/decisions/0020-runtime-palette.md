# 0020 — 색은 실행 중에 바꿀 수 있는 팔레트로: `tok::palette()` · 역할(멤버 포인터) · `onColor`

- 상태: 채택 (2026-10-13)
- 관련: [ADR 0005](0005-design-handoff-adoption.md) · [ADR 0007](0007-ui-component-structure.md) · 가이드 [f3a-runtime-palette.md](../guides/f3a-runtime-palette.md) · 로드맵 F3 · [worklog](../worklog.md) 열린 일 8

## 배경

사용자 요청(2026-10-12): 앱 막대에 [라이트 · 다크 · 시스템] 전환. 그때까지 색은 이랬다:

1. 토큰이 `inline constexpr QRgb tok::kRed …`(53파일 552곳) — 컴파일 때 값이 박혀 실행 중에 바꿀 수 없다
2. `app.qss`의 `@이름`은 시작할 때 한 번 라이트 값으로 치환된다
3. `white` 하나가 두 뜻이다: **바탕**(카드 · 표 · 입력란)과 **색 위의 흰 글자 · 그림**(빨강 버튼 글자, 패널 머리 제목, 히트맵 ×4 숫자).
   다크에서 바탕은 어두워져야 하고 색 위의 글자는 흰색으로 남아야 한다
4. `PanelStyle`(창 모양)은 `constexpr` 상수로 색을 들고 있고, `PanelFrame`은 그 값을 생성 때 복사해 둔다

## 결정

1. **`tok::Palette` 구조체 = 테마 하나의 색 전부.** 필드 이름은 토큰 이름에서 `k`를 뗀 것(`kRedDeep` → `redDeep`).
   `tok::kLight`(핸드오프 값, `tok::light::k…`에서) · `tok::kDark`(라이트를 복사하고 `tok::dark::k…`로 덮어씀)
2. **화면 코드는 `tok::palette().red`로 읽는다** — 그릴 때마다 지금 테마의 값. 라이트 상수는 `tok::light::` 안으로 옮겨 직접 쓰면 눈에 띄게 했다
3. **지금 모드는 `theme` 안의 변수 하나**(`theme::setMode` · `theme::mode`). UI 스레드에서만 바꾸고 읽는다
4. **`white`를 둘로 나눈다**: 바탕은 `white`, 색 채움 위의 흰 글자 · 테 · 아이콘은 새 칸 `onColor`(QSS `@on.color`, 라이트 · 다크 모두 흰색).
   분류는 사용처 74곳 + QSS 21곳을 하나씩 보고 정했다(28곳 + QSS 5줄이 `onColor`)
5. **오래 들고 있는 색은 값 대신 "역할"을 담는다.** `tok::Role = QRgb Palette::*`(멤버 포인터), `tok::Color` = 역할 또는 고정 색.
   `PanelStyle`의 `fill` · `ink` · `innerColor` · `headerColor`가 `tok::Color`라서 `constexpr` 그대로 두면서 그릴 때 지금 테마를 읽는다.
   타입 색처럼 테마와 무관한 색은 고정 색으로 넣는다
6. **QSS 이름표도 역할로**(`{"red.deep", &tok::Palette::redDeep}`) — 표 하나로 두 테마. `theme::applyColors`가 앱 `QPalette` ·
   색 구성표 · QSS를 지금 팔레트로 다시 입힌다
7. **고르는 곳은 앱 막대의 세 칸(라이트 · 다크 · 시스템) 하나**, 세대 버튼 바로 왼쪽(사용자 결정). 명령행 옵션은 두지 않는다.
   고른 값은 data의 `AppState::Theme`(QSettings `theme`)이 저장하고, 칠할 모드를 정하는 일(시스템 → OS가 다크인가)은 ui의 `theme::applyTheme`이 한다.
   시스템이면 `QStyleHints::unsetColorScheme`으로 고정을 풀고 `colorSchemeChanged`를 따라간다
8. **실행 중 전환**: `app.setStyleSheet`가 모든 위젯에 `QEvent::StyleChange`를 보내 다시 그리게 한다. 색을 입혀 만든 아이콘
   (탭 · 스쿼드 도구 · 검색 · ⚠)은 그 이벤트(`changeEvent`) 또는 그릴 때 색이 바뀐 걸 보고 다시 만든다
9. **순서**: F3a(팔레트 + 스위치 + 실행 중 전환 + 시스템) → F3b(빠진 다크 값)

## 결과

- 라이트 화면은 그대로다 — 도감 · 아이템 · 타운맵 · 스쿼드 · 설정 캡처가 0.4.1과 픽셀 단위로 같다(인트로는 하단 버전 글자만 다름)
- `paintEvent`에서 읽는 색은 테마가 바뀌어도 다시 그리기만 하면 따라온다. QSS도 `setStyleSheet`가 모든 위젯을 다시 다듬는다
- 대가: `QColor(tok::palette().text1)`처럼 글자가 길어졌다. 한 함수에서 많이 쓰면 `const tok::Palette &c = tok::palette();`로 줄인다
- 실행 중 전환 확인(참조 구현, 2026-10-13): 라이트로 띄운 뒤 다크로 바꾼 캡처가 처음부터 다크로 띄운 캡처와 픽셀 단위로 같다
  (도감 · 아이템 · 타운맵 · 스쿼드 · 설정 · 인트로). 다르던 두 곳(활성 탭 아이콘 · 스쿼드 도구 아이콘)은 결정 8로 고쳤다
- 남은 숙제(F3b): 생성 때 넣는 칩 색(`VersionChip` 조각의 `white` 바탕), JSON의 버전 · 분류 · 카드 색(라이트 전용 파스텔),
  캡처에 안 잡힌 화면(상세 · 대화상자)의 굳은 색
