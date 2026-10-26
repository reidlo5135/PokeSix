# 작업 기록 (세션 인수인계)

여러 머신 · 여러 세션에서 이어 간다. **새 세션은 [CLAUDE.md](../CLAUDE.md) → [roadmap.md](roadmap.md) → 이 문서** 순으로 읽는다.
Qt 시절 기록은 태그 `qt6-final`의 `docs/worklog.md`에 있다.

## 지금 상태 — 2026-10-26

- **R0 완료(Claude)**: React 재작성 전환. 사용자 결정 — 같은 리포 main 이어서 · TypeScript · 동결은 전부 커밋.
  - Qt 최종본: 동결 커밋 `24f9228` → main merge `dc24085` → **태그 `qt6-final`**(push 됨). 작업 사본 `~/ws/src/PokeSix-qt6`(build 제외 전체, 자체 .git 포함)
  - 작업 폴더에는 `.github` · `.vscode` · `design` · `CLAUDE.md` · `LICENSE`만 남기고 비움. 새로 쓴 것: README · .gitignore · CLAUDE.md(React판) · roadmap · 이 문서 · R1 가이드
- **R1 완료**(`2ed57c9`): Vite 8 · React 19 · TS 6(strict 기본 켜짐 — 확인함) · ESLint 10. Vite가 README · .gitignore를 덮어써서 README는 되돌리고 .gitignore는 합침. dev 서버는 5174(5173은 다른 프로젝트가 점유)
- **R2 완료**: Prettier(사용자 규칙: 2칸 · 큰따옴표 · 세미콜론 없음, `.prettierignore`로 design · docs · .github · *.md 제외) · ESLint + eslint-config-prettier · 저장 시 포맷(사용자 전역 autoSave=afterDelay가 formatOnSave를 막아서 리포 설정은 onFocusChange) · Vitest(`formatDexNumber` 첫 테스트) · 크롬 디버그(launch.json 개인, dev 서버 5174 고정 strictPort) · `npm run check` = typecheck → lint → format:check → test:run. React 메모: 사용자가 App 안에 컴포넌트 정의 · 상태 배열 push를 해 봤다가 "그릴 때 계산"으로 고침(You Might Not Need an Effect)
- **R3 완료**: Electron 45 · `platforms/electron/`(main.ts · tsconfig · electron-builder.yml) · `platforms/assets/icon.png`(Qt판 캡슐 마크). `electron:dev`(dev 서버 5174를 창에) · `electron:start`(app://pokesix 커스텀 프로토콜로 dist, 없는 경로는 index.html) · `electron:dist`(AppImage · deb). 보안 옵션 3종, 외부 링크는 시스템 브라우저. typecheck가 main.ts까지. 개인 launch.json에 크롬 · Electron 메인 디버그. res_app에서 가져온 CORS 우회(allowAppOriginCors)는 PokéAPI에 불필요해 삭제. **제목 글꼴은 Do Hyeon 확정**
- **다음: R4 디자인 토큰** — 시작 때 가이드. 사용자가 화면 설계 도구(Figma 등)를 물어봄(2026-10-26)
- 환경: node v24.19.0 · npm 11.17.0 설치돼 있음(Linux). Windows 머신은 아직 미확인
- 메모:
  - `.github/workflows/release.yml`은 Qt CI(태그 `v*` 트리거) — React 첫 태그 전에 교체
  - 데이터: 웹은 PokéAPI 직접 호출로 시작(Qt판의 CSV→SQLite와 다름). 세이브 파서는 RS에서 TS로 포팅 — 정답지는 qt6-final의 `src/core/save/` · 합성 세이브
