# R2 — 도구 정리: 포맷 · 린트 · 테스트 · 디버깅

> 커밋 footer `Refs: R2` · 확장 6개와 `vitest` · `@vitest/ui` 설치는 이미 끝남(사용자)
> 이 단계가 끝나면: **저장하면 정리되고, 실수는 빨간 줄로 뜨고, 테스트는 ▶로 돌고, 중단점에서 멈춘다**

## 목적

R3부터 화면을 만들기 시작하면 매일 쓰는 도구다. Qt 때로 치면 clang-format · clang-tidy · gtest(Testing 패널) · gdb를
처음에 세팅해 둔 것과 같다. 한 번 맞춰 두면 다시 안 건드린다.

| Qt / C++ 시절 | 여기서 | 설정 파일 |
|---|---|---|
| `clang-format` + `.clang-format` | **Prettier** | `.prettierrc.json` |
| `clang-tidy` | **ESLint** (템플릿에 이미 있음) | `eslint.config.js` |
| `-Werror` 수준의 타입 검사 | **TypeScript strict** (TS 6은 기본으로 켜져 있음 — Claude가 확인) | `tsconfig.app.json` |
| gtest + ctest + Testing 패널 | **Vitest** + Vitest 확장 | `vite.config.ts`의 `test` |
| gdb + launch.json(cppdbg) | 크롬 + VS Code 내장 JS 디버거 | `.vscode/launch.json`(개인) |

---

## 미션 T1 — Prettier: 저장하면 정리

| # | 무엇을 | 어디서 | 언제 |
|---|---|---|---|
| ① | `npm i -D prettier eslint-config-prettier` | 터미널 | 한 번 |
| ② | 포맷 규칙 파일 만들기(아래) | `.prettierrc.json` (루트, 새로) | — |
| ③ | ESLint와 Prettier가 싸우지 않게: `eslint.config.js`의 `extends` **맨 끝**에 `eslintConfigPrettier` 추가 | `eslint.config.js` | — |
| ④ | npm 스크립트 두 줄: `"format": "prettier --write ."`, `"format:check": "prettier --check ."` | `package.json`의 `scripts` | — |
| ⑤ | 전체 한 번 정리: `npm run format` | 터미널 | 한 번 |

```jsonc
// .prettierrc.json — 템플릿 코드의 모양(작은따옴표 · 세미콜론 없음)에 맞춘 예. 취향대로 바꿔도 된다
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100
}
```

```js
// eslint.config.js — ③ 전/후
import eslintConfigPrettier from 'eslint-config-prettier/flat'   // ← 새로 (맨 위 import들 사이)
…
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      eslintConfigPrettier,                                        // ← 새로 — 반드시 맨 끝
    ],
```

**왜 맨 끝인가**: ESLint에도 "따옴표는 이렇게" 같은 모양 규칙이 있어서 Prettier와 서로 반대로 고치려 들 수 있다.
`eslint-config-prettier`는 **그런 규칙들을 끄는** 설정이라, 다른 설정들 뒤에 와야 앞에서 켠 것을 끈다(뒤에 온 설정이 이긴다).

`design/`(핸드오프 원본)과 `docs/`는 포맷하면 안 된다 → 루트에 `.prettierignore`를 만들고 두 줄: `design`, `docs`.
(Qt 때 `clang-format -i tests/**/**/*.*`가 CSV를 망가뜨린 것과 같은 사고 방지)

---

## 미션 T2 — VS Code: 저장 시 자동으로

`.vscode/settings.json`(리포 공유)은 아직 C++/CMake 내용이다 — **통째로 바꾼다.**

```jsonc
// .vscode/settings.json — 후
{
  // 리포 공유 설정 — 모든 머신에 같이 적용된다
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"          // 저장할 때 ESLint가 고칠 수 있는 것은 고친다
  },
  "typescript.tsdk": "node_modules/typescript/lib"   // 전역 TS 말고 프로젝트의 TS 6 사용
}
```

**✅ 확인**: `App.tsx`에서 들여쓰기를 일부러 엉망으로 하고 저장 → 저절로 정리되면 성공.

---

## 미션 T3 — Vitest: 첫 테스트

**목적**: 로직(나중에 세이브 파서 · PokéAPI 응답 변환)을 화면 없이 확인하는 틀. 첫 테스트는 아주 작은 순수 함수로.

| # | 무엇을 | 어디서 | 언제 |
|---|---|---|---|
| ① | 스크립트 세 줄: `"test": "vitest"`, `"test:run": "vitest run"`, `"test:ui": "vitest --ui"` | `package.json` | — |
| ② | 도감 번호 꾸미기 함수: `formatDexNumber(25)` → `"No.025"` | `src/shared/dex.ts` (새로) | — |
| ③ | 그 함수의 테스트 | `src/shared/dex.test.ts` (새로) | — |
| ④ | `npm test` (지켜보기 모드 — 저장할 때마다 다시 돈다) | 터미널 | 개발 중 켜 둠 |
| ⑤ | Testing 패널(플라스크 아이콘)에서 ▶ · 🐞(디버그) 눌러 보기 | VS Code | — |

```ts
// src/shared/dex.ts — 함수 모양 (본문은 직접)
export function formatDexNumber(id: number): string {
  // 세 자리로 0을 채운다: 1 → "No.001", 25 → "No.025", 493 → "No.493", 1025 → "No.1025"
  // 힌트: String(id).padStart(…)
}
```

```ts
// src/shared/dex.test.ts — gtest와 거의 같은 모양
import { describe, expect, it } from 'vitest'
import { formatDexNumber } from './dex'

describe('formatDexNumber', () => {          // ≈ TEST 스위트 이름
  it('세 자리로 0을 채운다', () => {          // ≈ TEST(…, 이름)
    expect(formatDexNumber(25)).toBe('No.025') // ≈ EXPECT_EQ(formatDexNumber(25), "No.025")
  })
  // 1 · 493 · 1025 경우도 직접 추가
})
```

| gtest | Vitest |
|---|---|
| `TEST(Suite, Name)` | `describe('Suite', …)` 안에 `it('Name', …)` |
| `EXPECT_EQ(a, b)` | `expect(a).toBe(b)` (객체 · 배열 비교는 `toEqual`) |
| `EXPECT_TRUE(x)` | `expect(x).toBe(true)` |
| `ctest -R Name` | `npx vitest -t Name` 또는 Testing 패널 |
| 테스트 파일은 `tests/`에 따로 | **같은 폴더에 `*.test.ts`** 로 나란히 두는 게 관례 |

**✅ 확인**: `npm run test:run` 통과 · Testing 패널에 테스트가 보이고 ▶가 초록 · `npm run test:ui`가 브라우저에 결과 화면을 띄운다.

---

## 미션 T4 — 디버깅: 크롬에서 중단점

`.vscode/launch.json`(개인 파일 — git 제외)은 아직 Qt gdb 구성이다. **통째로 바꾼다.**

```jsonc
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "크롬으로 디버깅",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",      // npm run dev가 알려 주는 주소로
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

| # | 무엇을 | 언제 |
|---|---|---|
| ① | `npm run dev` 켜 두기 | 먼저 |
| ② | `App.tsx`의 `onClick` 안(`setCount` 줄)에 중단점(줄 번호 왼쪽 클릭) | — |
| ③ | F5 → 크롬이 뜸 → 버튼 클릭 → VS Code가 그 줄에서 멈춤, 왼쪽에 `count` 값 | 매번(디버깅할 때) |
| ④ | 크롬에 **React Developer Tools** 설치 → F12 → Components 탭에서 `App`의 state 보기 | 한 번 |

**포트**: 5173이 다른 프로젝트(res_app 등)에 잡혀 있으면 5174가 된다. 고정하고 싶으면 `vite.config.ts`에
`server: { port: 5180, strictPort: true }` — 이러면 launch.json의 주소도 늘 같다.

---

## 마지막 — 정리 스크립트 한 줄

`package.json`에 `"typecheck": "tsc -b --noEmit"`을 더하면 커밋 전 점검이 이렇게 된다:

```bash
npm run typecheck && npm run lint && npm run format:check && npm run test:run
```

(Qt 때의 `scripts/linux/build.sh`가 빌드 + 테스트를 한 번에 돌리던 것과 같다.)

## R2 완료 조건

- [ ] 저장하면 Prettier가 정리하고, ESLint 문제가 빨간 줄(Error Lens로 줄 끝)에 뜬다
- [ ] `npm run test:run` 통과, Testing 패널에서 ▶ · 🐞 동작
- [ ] F5로 크롬이 뜨고 `.tsx` 중단점에서 멈춘다
- [ ] 위 정리 스크립트 한 줄이 전부 통과

끝나면 `git status`와 함께 알려 주기 — 커밋은 Claude가 한다.
