# 작업 기록 (세션 인수인계)

여러 머신 · 여러 세션에서 이어 간다. **새 세션은 [CLAUDE.md](../CLAUDE.md) → [roadmap.md](roadmap.md) → 이 문서** 순으로 읽는다.
Qt 시절 기록은 태그 `qt6-final`의 `docs/worklog.md`에 있다.

## 지금 상태 — 2026-10-26

- **R0 완료(Claude)**: React 재작성 전환. 사용자 결정 — 같은 리포 main 이어서 · TypeScript · 동결은 전부 커밋.
  - Qt 최종본: 동결 커밋 `24f9228` → main merge `dc24085` → **태그 `qt6-final`**(push 됨). 작업 사본 `~/ws/src/PokeSix-qt6`(build 제외 전체, 자체 .git 포함)
  - 작업 폴더에는 `.github` · `.vscode` · `design` · `CLAUDE.md` · `LICENSE`만 남기고 비움. 새로 쓴 것: README · .gitignore · CLAUDE.md(React판) · roadmap · 이 문서 · R1 가이드
- **다음: R1** — 사용자가 Vite 스캐폴드([가이드](guides/r1-vite-scaffold.md)). ⚠ 스캐폴드 때 "Remove existing files"를 고르면 design/·.git이 날아간다 — 반드시 "Ignore files and continue"
- 환경: node v24.19.0 · npm 11.17.0 설치돼 있음(Linux). Windows 머신은 아직 미확인
- 메모:
  - `.github/workflows/release.yml`은 Qt CI(태그 `v*` 트리거) — React 첫 태그 전에 교체
  - `.vscode/settings.json`은 아직 C++/CMake 내용 — R2에서 정리
  - 폰트: 사용자가 "Jua"라 불렀지만 실제 토큰은 **Do Hyeon**(제목) · NanumGothic · NanumGothicCoding · Silkscreen — R3에서 이름 확정
  - 데이터: 웹은 PokéAPI 직접 호출로 시작(Qt판의 CSV→SQLite와 다름). 세이브 파서는 RS에서 TS로 포팅 — 정답지는 qt6-final의 `src/core/save/` · 합성 세이브
