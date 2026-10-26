# R4 — 디자인 토큰: 팔레트 · 글꼴 · 테마

> 커밋 footer `Refs: R4` · 이 단계가 끝나면 **화면 코드에 색 · 글꼴 값이 한 번도 직접 나오지 않는다** — 전부 토큰 이름으로

## 디자인이 정해 둔 것은 어디에 있나

| 무엇 | 어디 | 읽는 법 |
|---|---|---|
| **팔레트 · 크기 · 간격 · 글꼴 (기계용)** | [`design/handoff-v2/design/tokens.json`](../../design/handoff-v2/design/tokens.json) | **이게 원본이다.** v1 json에 v2 추가분(캡슐 · 인트로 · 메뉴 색, 인트로 크기)을 더한 것 — 기존 값 변경은 없다. `color.light`(53색) · `color.darkOverrides`(다크에서 바뀌는 11색) · `type`(타입 18색) · `font` · `size` · `space` · `breakpoint` · `mark`(마크 기하 — CSS에는 안 씀) |
| 같은 내용의 설명 (사람용) | [`01_DESIGN_SHEET.md`](../../design/handoff-v1/docs/01_DESIGN_SHEET.md) §1–4 | 토큰마다 **어디에 쓰는 색인지**가 적혀 있다 — 이름만 보고 모르겠으면 여기 |
| v2에서 더해진 토큰의 설명 | [`01b_DESIGN_SHEET_V2.md`](../../design/handoff-v2/docs/01b_DESIGN_SHEET_V2.md) §1 | 캡슐 마크 색 · 인트로 색(`intro.*` · `menu.pressed`)을 어디에 쓰나. `capsule.gloss`는 json에 `#FFFFFF`로만 있고 표에는 "60%" — 투명도는 쓰는 쪽에서 |
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
- `scripts/build-tokens.ts`(또는 `.mjs`) — `design/handoff-v2/design/tokens.json`을 읽어 `src/styles/tokens.css`를 쓴다
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

**만들어질 파일 모양**

```css
/* 자동 생성 — 직접 고치지 말 것. 원본: design/handoff-v2/design/tokens.json (npm run tokens) */
:root {
  --color-red: #D8322B;
  --color-red-deep: #B8241D;
  …
}
[data-theme="dark"] {
  --color-paper: #1B1B21;
  …(darkOverrides 11개만)
}
```

**통과 조건**
- [ ] `npm run tokens` → `src/styles/tokens.css`가 생기고, 위 표의 이름 규칙대로 **json의 모든 항목**이 들어 있다
- [ ] 변환 함수 테스트: `"red.deep"` → `"--color-red-deep"`, `"appBar"` → `"--size-app-bar"` 등 규칙마다 한 줄 이상
- [ ] 같은 json으로 두 번 돌리면 결과 파일이 **한 글자도 안 바뀐다**(git diff 없음)
- [ ] v2의 추가 토큰(`intro.stripe` · `menu.pressed` · `capsule.*` · `introMenuWidth` …)도 들어 있다
- [ ] `mark` 블록(마크 기하)은 CSS로 내보내지 않는다 — 스크립트가 **모르는 블록은 건너뛴다**

**제약**: `design/` 안의 파일은 고치지 않는다(원본 스냅샷). 생성된 tokens.css는 커밋한다(빌드 때마다 만들지 않아도 되게)

**힌트**: Node의 `fs.readFileSync` · `JSON.parse` · 문자열 `replace(/([A-Z])/g, …)`. TS로 쓰면 `npx tsx scripts/build-tokens.ts`로 바로 실행된다(`tsx`는 devDependency)

---

## 문제 K2 — 글꼴 네 개

**배경**: 사용자 PC에 도현 · 나눔고딕이 깔려 있다는 보장이 없다. 앱이 글꼴을 **직접 들고 다닌다**(오프라인 데스크톱 앱이니 구글 폰트 CDN에 기대지 않는다).

**구현할 것**: 글꼴 파일 · 라이선스를 리포로 가져오고 `@font-face`로 등록, 역할별 글꼴 토큰.

| 역할 토큰 | 글꼴 | 쓰는 곳 |
|---|---|---|
| `--font-display` | Do Hyeon 400 | 화면 제목 · 창 머리 · 탭 · 버튼 |
| `--font-body` | Nanum Gothic 400 · 700 · 800 | 본문 · 표 · 라벨 — **본문은 절대 도현으로 쓰지 않는다** |
| `--font-mono` | Nanum Gothic Coding 400 · 700 | 번호 · 종족값 · 배율 (숫자 열) |
| `--font-pixel` | Silkscreen 400(숫자) · 700(워드마크만) | "POKESIX" · GEN 뱃지 · 슬롯 번호 |

**통과 조건**
- [ ] 와이파이를 끈 상태의 `npm run electron:start`에서도 네 글꼴이 다 보인다
- [ ] 개발자 도구 Network에 `.ttf`(또는 변환한 `.woff2`) 요청이 **실패 없이** 보인다
- [ ] 글꼴을 못 불러오면 어색하지 않은 대체 글꼴로 떨어진다(대체 목록: 핸드오프 `assets/fonts/README.md`)
- [ ] `OFL-*.txt` 네 개가 글꼴 옆에 있다

**제약**: 글꼴 이름 문자열(`"Do Hyeon"` 등)은 **토큰 파일 한 곳**에만 나온다

**힌트**: [MDN `@font-face`](https://developer.mozilla.org/ko/docs/Web/CSS/@font-face) — `font-family` · `src: url(…)` · `font-weight` · `font-display: swap`.
글꼴을 `src/` 아래에 두고 CSS에서 상대 경로로 가리키면 Vite가 빌드에 넣어 준다(`public/`과의 차이를 알아 두기)

---

## 문제 K3 — 라이트 · 다크 · 시스템

**배경**: Qt판처럼 테마를 **라이트 / 다크 / 시스템 따라가기** 셋 중에서 고른다. 고른 값은 다음 실행에도 남는다.

**구현할 것**: `<html data-theme="light|dark">`를 정하는 작은 모듈과, 테마를 고르는 임시 버튼 셋(자리는 R5에서 앱 막대로 옮긴다).

**통과 조건**
- [ ] 버튼 셋으로 라이트 · 다크 · 시스템을 바꾸면 바탕 · 글자 · 선 색이 즉시 바뀐다
- [ ] "시스템"일 때 우분투 설정에서 다크/라이트를 바꾸면 **앱을 다시 켜지 않아도** 따라 바뀐다
- [ ] 다크로 두고 앱을 껐다 켜면 다크로 뜬다 — 그리고 켜지는 순간 **라이트가 번쩍 보였다가 바뀌지 않는다**
- [ ] 테마 결정 로직(저장값 + 시스템 설정 → 실제 테마)은 순수 함수로 떼어 테스트가 있다

**제약**: 타입 색 · 히트맵 색은 다크에서도 그대로(디자인 규칙). 다크 값이 없는 토큰(`red.tint` 등 33개)은 **이번엔 라이트 값 그대로** 두고, 어색한 곳 목록만 적어 둔다 — 다크 다듬기는 화면이 생긴 뒤에 한다

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
- [ ] `00_foundations.png`와 나란히 놓고 봤을 때 색 · 글꼴이 같다
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
