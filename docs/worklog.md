# 작업 기록 (세션 인수인계)

이 프로젝트는 여러 머신 · 여러 Claude Code 세션(집 Windows 11 · 회사 · Linux)에서 이어 간다.
**새 세션은 [CLAUDE.md](../CLAUDE.md) → [roadmap.md](roadmap.md) → 이 문서** 순으로 읽는다.
Claude는 작업 덩어리가 끝날 때마다 이 문서의 "지금 상태"와 "최근 세션"을 갱신한다(커밋에 포함).
코드 · 커밋 · CHANGELOG에 이미 있는 것은 적지 않는다. 여기 적는 것은 **어디까지 검증됐고, 무엇이 미확인이고, 다음에 무엇부터 할지**다.

---

## 지금 상태 — 2026-10-20

- **`v0.5.1`(2026-10-19, PATCH) 공개됨**: E2b(진화 전 단계 기술 상속 + 1세대 중복 버전 숨김). 사용자가 push
- **진행 중: H10 세이브 에디터**(브랜치 `feat/h10-save-editor`, 가이드 [h10-save-editor.md](guides/h10-save-editor.md), [ADR 0022](decisions/0022-writing-saves.md) — 원본은 두고 다른 이름으로만 쓴다). 사용자 결정(2026-10-20): 범위 "sav 버전의 스쿼드 페이지"까지 전부 · 4 · 5세대 · **core부터 화면까지 전부 사용자 구현**, 가이드는 미션마다 목적 · 기능 · 위젯 트리 · 값이 오는 길 · 할 일 표(언제 실행되나) · 흔한 실수. 로드맵에서 H10a(카드 완성) → b(SaveFile) → c(core 쓰기) → d(기술 · 물건 편집 + 저장) → e(레벨 · 개체값 · 능력치 공식, 스키마 올림) → f(5세대 별명)로 나눴다. **H10a 완료(2026-10-21)**: 카드에 아이콘 · 타입 칩 · 특성/성격/물건(BW 도트 아이콘) · 기술 칸 타입 칩 · 실능력치(성격 ↑ 빨강 ↓ 파랑, QSS 동적 속성) · 창이 낮으면 스크롤(`editorScroll` 투명). 번역 en/ja 채움. 다크는 F3b 전이라 일부 어색. **진행 중: H10b(SaveFile)** — B1(헤더, 사용자) · B2–B4(`savefile::open` · `load`를 open 위에 · 테스트 4, **Claude — 사용자 요청: 가이드 B2가 6칸 배열 vs 목록 차이를 빠뜨림**) 완료, 187 통과. 이름은 `savedocument` → **`savefile`**(사용자 결정 — squadfile과 짝). 다음(사용자): B5 에디터를 `SaveFile`로 교체(`editorpage.h` include만 Claude가 새 이름으로 고쳐 둠) → B7 `filekinds`(확장자 한 곳) → B8 `saveimport` 삭제 · 테스트 옮기기 → B6 선택. 스쿼드 · 에디터 공통 모듈화는 H11(사용자가 직접). VS Code: 자동완성 clangd(사용자 설정), Alt 메뉴 포커스 끔
- **H9 완료(2026-10-20, main에 merge)**: 6번째 탭 [에디터] — `.sav`/`.dsv` 끌어다 놓기 · 열기, 파일 정보 줄, 파티 카드 6장(이름 · 레벨 · 기술 4). 스쿼드는 `.pks`/`.json`만(`.sav`를 끌어 오면 금지 커서 — 사용자 결정 "각자 페이지는 각자 역할만"). 미션 4(스쿼드로 보내기)는 뺐다(ADR 0021 결정 3 개정). 다크에서 세대 버튼 글자가 파스텔 바탕에 묻힘(F3b 거리). **다음: H10(세이브 편집 · 쓰기)**. 가이드 메모: "만들기(build…/생성자, 한 번)"와 "채우기(이벤트/set…, 매번)"를 표와 코드 한 줄로 나눠 말할 것
- 작업 트리에 **VS Code 저장 포맷으로 주석 정렬만 바뀐 헤더 5개**(`repository.h` · `csvimporter.h` · `dataupdater.h` · `firstrunpanel.h` · `panelpainter.h`)가 있다 — 커밋하지 않았다(열린 일 9: clang-format 버전 차이. VS Code가 apt 18.1.3이 아닌 다른 clang-format을 쓰는 듯)
- **`v0.5.0`(2026-10-13, MINOR) 공개됨**: F3a 테마 스위치(라이트 · 다크 · 시스템). 다크의 연한 칸 몇 곳은 F3b 전이라 어색함 — 릴리스 노트에 적었다
- **`v0.4.1`(2026-10-13, PATCH) 공개됨**: 일괄 비우기 후 게임을 바꿨다 오면 옛 스쿼드가 돌아오던 버그(사용자 발견). 원인: `SquadStore::setSquad`가 없는 키의
  `value()`(빈 Squad)와 비교 → 묶음 키(`firered-leafgreen`)에서 이어받은 스쿼드를 비우면 버전 키가 안 생김. 테스트 `KeepsAnEmptySquadOverTheGroupItCameFrom`, 수정은 사용자
- **`v0.4.0`(2026-10-13, MINOR) 공개됨**: H8(가져온 멤버의 레벨 · 인게임 능력치) + AppImage 앱 메뉴 자기 등록. 사용자가 push
- **`v0.3.0`(2026-10-12, MINOR) 공개됨**: 5세대(BW · B2W2) 세이브 불러오기(H6). 사용자가 push했고 내려받기 확인(사용자 PC의 AppImage가 0.3.0)
- **`v0.2.1`(2026-10-09, PATCH)**: Windows 다크 모드 검은 패널 수정 + dmg 안의 macOS 안내문. https://github.com/yamada-studio/PokeSix/releases/tag/v0.2.1 — CI가 4개 파일 첨부(msi 18.5MB · zip 18.2MB · AppImage 39.5MB · dmg 32.1MB), 노트 · SHA-256은 API로
- **`v0.2.0` 릴리스(2026-10-09)**: https://github.com/yamada-studio/PokeSix/releases/tag/v0.2.0 — 이번에는 **CI가 Release를 스스로 만들고 4개 파일(zip · msi · AppImage · dmg)을 붙였다**(`permissions: contents: write` 확인). 노트 본문 · SHA-256만 API로 채웠다. 러너의 WiX 3.14로 msi도 나온다
- 2026-10-09(집 Windows): 회사 세션의 H1 · H2(스키마 12)를 Windows에서 처음 돌리다 만난 **DB 교체 실패(파일 잠금)** 를 고쳤다 — [build.md §5-8](build.md#db-swap-blocked). 145 테스트 통과. Windows 패키지에 빠져 있던 MSVC 런타임을 동봉했고 msi를 실기 검증했다
- `v0.1.0`(2026-10-07)은 Phase A 완료 태그. 그때는 조직의 read-only 토큰 때문에 Release를 손으로 올렸다
- 원격 `origin` = github.com/reidlo5135/PokeSix(2026-10-19 yamada-studio 조직에서 Transfer — 릴리스 · 별 · Actions 기록 그대로, 옛 주소는 리디렉트). `main`과 동기화.
- 버전 `0.5.0`. Phase B · C · D · E · T가 섞여 진행 중이고 Phase G는 "lite"(패키징 스크립트 · CI)만. 단계별 상태는 roadmap.md.

### 검증 매트릭스

| | setup | build + ctest | run | package | quickstart |
|---|---|---|---|---|---|
| Linux (Ubuntu 24.04) | ✅ 최소 Qt(`--archives`) 포함 | ✅ 96 | ✅ | ✅ AppImage · `--install` | ✅ |
| Windows 11 (MSVC 2022) | ✅ 전체 Qt. **최소 Qt 미검증**(이미 설치돼 있어 경로를 안 탐) | ✅ 96 (Release · Debug) | ✅ | ✅ ZIP 17.6MB, Qt 없는 PATH에서 실행 확인 | ✅ `--no-run` |
| macOS | ⚠ 실기 없음 | ⚠ | ⚠ | ⚠ dmg 스크립트만 | ⚠ |
| GitHub Actions | — | ✅ 3 OS(러너에서 ctest 포함) | — | ✅ 태그 `v0.2.0` 실행 37897235019: Release 자동 생성 + zip 18.2MB · msi 18.5MB · AppImage 39.5MB · dmg 32.1MB 첨부 | — |

### 진행 중

- **AppImage 자기 등록 — 완료 · merge**(Claude 구현 — 사용자 결정 2026-10-13). 사용자 PC(Ubuntu GNOME)에서 메뉴 항목이 지워진 상태로 새 AppImage를 한 번 실행 → 앱 메뉴에 생김 확인.
  다음: v0.5.0 push(사용자) → F3b.
- **F3a 런타임 팔레트 + 테마 스위치 — 완료 · merge(2026-10-13)**. CP1–CP4 사용자, CP5 · CP6은 사용자 요청("그냥 너가 이어서 완성해주라")으로 Claude.
  확인: 테스트 180 통과 · 경고 0, 라이트는 0.4.1과 같은 설정으로 찍어 스위치 자리(x 1215–1321)만 다름, 시작-다크 vs 실행 중 전환-다크 6화면 픽셀 동일.
  시스템 모드(OS 다크 설정을 바꾸면 따라감)는 offscreen으로 검증 불가 — **사용자 PC에서 확인 필요**. 다음: **F3b**(빠진 다크 값 40여 칸 + JSON 색 — 0.5.0 캡처로 본 대상: 세대 버튼 · 규칙 알약 · 버전 칩 · 필터 타입 칩 · 스쿼드 문제 카드(red.tint) · 히트맵 연한 칸)(브랜치 `feat/f3a-runtime-palette`, [가이드](guides/f3a-runtime-palette.md), [ADR 0020](decisions/0020-runtime-palette.md)).
  뼈대 · 테스트(`tests/ui`, 빨강 4) · 기계적 치환(552곳 → `tok::palette()`, white 74 + QSS 21곳 분류 → `onColor` 28 + QSS 5줄)은 Claude.
  라이트 픽셀 비교 0.4.1과 동일(인트로 버전 글자만), 참조 구현으로 다크 캡처 확인 → F3b 대상: 세대 버튼 · 규칙 알약 · 버전 칩의 연한 바탕 글자, 필터 타입 칩, 히트맵 연한 칸.
  `homepage.cpp` 정렬 변경은 `git stash`에 보관(stash@{0}) — 이 브랜치의 치환과 섞이지 않게. 포맷은 `git clang-format`(바꾼 줄만)
  그 밖의 후보: 폼 표 · 세이브 파일 감시 · 전투 분석 입력 넓히기([data/battle-inputs.md](data/battle-inputs.md) §4) · Phase B · E4

### 열린 일 (작은 것부터)

0. **VS 2026 지원**: GitHub의 `windows-latest`는 이제 `windows-2025-vs2026`(VS 18)이라 CI 잡을 `windows-2022`로 고정해 두었다. `windows-2022` 이미지가 은퇴하기 전에 `CMakePresets.json`에 "Visual Studio 18 2026" 프리셋과 `env.bat :find_vs`의 `[17.0,19.0)` 범위를 더해야 한다(Qt `msvc2022_64` 바이너리는 v145 툴셋과 ABI 호환)
1. MSVC 경고 C4305(`double`→`float`) 두 곳: `src/ui/widgets/versionchip.cpp:170`, `src/ui/dex/statradar.cpp:80`. 동작 영향 없음. `static_cast<float>` 또는 `qreal` 유지로 정리하면 된다(사용자 코드 영역 — 가이드 대상)
2. Windows 최소 Qt 설치 검증: `C:\Qt`가 없는 PC에서 `scripts\windows\setup.bat` → `--archives qtbase qtsvg qttools`만 받아 빌드되는지
3. 스쿼드 분석 패널의 문제 칸 높이(넓은 배치 최소 2줄 · 좁은 배치 최대 4줄, `squadpage.cpp`의 `kProblemVisibleRows`) — 사용자 피드백 대기
4. 에뮬레이터 오버레이: [overlay-design.md](overlay-design.md)는 검토 문서. 시작하려면 ADR로 결정을 확정하고 roadmap에 Phase H를 올린다(H1 = core 세이브 파서)
5. Windows 설정이 레지스트리 → `%APPDATA%\YamadaStudio\PokeSix.ini`로 바뀌었다(2026-10-07). 이전에 레지스트리에 저장된 세대 · 게임은 이어지지 않는다(한 번 다시 고르면 끝). 레지스트리 잔여물은 `HKCU\Software\YamadaStudio`에 남아 있어도 무해하다
6. ~~**Windows .msi 검증**~~ → 2026-10-09 집 PC에서 통과(WiX 3.14 winget 설치 · `package.bat` → msi · 설치 → 사용자 시작 메뉴 바로가기 → 설치된 exe 실행 → 제거 깨끗). 남은 것: CI 러너(windows-2022, WiX 프리인스톨)에서 msi가 나오는지는 v0.2.0 태그 실행으로 확인
7. macOS 공증(notarization): Apple Developer(연 99달러) + CI secrets(`notarytool`)를 붙이면 내려받은 dmg의 Gatekeeper "손상됨" 차단이 사라진다. 그 전까지는 README Download 절 + dmg 안 `READ ME FIRST - macOS.txt`의 `xattr` 안내로 운용(2026-10-09). **무료 대안**: GitHub에 `reidlo5135/homebrew-tap` 리포를 만들고 cask를 두면 Mac 사용자는 `brew install --cask --no-quarantine reidlo5135/tap/pokesix` 한 줄로 격리 없이 설치한다(새 리포 생성은 사용자 결정). 확인 필요: 친구 Mac에서 **v0.2.0** dmg + xattr 절차로 실제로 뜨는지(v0.1.0은 재서명 전이라 xattr을 풀어도 arm64에서 안 뜰 수 있다)
8. **테마 전환 [라이트 | 다크 | 시스템]** → 2026-10-13 시작(F3a). 결정 셋: 치환은 Claude · 빠진 다크 값은 Claude 제안 · 위치는 앱 막대만. 아래는 당시 분석. — 사용자 요청(2026-10-12): 앱 막대의 세대 버튼 바로 왼쪽에 흔한 SVG 아이콘 3칸(해 · 달 · 모니터, Lucide ISC 추천).
   v0.2.1의 `setColorScheme(Light)`는 임시방편. **H6 끝난 뒤 시작**(사용자 결정). 막히는 것 셋: ① 토큰이 `constexpr`(53파일 552회) · QSS는 시작 때 한 번 치환 →
   실행 중 전환 불가 ② 핸드오프 `darkOverrides`는 11개뿐 — tint · rowSel · cell.border · line.strong · text.disabled 등 40여 개 다크 값 없음
   ③ `white`가 "바탕"과 "색 위 흰 글자"(히트맵 · 마크 버튼 · 분류 칸 · QSS `color: @white`) 두 뜻 → `onColor` 분리 필요.
   제안 순서: F3a 런타임 팔레트(`Palette` kLight · kDark를 바꿔 끼움, QSS 재적용 · 다시 칠하기, `--theme dark` 검증) → F3b 빠진 다크 값 →
   F2' 모드 설정(`QStyleHints::colorScheme` · `colorSchemeChanged`, QSettings `theme/mode`) + 앱 막대 3칸. 핸드오프는 설정 화면 테마 카드(라이트/다크)라 위치 · "시스템"은 이탈.
   **시작할 때 물을 것**: 토큰 치환 방식(`tok::palette().paper` 추천, 기계적 치환은 Claude), 빠진 다크 값(디자인 요청서 vs Claude 제안값), 설정 화면 카드도 둘지
9. **clang-format 버전이 머신마다 다르다**: Linux는 18.1.3(apt), Windows는 VS 번들(`VC\Tools\Llvm\bin`, 더 새 버전). 줄 끝 주석 정렬이 달라서
   Windows에서 커밋한 파일(`csvimporter.h` · `dataupdater.h` · `firstrunpanel.h` · `homepage.cpp`)을 Linux에서 돌리면 바뀌고, 반대도 마찬가지다.
   2026-10-12 사용자 작업 트리에 `homepage.cpp`의 정렬만 바뀐 변경이 남아 있다(커밋 안 함). 해결안: 두 머신이 같은 버전을 쓰게 고정
   (예: `uv tool install clang-format==<버전>` — PyPI 휠, setup 스크립트에 넣기)하고 한 번 전체 포맷 커밋. 사용자 결정 대기
10. ~~**AppImage 자기 등록(앱 메뉴)**~~ → 2026-10-13 구현(`src/app/desktopentry.cpp`, 아이콘 · .desktop은 qrc가 아니라 `$APPDIR/usr/share`에서 — package.sh와 같은 원본). 아래는 당시 계획. 사용자 결정(2026-10-12): Linux 배포는 AppImage 하나뿐이니 **AppImage만 실행해도 메뉴에 등록**돼야 한다(별도 CLI 불편).
    방법: 시작할 때 환경 변수 `APPIMAGE`(런타임이 넣는 파일 절대 경로)가 있으면 `~/.local/share/applications/com.yamada.studio.pokesix.desktop`이 없거나
    `Exec`가 다를 때 다시 쓰고, 아이콘은 qrc에서 `~/.local/share/icons/hicolor/<크기>/apps/pokesix.png`로(지금 `package.sh --install`이 하는 일과 같은 결과).
    app 레이어 한 파일, `#ifdef Q_OS_LINUX`. 한계: 첫 실행은 손으로, 파일을 지우면 메뉴 항목이 남음(README에 제거법), 끄는 스위치는 E4 설정 때.
    **순서: H8 마무리 → 이것 → 전체 검증 → 릴리스.** 사용자는 "0.3.1"이라 했지만 기능 추가라 규칙상 0.4.0 — 릴리스 때 확인. 구현을 가이드로 할지 Claude가 할지는 시작 때 묻기
11. **획득 사전 보강(REFER.md)**: 사용자가 `docs/data/REFER.md`에 세대별 TM/HM · 아이템 출처 링크를 수집 중(2026-10-19 현재 1–5세대). 끝나면 `resources/data/acquisition/<version-group>.json`에 **사실만 구조화**해 넣는다(블로그 문장 복사 금지 — i18n 저작권 원칙). 목표: 아이템 · TM의 "획득처 정보 없음" 줄이기. 1세대 버전 정리(G·R·B·Y 네 개, 사용자 결정)는 E2b 과제 5로 끝남
12. **업데이트 쉽게** — 사용자(2026-10-13): AppImage 교체(받기 → chmod → `~/.local/bin`에 mv)가 번거롭다. 후보: ① 앱 안 업데이트 알림(시작 때 GitHub 최신 릴리스 확인 → "새 버전 → 받기" 링크, 3 OS, E4에 끄는 스위치 — 추천)
    ② AppImage zsync 업데이트 정보(CI가 `UPDATE_INFORMATION` + `.zsync` 첨부, Gear Lever · AppImageUpdate용, Linux만). **사용자 결정: 나중에**

---

## 환경 메모

### Windows 11 (집)

- VS 2022 Community 17.14(C++ 데스크톱, CMake 3.31 번들, clang-format은 `VC\Tools\Llvm\bin`), uv 0.12(winget portable → `%LOCALAPPDATA%\Microsoft\WinGet\Packages\astral-sh.uv_*`), Qt 6.8.3 전체 → `C:\Qt\6.8.3\msvc2022_64`. `QT_ROOT_DIR` 환경 변수는 **설정하지 않았다** — 스크립트가 기본 경로를 찾는다. IDE에서 프리셋을 직접 쓰려면 `setx QT_ROOT_DIR "C:\Qt\6.8.3\msvc2022_64"`
- 셸은 관리자 아님. winget으로 VS를 설치할 때 UAC 창이 뜬다
- `gh` CLI 없음. git 원격 인증은 Git Credential Manager
- 사용자는 이 머신에서 melonDS로 4세대(HGSS · Pt)를 플레이한다 → 오버레이 요구의 출처

### Linux (Ubuntu 24.04)

- `~/Qt/6.8.3/gcc_64`, `QT_ROOT_DIR`은 `~/.bashrc`. 142개 커밋(Phase G lite · Phase T · 스쿼드 기능)은 여기서 이루어졌다
- melonDS 1.1(AppImage)은 `~/melonDS-1.1/`, 4세대 ROM · 세이브는 `~/melonDS-1.1/gen4/`(melonDS가 같은 이름의 `.nds` ↔ `.sav`를 짝짓는다).
  2026-10-08 현재 `포켓몬스터 소울실버(K).sav`(한국판, 512 KiB)만 있다 — Pt 세이브는 아직 없다. H1 디버깅은 스냅샷 복사본
  `~/pokesix-saves/포켓몬스터 소울실버(K).sav`로 한다(게임에서 저장하면 원본의 카운터 · 슬롯이 바뀌므로)

---

## 최근 세션 (역순)

### 2026-10-19 — 리포 이전(reidlo5135), E2b 시작 · H9/H10 계획 (Linux 세션)

- **리포 이전**: PokeSix · Tabiji를 GitHub Transfer로 `yamada-studio` 조직 → `reidlo5135` 개인 계정으로 옮겼다(릴리스 · 별 · Actions 기록 유지, 옛 주소는 리디렉트 — 조직을 지우면 리디렉트도 끝). 코드 안 주소는 `dff9f78`로 수정. **GitHub Release 본문 10곳(v0.1.0–v0.5.0)의 옛 링크는 아직** — 사용자가 원하면 API로 수정. 조직에 CodeTerra · ai-model-bloom 2개 남음(조직 삭제 전 정리는 사용자 몫)
- **사용자 개선 요청 3건** → ① 에디터 페이지 신설(.sav는 거기서만, PkHex류 편집까지) = **H9 · H10**(ADR 0018 뒤집기 — 시작 때 대체 ADR) ② 기술 선택이 진화 전 자력기를 모름 = **E2b 시작**(원인: `readPokemonDetail`의 pokemon_moves 쿼리가 고른 id만 — `fillEvolution`이 이미 읽는 조상 자력표를 내보내면 됨) ③ HP 과다 의심 = **버그 아님 진단**(저장값 0x90 그대로 표시, 실세이브 검증 이력 있음. HP 공식만 `+레벨+10`이라 다른 능력치보다 크게 자람 — 인게임 능력치 화면과 비교하는 확인법 안내)
- **가이드 스타일 바꿈**(사용자 요청): Tabiji B2처럼 레이아웃 약도 · 위젯(흐름) 트리 · 과제형("~하라" + 입력/출력/조건) — e2b 가이드부터 적용
- `docs/data/REFER.md`(사용자 작성 중): 세대별 TM/HM · 아이템 외부 링크 모음. **블로그 문장 복사 블록은 커밋 전에 사실 구조화 필요**(저작권 원칙)

### 2026-10-13 — H8 완료 · merge, AppImage 자기 등록 (Linux 세션)

- 사용자 구현 CP1–CP4. 진단 · 구현 중 짚은 것: `QFontMetrics`는 글꼴마다 따로(바꾸기 전에 재기), 위치와 폭을 섞음, `setAlpha(0.28)`(0–255 정수) vs `setAlphaF`,
  scaleMax에서 확인 전 역참조, 진화 트리로 옮긴 뒤 파랑이 남음(`else` → `std::nullopt` — 렌더 도구로 맘모꾸리 → 메꾸리 확인)
- 정리: TODO → 짧은 한국어 주석, 파랑 점의 테두리 제거(`NoPen` — 빨강과 같게), 셋째 줄 높이 18, 배열 복사 → const 참조
- 클린 빌드 경고 0 · 173 통과. `RealSave` 소울실버 + **화이트(BW) 실파일 첫 통과** — 5세대 BW 수치 확인([data/gen5/](data/gen5/README.md))
- AppImage 자기 등록(Claude 구현): 격리한 `XDG_DATA_HOME`에서 실제 AppImage로 확인 — 첫 실행에 .desktop + 아이콘 8개, 두 번째는 쓰지 않음(mtime 그대로),
  공백 · `$` 든 경로의 Exec를 GLib(`shell_parse_argv`)가 원래 경로로 되돌림, `desktop-file-validate` 통과, 파일을 옮기면 Exec 갱신, 지우면 `Gio.DesktopAppInfo`가 NULL(TryExec로 숨음)
- 렌더 도구(`detailshot` — `DexDetailPage`를 offscreen으로 그려 PNG)는 scratch 워크트리에서만 만들고 지웠다. 필요하면 다시 만든다: `tools/CMakeLists.txt`에 실행 파일 하나 + `pokesix_ui` · `pokesix_data` 링크

### 2026-10-12 — v0.3.0 릴리스 준비 · H8 시작 (Linux 세션)

- v0.3.0(MINOR — 기능 추가라 사용자가 말한 0.2.2 대신 규칙대로) 릴리스 커밋 · 태그를 로컬에 만들고, 릴리스 노트를 `docs/release-notes/`에서 CI가 올리게 했다(notes 잡). push는 사용자
- 사용자 PC의 0.2.1 AppImage가 안 뜬 원인: 브라우저로 받은 파일에 실행 권한 없음. `chmod +x` 후 `~/.local/bin/PokeSix.AppImage`(quickstart가 만든 메뉴 항목의 대상)에 덮어씀
- H8 설계: 사용자는 "성격 · 도핑으로 종족값이 바뀐다"로 시작 — 바뀌는 건 능력치라는 점을 짚고, 파랑 = 인게임 숫자 그대로(A안, 눈금 자동 확장 + 숫자 병기)로 합의.
  능력치는 계산하지 않고 세이브 저장값을 읽는다(공식은 시뮬 때). `SquadMember.level` 0 = 모름(optional 대신 — JSON · 기본값 단순), 종을 바꾸면 `setPokemon`이 새 멤버라 저절로 지워짐
- 뼈대 검증: 참조 구현으로 173개 통과, 격리한 데이터 복사본(XDG_*_HOME)으로 스쿼드 화면 캡처(LV.48 확인 — 도트 글꼴은 대문자뿐), 레이더는 임시 렌더 도구로 그려 봄 →
  파랑을 빨강 뒤에 그리기 · 아래 축 셋째 줄이 잘려 여백 필요 — 두 힌트를 뼈대 TODO에 반영
- 사용자 요청: 가이드는 시작 코드를 조금만, 아이디어 설명을 읽기 좋게 — H8 가이드부터 CP마다 "아이디어 → 알아 둘 것 → 시작 코드 → 확인"

### 2026-10-12 — H6 완료 · merge (Linux 세션)

- 사용자 구현 CP1–CP5(기기 리더 목록 · NDS 시리즈 판별 `std::visit` · 5세대 체크섬 검증 · PK5 · Portable 세대). 진단 · 구현 중 짚은 것:
  반복문 안의 `else return nullopt`(첫 행에서 끝남 + 반복문 뒤 return 없음 = 정의되지 않은 동작, `-Wreturn-type`), `uint16_t`에 파일 위치를 담아
  잘림(0x23F8C → 0x3F8C), 파일 밖 검사 뒤 return 없이 계속 읽어 SEGFAULT, 사본 위치를 BW 숫자(0x23F34)로 하드코딩(→ B2W2 테스트 보강),
  `decodePkm`의 `||`(늘 참 — 내 TODO 문구 "236 또는 220"이 오해를 부름), `x & 0x01 != 0` 우선순위, `portable.generation`을 채우기 전에 읽음
  (가이드 · TODO가 그 이름을 고칠 자리로 나열해 오해를 부름 — 가이드 수정)
- 정리: 다 채운 TODO 삭제(CP6만 남김), 숨겨진 특성 비트 1 테스트, 오류 문구(사용자가 "4세대 · 5세대"를 나열한 문구를 일단 유지) 번역 2벌
- 검증: 클린 빌드 경고 0 · 테스트 167 · RealSave(SS 한국판) 6마리 H1과 동일 · readsav 출력 동일. 앱에서의 불러오기는 사용자 확인 필요
- 집 Windows 세션(10-09)의 origin/main과 이 머신의 main이 갈라져 있던 것을 merge로 합쳤다(worklog 충돌만)

### 2026-10-09 — Windows: 스키마 12 첫 실행의 DB 교체 실패 (집 세션)

- 증상: 첫 실행 패널 "데이터를 받지 못했어요 / cannot move …pokesix.sqlite.importing to …pokesix.sqlite". 원인: 설치본 `C:\PokeSix\bin\PokeSix.exe`(v0.1.0 · 스키마 11)가 떠 있어 옛 DB를 읽기 전용으로 잡고 있었고, 새 Debug 빌드(스키마 12)의 변환 결과를 Windows가 바꿔 넣지 못함. PowerShell 배타 열기로 잠금 확인. Linux에서는 열린 파일도 교체되므로 회사 세션에서는 안 보였다
- 수정(`gamedatabase` · `CsvImporter` · `DataUpdater` · `FirstRunPanel` · `Application` · `MainWindow`): 교체가 막히면 완성된 임시 DB를 남기고 `replaceBlocked`로 알림 → 패널이 "다른 PokeSix 창을 닫고 다시 시도" 안내, [다시 시도]는 재변환 없이 교체만, 다음 실행 때 `adoptPendingImport`가 DB를 열기 전에 교체. 같은 프로세스의 Repository는 변환 전에 닫는다(`aboutToReplaceDatabase`). 스키마 · CSV 커밋이 다른 임시 파일은 폐기. 테스트 3개(`PendingImport.*`)
- 실기 확인: 설치본이 떠 있는 상태에서 새 빌드 시작 → 로그 `cannot remove … (opened by another process?)`, 두 파일 모두 보존. **설치본을 닫고 다시 실행하면 11:27에 만든 `.importing`이 자동 적용된다**(사용자 확인 필요). 설치본은 `package.bat`/msi로 다시 만들어 교체하면 스키마가 맞는다
- **v0.2.0 릴리스 · msi 검증**(같은 날 오후): 버전 규칙에 "Phase 중간이라도 기능이 들어가면 MINOR"를 명시하고 0.2.0으로. WiX 3.14를 winget(관리자 UAC, NetFx3 필요)으로 설치해 `package.bat`으로 zip + msi 생성. 발견 · 수정 셋: ① 포터블 exe가 떠 있으면 `rmdir`이 조용히 실패하고 `cmake --install`에서 죽음 → `package.bat`이 바로 "실행 중인 PokeSix를 닫으라"고 멈춤. ② `windeployqt --compiler-runtime`은 VS 환경 변수 없이는 vc_redist를 안 넣어 **지금까지 Windows 패키지에 CRT가 없었다** → `InstallRequiredSystemLibraries`로 `msvcp140*` · `vcruntime140*`를 bin에 동봉(THIRD_PARTY_NOTICES 갱신). ③ Windows 패키지에는 offscreen 플러그인이 없어 `--offscreen` 테스트가 "no Qt platform plugin" 창을 띄웠다(사용자가 그 창을 봄) — 배포본 캡처는 창을 띄운 채로. msi: 설치(UAC) → `%APPDATA%` 시작 메뉴 바로가기(per-user 컴포넌트) → 설치된 exe가 Qt 없는 PATH에서 `--screenshot` 성공 → 제거 후 폴더 · 바로가기 · 제거 항목 모두 사라짐

### 2026-10-09 — Windows 다크 모드에서 분석 창이 검게 (집 세션) → v0.2.1

- 친구 PC(msi 0.2.0)에서 스쿼드 분석 창 몸통이 검게. 처음엔 공유 이미지 렌더를 의심했으나 라이브 창도 같다고 함 → **Windows 다크 모드** 가설을 내 PC에서 `AppsUseLightTheme=0`으로 재현(캡처로 확인). 원인: Qt 6.5+ Windows가 다크 팔레트를 적용하고, 앱은 팔레트를 안 정해 `background: transparent` 자리에 어두운 Window 색이 비침. 수정: `theme::apply`에서 `setColorScheme(Light)` + 토큰 팔레트. 재현 캡처에서 종이색 확인. [build.md §5-9](build.md#dark-mode)
- 버그 수정만이라 **v0.2.1(PATCH)**. dmg 안내문 변경도 같이 나간다

### 2026-10-09 — macOS "손상됨" 후속 (집 세션)

- 사용자가 친구 Mac의 v0.1.0 dmg 화면(Gatekeeper "손상되었기 때문에 열 수 없습니다")을 다시 가져옴. 원인은 10-08 기록 그대로(공증 없음 + quarantine). v0.2.0은 CI 로그에서 ad-hoc 재서명 + `codesign --verify` 통과 확인. 무료로 창 자체를 없앨 방법은 없으므로 **안내를 창이 뜨는 자리(dmg 안 텍스트 파일)에 넣었다** + README에 추출 단계 · `curl -LO` 대안. v0.1.0 · v0.2.0 릴리스 노트에도 macOS 절을 덧붙였다(이 머신엔 자격 증명이 있다)

### 2026-10-08 — H6 시작: 여러 세대 세이브 (Linux 세션)

- 사용자 질문("4세대 하드코딩 아니지?")에서 출발: 게임 단위 판별은 표였지만 세대는 `saveimport`의 `kGeneration = 4`로 고정이었음 →
  사용자가 정한 세 단계(① 판별 ② 추출 ③ Portable 구성)로 H6 설계. overlay-design §5 · roadmap · data README 교정은 먼저 merge(e7b317f)
- 첫 뼈대: `saveformat.{h,cpp}`(함수 포인터 형식 표) · `gen5.{h,cpp}`(PKHeX 수치) · `ReadParty` 세대 중립화 ·
  PK5 220 B · 성격 `0x41` · 숨겨진 특성 `0x42` 비트 0 (→ 아래 재작업으로 대체)
- 검증: scratch worktree의 버리는 참조 구현으로 코드 테스트 161개 전부 통과(env 검사는 그 worktree에서 빌드하지 않아 제외). worktree는 삭제
- **구조 재작업(같은 날, 사용자 검토)**: 세대별 파일(`gen5.*` · `saveformat.*`)은 "하드코딩이 파일 단위로 옮겨 갔을 뿐"이라는 지적 →
  기기별 클래스(`PartyReader` 부모 → `PartyNdsReader`, 파일명 `partyndsreader` — 사용자가 부모 이름을 앞에 두자고 정함) + 시리즈 표
  `kNdsSeries` + 검증 방식 `std::variant<FooterSlots, ChecksumTable>` + `PkmFormat`(PK4 · PK5) → [ADR 0019](decisions/0019-save-readers-per-platform.md).
  H1 코드는 로직 그대로 옮김. 사용자가 첫 뼈대에 채우던 CP1 · CP2-1(커밋 전)은 구조가 바뀌어 덮어썼다(가이드에 옮겨 간 자리 명시).
  참조 구현으로 163개 전부 통과 + 실제 SS 세이브 결과가 H1과 동일. 빨강 19개
- **미확인(◇)**: 5세대 수치 전부 — BW · B2W2 실파일 없음. 합성 세이브는 같은 수치로 만들었으므로 "PKHeX 수치를 맞게 옮겼다"까지만 보장한다

### 2026-10-08 — H2 완료 · merge (Linux 세션)

- 사용자 구현 CP1–CP8(CP8 = 끌어다 놓기 안내 덮개, 사용자 추가 요청). 진단에서 고친 것: 스키마 · 변환기의 칸 누락과
  쉼표 실수(INTEGER라는 칸이 생김), 조회의 세대 조건 · bindValue 오타, egg 덮어쓰기(중복 줄), importFile 옮기기 미완,
  setAcceptDrops 위치 — 각각 원인을 설명하고 고침. 정리: 다 채운 TODO 삭제, 드롭 후 불러오기를 다음 루프로 미룸
  (확인 창이 드래그 원본을 막지 않게), 번역 7문구 × 2
- **스키마 12**: 업데이트 후 첫 실행에 데이터를 다시 만든다(캐시 CSV, 수 초) — CHANGELOG에 명시
- 실데이터 확인: 캐시 CSV로 만든 DB + 실제 SS 세이브 → soulsilver · 6마리, 성격 · 물건까지 H1 표와 일치. 앱에서 불러오기 · 드롭 · 덮개 사용자 확인
- 클린 빌드에서만 보이던 숨은 경고 2개(repository_test dangling else · VersionChip::Part 초기화) 정리
- UI 자동 테스트는 없다(core · data · env만) — 로직은 data에 두고 UI는 얇게. 화면이 안정되는 F–G쯤 `tests/ui/` 검토

### 2026-10-08 — H1 완료 · merge, H2 시작 (Linux 세션)

- H1 진단 통과(경고 0 · 테스트 131 · RealSave(SS) 통과 · clang-format): 사용자 구현 CP1–CP5 + 로그. 채운 TODO 주석은 지우고 merge
- 진단 중 발견해 고친 것: 파일 밖 footer가 CRC 0 = 0으로 "맞음"이 되던 뼈대 버그(`BlockFooter::inFile`), 도구가 512 KiB 미만 파일에서 멈추지 않던 것
- 사용자 기억의 스쿼드와 비교: 기술 24 · 특성 6 · 성격(홍수몬) 전부 일치, 파티 순서와 기술 칸 순서만 다름(세이브가 게임 순서)
- VS Code 디버깅 실습: 개인 `.vscode/launch.json` · `tasks.json`(git 제외) — 세이브 도구 · core 테스트 · 앱 세 설정

### 2026-10-08 — docs/data/ 세이브 · PK4 바이트 지도 (Linux 세션)

- 사용자 요청(최종 목표 = 전투 분석 · 시뮬): 세대 · 시리즈별 세이브 비트맵 → `docs/data/` (`gen4/` README · pk4 · dp · pt · hgss,
  `battle-inputs.md`). 수치는 PKHeX 대조, 바이트 지도는 정렬이 깨지지 않게 스크립트로 생성(scratch, 커밋 안 함)
- **실파일 검증(SS 한국판)**: 첫 포켓몬 프테라 Lv.48의 저장 능력치 6개가 IV · EV · 성격(PID % 25) · DB 종족값으로 계산한 값과 전부 일치.
  출신 게임 `0x5F` = 8, 만난 날 2026-10-06, 가방 TM 주머니 `0x09A0` 첫 칸 = 328(TM01), 트레이너 언어 8. DP · Pt는 실파일 없음(◇)
- 남은 것: 경험치 → 레벨 표(PokéAPI `experience` · `growth_rates`)는 받는 CSV 목록에 없음 — 박스 포켓몬을 읽을 때 추가.
  4세대 글자표(이름) 미정리. 데미지 공식은 시뮬 시작 때 출처 대조 후 별도 문서

### 2026-10-08 — docs/ui/ UI 구조 지도 (Linux 세션)

- 사용자 요청: Qt UI 구조를 그림으로 전수조사 → `docs/ui/` 11개 문서(상속 계층 · 화면별 배치 그림 · 객체 트리 ·
  시그널 흐름 · 모델/뷰 · 공용 부품 · 스타일). 조사는 영역별 하위 에이전트 5개로 병렬, 핵심 수치는 코드로 재확인
- 발견: 주석이 코드와 다른 곳 12곳(탭 4개 → 실제 5개, 인트로 메뉴 3개 → 4개 등)과 작은 동작 문제 2개(타운맵 아이템 아이콘
  `ready` 미연결, 아이템 표 상세 질의 두 번) — README 표에 기록만 하고 **코드는 고치지 않았다**(사용자 판단 대기)
- H1 작업 중인 브랜치를 건드리지 않으려고 별도 worktree에서 작성해 main에 바로 merge

### 2026-10-08 — H1 시작: 세이브 읽기 설계 확정 · 가이드 (Linux 세션)

- 사용자 결정: 세이브 화면을 새로 만들지 않고 **스쿼드 불러오기가 `.sav`를 받는다**, 읽기 전용(편집 · 내보내기 없음) →
  [ADR 0018](decisions/0018-save-import-read-only.md). 파서는 사용자가 직접(가이드 + 로그 + 디버그 CLI 단계별)
- overlay-design.md §5 수치 교정(PKHeX 대조): 파티 수 DP 0x94 · Pt 0x9C · HGSS 0x94, 파티 DP 0x98 · Pt 0xA0 · HGSS 0x98,
  일반 블록 HGSS 0xF628(앞선 판의 0xF700은 보관 블록 위치), footer 카운터는 세 게임 모두 끝 − 0x14 · − 0x10, CRC-16/CCITT-FALSE
- 뼈대: `src/core/save/`(savebytes · saveblock · pkmcodec · partyreader — 헤더 완성, 몸통 TODO), 도구
  `tools/readsav`(`pokesix-read-sav`, `pokesix.save` 로그 줄이 TODO), 테스트 32개(+ RealSave 2개는 환경 변수 있을 때만).
  테스트는 scratch의 버리는 참조 구현으로 32/32 통과 확인, 도구도 합성 세이브로 출력 확인(가이드의 기대 출력이 그것)
- ~~미확인: footer 끝 − 0x0C가 블록 크기인지~~ → 사용자 CP0(SS 한국판 실파일)으로 확인: `28 f6 00 00` = 0xF628. 같은 출력에서 HGSS는 major가 두 슬롯 모두 0이고 저장 횟수가 minor(100 · 99)에 있음을 확인 — 주석 · 가이드 교정.
  한국판 매직 0x20070903 외 레이아웃 차이는 없다고 보고 있음(PKHeX 기준)

### 2026-10-08 — 빌드 식별 문자열 · Windows .msi (Linux 세션)

- **버전 형상화(ADR 0017)**: 창 제목 · `--version`이 정확한 빌드를 말한다 — 태그 위 클린
  Release만 `0.1.0`, 그 외 `0.1.0+12.g3f4a5b6[.dirty]`, Debug는 ` Debug` 추가.
  `cmake/PokeSixBuildInfo.cmake`(빌드마다 실행, 내용 같으면 안 씀 — 재컴파일 0 실측) →
  `buildinfo.h` → `applicationVersion()`. 규칙 전문은 versioning-and-git.md §1
- **Windows 설치본**: CPack **WIX**로 `PokeSix-<버전>-win64.msi` — 시작 메뉴 바로가기,
  고정 UPGRADE_GUID(`D70F9D30-…`, 바꾸면 업그레이드가 깨진다), 라이선스 화면(MIT txt 자동
  변환). WiX 3.14는 windows-2022 러너에 프리인스톨(InnoSetup · NSIS도 있음 — WIX 채택 근거는
  deploy.md §2-4). `package.bat`이 zip 뒤에 cpack 실행, WiX 없으면 안내 후 건너뜀.
  릴리스 워크플로가 zip + msi 둘 다 첨부, checkout 3곳에 `fetch-depth: 0`(태그 없으면
  식별 문자열이 `+unknown`)
- **미검증**: msi 생성은 Windows에서만 돌므로 실기/CI 확인 전. CPack이
  `install(SCRIPT)`(windeployqt)를 스테이징에 돌리는 경로가 첫 관문 — workflow_dispatch
  한 번으로 확인 가능(이 머신엔 트리거 자격 증명이 없어 사용자가 눌러야 하고, 결과는
  public API로 여기서 읽을 수 있다)
- v0.1.0 Release에는 msi가 없다 — 다음 태그부터 포함. README Download 표에 msi 행 추가

### 2026-10-08 — macOS Gatekeeper "손상됨" (Linux 세션)

- 친구 Mac에서 v0.1.0 dmg가 **"PokeSix은(는) 손상되었기 때문에 열 수 없습니다"** — 파일 손상이
  아니라 Gatekeeper: 공증(notarization) 없는 앱을 브라우저로 받으면 quarantine이 붙고, 서명이
  Developer ID가 아니면 이 문구로 막는다(이 경우 **우클릭 → 열기 우회도 안 된다** — 기존 문서
  3곳의 안내가 틀렸었다)
- 조치: README에 **Download 절** 신설(3 OS 받는 법 + macOS `xattr -d com.apple.quarantine` 안내,
  Windows SmartScreen 안내), deploy.md · package.sh 주석 교정, `scripts/macos/package.sh`에
  macdeployqt 뒤 **ad-hoc 재서명**(`codesign --force --deep --sign -` + verify) 추가 — 서명이
  깨진 arm64 바이너리는 격리를 풀어도 안 떠서, 풀면 반드시 뜨게 하는 보험
- **v0.1.0 릴리스 노트에 macOS 안내를 덧붙이는 건 사용자 몫**(이 머신엔 GitHub 자격 증명 없음) —
  본문은 이 세션이 준비해 전달함. ad-hoc 재서명은 다음 태그 패키지부터 효력
- 공증(Apple Developer 연 99달러 + CI secrets)은 백로그 — 붙이면 경고 자체가 사라진다

### 2026-10-07 — Windows · quickstart 통과 · 릴리스 CI · Phase A 마무리 시작

- 사용자가 "진행해봐"로 추천안(태그는 Phase A 완료 뒤 `v0.1.0`)을 승인 → Phase A 남은 단계를 Claude가 구현하기 시작했다(ADR 0010의 연장)
- **A3 완료**: `src/app/`에 `Application`(composition root) — `main.cpp`는 이것만 만든다. AppState · Repository · DataUpdater를 여기서 만들어 `MainWindow`에 주입(생성자 시그니처 변경). 로그 형식 `hh:mm:ss.zzz L category: message`. `--screenshot <intro|dex|items|map|squad|settings> <WxH> <out.png> [--screenshot-delay ms]`(기본 1200ms = 부채꼴 등장 애니메이션 뒤). Windows offscreen에서 intro · dex · squad 캡처 확인. 디자인 03b의 `intro-gen-open`(세대 메뉴는 이제 카드 부채꼴이라 대상 없음) · `intro-first-run`(상태 강제 API 없음)은 만들지 않았다
- **A7 완료**: 인트로 메뉴 포커스 링 — Tab · Shift+Tab으로 들어온 포커스에만 선택 카드 바깥 파란 링(3px · 간격 2px). 부모(`IntroMenu`)가 여백(`kFocusMargin` 5)에 그린다 → 열린 질문 7을 [ADR 0016](decisions/0016-outside-decorations-drawn-by-parent.md)으로 확정. 메뉴 폭 = 520 + 10. 캡처 모드로는 Tab을 누를 수 없어 링 자체는 눈으로 확인하지 못했다(코드 리뷰 · 컴파일만) → 실기에서 Tab 한 번 눌러 확인할 것
- **A8 · A10 완료 → Phase A 종료**: A8의 "폭 300 팝업"은 ADR 0015 · 사용자 결정으로 다른 모양이 되어 있어 코드 변경 없이 차이를 [design/README.md "의도한 차이"](../design/README.md)에 적는 것으로 마무리. A10: 캡처(`--screenshot intro`) vs `30` · `31` 차이 목록 = 같은 표. 키보드 왕복을 위해 **Ctrl+0 → 인트로** 단축키를 더했다(마크 버튼은 Tab으로 멀다). 실기 키보드 확인은 사용자 몫
- **릴리스 `v0.1.0`**: CHANGELOG `Unreleased` → `[0.1.0] - 2026-10-07`, `CMakeLists.txt` VERSION 0.1.0, README 상태 줄. `chore(release): v0.1.0` 커밋 + 태그 → 릴리스 워크플로가 3 OS 패키지를 Release에 붙인다(결과 아래에 추가)
- **릴리스 결과**: 태그 실행(37604014683)은 3 OS 모두 패키지 · 아티팩트까지 성공했지만 **Release 첨부 단계가 403**("Resource not accessible by integration"). 원인: 조직(yamada-studio) 설정이 `GITHUB_TOKEN` 기본 권한을 read로 고정(리포 설정 API로 바꾸려 하면 409 "disabled by the organization"). 워크플로에 `permissions: contents: write`를 더해 main에 커밋했다(`670a8a7`) — 태그 뒤라 이번 태그에는 안 먹는다. 태그를 옮기지(force) 않고, **그 실행의 아티팩트 3개를 받아 Release를 손으로 만들어 공개했다**: https://github.com/yamada-studio/PokeSix/releases/tag/v0.1.0 (ZIP 17.5MB · AppImage 39.5MB · dmg 32.6MB, SHA-256은 릴리스 노트 안). **다음 태그에서 워크플로가 스스로 붙이는지 확인할 것** — 안 되면 조직 설정에서 "Workflow permissions"를 바꾸거나 PAT secret을 써야 한다

- Linux 쪽 142개 커밋을 받은 뒤 `quickstart.bat`이 Windows에서 세 군데 깨졌다 → 전부 고쳐 통과:
  `cardbarrel.cpp` most vexing parse(MSVC만 거부) · `package.bat`이 VS 번들 cmake를 안 찾음 · `QSettings` 기본 형식(Windows 레지스트리 + 테스트에 조직 이름 없음 → 쓰기 무시)으로 테스트 2개 실패.
  상세는 CHANGELOG `Fixed`와 커밋 `63f2115`
- 릴리스 CI 첫 실행(`workflow_dispatch`, 태그 없음): 1차 — Linux 성공, macOS는 AppleClang 15가 람다의 구조적 바인딩 캡처(`moveeffect.cpp`)를 거부, Windows는 `windows-latest`에 VS 2022가 없음. 둘 다 고친 2차(37600397225)는 3 OS 모두 성공, 소요 Linux 3.5분 · macOS 2.5분 · Windows 7.5분. 커밋 `3996834`
- GitHub API는 `gh` 없이 Git Credential Manager의 토큰(`repo` · `workflow` 범위)으로 호출했다. 헬퍼는 세션 임시 폴더에만 있었고 리포에는 없다 — 회사 세션에서는 `gh`를 쓰는 편이 낫다
- `docs/worklog.md`(이 문서) 시작, CLAUDE.md에서 연결

### 2026-10-04 — Windows 첫 세팅

- Windows 머신 세팅(VS · uv · Qt) 후 Debug 빌드 · 71 테스트 · 실행 확인. 스크립트 버그 3개(`shift` → `shift /1`, gtest discovery `PRE_TEST`, uv PATH) 수정
- 문서: [overlay-design.md](overlay-design.md)(에뮬레이터 오버레이 검토 · 설계), [deploy.md](deploy.md)(실행 CLI · 배포 방안 — 이후 Linux 세션이 방안 B · D를 실제로 적용함)
- 스쿼드 분석 패널 배치 변경(히트맵 고정 · 문제 칸 자체 스크롤 · 크게 보기 모달) — 사용자 요청으로 Claude 구현

### ~2026-10-06 — Linux (CHANGELOG `Unreleased` 참고)

- Phase G lite: `package.*` · `quickstart.*` · `qt_generate_deploy_app_script` · 릴리스 워크플로 · 최소 Qt 설치
- Phase T 타운맵 백과(성도 · 관동 · 신오 · 하나), 스쿼드(비전셔틀 · undo/redo · `.pks` 내보내기 · 이미지 공유 · 기술 출처 배지), 세대 버튼 줄무늬

---

## 이 리포에서 Claude가 배운 함정

- **Windows 전용 빌드 함정**은 [scripts/README.md "스크립트를 고칠 때"](../scripts/README.md)와 [build.md §5](build.md)에 모아 둔다(`shift /1`, `:find_cmake`, gtest `PRE_TEST`, DLL PATH). 새로 발견하면 거기에 추가
- GCC가 받아 주고 MSVC가 거부하는 코드가 있다(most vexing parse, 좁히기 변환 경고). Linux에서 큰 변경을 한 뒤에는 **Windows에서 `quickstart.bat --no-run`을 한 번 돌린다**
- 실행 중인 `PokeSix.exe`가 있으면 링크가 `LNK1168`로 실패한다. 창에 닫기 메시지를 보내면(`CloseMainWindow`) 저장소 소멸자가 flush하므로 편집이 보존된다
- Windows에서 테스트가 `QSettings`를 건드리면 반드시 `IniFormat` + 임시 폴더 `setPath`. 기본(레지스트리)은 조직 이름이 없으면 조용히 실패한다
- Claude Code의 Bash 도구(Git Bash)는 `\\`를 한 번 벗긴다. 백슬래시(Windows 경로 · `.bat`)가 들어가는 편집은 Read + Edit 도구로 한다. `.bat`은 CRLF 유지
