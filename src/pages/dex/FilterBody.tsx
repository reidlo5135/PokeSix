/**
 * 필터 창 본문(264) — 넓은 화면의 왼쪽 창과 좁은 화면의 "필터 n" 팝오버가 같이 쓴다.
 * 순서: 검색 · 세대 · 도감 · 게임 · 타입 · 종족값 합계(+ 개별 조건) · 체크 · 필터 초기화.
 */
import type { Ref } from "react"

import {
  AddChip,
  Checkbox,
  RangeSlider,
  SearchField,
} from "../../components/index.ts"
import { Icon } from "../../components/Icon.tsx"
import type { DexInfo } from "../../data/repository/types.ts"
import { useT } from "../../i18n/index.ts"
import { ALL_GENERATIONS } from "../../shared/generations.ts"
import { TYPE_INFO, TYPE_KEYS, typeName } from "../../shared/pokemonTypes.ts"
import { settingsActions, useNameLanguage } from "../../state/settings.ts"
import { GameChips } from "./GameChips.tsx"
import { DexSelector } from "./DexSelector.tsx"
import {
  STAT_KEYS,
  STAT_LABEL,
  TOTAL_MAX,
  TOTAL_MIN,
  TOTAL_STEP,
  isStatKey,
  totalRange,
  totalReadout,
  type DexFilters,
  type StatCondition,
} from "./model/dexList.ts"
import type { GameChip } from "./model/dexstyle.ts"
import styles from "./Dex.module.css"

export interface FilterBodyProps {
  generation: number
  search: string
  onSearchChange: (raw: string) => void
  onQuery: (query: string) => void
  filters: DexFilters
  onFilters: (next: DexFilters) => void
  /** 그 세대에 있는 타입 */
  availableTypes: readonly string[]
  dexes: readonly DexInfo[]
  dexId: number
  onDex: (dexId: number) => void
  chips: readonly GameChip[]
  version: string
  onReset: () => void
  searchRef?: Ref<HTMLInputElement>
  typesRef?: Ref<HTMLDivElement>
}

let nextConditionId = 1

export function FilterBody({
  generation,
  search,
  onSearchChange,
  onQuery,
  filters,
  onFilters,
  availableTypes,
  dexes,
  dexId,
  onDex,
  chips,
  version,
  onReset,
  searchRef,
  typesRef,
}: FilterBodyProps) {
  const t = useT()
  const lang = useNameLanguage()
  const lo = filters.totalMin ?? TOTAL_MIN
  const hi = filters.totalMax ?? TOTAL_MAX
  const specialSplit = generation >= 2

  const toggleType = (type: string) =>
    onFilters({
      ...filters,
      types: filters.types.includes(type)
        ? filters.types.filter((x) => x !== type)
        : [...filters.types, type],
    })

  const setCondition = (id: number, patch: Partial<StatCondition>) =>
    onFilters({
      ...filters,
      statConditions: filters.statConditions.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    })

  return (
    <div className={styles.filterBody}>
      <div className={styles.filterScroll}>
        <SearchField
          ariaLabel={t("도감 내 검색")}
          placeholder={t("이름 · 번호 · 특성")}
          value={search}
          onValueChange={onSearchChange}
          onQuery={onQuery}
          iconSize={15}
          inputRef={searchRef}
        />

        <section className={styles.block}>
          <h3 className={styles.blockLabel}>{t("세대")}</h3>
          <div className={styles.genGrid}>
            {ALL_GENERATIONS.map((g) => (
              <button
                key={g}
                type="button"
                className={styles.genButton}
                aria-pressed={g === generation}
                aria-label={t("%1세대", g)}
                onClick={() => settingsActions().setGeneration(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </section>

        {dexes.length > 0 && (
          <section className={styles.block}>
            <h3 className={styles.blockLabel}>{t("도감")}</h3>
            <DexSelector dexes={dexes} dexId={dexId} onDex={onDex} />
          </section>
        )}

        {chips.length > 0 && (
          <section className={styles.block}>
            <h3 className={styles.blockLabel}>{t("게임")}</h3>
            <GameChips
              chips={chips}
              version={version}
              onPick={(v) => settingsActions().setGame(v)}
            />
          </section>
        )}

        <section className={styles.block} ref={typesRef}>
          <div className={styles.blockHead}>
            <h3 className={styles.blockLabel}>{t("타입")}</h3>
            <span className={styles.blockCaption}>
              {filters.types.length === 0
                ? t("전체")
                : t("%1개", filters.types.length)}
            </span>
          </div>
          <div className={styles.typeGrid}>
            {TYPE_KEYS.map((type) => {
              const available = availableTypes.includes(type)
              const name = typeName(type, lang)
              const on = filters.types.includes(type)
              return (
                <button
                  key={type}
                  type="button"
                  className={styles.typeButton}
                  data-absent={available ? undefined : ""}
                  aria-pressed={available ? on : undefined}
                  aria-disabled={available ? undefined : true}
                  title={
                    available
                      ? undefined
                      : t(
                          "%1은(는) %2세대부터 있어요",
                          name,
                          TYPE_INFO[type].introGen
                        )
                  }
                  style={
                    available
                      ? {
                          background: `var(--type-${type})`,
                          color: `var(--type-${type}-text)`,
                        }
                      : undefined
                  }
                  onClick={() => {
                    if (available) toggleType(type)
                  }}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </section>

        <section className={styles.block}>
          <div className={styles.blockHead}>
            <h3 className={styles.blockLabel}>{t("종족값 합계")}</h3>
            <span className={styles.totalReadout}>
              {totalReadout(filters, t)}
            </span>
          </div>
          <RangeSlider
            min={TOTAL_MIN}
            max={TOTAL_MAX}
            step={TOTAL_STEP}
            value={[lo, hi]}
            scale={[TOTAL_MIN, 450, TOTAL_MAX]}
            onChange={([a, b]) =>
              onFilters({ ...filters, ...totalRange(a, b) })
            }
          />
          {filters.statConditions.map((c) => (
            <div key={c.id} className={styles.condition}>
              <select
                className={styles.conditionControl}
                aria-label={t("스탯")}
                value={c.stat}
                onChange={(e) => {
                  if (isStatKey(e.target.value))
                    setCondition(c.id, { stat: e.target.value })
                }}
              >
                {STAT_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {!specialSplit && (k === "spAttack" || k === "spDefense")
                      ? t("특수")
                      : t(STAT_LABEL[k])}
                  </option>
                ))}
              </select>
              <select
                className={styles.conditionControl}
                aria-label={t("비교")}
                value={c.op}
                onChange={(e) =>
                  setCondition(c.id, {
                    op: e.target.value === "<=" ? "<=" : ">=",
                  })
                }
              >
                <option value=">=">≥</option>
                <option value="<=">≤</option>
              </select>
              <input
                type="number"
                className={styles.conditionValue}
                aria-label={t("값")}
                min={1}
                max={255}
                value={c.value ?? ""}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10)
                  setCondition(c.id, {
                    value: Number.isFinite(n)
                      ? Math.max(1, Math.min(255, n))
                      : null,
                  })
                }}
              />
              <button
                type="button"
                className={styles.conditionRemove}
                aria-label={t("조건 삭제")}
                title={t("조건 삭제")}
                onClick={() =>
                  onFilters({
                    ...filters,
                    statConditions: filters.statConditions.filter(
                      (x) => x.id !== c.id
                    ),
                  })
                }
              >
                <Icon name="close" size={12} strokeWidth={3} />
              </button>
            </div>
          ))}
          <AddChip
            shape="box"
            onClick={() =>
              onFilters({
                ...filters,
                statConditions: [
                  ...filters.statConditions,
                  {
                    id: nextConditionId++,
                    stat: "speed",
                    op: ">=",
                    value: null,
                  },
                ],
              })
            }
          >
            {t("개별 종족값 조건")}
          </AddChip>
        </section>

        <section className={styles.checks}>
          <Checkbox
            checked={filters.excludeLegendary}
            onChange={(v) => onFilters({ ...filters, excludeLegendary: v })}
            label={t("전설 · 환상 제외")}
          />
          <Checkbox
            checked={filters.finalOnly}
            onChange={(v) => onFilters({ ...filters, finalOnly: v })}
            label={t("최종 진화만")}
          />
        </section>
      </div>
      <button type="button" className={styles.resetButton} onClick={onReset}>
        {t("필터 초기화")}
      </button>
    </div>
  )
}
