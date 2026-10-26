# R1 — Vite로 React + TypeScript 스캐폴드

> 커밋 footer `Refs: R1` · 작업 위치: `~/ws/src/PokeSix` (지금 폴더 그대로)
> node v24.19 · npm 11.17이 이미 깔려 있다 — 설치할 것 없음

## 목적

빈 폴더에서 **돌아가는 React 앱 한 장**까지. 기능을 만들기 전에, 생성된 파일이 각각
무슨 역할인지 몸으로 익히는 단계다.

## 먼저 읽을 것 (30분)

| 문서 | 왜 |
|---|---|
| [react.dev — Quick Start](https://react.dev/learn) | 컴포넌트 · JSX가 뭔지 첫 감 |
| [Vite — 시작하기](https://vitejs.dev/guide/) | 지금 칠 명령이 뭘 만드는지 |
| [MDN — HTML 기본](https://developer.mozilla.org/ko/docs/Learn/Getting_started_with_the_web/HTML_basics) | index.html을 읽을 수 있게 |

## 할 일

| # | 무엇을 | 명령 / 위치 | 언제 |
|---|---|---|---|
| ① | 스캐폴드 생성 | `npm create vite@latest . -- --template react-ts` | 한 번 |
| ② | 프롬프트 답하기 | 아래 ⚠ 참고 | ①의 일부 |
| ③ | 의존성 설치 | `npm install` | 한 번 (package.json이 바뀔 때마다) |
| ④ | 개발 서버 | `npm run dev` → 브라우저로 http://localhost:5173 | 개발 내내 켜 둠 |
| ⑤ | HMR 체험 | `src/App.tsx`의 글자를 아무거나 바꿔 저장 → 브라우저가 **새로고침 없이** 바뀌는지 | 매번(저장할 때) |
| ⑥ | 프로덕션 빌드 | `npm run build` (멈춘 터미널에서) | 확인용 한 번 |

**⚠ ②의 프롬프트 — 여기서 실수하면 폴더가 날아간다**

```
Current directory is not empty. Please choose how to proceed:
  ○ Remove existing files and continue   ← 절대 금지: design/ · .git까지 지운다
  ● Ignore files and continue            ← 이걸 고른다
  ○ Cancel
Package name: … → pokesix
```

(만약 잘못 골라도 git과 `~/ws/src/PokeSix-qt6` 사본이 있어서 복구는 된다 — 그래도 고르기 전에 한 번 더 보기.)

## 생성되는 파일 — 하나씩 열어 보기

```
index.html          진짜 진입점. <div id="root">에 앱이 그려진다
src/main.tsx        root div를 찾아 <App />을 그려 넣는 곳
src/App.tsx         첫 컴포넌트 — 당분간 우리의 놀이터
src/*.css           스타일. R3에서 토큰으로 갈아엎는다
vite.config.ts      Vite 설정
tsconfig*.json      TypeScript 컴파일 설정 (strict가 켜져 있는지 확인해 보기)
package.json        의존성 + scripts (dev · build · preview)
public/             가공 없이 그대로 서빙되는 파일들
```

각 파일을 열어 "이 줄이 왜 있지?"를 한 번씩 생각해 보기. 모르는 줄은 붙여 넣고 물어보면 된다.

## 흔한 문제

| 증상 | 원인 |
|---|---|
| `Ignore files` 후 README.md를 덮어썼다 | Vite가 자기 README를 쓴다 — 우리 README는 git에 있으니 `git checkout -- README.md`로 되살린다 (.gitignore도 확인) |
| 5173 포트가 이미 사용 중 | 다른 dev 서버가 떠 있음 — 그 터미널을 끄거나 Vite가 제안하는 다음 포트 사용 |
| 브라우저가 안 바뀜 | dev 서버 터미널에 에러가 떠 있는지 먼저 — TS 에러면 화면에도 빨간 오버레이가 뜬다 |

## ✅ 완료 조건

- [ ] `npm run dev` 화면이 뜬다
- [ ] App.tsx 글자를 바꾸면 저장 즉시 반영된다
- [ ] `npm run build`가 에러 없이 끝나고 `dist/`가 생긴다
- [ ] README.md · .gitignore가 우리 것 그대로다 (`git status`로 확인)

끝나면 `git status` 출력과 함께 알려 주기 — 커밋은 Claude가 한다.
