/**
 * 종족값 막대(C-23) + 합계 + "n세대 종족값 기준". 오른쪽 [성격 ▾]: 고른 성격의 ▲ · ▼를 이름 칸에 단다
 * (3세대부터). 1세대는 특공 · 특방 대신 "특수" 한 줄. 스쿼드 모달은 실제 능력치 칸이 더 붙는다.
 */
import { useCallback, useRef, useState } from "react"

import { Icon } from "../../../components/Icon.tsx"
import { statFill } from "../../../components/logic.ts"
import { natures, type PokemonDetail } from "../../../data/repository/index.ts"
import { text } from "../../../data/text/localizedText.ts"
import { useT } from "../../../i18n/index.ts"
import { useNameLanguage } from "../../../state/settings.ts"
import { STAT_KEYS, STAT_LABEL } from "../model/dexList.ts"
import { useDataMemo } from "../model/useDataMemo.ts"
import { NaturePicker } from "./NaturePicker.tsx"
import styles from "./Detail.module.css"

const FIRST_NATURE_GENERATION = 3
const STAT_MAX = 255

export function StatsBlock({
  detail,
  generation: g,
  natureId,
  onNature,
  trained,
}: {
  detail: PokemonDetail
  generation: number
  natureId: number
  onNature: (natureId: number) => void
  trained?: readonly number[]
}) {
  const t = useT()
  const lang = useNameLanguage()
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement | null>(null)
  const close = useCallback(() => setOpen(false), [])
  const all = useDataMemo(() => natures(), [])
  const showNature = g >= FIRST_NATURE_GENERATION
  const nature = showNature ? all.find((n) => n.id === natureId) : undefined

  // 1세대: 특공 · 특방 → 특수 한 줄
  const rows = STAT_KEYS.map((key, i) => ({ key, i })).filter(
    ({ key }) => g >= 2 || key !== "spDefense"
  )

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>{t("종족값")}</h3>
        {showNature && (
          <>
            <button
              ref={anchor}
              type="button"
              className={styles.natureButton}
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {nature ? text(nature.name, lang) : t("성격")}
              <Icon name="chevronDown" size={11} strokeWidth={3} />
            </button>
            {open && (
              <NaturePicker
                anchorRef={anchor}
                natures={all}
                natureId={natureId}
                onPick={(id) => {
                  onNature(id)
                  close()
                }}
                onClose={close}
              />
            )}
          </>
        )}
      </div>
      <div className={styles.stats} data-trained={trained ? "" : undefined}>
        {rows.map(({ key, i }) => {
          const value = detail.stats[i]
          const statId = i + 1 // stats.id: 2 공격 … 6 스피드
          const up =
            nature !== undefined &&
            nature.increasedStat !== nature.decreasedStat &&
            nature.increasedStat === statId
          const down =
            nature !== undefined &&
            nature.increasedStat !== nature.decreasedStat &&
            nature.decreasedStat === statId
          const label =
            g === 1 && key === "spAttack" ? t("특수") : t(STAT_LABEL[key])
          return (
            <div key={key} className={styles.statRow}>
              <span
                className={styles.statLabel}
                data-mark={up ? "up" : down ? "down" : undefined}
              >
                {label}
                {up && " ▲"}
                {down && " ▼"}
              </span>
              <span className={styles.statValue}>{value}</span>
              {trained && (
                <span className={styles.statTrained}>{trained[i] ?? ""}</span>
              )}
              <span
                className={styles.statBar}
                role="img"
                aria-label={`${label} ${value}`}
              >
                <span
                  className={styles.statFill}
                  data-fill={statFill(value)}
                  style={{
                    width: `${Math.min(100, (value / STAT_MAX) * 100).toFixed(1)}%`,
                  }}
                />
              </span>
            </div>
          )
        })}
        <div className={styles.statTotalRow}>
          <span className={styles.statLabel}>{t("합계")}</span>
          <span className={styles.statTotal}>{detail.total}</span>
          {trained && <span />}
          <span className={styles.statCaption}>
            {t("%1세대 종족값 기준", g)}
          </span>
        </div>
      </div>
    </section>
  )
}
