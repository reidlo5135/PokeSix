# E2b — 진화 전 단계의 기술 상속: 가디가 배운 기술은 윈디의 것이다

> 브랜치: `fix/e2b-preevo-moves` (Claude가 만들어 둠) · 커밋 footer `Refs: E2b`
> 버그 신고(2026-10-19, 사용자): "스쿼드 구상에서 윈디를 골라 버리면 가디에서 배우는 기술들을 못 고른다"
> 확인은 테스트(픽스처의 삐삐 → 픽시)로 먼저, 실행은 실제 DB(DP 가디 → 윈디)로

## 0. 무엇이 잘못됐나

실제 게임의 규칙: **진화해도 기술은 남는다.** 가디를 Lv.43까지 키워 불대문자를 배우고 불꽃의돌을
쓰면, 윈디는 불대문자를 아는 채로 시작한다. 윈디 자신의 자력표에는 Lv.1 기술 몇 개뿐이라
"윈디가 배울 수 있는 기술"은 사실상 **가디의 자력표 ∪ 윈디의 자력표**다. 돌 진화 포켓몬
(윈디 · 픽시 · 샤미드 …)은 전부 이 구조다.

그런데 지금 기술 선택 창은 윈디 **자신의** 표만 보여 준다:

```
[기술 선택 창 — DP 윈디]                          기대 (E2b 완료 후)
┌──────────────────────────────┐          ┌──────────────────────────────────┐
│ 물기      자력(1레벨)         │          │ 물기        자력(1레벨)           │
│ 포효      자력(1레벨)         │          │ 포효        자력(1레벨)           │
│ 불꽃엄니  자력(1레벨)         │          │ 불꽃엄니    자력(1레벨)           │
│ 신속      자력(39레벨)        │          │ 신속        자력(39레벨)          │
│ (TM 목록 …)                  │          │ 물어뜯기    자력(가디 28레벨)   ★ │
└──────────────────────────────┘          │ 불대문자    자력(가디 43레벨)   ★ │
  가디의 자력기 13개가 안 보인다            │ 버티기      알                 ★ │
  알 기술도 0개(가디에만 있다)              │ (TM 목록 …)                      │
                                          └──────────────────────────────────┘
```

같은 구멍이 둘 더 있다:

- **알 기술**: PokéAPI는 알 기술을 **기본 모습**(가디)에만 적는다. 윈디로 조회하면 0개
- **세이브 불러오기**: 가디 시절에 배운 기술을 가진 윈디를 `.sav`로 불러오면, 그 기술이
  "이 게임에서는 배울 수 없는 기술이에요"(빨간 빗금)로 찍히고 분석에서도 빠진다

## 1. 원인 — 데이터가 흐르는 길

기술 선택 창까지의 경로다. 끝에서 SQL이 **고른 포켓몬의 id 하나로만** 묻는 게 원인이다.

```
SlotCard 기술 칸 클릭
└─ SquadPage::pickMove(slot, index)                 src/ui/squad/squadpage.cpp
   └─ SquadSession::learnableMoves(slot)            src/data/state/squadsession.cpp
      └─ m_details[slot]  (PokemonDetail 캐시)
         └─ Repository::readPokemonDetail()         src/data/repository/repository.cpp
            ├─ levelMoves   ← SELECT … WHERE pokemon_id = :p AND method = 1   ← 윈디(59)만
            ├─ machineMoves ← …                            AND method = 4
            ├─ tutorMoves · eggMoves ← …                   AND method = 3 · 2
            └─ fillEvolution(detail, groupId)
               └─ 조상(가디)의 자력표를 이미 SELECT한다!  ← 그런데 needsReminder
                  movereach::reachableMoves(path)          판정에만 쓰고 버린다
```

핵심 발견: **재료는 이미 다 있다.** `Repository::fillEvolution`은 하트비늘 판정을 위해

1. 같은 진화 사슬의 종을 `steps`(이름 포함)로 읽고,
2. `ancestors`(가까운 단계부터의 pokemon id 목록)를 만들고,
3. 조상마다 자력표를 SELECT해서 `path`(뿌리 → 대상 순서의 `movereach::Stage` 목록)에 담는다.

이번 단계는 이 `path`에 담긴 조상 자력표를 **버리지 않고 목록으로 내보내는** 일이다.
새 SQL은 알 기술 한 줄뿐이다.

## 2. 설계 — 상속 기술을 어디에 담을까

| | A안: `levelMoves`에 섞기 | B안: 새 목록 `inheritedMoves` ✅ |
|---|---|---|
| 스쿼드 기술 선택 | 자동으로 나옴 | `learnableMoves`에 한 루프 추가 |
| 도감 상세의 자력표 | **가디 기술이 윈디 표에 섞인다** — 출처 표시가 없으면 거짓말 | 그대로(남는 숙제로) |
| `.pks` 저장 | 영향 없음 | 영향 없음 |
| 테스트 | 기존 `levelMoves` 단언이 흔들림 | 기존 테스트 그대로 |

B안으로 간다. 데이터 구조는 세 곳이 바뀐다 (`src/data/repository/repository.h`):

| 자리 | 추가 | 뜻 |
|---|---|---|
| `MoveEntry` | `int fromPokemonId = 0;` | 0 = 제 기술, >0 = 이 단계가 배운 기술 |
| `MoveEntry` | `LocalizedText fromName;` | "가디" — 언어 전환을 따라가게 id가 아니라 이름 묶음 |
| `PokemonDetail` | `QList<MoveEntry> inheritedMoves;` | 진화 전 단계의 자력기(레벨 순). 제 자력표에 있는 기술은 제외 |

알 기술은 새 목록이 아니라 **기존 `eggMoves`에 합친다** — "알에서 태어날 때 갖고 나오는
기술"이라는 뜻은 진화해도 같아서, UI를 바꿀 필요가 없다.

---

## 과제 1 (data) — Repository: 조상의 자력표를 내보내기

> **문제.** `Repository::pokemonDetail(36, 4)`(DP 픽시)를 호출하면
> `inheritedMoves`에 삐삐(35)의 자력기 중 픽시 자력표에 없는 13개가
> (레벨 오름차순, `fromPokemonId = 35`, `fromName = 삐삐`)로 들어 있어야 한다.
> 진화하지 않는 포켓몬(한카리아스)은 빈 목록. 기존 `levelMoves`는 바뀌면 안 된다.
>
> **조건.**
> - 3단 진화(리오루 → 루카리오 같은 2단은 물론, 꼬링크 3단)도 동작: **가까운 단계가 우선**이고,
>   같은 기술이 여러 단계에 있으면 한 번만 넣는다
> - 하트비늘 표시(`needsReminder`)는 기존 `reach` 결과를 그대로 쓴다: 이 게임에서 얻을 수
>   있는데(`reach.obtainable`) 자연 습득 경로에 없으면(`!reach.moves.contains`) 참

### 아이디어

`fillEvolution`의 2) 블록이 끝나면 손에 이런 게 있다:

```
ancestors        = [가디 pokemon id]                 ← 가까운 단계부터
ancestorSpecies  = [가디 species id]
steps            = { species id → EvolutionStep(이름 · pokemonId …) }
path             = [가디 Stage, 윈디 Stage]          ← 뿌리 → 대상. Stage.learnset = 자력표
reach            = movereach 결과(obtainable · moves)
```

`ancestors[k]`와 `path`의 대응만 조심하면 된다: `path`는 뿌리부터, `ancestors`는 가까운
단계부터라 **서로 반대 방향**이다. `ancestors[k]`의 자력표는 `path[path.size() - 2 - k]`다
(마지막 칸은 자기 자신).

### TODO

`src/data/repository/repository.h`:

1. `MoveEntry`에 `fromPokemonId` · `fromName`을 더한다 (§2 표)
2. `PokemonDetail`의 `levelMoves` 아래에 `inheritedMoves`를 더한다

`src/data/repository/repository.cpp`:

3. `readPokemonDetail`에서 `fillEvolution(detail, groupId);` 호출을 `fillMoves(…)` 네 줄
   **앞으로** 옮긴다 (상속 목록도 이름 · 타입 · 위력을 받아야 하니까)
4. `fillMoves(detail.levelMoves, generation);` 옆에 `fillMoves(detail.inheritedMoves, generation);`을 더한다
5. `fillEvolution` 안, `reach`로 `needsReminder`를 정하는 `if (reach.obtainable)` 블록 **앞**에
   상속 목록을 만든다 (아래 시작 코드) — `reach`는 블록보다 먼저 계산돼 있다
6. 다 채운 뒤 `detail.inheritedMoves`를 레벨 오름차순(같으면 move id 순)으로 `std::sort`한다

시작 코드 (5번):

```cpp
// 진화 전 단계의 자력표를 상속 목록으로 — 제 자력표에 있는 기술과 이미 넣은 기술은 건너뛴다
QSet<int> taken;
for (const MoveEntry &move : std::as_const(detail.levelMoves))
    taken.insert(move.moveId);
for (qsizetype k = 0; k < ancestors.size(); ++k) {
    const movereach::Stage &stage = path[/* ? — §아이디어의 대응식 */];
    const EvolutionStep &from = steps.value(ancestorSpecies.at(k));
    for (const movereach::LevelMove &learned : stage.learnset) {
        if (taken.contains(learned.move))
            continue;
        taken.insert(learned.move);
        MoveEntry move;
        move.moveId = /* ? */;
        move.level = /* ? */;
        move.fromPokemonId = from./* ? */;
        move.fromName = from./* ? */;
        move.needsReminder = /* ? — 문제의 "조건" 둘째 줄 그대로 */;
        detail.inheritedMoves.append(move);
    }
}
```

### ✅ 확인 — 테스트부터 (tests/data/repository_test.cpp)

픽스처가 이미 가디/윈디와 같은 모양이다: 삐삐(35)는 Lv.46까지 17개, 픽시(36)는 Lv.1 네 개
(3 · 47 · 107 · 118)뿐이다. `EvolutionTreeAndReminderMoves` 아래에 새 테스트를 쓴다:

```cpp
TEST_F(RepositoryTest, InheritsLevelMovesFromPreEvolutions)
{
    Repository repository(s_dbPath);
    const PokemonDetail clefable = repository.pokemonDetail(36, 4);
    EXPECT_EQ(clefable.levelMoves.size(), 4); // 제 자력표는 그대로
    ASSERT_EQ(clefable.inheritedMoves.size(), 13); // 삐삐 17 − 겹치는 4
    // 메테오마시(309): 삐삐가 Lv.43에 배우고 픽시 자력표에는 없다
    /* ? — inheritedMoves에서 moveId 309를 찾아
           level == 43, fromPokemonId == 35, 이름이 비어 있지 않음을 단언 */
    // 제가 Lv.1에 배우는 노래하기(47)는 상속 목록에 없다
    /* ? */
    // 진화하지 않는 포켓몬은 빈 목록
    EXPECT_TRUE(repository.pokemonDetail(445, 4).inheritedMoves.isEmpty());
}
```

```bash
scripts/linux/build.sh && build/linux-debug/tests/data/pokesix_data_tests --gtest_filter='*Inherits*'
```

## 과제 2 (data) — 알 기술은 뿌리의 것

> **문제.** 알 기술은 사슬의 **뿌리**(이 세대에 있는 가장 앞 단계)에만 적혀 있다.
> `fillEvolution`에서 뿌리의 method 2 기술 중 `detail.eggMoves`에 없는 것을 합쳐라.
> 픽스처에는 알 기술이 없으니 한 줄 심고 테스트한다.

### TODO

1. `fillEvolution`의 상속 루프(과제 1) 뒤에: `ancestors`가 비어 있지 않으면 뿌리의
   pokemon id(= `ancestors`의 **마지막** 원소)로 method 2를 SELECT한다 — 쿼리 모양은
   `readPokemonDetail`의 "기술 가르침(3) · 알 기술(2)" 블록과 같고, 바인딩만 다르다
2. 이미 `eggMoves`에 있는 move id는 건너뛰고, 나머지를 `detail.eggMoves`에 붙인다
   (`fromPokemonId`는 채우지 않는다 — 알에서 나올 때 갖고 나오는 건 똑같아서 출처 표시가 필요 없다)
3. 과제 1의 3번 순서 이동 덕에 `fillMoves(detail.eggMoves, …)`가 뒤에 와서 이름이 채워진다
4. 픽스처 `tests/fixtures/pokeapi-csv/pokemon_moves.csv`에 삐삐의 알 기술 한 줄을 심는다:
   `35,8,7,2,0,,` (불꽃펀치 7 — moves.csv에 있고 삐삐 · 픽시 누구도 안 배우는 번호)
5. 테스트: `pokemonDetail(36, 4).eggMoves`에 7이 있고, `pokemonDetail(35, 4).eggMoves`에도
   7이 있다(제 것 그대로)

> 픽스처를 고치면 테스트 DB가 다시 만들어진다. 혹시 다른 테스트가 줄 수를 단언하고 있어
> 깨지면 그 숫자를 올리면 된다(지금은 없는 걸로 확인했다).

## 과제 3 (data) — SquadSession: 고르기 목록과 "배울 수 있나" 판정

> **문제.** 스쿼드 쪽에서 상속 기술이 (1) 선택 창 목록에 나오고 (2) 세이브에서 불러온
> 기술이 더 이상 "배울 수 없음"으로 찍히지 않게 하라. 두 함수, 각각 몇 줄이다.

`src/data/state/squadsession.cpp`:

1. `learnableMoves`: `detail.levelMoves` 루프 **바로 뒤에** `detail.inheritedMoves` 루프를
   더한다 — 몸통은 levelMoves 루프와 같다(`row(move)` + 가장 이른 레벨). `row()`가
   move id로 합쳐 주므로 겹칠 걱정은 없다 (Repository가 이미 제 자력표 우선으로 걸렀다)
2. `resolveMember`: `learnable` 해시를 채우는 목록 네 개 `{&detail.levelMoves, …}`에
   `&detail.inheritedMoves`를 더한다 (순서는 levelMoves 다음 — 먼저 넣은 쪽이 남는 건 아니고
   `insert`가 덮어쓰니, 출처 표시가 있는 상속 항목이 TM 항목을 덮지 않게 levelMoves 바로 뒤가 맞다)

### ✅ 확인

`SquadSessionResolvesAndAnalyzesTheGeneration` 옆에 단언 둘을 보태거나 새 테스트:
픽시를 넣고 `learnableMoves`에 309가 있고(`move.fromPokemonId == 35`), `setMove`로 309를
고른 뒤 `slotMoves`에서 `learnable == true`.

## 과제 4 (ui) — 선택 창에 출처 쓰기: "자력(삐삐 43레벨)"

> **문제.** 기술 선택 창의 "배우는 방법" 칸이 상속 기술을 구분해 보여 주게 하라.
> 화면은 새로 만들지 않는다 — `ListPicker`의 글자 하나를 바꾸는 일이다.

```
배우는 방법 칸 (오른쪽 정렬)
┌─────────────────────────────┬──────────────────────┐
│ 신속                        │        자력(39레벨)   │  ← 제 기술: 그대로
│ 불대문자                    │  자력(가디 43레벨)    │  ← 상속: 이름이 앞에
│ 물어뜯기                    │  자력(가디 28레벨) ♡  │  ← reach 밖이면 기존
│ 버티기                      │                 알   │     하트비늘 표시를 따른다
└─────────────────────────────┴──────────────────────┘
```

`src/ui/squad/squadpage.cpp` `pickMove`:

1. `parts.append(tr("자력(%1레벨)").arg(row.level));` 자리에서 분기한다:
   `row.move.fromPokemonId > 0`이면 `tr("자력(%1 %2레벨)").arg(row.move.fromName.text(language)).arg(row.level)`,
   아니면 지금 그대로
2. 문구가 바뀌었으니 `cmake --build --preset linux-debug --target update_translations`를 돌린다
   (en/ja 번역은 진단 때 Claude가 채운다)

### ✅ 확인 — 실제 DB로

```bash
scripts/linux/run.sh
```

DP(또는 Pt)로 바꾸고 스쿼드에 **윈디**를 넣는다 →

- 기술 칸 클릭: 목록에 "자력(가디 N레벨)" 줄들이 자력기 뒤 · TM 앞에 보인다
- 불대문자를 고르면 분석(히트맵 · 커버리지)에 바로 들어간다
- 알 기술 몇 줄이 "알"로 보인다 (가디의 알 기술)
- 도감 탭의 윈디 상세는 **이전과 똑같다** (B안의 약속)

## 과제 5 (보너스) — 1세대 중복 버전 숨기기

> **문제.** 1세대 게임 버튼이 6개다: PokéAPI가 일본판(`red-green-japan` · `blue-japan`)과
> 국제판(`red-blue`)을 따로 들고 있어서다. 자력표 · TM은 네 묶음이 전부 같고(4,127행 동일),
> 다른 건 야생 출현뿐이다. **R · G · B · Y 네 개**가 되게 하라(사용자 결정 2026-10-19):
> 레드 · 블루는 출현 데이터가 온전한 국제판을, 그린은 일본판(`green-japan`, 출현 703행)을 남기고,
> 중복인 `red-japan`과 깡통인 `blue-japan`(출현 6행)을 숨긴다.

`src/data/repository/repository.cpp`:

1. 익명 namespace에 숨길 버전 상수를 둔다:
   `constexpr const char *kHiddenVersions = " AND v.identifier NOT IN ('red-japan', 'blue-japan')"; // 국제판과 중복(자력표 동일) · blue-japan은 출현 6행뿐`
2. `gamesForGeneration`의 SQL WHERE 끝(`ORDER BY` 앞)에 이어 붙인다 —
   `QStringLiteral("…") + QLatin1String(kHiddenVersions) + QStringLiteral(" ORDER BY …")`
3. `readPokemonDetail`의 "5) 야생 출현" 쿼리에도 같은 조각을 붙인다
   (도감 상세의 출현 표에 레드(일) 줄이 겹쳐 나오는 것도 같이 사라진다)

✅ 확인: 실행해서 1세대로 바꾸면 게임 버튼이 **레드 · 그린 · 블루 · 피카츄** 네 개,
도감 상세의 출현 표에 같은 장소가 두 번 나오지 않는다. (픽스처는 4세대뿐이라 테스트는 실행 확인으로 갈음)

## 흔한 문제와 원인

| 증상 | 원인 |
|---|---|
| `inheritedMoves`의 이름 · 타입이 빈 칸 | 과제 1-3(호출 순서 이동) 또는 1-4(`fillMoves` 추가)를 빠뜨림 |
| 상속 기술이 두 번 나온다 | `taken`에 levelMoves를 미리 안 넣었거나, 넣은 기술을 `taken`에 추가 안 함 |
| 3단 진화에서 틀린 단계 이름이 붙는다 | `path` 인덱스 대응식이 틀림 — `ancestors[0]`(가까운 단계)은 `path`의 뒤에서 둘째 |
| 픽시 상속이 13이 아니라 17 | 제 자력표(4개)를 거르지 않음 |
| 알 기술 테스트가 그대로 0 | 픽스처를 고치고 테스트 DB를 다시 안 만듦(빌드 디렉터리의 캐시 DB 삭제 후 재실행) |
| 세이브 불러온 기술이 여전히 빨간 빗금 | 과제 3-2(`resolveMember`)를 빠뜨림 — 선택 창(3-1)과 판정은 딴 함수다 |
| `LocalizedText` 복사에서 컴파일 에러 | `fromName`을 참조로 선언함 — 값으로 담는다(캐시에 남는 구조체다) |

## 완료 조건

- [ ] 새 테스트 2개(과제 1 · 2)와 과제 3 단언이 통과하고, 기존 테스트 180개가 그대로 통과
- [ ] DP 윈디: 선택 창에 가디 자력기 13 + 알 기술, 고르면 분석 반영
- [ ] 가디 시절 기술을 가진 `.sav` 멤버가 빨간 빗금 없이 보인다 (실기 세이브로)
- [ ] 도감 상세의 자력표는 이전과 동일
- [ ] 1세대 게임 버튼이 R · G · B · Y 네 개 (과제 5)
- [ ] `update_translations` 돌림 (en/ja는 Claude 몫)

## 끝나면 붙여넣어 줄 것

1. `git diff main...fix/e2b-preevo-moves` 범위의 변경 (repository.h/.cpp, squadsession.cpp, squadpage.cpp, 픽스처, 테스트)
2. 테스트 출력과, DP 윈디 선택 창 스크린샷(스프라이트 없는 영역이라 그대로 찍어도 된다)

→ 진단 통과 후 Claude가 커밋 · merge · CHANGELOG. 버그 수정이라 **v0.5.1(PATCH)** 후보다.

## 남는 숙제 (이번 단계 아님)

- 기술머신 · NPC 가르침의 세대 간 carry-over(진화 전만 TM을 배우는 희귀 케이스) — 실데이터 조사 필요
- 도감 상세의 자력표에 "진화 전" 절 추가할지 — 사용자 결정
- 에디터 페이지(H9)가 생기면 `.sav` 불러오기 동선이 바뀐다 — 이 단계의 판정 로직은 그대로 쓰인다
