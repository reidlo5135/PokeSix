# R4 — 디자인 토큰: 팔레트 · 글꼴 · 테마

> 커밋 footer `Refs: R4` · 이 단계가 끝나면 **화면 코드에 색 · 글꼴 값이 한 번도 직접 나오지 않는다** — 전부 토큰 이름으로

## 디자인이 정해 둔 것은 어디에 있나

| 무엇 | 어디 | 읽는 법 |
|---|---|---|
| **팔레트 · 크기 · 간격 · 글꼴 (기계용)** | [`design/handoff-v3/design/tokens.json`](../../design/handoff-v3/design/tokens.json) | **이게 원본이다**(v1 + v2 + v3 — 다크 완성판). `color.light`(53) · `color.darkOverrides`(**57 — 다크 완성**) · `color.lightStates` · `color.darkStates`(호버 · 선택 · 눌림 · 포커스 · 탭 상태 12씩) · `type`(18) · `font` · `size` · `space` · `breakpoint` · `mark`(마크 기하 — CSS 아님) · `web`(메모 — CSS 아님) |
| 같은 내용의 설명 (사람용) | [`01_DESIGN_SHEET.md`](../../design/handoff-v1/docs/01_DESIGN_SHEET.md) §1–4 | 토큰마다 **어디에 쓰는 색인지**가 적혀 있다 — 이름만 보고 모르겠으면 여기 |
| v2에서 더해진 토큰의 설명 | [`01b_DESIGN_SHEET_V2.md`](../../design/handoff-v2/docs/01b_DESIGN_SHEET_V2.md) §1 | 캡슐 마크 색 · 인트로 색(`intro.*` · `menu.pressed`)을 어디에 쓰나. `capsule.gloss`는 json에 `#FFFFFF`로만 있고 표에는 "60%" — 투명도는 쓰는 쪽에서 |
| **다크 결정 · 대비 (v3)** | [`01b_DARK_TOKENS.md`](../../design/handoff-v3/docs/01b_DARK_TOKENS.md) · [`01c_DARK_CONTRAST.md`](../../design/handoff-v3/docs/01c_DARK_CONTRAST.md) | 다크 값마다 이유 · 원칙 4개(특히 **면으로 쓸 때와 글자로 쓸 때 값이 다르다** — `red` vs `red.asText`) · 대비표 |
| 다크 기준 이미지 | [`61_dark_foundations.png`](../../design/handoff-v3/images/screens/61_dark_foundations.png) · `62_components_dark.png` | K4 다크 비교용 |
| 눈으로 볼 기준 | [`images/screens/00_foundations.png`](../../design/handoff-v1/images/screens/00_foundations.png) · `02_components.png` | 색 견본 · 글꼴 견본 · 컴포넌트 모양 |
| 글꼴 파일 | `~/ws/src/PokeSix-qt6/resources/fonts/` | Qt판이 쓰던 TTF 8개 + `OFL-*.txt` 4개(라이선스 — **같이 넣어야 배포 가능**) |

## 보통 어떻게 쌓아 가나

디자인 시스템은 아래에서 위로 쌓는다. 아래층이 흔들리면 위층을 전부 고쳐야 해서, 페이지를 만들기 전에 아래 두 층을 끝낸다.

```
4. 페이지        홈 · 도감 · 아이템 …           ← R5부터 (레이아웃은 직접 설계)
3. 컴포넌트      버튼 · 창(패널) · 타입 칩 · 탭   ← 페이지를 만들며 필요할 때 하나씩
2. 기본 스타일   글꼴 · 본문 글자 · 바탕색 · 리셋  ← R4
1. 토큰          --color-red · --font-display …   ← R4
```

- **토큰**은 값에 붙인 이름이다. 화면 코드는 `#D8322B`가 아니라 `var(--color-red)`를 쓴다 → 색을 바꿀 때 한 곳만 고치고, 다크 테마는 **같은 이름에 다른 값**을 넣는 것으로 끝난다
- 디자인 도구(Figma · Claude Design)와 코드가 **같은 토큰 이름**을 쓰면 "빨강 말고 진한 빨강으로"가 아니라 "`red.deep`으로"라고 말할 수 있다

문제 4개.

---

## 문제 K1 — tokens.json → CSS 변수 (생성기)

**배경**: 토큰을 CSS로 손으로 옮기면 디자인이 바뀔 때마다 두 곳을 맞춰야 한다. `tokens.json`을 원본으로 두고 **CSS 파일을 만들어 내는 스크립트**를 짠다.

**구현할 것**
- `scripts/build-tokens.ts`(또는 `.mjs`) — `design/handoff-v3/design/tokens.json`을 읽어 `src/styles/tokens.css`를 쓴다
- 스크립트 `npm run tokens`
- 변환 함수는 따로 떼어 **테스트**한다(`scripts/tokens.ts` + `tokens.test.ts` 같은 식)

**이름 규칙**

| json | CSS 변수 |
|---|---|
| `color.light["red"]` | `--color-red` |
| `color.light["red.deep"]` | `--color-red-deep` (점 → 하이픈) |
| `color.light["heat.x2.text"]` | `--color-heat-x2-text` |
| `type[].key = "fire"`, `fill` · `text` | `--type-fire` · `--type-fire-text` |
| `size["appBar"]` = 60 | `--size-app-bar: 60px` (camelCase → kebab-case, 숫자엔 px) |
| `space` = [4, 8, 12 …] | `--space-1: 4px` · `--space-2: 8px` … |
| `color.lightStates["selectedRow"]` / `darkStates` | `--state-selected-row` (라이트는 `:root`, 다크는 `[data-theme="dark"]`) |

**만들어질 파일 모양**

```css
/* 자동 생성 — 직접 고치지 말 것. 원본: design/handoff-v3/design/tokens.json (npm run tokens) */
:root {
  --color-red: #D8322B;
  --color-red-deep: #B8241D;
  …
}
[data-theme="dark"] {
  --color-paper: #1B1B21;
  …(darkOverrides 57개)
}
```

**통과 조건**
- [ ] `npm run tokens` → `src/styles/tokens.css`가 생기고, 위 표의 이름 규칙대로 **json의 모든 항목**이 들어 있다
- [ ] 변환 함수 테스트: `"red.deep"` → `"--color-red-deep"`, `"appBar"` → `"--size-app-bar"` 등 규칙마다 한 줄 이상
- [ ] 같은 json으로 두 번 돌리면 결과 파일이 **한 글자도 안 바뀐다**(git diff 없음)
- [ ] v2의 추가 토큰(`intro.stripe` · `menu.pressed` · `capsule.*` · `introMenuWidth` …)도 들어 있다
- [ ] `mark` · `web` 블록은 CSS로 내보내지 않는다 — 스크립트가 **모르는 블록은 건너뛴다**
- [ ] **다크에만 있는 키 4개**(`raised` · `red.asText` · `danger.asText` · `glyph.ink`)도 라이트에서 값이 있다 — json `color.light`에는 없다. 라이트 값은 `01b_DARK_TOKENS.md` 표에 있다(`raised`는 표에 없으니 근거를 찾아 정한다). 이 값들을 **어디에 둘지**(별도 보충 json · 스크립트 안 표)는 직접 정한다 — `design/` 원본은 고치지 않는다

**제약**: `design/` 안의 파일은 고치지 않는다(원본 스냅샷). 생성된 tokens.css는 커밋한다(빌드 때마다 만들지 않아도 되게)

**힌트**: Node의 `fs.readFileSync` · `JSON.parse` · 문자열 `replace(/([A-Z])/g, …)`. TS로 쓰면 `npx tsx scripts/build-tokens.ts`로 바로 실행된다(`tsx`는 devDependency)

---

## 문제 K2 — 글꼴 네 개

**배경**: 데스크톱 앱이라 사용자 PC에 도현 · 나눔고딕이 깔려 있다는 보장이 없다. 앱이 글꼴 파일을 **직접 들고 다닌다**
(구글 폰트 CDN에 기대지 않는다). 화면 코드는 글꼴 이름을 직접 쓰지 않고 **역할 변수**(`--font-body` 등)만 쓴다.

**재료**: `~/ws/src/PokeSix-qt6/resources/fonts/` — TTF 8개 + `OFL-*.txt` 4개(라이선스 — 배포하려면 같이 넣어야 한다)

**구현할 것 — 파일 하나: `src/styles/fonts.css`** (손으로 쓰는 파일. `tokens.css`는 생성기가 덮어쓰므로 거기에 쓰지 않는다)

이 파일에 두 가지를 쓴다.

**① `@font-face` 8블록 — TTF 파일 하나당 한 블록.** 한 블록은 "이 **이름** + 이 **굵기** = 이 **파일**"이라는 등록이다.

```css
@font-face {
  font-family: "Do Hyeon";          /* 이 글꼴을 부를 이름 — 같은 글꼴의 굵기들은 같은 이름 */
  src: url("./fonts/DoHyeon-Regular.ttf") format("truetype");   /* fonts.css 기준 상대 경로 */
  font-weight: 400;                 /* 이 파일의 굵기 */
  font-display: swap;               /* 불러오는 방식 — 아래 ⚠ */
}
```

| 파일 | `font-family` | `font-weight` |
|---|---|---|
| DoHyeon-Regular | Do Hyeon | 400 |
| NanumGothic-Regular · Bold · ExtraBold | Nanum Gothic | 400 · 700 · 800 (블록 3개) |
| NanumGothicCoding-Regular · Bold | Nanum Gothic Coding | 400 · 700 (블록 2개) |
| Silkscreen-Regular · Bold | Silkscreen | 400 · 700 (블록 2개) |

같은 이름에 굵기만 다른 블록을 여러 개 등록해 두면, 화면에서 `font-weight: 700`만 써도 브라우저가 Bold 파일을 고른다.

**② 역할 변수 4개 — `:root` 안에.** ①에서 등록한 이름 + 대체 글꼴(그 글꼴을 못 불러왔을 때 쓸 것) 목록이다.
**생성기(K1)는 `tokens.json`의 `font` 묶음을 만들지 않는다 — 이 넷은 여기서 직접 쓴다.**

```css
:root {
  --font-display: "Do Hyeon", "Black Han Sans", "Malgun Gothic", sans-serif;
  --font-body: …;     /* 나머지 셋 — 대체 목록은 design/handoff-v1/assets/fonts/README.md */
  --font-mono: …;
  --font-pixel: …;
}
```

| 역할 변수 | 글꼴 | 쓰는 곳 |
|---|---|---|
| `--font-display` | Do Hyeon | 화면 제목 · 창 머리 · 탭 · 버튼 |
| `--font-body` | Nanum Gothic | 본문 · 표 · 라벨 — **본문은 절대 도현으로 쓰지 않는다** |
| `--font-mono` | Nanum Gothic Coding | 번호 · 종족값 · 배율(숫자 열) |
| `--font-pixel` | Silkscreen | "POKESIX"(700) · GEN 뱃지 · 슬롯 번호(400 — 700은 숫자 4가 뭉개진다) |

**⚠ 같은 이름 함정**: 역할 변수 **`--font-display`**(우리가 지은 이름 — "제목용 글꼴")와 `@font-face` 안의 CSS 속성 **`font-display`**("파일이
오기 전에 글자를 어떻게 보일까" — 값은 `swap` · `block` 같은 정해진 단어)는 **이름만 같고 아무 관계가 없다.**

**연결**: `main.tsx`에서 `import "./styles/tokens.css"`와 `import "./styles/fonts.css"`를 한 번씩 — 앱 전체에 적용된다.

**제출물**: `src/styles/fonts/`(TTF 8 + OFL 4) · `src/styles/fonts.css` · `main.tsx`의 import 두 줄

**통과 조건**
- [ ] `App.tsx`에 `<h1 style={{ fontFamily: "var(--font-display)" }}>도감 백과</h1>`를 잠깐 넣으면 도현으로 보인다(나머지 셋도 같은 식으로)
- [ ] 나눔고딕 `font-weight: 400 / 700 / 800`이 서로 다른 굵기로 보인다
- [ ] 오프라인에서도 보인다 — `npm run electron:start` 창의 개발자 도구 → Network에서 글꼴 요청 주소가 전부 `app://pokesix/…`(바깥 주소 0개). 또는 스로틀링 **Offline** + `Ctrl+R`(PC 네트워크는 끄지 않는다)
- [ ] 글꼴 이름 문자열(`"Do Hyeon"` · `"Nanum Gothic"` …)이 `fonts.css` **한 파일에만** 나온다:
  `grep -rn "Do Hyeon\|Nanum Gothic\|Silkscreen" src --include=*.tsx --include=*.css | grep -v src/styles/fonts.css` → 비어 있음

**힌트**: [MDN `@font-face`](https://developer.mozilla.org/ko/docs/Web/CSS/@font-face). 글꼴을 `src/` 아래에 두고 CSS에서 상대 경로로
가리키면 Vite가 빌드에 넣어 준다(`public/`에 두면 경로를 `/fonts/…`처럼 써야 하고 빌드 때 이름에 해시가 안 붙는다)

---

## 문제 K3 — 라이트 · 다크 · 시스템

**배경**: Qt판처럼 테마를 **라이트 / 다크 / 시스템 따라가기** 셋 중에서 고른다. 고른 값은 다음 실행에도 남는다.

**구현할 것**: `<html data-theme="light|dark">`를 정하는 작은 모듈과, 테마를 고르는 임시 버튼 셋(자리는 R5에서 앱 막대로 옮긴다).

**통과 조건**
- [ ] 버튼 셋으로 라이트 · 다크 · 시스템을 바꾸면 바탕 · 글자 · 선 색이 즉시 바뀐다
- [ ] "시스템"일 때 우분투 설정에서 다크/라이트를 바꾸면 **앱을 다시 켜지 않아도** 따라 바뀐다
- [ ] 다크로 두고 앱을 껐다 켜면 다크로 뜬다 — 그리고 켜지는 순간 **라이트가 번쩍 보였다가 바뀌지 않는다**
- [ ] 테마 결정 로직(저장값 + 시스템 설정 → 실제 테마)은 순수 함수로 떼어 테스트가 있다

**제약**: 다크 값은 v3가 전부 정했다 — 손으로 고치지 않는다(바꾸고 싶으면 디자인 요청). 처음 실행(저장값 없음)의 기본값은 **시스템 따라가기**(사용자 결정 2026-10-26)

**힌트**: `matchMedia('(prefers-color-scheme: dark)')` + `change` 이벤트 · `localStorage`.
"번쩍" 문제는 React가 그려지기 **전에** 속성을 붙여야 풀린다 — `index.html`에서 할 수 있는 일을 생각해 보기

---

## 문제 K4 — 토큰 견본 화면

**배경**: 토큰이 맞게 들어갔는지 눈으로 확인하는 화면. 지금 `App.tsx`의 데모(도감 번호 목록)를 이 화면으로 바꾼다. R5에서 진짜 화면이 생기면 지운다.

**만들 것**

```
┌────────────────────────────────────────────────────────────────┐
│ POKESIX  토큰 견본                       [라이트][다크][시스템] │  ← 워드마크(Silkscreen 700) · 제목(도현)
├────────────────────────────────────────────────────────────────┤
│ 색                                                             │
│ [■ red][■ red-deep][■ red-tint] …   (칸마다 이름 · 값)         │
│ 타입                                                           │
│ [노][불][물][풀] … 18개 — 채움색 + 글자색                      │
│ 글꼴                                                           │
│ 도현 28  세대별 정주행을 위한 도감 · 파티 도우미               │
│ 나눔고딕 14  본문은 이 글꼴이에요. 가나다 ABC 123               │
│ 나눔고딕코딩 13  No.025  HP 100  ×4  ½                         │
│ Silkscreen  GEN 4  01 02 03                                    │
└────────────────────────────────────────────────────────────────┘
```

**통과 조건**
- [ ] 라이트는 v1 `00_foundations.png`, 다크는 v3 `61_dark_foundations.png`와 나란히 놓고 봤을 때 색 · 글꼴이 같다
- [ ] 다크로 바꾸면 바탕 · 글자 · 선이 바뀌고 타입 칩은 그대로다
- [ ] 아래 명령의 결과가 **비어 있다** — 화면 코드에 색 값이 직접 없다
  ```bash
  grep -rnE "#[0-9a-fA-F]{3,8}\b" src --include=*.tsx --include=*.css | grep -v "src/styles/tokens.css"
  ```
- [ ] Vite 템플릿의 `index.css` · `App.css` 기본 스타일(가운데 정렬 · 보라 링크 등)이 남아 있지 않다
- [ ] `npm run check` 통과

**제약**: 색 견본 목록을 손으로 44줄 적지 않는다 — 토큰 데이터에서 만들어 낸다(K1 결과를 어떻게 화면에서도 쓸지)

**힌트**: 타입 칩처럼 같은 모양이 반복되면 작은 컴포넌트로 · `style={{ background: 'var(--type-fire)' }}`처럼 CSS 변수는 인라인 스타일에서도 쓸 수 있다

---

## R4 완료

K1–K4 통과 조건을 채우면 알려 주기 — 커밋은 Claude가 한다.
그다음 **R5: 앱 셸 + 홈** — 세대 쇼윈도를 없애고 메뉴를 세로로 놓는 새 홈(사용자 설계).
