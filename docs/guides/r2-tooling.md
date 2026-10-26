# R2 — 도구: 포맷 · 린트 · 테스트 · 디버깅

> 커밋 footer `Refs: R2` · 이미 설치됨: VS Code 확장 6개, `vitest` · `@vitest/ui`
> TS 6은 strict가 기본으로 켜져 있다(확인함 — `tsconfig`에 줄이 없어도 엄격)

R3부터 매일 쓸 개발 환경을 완성하는 단계다. 문제 4개.

---

## 문제 T1 — 저장하면 정리되는 코드

**만들 것**: 어떤 파일을 열어 들여쓰기 · 따옴표 · 세미콜론을 엉망으로 만든 뒤 **저장하면 저절로 정리**되고,
ESLint가 고칠 수 있는 문제도 저장 때 고쳐지는 편집 환경.

**통과 조건**
- [ ] `App.tsx`의 들여쓰기를 망가뜨리고 저장 → 원래대로 정리된다
- [ ] `npm run format:check`가 통과한다 (`format` · `format:check` 스크립트 존재)
- [ ] `npm run lint`가 통과하고, ESLint와 포맷터가 같은 줄을 서로 반대로 고치지 않는다
- [ ] `npm run format`을 돌려도 `design/` · `docs/`는 **한 글자도 안 바뀐다** (`git status`로 확인)

**제약**
- 포맷 규칙은 **리포 파일**로(`.prettierrc.json` 등) — 개인 VS Code 설정에만 두면 다른 머신에서 다르게 포맷된다
- `.vscode/settings.json`(리포 공유)은 아직 C++/CMake 내용 → 이 리포에 필요한 것만 남긴다

**힌트**: Prettier · `eslint-config-prettier`(flat config는 `/flat` 경로) · `.prettierignore` ·
VS Code `editor.formatOnSave` · `editor.codeActionsOnSave`의 `source.fixAll.eslint`.
따옴표 · 세미콜론 같은 스타일은 취향 — 템플릿 코드는 작은따옴표 · 세미콜론 없음이다.

---

## 문제 T2 — 첫 테스트: 도감 번호 표기

**만들 것**: 도감 화면 곳곳에 쓸 표기 함수와 그 테스트.

```
formatDexNumber(1)    → "No.001"
formatDexNumber(25)   → "No.025"
formatDexNumber(493)  → "No.493"
formatDexNumber(1025) → "No.1025"
```

**통과 조건**
- [ ] 위 네 경우를 확인하는 테스트가 있고 통과한다
- [ ] `npm test`(저장할 때마다 다시 도는 모드) · `npm run test:run`(한 번 돌고 끝) 둘 다 있다
- [ ] VS Code **Testing 패널**에 테스트가 보이고 ▶로 돌고, 🐞로 돌리면 함수 안 중단점에서 멈춘다
- [ ] `npm run test:ui`가 브라우저에 결과 화면을 띄운다

**제약**
- 함수는 화면 코드와 분리된 파일에(`src/shared/` 같은 곳). 테스트 파일은 대상 옆에 `*.test.ts`
- 0 · 음수는 이번엔 안 다룬다(호출하는 쪽이 1 이상만 넘긴다고 가정)

**힌트**: [Vitest — Getting Started](https://vitest.dev/guide/) · `describe` / `it` / `expect().toBe()` · `String.prototype.padStart`

---

## 문제 T3 — 브라우저 코드에 중단점

**만들 것**: 카운터 버튼을 누르는 순간 VS Code가 **`App.tsx`의 그 줄에서 멈추고** 현재 `count` 값을 보여 주는 디버그 구성.
그리고 브라우저 개발자 도구에서 `App` 컴포넌트의 state를 들여다볼 수 있는 환경.

**통과 조건**
- [ ] F5 → 크롬이 dev 서버 주소로 뜬다
- [ ] 버튼 클릭 → `.tsx` 파일의 중단점에서 멈추고, 변수 패널에 `count`가 보인다
- [ ] 크롬 F12의 **Components** 탭(React Developer Tools)에서 `App`의 state가 보이고, 거기서 값을 바꾸면 화면도 바뀐다

**제약**
- `.vscode/launch.json`은 **개인 파일**(git 제외) — 지금 들어 있는 Qt gdb 구성은 지워도 된다
- dev 서버 포트가 실행할 때마다 달라지면(5173 → 5174) 디버그 구성이 깨진다 → 포트를 고정한다

**힌트**: VS Code 내장 JS 디버거의 `"type": "chrome"` 구성 · Vite `server.port` · `server.strictPort`

---

## 문제 T4 — 커밋 전 점검 한 줄

**만들 것**: 커밋 전에 치는 명령 한 줄이 **타입 · 린트 · 포맷 · 테스트**를 전부 확인한다.

**통과 조건**
- [ ] `npm run check`(이름은 자유) 하나로 네 가지가 차례로 돌고, 하나라도 실패하면 거기서 멈춘다
- [ ] 일부러 타입 에러를 하나 넣으면 `check`가 실패하고, 빼면 통과한다

**힌트**: `tsc -b --noEmit` · npm 스크립트에서 `&&`

---

## R2 완료

네 문제의 통과 조건을 다 채우면 `git status`와 함께 알려 주기 — 커밋은 Claude가 한다.
