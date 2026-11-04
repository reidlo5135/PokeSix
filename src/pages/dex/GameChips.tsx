/**
 * 게임(버전) 칩 — 버전마다 하나, 고르면 앱 전체 게임이 바뀐다(스쿼드 · 아이템도 따라간다).
 * 같은 약칭이 앞에 있으면 DLC 이름을 뒤에 붙인다("Sw 외딴섬"). 버전 배지(VersionBadge)도 여기.
 */
import type { CSSProperties } from "react"

import { useT } from "../../i18n/index.ts"
import {
  badgeVars,
  type GameChip,
  type VersionStyle,
} from "./model/dexstyle.ts"
import styles from "./Dex.module.css"

export function GameChips({
  chips,
  version,
  onPick,
}: {
  chips: readonly GameChip[]
  version: string
  onPick: (version: string) => void
}) {
  const t = useT()
  return (
    <div className={styles.wrapRow} role="group" aria-label={t("게임")}>
      {chips.map((chip) => (
        <button
          key={chip.version}
          type="button"
          className={styles.versionChip}
          aria-pressed={chip.version === version}
          title={chip.name}
          aria-label={chip.name}
          onClick={() => onPick(chip.version)}
        >
          <span
            className={styles.versionFill}
            style={badgeVars(chip.style) as CSSProperties}
          >
            {chip.style.short}
          </span>
          {chip.suffix && (
            <span className={styles.versionSuffix}>{chip.suffix}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/** 작은 버전 배지(출현 줄 34×18 · 기준 게임 표시) */
export function VersionBadge({
  style,
  title,
  size = "row",
}: {
  style: VersionStyle
  title?: string
  size?: "row" | "inline"
}) {
  return (
    <span
      className={styles.versionBadge}
      data-size={size}
      style={badgeVars(style) as CSSProperties}
      title={title}
    >
      {style.short}
    </span>
  )
}
