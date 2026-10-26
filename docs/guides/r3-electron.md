# R3 — 데스크톱 셸 (Electron)

> 커밋 footer `Refs: R3` · 사용자 결정(2026-10-26): **메인 플랫폼은 데스크톱**, 셋업도 직접
> 참고 구성: `~/ws/src/robot-engineering-studio/res_app` — `platforms/electron/`(main.ts · tsconfig.json · electron-builder.yml)과
> `package.json`의 `electron:*` 스크립트. **베끼지 말고 읽고 이해한 뒤 PokeSix에 맞게** 쓴다

지금의 웹 앱(`dist/`)을 **그대로** 데스크톱 창에 담는다. 렌더러(React 화면)는 웹 빌드와 한 글자도 다르지 않고,
Electron 쪽 코드(메인 프로세스)는 "창을 띄우고 그 안에 앱을 싣는 일"만 한다.

```
platforms/electron/
├ main.ts            메인 프로세스 — 창 · 앱 수명주기 · (나중에) 파일 시스템 접근
├ tsconfig.json      main.ts 전용 컴파일 설정 — 결과는 dist-electron/
└ electron-builder.yml   설치본 만들기 설정 (E4)
platforms/assets/icon.png   앱 아이콘 (E4)
```

문제 4개 + 선택 1개.

---

## 문제 E1 — 개발 창: 데스크톱에서 HMR

**배경**: 앞으로 화면을 만들 때 브라우저 대신 **데스크톱 창**을 켜 놓고 작업한다. 저장하면 창이 바로 바뀌어야 한다(지금 브라우저에서처럼).

**구현할 것**
- `platforms/electron/main.ts` — 창 하나를 띄우고 그 창에 **dev 서버 주소**를 싣는다
- `platforms/electron/tsconfig.json` — main.ts를 `dist-electron/main.js`로 컴파일
- `package.json` 스크립트 `electron:dev` — main.ts를 컴파일하고 Electron을 dev 서버 주소와 함께 띄운다

```
┌ PokeSix ───────────────────────────────── _ □ x ┐
│                                                 │   제목: PokeSix
│   No.001                                        │   크기: 1440 × 900 (디자인 기준 크기)
│   No.025                                        │   최소: 1024 × 640 (이보다 작게 못 줄임)
│   …                                             │   메뉴 막대(File · Edit …) 없음
└─────────────────────────────────────────────────┘
```

**통과 조건**
- [ ] 터미널 1: `npm run dev`, 터미널 2: `npm run electron:dev` → 위 모양의 창이 뜬다
- [ ] `App.tsx`를 고치고 저장하면 **창이 새로고침 없이** 바뀐다
- [ ] 창 안에서 `Ctrl+Shift+I`로 개발자 도구가 열린다
- [ ] 창을 닫으면 Electron 프로세스가 끝난다(터미널이 돌아온다)
- [ ] `npm run typecheck`가 main.ts까지 검사한다(main.ts에 일부러 타입 에러를 넣으면 실패)

**제약**
- 메인 프로세스와 화면 사이는 **잠근다**: `contextIsolation: true` · `sandbox: true` · `nodeIntegration: false`.
  화면 코드(React)에서 Node API를 직접 쓰지 않는다 — 파일 접근이 필요해지면(세이브 파일) 그때 preload로 좁게 연다
- `electron`은 devDependency로(전역 설치 금지)
- dev 서버 주소를 main.ts에 박아 넣지 않는다 — 스크립트에서 인자로 넘긴다(res_app의 `--dev-url=` 참고)

**힌트**: [Electron — Quick Start](https://www.electronjs.org/docs/latest/tutorial/quick-start) · `BrowserWindow`(`width` · `minWidth` · `autoHideMenuBar` · `webPreferences`) ·
`app.whenReady()` · `window-all-closed`. main.ts는 Node 쪽 코드라 tsconfig의 `types`에 `node`, `module`은 `nodenext`.
`package.json`의 `"main"` 필드가 Electron이 처음 실행할 파일이다

---

## 문제 E2 — 빌드본 실행: 서버 없이

**배경**: 설치본은 dev 서버 없이 `dist/`(빌드 결과)를 창에 싣는다. 지금 `dist/index.html`을 그냥 파일로 열면 **흰 화면**이 뜬다 — 왜 그런지 알아내고 고치는 문제다.

**구현할 것**: 스크립트 `electron:start` — 웹 빌드 + main.ts 컴파일 + dev 서버 없이 창 띄우기.
main.ts는 dev 주소 인자가 **없으면** `dist/`를 싣는다.

**통과 조건**
- [ ] `npm run dev`를 끈 상태에서 `npm run electron:start` → E1과 같은 화면이 뜬다
- [ ] 개발자 도구 Console · Network에 실패한 요청(빨간 줄)이 없다
- [ ] 와이파이를 끄고도 뜬다(지금 화면은 네트워크가 필요 없다)

**제약**: 다음 단계들에서 **페이지 주소**(`/dex`, `/squad` 같은 라우터 경로)가 생긴다. 그 주소에서 새로고침해도 흰 화면이 되지 않는 방식이어야 한다

**힌트**: 흰 화면의 원인은 개발자 도구 Console에 나온다 — `index.html`이 `/assets/…`를 어디서 찾고 있는지 보기.
고치는 길은 두 가지다:

| 방법 | 장점 | 단점 |
|---|---|---|
| ① `win.loadFile(…)` + Vite `base: './'` | 코드가 짧다 | `file://`에서는 `/dex` 같은 주소가 진짜 파일 경로가 되어 새로고침하면 깨진다 → 라우터를 해시 방식(`/#/dex`)으로 써야 한다 |
| ② 앱 전용 주소(`app://pokesix/…`)를 `protocol.handle`로 만들고 `dist/`의 파일을 돌려준다, 없는 경로는 `index.html` | 웹과 똑같은 주소 체계 — 라우터를 그대로 쓴다 | 코드가 길다 |

res_app은 ②다(`serveDist`). 위 제약 때문에 **②를 추천** — 어느 쪽이든 고른 이유를 말할 수 있으면 통과

---

## 문제 E3 — 바깥 링크는 바깥에서

**배경**: 화면에 PokéAPI · 출처 링크 같은 **외부 주소**가 생긴다. 그걸 누르면 앱 창이 그 사이트로 넘어가 버리면 앱으로 돌아올 길이 없다.

**구현할 것**: 외부 링크(`http(s)://`로 시작하고 앱 주소가 아닌 것)는 **시스템 기본 브라우저**에서 열고, 앱 창은 그대로 둔다.

**통과 조건**
- [ ] `App.tsx`에 `<a href="https://pokeapi.co" target="_blank">PokéAPI</a>`를 잠깐 넣고 누르면 → 크롬(기본 브라우저)이 열리고 앱 창은 그대로
- [ ] `target` 없이 `<a href="https://pokeapi.co">`로 바꿔 눌러도 → 마찬가지
- [ ] 확인이 끝나면 그 링크는 지워도 된다

**힌트**: 새 창 요청은 `webContents.setWindowOpenHandler`, 같은 창 이동은 `will-navigate` 이벤트 · `shell.openExternal`

---

## 문제 E4 — 설치본

**배경**: 다른 사람(또는 Windows 머신)에게 줄 수 있는 실행 파일. Linux에서는 **AppImage**(받아서 실행 권한만 주면 되는 단일 파일).

**구현할 것**
- `platforms/electron/electron-builder.yml` · 스크립트 `electron:dist`
- 앱 아이콘 `platforms/assets/icon.png` — Qt판의 마크를 쓴다:
  `~/ws/src/PokeSix-qt6/resources/icons/app/linux/hicolor/1024x1024/apps/pokesix.png` (게임 에셋이 아니라 디자인 핸드오프의 오리지널 마크)

**통과 조건**
- [ ] `npm run electron:dist` → `release/` 아래에 `PokeSix-<버전>-<…>.AppImage`가 생긴다
- [ ] 그 파일을 실행하면 E2와 같은 화면이 뜨고, 창 · 작업 표시줄에 **캡슐 마크 아이콘**이 보인다
- [ ] 설치본 안에 `node_modules`가 통째로 들어가지 않는다(설치본 크기가 100MB 남짓 — Electron 자체 크기)
- [ ] `release/` · `dist-electron/`이 git에 안 잡힌다(이미 .gitignore에 있음 — `git status`로 확인)

**제약**: `appId`는 역도메인 형식(예: `io.github.reidlo5135.pokesix`). 설치본 이름에 npm 이름 대신 앱 이름(PokeSix)

**힌트**: [electron-builder 설정](https://www.electron.build/configuration) — `files` · `directories.output` · `linux.target` · `extraMetadata.main` · `artifactName`.
res_app의 yml이 거의 그대로 쓸 수 있는 모양이다(이름 · 아이콘 · 카테고리만 다르다)

---

## 문제 E5 (선택) — 메인 프로세스 디버깅

**배경**: 화면 코드는 크롬 디버그(R2 T3)로 멈출 수 있다. 메인 프로세스(main.ts)는 별개의 Node 프로세스라 따로 붙어야 한다.

**통과 조건**
- [ ] VS Code에서 F5 한 번으로 Electron이 뜨고, `main.ts`의 `createWindow` 안 중단점에서 멈춘다

**힌트**: launch.json에 `"type": "node"` · `"runtimeExecutable"`에 프로젝트의 electron · 소스맵(tsconfig `sourceMap: true`)

---

## R3 완료

E1–E4 통과 조건을 채우면 `git status`와 함께 알려 주기 — 커밋은 Claude가 한다.
그다음이 **R4 디자인 토큰**(팔레트 · Do Hyeon 등 글꼴) — 데스크톱 창에서 바로 확인하며 만든다.
