# 작업 기록 (세션 인수인계)

여러 머신 · 여러 세션에서 이어 간다. **새 세션은 [CLAUDE.md](../CLAUDE.md) → [roadmap.md](roadmap.md) → 이 문서** 순으로 읽는다.
Qt 시절 기록은 태그 `qt6-final`의 `docs/worklog.md`에 있다.

## 지금 상태 — 2026-11-04

- **0.5.1 수준 완성(Claude, 2026-11-04)** — 모두 main에 merge:
  - 데이터 계층 · 저장소 · 셸(홈 · 설정 · 테마 · i18n) · 세이브 파서 · 번들 사전 + 빈 데이터 채우기(앞선 merge들)
  - R6 도감(`feat/r6-dex`) · R7 아이템(`feat/r7-items`) · R8 스쿼드(`feat/r8-squad`) · R10 타운맵(`feat/r10-townmap`) · 라우터 경고 수정
  - 확인: `npm run check` 통과(381 테스트) · Electron 빌드본으로 도감/아이템/스쿼드/타운맵 화면을 찍어 봄(넓은 · 좁은 배치)
  - **아직 안 옮긴 것**: 스쿼드 이미지 내보내기(클립보드 · PNG), 설정의 "그림 캐시 비우기", 디자인의 "복제" 버튼(Qt에 없던 기능 — 사용자 결정 필요). 에디터는 0.5.1처럼 빈 화면
  - 함정: Vitest 캐시(`node_modules/.vitest-cache`)가 `import.meta.glob`의 새 파일을 못 보고 옛 결과를 쓴다 → 사전 파일을 더한 뒤 i18n 테스트가 이상하면 캐시를 지운다. 실패 목록은 앞 4개만 보인다(`…(n)`이 전체 개수)
  - 중복: 기술 효과 글이 `src/pages/dex/model/moveEffect.ts`와 `src/core/rules/moveEffect.ts` 두 벌(화면을 따로 만들다 생김) — 다음에 하나로
- **데이터 계층 결정(Claude, 2026-11-04)**: REST(수천 요청)가 아니라 **Qt판과 같은 고정 커밋 CSV 54개 → SQLite(스키마 v12)**. 웹 워커가 받고(크기 · SHA-256 확인, IndexedDB에 이어 받기) sql.js로 가져와 DB 바이트를 IndexedDB에 둔다. 메인 스레드는 sql.js로 읽기 전용. 실제 CSV로 만든 DB가 Qt DB와 **36개 표 전부 줄 단위로 같음** 확인(`950dabc`). Electron `app://`는 `secure: true`(crypto.subtle).
- **릴리스 CI 교체 완료**(`2aa8934`): Electron 3-OS — AppImage(ubuntu-22.04) · msi(windows-2022) · dmg(macos-14), 서명 없음, notes 잡은 `docs/release-notes/<태그>.md` + SHA-256.
- 사양 문서(Qt판에서 뽑은 화면 · 데이터 사양 10개 + 빈 데이터 목록)는 세션 scratchpad에 있다 — 필요한 내용은 코드 · 이 문서로 옮긴다.
- **사용자 요청(2026-11-04)**: "Qt6로 했던 0.5.1 수준까지 전부 완성해 줘 · 도감 빵꾸(빈 데이터) 조사해서 채워 줘" — R4 K3부터 R11까지 Claude가 구현. 진행: ① Qt판 사양 정리 + 데이터 빈 곳 감사(워크플로) → ② 데이터 계층 설계 → ③ 기반(데이터 · 테마 · 앱 셸 · i18n) → ④ 화면들 → ⑤ 검증 · 데이터 채우기


- **R0 완료(Claude)**: React 재작성 전환. 사용자 결정 — 같은 리포 main 이어서 · TypeScript · 동결은 전부 커밋.
  - Qt 최종본: 동결 커밋 `24f9228` → main merge `dc24085` → **태그 `qt6-final`**(push 됨). 작업 사본 `~/ws/src/PokeSix-qt6`(build 제외 전체, 자체 .git 포함)
  - 작업 폴더에는 `.github` · `.vscode` · `design` · `CLAUDE.md` · `LICENSE`만 남기고 비움. 새로 쓴 것: README · .gitignore · CLAUDE.md(React판) · roadmap · 이 문서 · R1 가이드
- **R1 완료**(`2ed57c9`): Vite 8 · React 19 · TS 6(strict 기본 켜짐 — 확인함) · ESLint 10. Vite가 README · .gitignore를 덮어써서 README는 되돌리고 .gitignore는 합침. dev 서버는 5174(5173은 다른 프로젝트가 점유)
- **R2 완료**: Prettier(사용자 규칙: 2칸 · 큰따옴표 · 세미콜론 없음, `.prettierignore`로 design · docs · .github · *.md 제외) · ESLint + eslint-config-prettier · 저장 시 포맷(사용자 전역 autoSave=afterDelay가 formatOnSave를 막아서 리포 설정은 onFocusChange) · Vitest(`formatDexNumber` 첫 테스트) · 크롬 디버그(launch.json 개인, dev 서버 5174 고정 strictPort) · `npm run check` = typecheck → lint → format:check → test:run. React 메모: 사용자가 App 안에 컴포넌트 정의 · 상태 배열 push를 해 봤다가 "그릴 때 계산"으로 고침(You Might Not Need an Effect)
- **R3 완료**: Electron 45 · `platforms/electron/`(main.ts · tsconfig · electron-builder.yml) · `platforms/assets/icon.png`(Qt판 캡슐 마크). `electron:dev`(dev 서버 5174를 창에) · `electron:start`(app://pokesix 커스텀 프로토콜로 dist, 없는 경로는 index.html) · `electron:dist`(AppImage · deb). 보안 옵션 3종, 외부 링크는 시스템 브라우저. typecheck가 main.ts까지. 개인 launch.json에 크롬 · Electron 메인 디버그. res_app에서 가져온 CORS 우회(allowAppOriginCors)는 PokéAPI에 불필요해 삭제. **제목 글꼴은 Do Hyeon 확정**
- **진행 중: R4 디자인 토큰**([가이드](guides/r4-design-tokens.md)) — 원본은 **`design/handoff-v3/design/tokens.json`**(v1+v2+v3, 다크 57 완성 · 상태 색 블록), 글꼴은 `~/ws/src/PokeSix-qt6/resources/fonts/`(TTF 8 + OFL 4). **페이지 순서(사용자 결정)**: 홈 → 도감 → 아이템 → 스쿼드 → 에디터 → 타운맵 → 설정 = R5–R11. **화면은 v1 핸드오프 그대로**(사용자 결정 2026-10-26 — 홈도 v1 엔트리 홈: 세대 카드 9장 · 최근 스쿼드 · 바로 가기, 앱 막대에 홈 탭). Qt판의 "의도한 차이"는 버림. 마크는 v2 캡슐. **디자인 요청 0002**(`design/requests/0002-web-dark-and-tabs.md`): 다크 43색 완성 · 앱 막대 7탭(+ 테마 스위치 자리) · 웹 기준 결과물(React 코드는 받지 않음) → **v3 받음(2026-10-26, `design/handoff-v3/`)**: 다크 57 · lightStates/darkStates · 앱 막대 7탭 + 테마 스위치(02c) · 화면 다크판 · 모바일 참고. 주의: 다크에만 있는 키 4개(raised · red.asText · danger.asText · glyph.ink)는 json `color.light`에 없음(R4 K1에 반영). v3 PROMPT §5 답(사용자 결정 2026-10-26): **테마 기본값 = 시스템 따라가기** · **창 프레임 = 네이티브 유지**(OS 제목 표시줄 + 메뉴바 숨김, 지금 main.ts 그대로) · **요청 0003(에디터 · 타운맵 본문)은 R9 시작 때**
- 환경: node v24.19.0 · npm 11.17.0 설치돼 있음(Linux). Windows 머신은 아직 미확인
- 메모:
  - `.github/workflows/release.yml`은 Qt CI(태그 `v*` 트리거) — React 첫 태그 전에 교체
  - 데이터: 웹은 PokéAPI 직접 호출로 시작(Qt판의 CSV→SQLite와 다름). 세이브 파서는 RS에서 TS로 포팅 — 정답지는 qt6-final의 `src/core/save/` · 합성 세이브
