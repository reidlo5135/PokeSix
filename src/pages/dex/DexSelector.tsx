/**
 * 도감 고르기(Qt DexSelector): [전국] [신오 D|P] [신오 Pt] [성도 HG|SS] — 하나만 고른다.
 * 배지는 버전 약칭마다 한 칸(색은 dexstyle 데이터).
 */
import type { CSSProperties } from "react"

import type { DexInfo } from "../../data/repository/types.ts"
import { text } from "../../data/text/localizedText.ts"
import { useT } from "../../i18n/index.ts"
import { useNameLanguage } from "../../state/settings.ts"
import { badgeCells, badgeVars, dexLabel } from "./model/dexstyle.ts"
import styles from "./Dex.module.css"

export function DexSelector({
  dexes,
  dexId,
  onDex,
}: {
  dexes: readonly DexInfo[]
  dexId: number
  onDex: (dexId: number) => void
}) {
  const t = useT()
  const lang = useNameLanguage()
  return (
    <div className={styles.wrapRow} role="group" aria-label={t("도감")}>
      <button
        type="button"
        className={styles.dexButton}
        aria-pressed={dexId === 0}
        title={t("그 세대까지 나온 포켓몬 전부")}
        onClick={() => onDex(0)}
      >
        {t("전국")}
      </button>
      {dexes.map((dex) => {
        const label = dexLabel(dex, lang)
        const cells = badgeCells(dex.versions, dex.versionNames)
        return (
          <button
            key={dex.pokedexId}
            type="button"
            className={styles.dexButton}
            aria-pressed={dexId === dex.pokedexId}
            title={`${label} — ${dex.versionNames.map((n) => text(n, lang)).join(" · ")}`}
            onClick={() => onDex(dex.pokedexId)}
          >
            {label}
            <span className={styles.badge} aria-hidden="true">
              {cells.map((c) => (
                <span
                  key={c.version}
                  className={styles.badgeCell}
                  style={badgeVars(c) as CSSProperties}
                >
                  {c.short}
                </span>
              ))}
            </span>
          </button>
        )
      })}
    </div>
  )
}
