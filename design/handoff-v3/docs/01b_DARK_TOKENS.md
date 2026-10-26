# 01b · 다크 테마 토큰 결정표

요청 0002 §1의 43색 전부에 대한 결정. 캔버스 "다크 기초" 보드가 같은 내용의 시각판이다.
기준 이미지: `images/screens/61_dark_foundations.png` · 값 원본: `design/tokens.json`의 `color.darkOverrides`.

## 원칙

1. **바탕 · 선 · 글자만 교체한다.** 고채도 면(타입 18색, 히트맵 셀, 분류 칸, 노랑 선택, 스탯 채움, 아이콘)은 면 자체가 신호라 그대로 둔다.
2. **틴트는 "다크 바탕 위의 같은 의미"로 다시 만든다.** 라이트의 연한 틴트를 그대로 쓰면 형광 띠가 되므로(Qt판에서 확인된 문제), 같은 색상(hue)의 어두운 바탕으로 바꾸고 그 위 글자를 밝힌다.
3. **면으로 쓸 때와 글자로 쓸 때를 가른다.** `red`는 면(앱 막대)일 땐 `#B8241D`, 글자(합계 600)일 땐 `#F07B6F`. 토큰으로는 `red` / `red.asText`, `blue` / (면은 라이트 값 유지)로 구분했다.
4. **먹색의 두 역할 분리.** 외곽선 · 그림자(`ink`)는 `#0E0E12`로 어둡게, 먹색 **글리프**(▶ 커서, ⋯ 메뉴, 화살표)는 글자색을 따라 `#E9E6EF`(`glyph.ink`). 단, 노랑 면 위의 글리프는 먹색 유지.

## 바뀌는 24

| 토큰 | 라이트 | 다크 | 비고 |
|---|---|---|---|
| `red.deep` | #B8241D | **#8E1C16** | 비활성 탭 · 눌림 (다크 막대 #B8241D 기준 한 단계 아래) |
| `red.tint` | #FDE7E4 | **#3A1D1B** | 문제 행 바탕 |
| `red.text` | #8E1C16 | **#E79A91** | red.tint 위 글자 (6.9:1) |
| `red.asText` *(신규)* | #D8322B | **#F07B6F** | 합계 · 활성 탭 글자 등 "글자로 쓰는 빨강" |
| `paper.stripe` | #EDE7DA | **#22222A** | 빈 슬롯 사선 — paper보다 반 단계 위 |
| `blue` | #2C64B0 | **#6FA3DC** | 링크 · 포커스 링. 면(파랑 머리 · ×¼ 셀)으로 쓸 때는 #2C64B0 유지 |
| `blue.deep` | #1D4E8F | **#8FB4D9** | 내성 글자 |
| `blue.tint` | #E3EDF9 | **#1D2C3E** | 내성 요약 바탕 |
| `blue.focusRing` | #CFE0F5 | **#2C4A6E** | 포커스 바깥 번짐 |
| `green` | #2A7D38 | **#58B96A** | 확인 글자. 토글 ON 면은 #2A7D38 유지 |
| `green.tint` | #E3F3E4 | **#1E3524** | 커버 ✓ 바탕 |
| `yellow.tint` | #FFF4CC | **#3A3317** | 선택 행 · 선택 칩 바탕 |
| `yellow.rowSel` | #FFF9E0 | **#33301E** | 선택 행의 ×1 셀 |
| `text.disabled` | #9A96A0 | **#6A6675** | 의도된 저대비 (2.7:1, WCAG 비활성 예외) |
| `line.strong` | #BDB4A3 | **#4A4A57** | 입력 테두리 · 점선 |
| `cell.border` | #E4DDCF | **#3A3A45** | 히트맵 셀 테두리 |
| `stat.high` | #2C64B0 | **#3E7FD0** | 막대 채움 — 다크 트랙 위 3.25:1 (그래픽 3:1 통과) |
| `intro.stripe` | #EFEADF | **#22222A** | v3 미사용 화면이지만 값은 정의 |
| `intro.titleShadow` | #F2C12E | **#6B5528** | 어두운 황동 |
| `danger.asText` *(신규)* | #B8241D | **#E8766B** | 삭제 버튼 글자 |
| `glyph.ink` *(신규)* | #2A2A33 | **#E9E6EF** | 먹색 글리프(▶ · ⋯ · 화살표) — 원칙 4 |
| `hover` | paper.alt | **#33333D** | = raised |
| `ink` *(v1 정의 재사용)* | #2A2A33 | **#0E0E12** | 외곽선 · 단단한 그림자 |
| `track` *(= line.soft)* | #EFEAE0 | **#2F2F38** | 막대 트랙 · 표 행 구분선 |

## 그대로 두는 19 (이유)

| 토큰 | 값 | 이유 |
|---|---|---|
| `yellow` · `menu.pressed` | #F2C12E | 선택 · 눌림의 면. 글자는 항상 먹색(9.4:1) |
| `yellow.soft` | #FFE08A | 빨강 막대 위 전용 (4.9:1) |
| `stat.low` / `stat.mid` / `stat.good` | #E86A4F / #F2C12E / #5DAE45 | 막대 채움 면 — 수치 구간 신호 |
| `cat.physical` / `cat.special` / `cat.status` | #EE8040 / #2C64B0 / #BDBBA6 | 분류 칸 면 + 고정 글자색 (5.9 / 5.9 / 8.1:1) |
| `heat.x4` `heat.x2` `heat.x2.text` `heat.half` `heat.half.text` `heat.quarter` `heat.zero` `blue.cell` | — | 히트맵은 셀 자체가 면. 글자 대비는 셀 안에서 성립(01c 표). ×0은 테두리 + 흰 글자가 구분 |
| `capsule.*` (4) · `plate.*` (4) | — | 마크 · 플랫폼 아이콘 전용, 테마와 무관 |

## 상태 색 (라이트 ↔ 다크)

| 상태 | 라이트 | 다크 |
|---|---|---|
| 호버 | #F3EFE6 (paper) | #33333D (raised) |
| 키보드 선택 | #FFF4CC + ▶ 먹색 | #3A3317 + ▶ #E9E6EF |
| 눌림 | #F2C12E + 먹색 글자 | 동일 (유일하게 양쪽 같음) |
| 포커스 링 (본문) | #2C64B0 3px | #6FA3DC 3px |
| 포커스 링 (앱 막대 위) | #FFE08A 3px 안쪽 | 동일 |
| 비활성 | #9A96A0 · 점선 #BDB4A3 | #6A6675 · 점선 #4A4A57 |

## 웹 구현 메모

- 키 이름 규칙 그대로 CSS 변수로: `red.deep` → `--color-red-deep`. 다크는 `[data-theme="dark"]`(또는 `prefers-color-scheme` + `system` 모드)에서 `darkOverrides` 값으로 재정의하면 끝 — 컴포넌트 쪽 분기 없음.
- 사선 무늬 3종은 `repeating-linear-gradient` 두 색을 변수로: 빈 슬롯 `paper ↔ paper.stripe`, 스프라이트 자리 `paper.alt ↔ paper.stripe`, 세대 외 셀 `line.soft ↔ white(panel)`.
- `glyph.ink` 예외 한 줄: 노랑 면(`yellow` · `yellow.tint`-라이트) 위 글리프는 항상 `#2A2A33`.
