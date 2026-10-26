# 로드맵 — React 재작성 (Phase R)

Qt 6 구현(v0.1.0–v0.5.1)의 로드맵은 태그 `qt6-final`의 `docs/roadmap.md`에 있다.
여기서는 재작성 단계만 적는다. **뒤쪽 단계는 거칠게만 적고, 시작할 때 상세를 정한다**
(레이아웃 · 페이지 구성은 사용자가 진행하며 바꾼다).

| | 단계 | 내용 | 배우는 것 | 완료 조건 |
|---|---|---|---|---|
| ✅ | **R0** | 전환(Claude): Qt 동결(`qt6-final` 태그 · `~/ws/src/PokeSix-qt6` 사본) → 작업 폴더 비우고 React 뼈대 문서 | — | main에 Qt가 보존되고 폴더가 새 출발 상태 |
| ✅ | **R1** ([가이드](guides/r1-vite-scaffold.md)) | Vite로 React+TS 스캐폴드, dev 서버 · HMR · 생성 파일 이해 | npm · Vite · 진입점(index.html → main.tsx) · JSX 첫걸음 | `npm run dev`로 화면이 뜨고, App.tsx를 고치면 즉시 반영, `npm run build` 성공 |
| ✅ | **R2** ([가이드](guides/r2-tooling.md)) | 도구 정리: Prettier · ESLint · Vitest · 크롬 디버깅, npm 스크립트, VS Code 연동 | 린트/포맷/테스트 러너 | `npm test` 통과, 저장 시 포맷 |
| 🟨 | **R3** ([가이드](guides/r3-electron.md)) | **데스크톱 셸(Electron)** — 사용자 결정: 메인 플랫폼은 데스크톱. 개발 창(HMR) · 빌드본 실행(서버 없이) · 외부 링크 · AppImage 설치본 | 메인/렌더러 프로세스 · 보안 옵션 · 커스텀 프로토콜 · electron-builder | dev 창에서 HMR, `electron:start`로 오프라인 실행, AppImage에 캡슐 아이콘 |
| ⬜ | **R4** | 디자인 토큰: design/ 팔레트 · 글꼴을 CSS 변수로(라이트 · 다크), 글꼴 로딩 — 제목 **Do Hyeon**(사용자 확정) · 본문 NanumGothic · 숫자 NanumGothicCoding · 워드마크 Silkscreen | CSS 변수 · @font-face · 다크 모드 | 토큰 데모 화면이 두 테마에서 맞게 보임 |
| ⬜ | **R5** | 앱 셸: 라우터 + 앱바(탭) 레이아웃 — 레이아웃은 사용자가 새로 설계 | react-router · 컴포넌트 분해 · flex/grid | 탭으로 빈 페이지들 사이를 이동(데스크톱 창에서 새로고침해도 유지) |
| ⬜ | **R6** | PokéAPI 클라이언트: 직접 REQ/RESP 처리(fetch) · 타입 · 캐시 → 도감 리스트 렌더링 | fetch · Promise/async · 상태와 리스트 렌더링 | 고른 세대의 도감이 실데이터로 뜸 |
| ⬜ | R7+ | 도감 상세 · 필터 · 파티(SixSquad) · 아이템 … Qt판 화면을 하나씩, 레이아웃은 새로 | — | 시작할 때 정의 |
| ⬜ | RS | 세이브 파서 포팅: Qt판 core/save(체크섬 · 복호화 · 쓰기)를 TS로, Vitest 왕복 테스트 + 데스크톱 파일 열기/저장(preload) | ArrayBuffer/DataView · File API · IPC | 합성 세이브 테스트 통과, 실세이브 파티 표시 |
| ⬜ | RM | 모바일: Capacitor(Android/iOS) 셸 — res_app 구성 참고 | 패키징 · 플랫폼별 차이 | 폰에서 같은 앱 |

- 버전: 재작성 첫 릴리스 번호(v1.0.0-alpha 등)는 데스크톱 설치본이 쓸 만해지면 정한다. **그 전에 `.github/workflows/release.yml`(Qt CI) 교체 필수**
- 데이터 전략: Qt판은 CSV→SQLite 오프라인이었다. 웹에서는 PokéAPI 직접 호출 + 캐시로 시작하고, 오프라인은 나중에 결정
