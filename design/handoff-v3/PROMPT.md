# PokeSix 디자인 v3 — 웹 재작성(React · TypeScript) 구현 가이드

> 이 패키지를 저장소의 `design/handoff-v3/`에 둔다. `design/handoff-v1/` · `design/handoff-v2/`는 수정하지 않는다.
> 사람이 직접 구현하는 걸 전제로 쓴 가이드다(React 코드는 패키지에 없음). Claude Code에 맡길 때도 이 파일부터 읽게 하면 된다.

---

## 0. v3가 정한 것

1. **다크 테마 완성** — `design/tokens.json`의 `color.darkOverrides`가 57키로 완성됐다. 결정 근거는 `docs/01b_DARK_TOKENS.md`, 대비 검증은 `docs/01c_DARK_CONTRAST.md`.
2. **앱 막대 7탭** — 홈 · 도감 · 아이템 · 스쿼드 · 에디터 · 타운맵 · 설정 + 테마 스위치. `docs/02c_APPBAR_7TAB.md`.
3. **화면 체계는 v1** (사용자 결정 2026-10-26): 엔트리 홈 + 도감 · 아이템 · 스쿼드 · 설정. v2 인트로는 쓰지 않는다. 마크는 v2 캡슐.
4. 에디터 · 타운맵의 **본문 화면은 범위 밖** — 탭만 있고, 본문 자리는 빈 상태("이 화면은 준비 중이에요").

## 1. 읽는 순서

1. `images/screens/` — 50–54 다크판 5장과 10–14 라이트 7탭판 5장을 나란히. 60(앱 막대) · 61(다크 기초) · 62(컴포넌트 다크) · 63(모바일 참고).
2. `docs/01b_DARK_TOKENS.md` → `01c_DARK_CONTRAST.md` → `02c_APPBAR_7TAB.md`
3. `design/tokens.json` — 모든 값의 원본. v1 · v2 문서(화면 정의서 · 디자인 시트)는 계속 유효하고, 이 패키지는 바뀐 부분만 덮어쓴다.
4. `design/source/*.dc.html` — 수치의 정답. 텍스트로 읽을 것(디자인 도구 템플릿이라 브라우저로 그대로 안 열림). 레이아웃은 전부 flex/grid + gap이라 그대로 CSS로 옮기면 된다.
   - `*Dark.dc.html`은 **라이트 원본 + `<style>` 토큰 오버라이드 블록** 구조다. 그 블록이 곧 "다크에서 뭐가 바뀌는가"의 목록이고, 웹에서는 CSS 변수 재정의 하나로 대체된다.

## 2. 토큰 → CSS 변수

- 키 이름 규칙 그대로: `red.deep` → `--color-red-deep`, `heat.x2.text` → `--color-heat-x2-text`.
- 라이트 값은 `color.light`, 다크는 `[data-theme="dark"]`에서 `color.darkOverrides`로 재정의. `system` 모드는 `prefers-color-scheme`을 따라 `data-theme`을 정하는 쪽을 권장(토큰은 두 벌뿐).
- 상태 색은 `color.lightStates` / `color.darkStates`. 빨강 막대 위 포커스 링만 예외(#FFE08A) — `appBarFocusRing`.
- 주의 3가지: ① `red`/`blue`/`green`은 **면으로 쓸 때와 글자로 쓸 때 값이 다르다**(`red.asText` 등, 01b §원칙 3). ② 먹색 글리프(▶ · ⋯ · 화살표)는 `glyph.ink`를 쓰고 노랑 면 위에서만 먹색 고정(원칙 4). ③ 사선 무늬 3종은 gradient 두 색을 변수로 묶는다(01b §웹 구현 메모).

## 3. 구현 순서 제안

1. 토큰 → CSS 변수 파일 생성(이 패키지 tokens.json에서 스크립트로 뽑는 걸 권장, 손 복사 금지) + 테마 전환(`data-theme` + localStorage + system 감지).
2. 앱 막대(7탭 + 세대 버튼 + 검색 + 테마 스위치) — 02c의 반응형 표 그대로. 라우트 7개 중 에디터 · 타운맵은 빈 상태 페이지.
3. v1 문서 기준으로 화면 5종 — 완료 기준은 라이트 10–14, 다크 50–54 캡처와의 일치.
4. 다크 검수: 61 보드의 대비표와 같은 조합을 실제 DOM에서 자동 검사(axe 등)로 한 번 더.

## 4. 지켜야 할 선 (변함없음)

- 포켓몬 공식 에셋 · 포켓볼 도안(원 + 가로 띠 + 가운데 버튼, 색만 바꾼 변형 포함) 금지. 스프라이트 자리는 자리표시자.
- 캡슐 마크 비율 · 기울기 · 크기별 규칙은 v2 핸드오프 그대로(아이콘 에셋도 v2 것 사용 — 이번에 변경 없음).
- 대비 4.5:1(예외는 01c 각주 2건뿐), 키보드 조작(Ctrl+1…7 · Ctrl+K), 해요체 문구.
- 블러 그림자 · 그라데이션 배경 금지(플랫폼 아이콘 플레이트 제외). 그림자는 전부 오프셋 단색.

## 5. 물어볼 것

1. 테마 기본값 — 시스템 따라가기로 시작할지, 라이트 고정일지 (디자인 가정: 시스템).
2. 에디터 · 타운맵 본문 디자인 요청(0003) 시점.
3. Electron 메뉴바 · 창 프레임 처리(네이티브 vs 커스텀) — 앱 막대와 겹치는 문제라 본문 요청 전에 정하면 좋다.

## 6. 패키지 구성

```
design/handoff-v3/
├─ PROMPT.md · CHANGELOG.md
├─ docs/  01b_DARK_TOKENS.md · 01c_DARK_CONTRAST.md · 02c_APPBAR_7TAB.md
├─ images/screens/
│  ├─ 10–14 라이트 1440 (7탭 갱신판) · 20–21 라이트 1024
│  ├─ 50–54 다크 1440 · 60 앱 막대 7탭 · 61 다크 기초 · 62 컴포넌트 다크 · 63 모바일 참고
└─ design/  tokens.json (v3) · source/*.dc.html (라이트 + 다크 + 보드)
```
