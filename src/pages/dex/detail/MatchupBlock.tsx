/**
 * 방어 상성(받을 때) ×4 ×2 ×½ ×¼ ×0 + 그 세대에 없는 타입 점선 칩, 아래 자속 기술로 줄 때.
 * 드로어(compact)는 한 줄 알약 "×½ 불꽃 · 독 · 바위".
 */
import { useMemo } from "react"

import { TypeChip } from "../../../components/index.ts"
import type { TypeChart } from "../../../data/repository/index.ts"
import { useT } from "../../../i18n/index.ts"
import { typeName } from "../../../shared/pokemonTypes.ts"
import { useNameLanguage } from "../../../state/settings.ts"
import { defenseRows, offenseRows, type MatchupRow } from "../model/matchups.ts"
import styles from "./Detail.module.css"

export function MatchupBlock({
  types,
  generation: g,
  chart,
  chartOf,
  compact,
}: {
  types: readonly string[]
  generation: number
  chart: TypeChart
  chartOf: (generation: number) => TypeChart
  compact: boolean
}) {
  const t = useT()
  const defense = useMemo(
    () => defenseRows(types, chart, chartOf),
    [types, chart, chartOf]
  )
  const offense = useMemo(() => offenseRows(types, chart), [types, chart])

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h3 className={styles.sectionTitle}>
          {compact ? t("방어 상성 · %1세대", g) : t("방어 상성")}
        </h3>
        {!compact && (
          <span className={styles.caption}>{t("%1세대 규칙", g)}</span>
        )}
      </div>
      <Rows rows={defense} compact={compact} />
      {offense.length > 0 && (
        <>
          <p className={styles.subCaption}>{t("자속 기술로 줄 때")}</p>
          <Rows rows={offense} compact={compact} />
        </>
      )}
    </section>
  )
}

function Rows({ rows, compact }: { rows: MatchupRow[]; compact: boolean }) {
  const t = useT()
  const lang = useNameLanguage()
  if (compact)
    return (
      <div className={styles.matchPills}>
        {rows.map((r) => (
          <span key={r.label} className={styles.matchPill} data-tone={r.tone}>
            {r.label}{" "}
            {[
              ...r.types.map((type) => typeName(type, lang)),
              ...r.absent.map((a) =>
                t("%1 · %2세대~", typeName(a.type, lang), a.introGen)
              ),
            ].join(" · ")}
          </span>
        ))}
      </div>
    )
  return (
    <div className={styles.matchGrid}>
      {rows.map((r) => (
        <div key={r.label} className={styles.matchRow}>
          <span className={styles.matchLabel} data-tone={r.tone}>
            {r.label}
          </span>
          <span className={styles.matchChips}>
            {r.types.map((type) => (
              <TypeChip key={type} type={type} size="slot" />
            ))}
            {r.absent.map((a) => (
              <TypeChip
                key={a.type}
                type={a.type}
                size="slot"
                absentUntil={a.introGen}
                absentStyle="tilde"
              />
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}
