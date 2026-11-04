/**
 * 게임 묶음 칩 줄 — 기술머신 내용 · 입수처의 기준 게임. 켜진 칩 = 노랑.
 * 마우스로 눌러도 검색 칸의 포커스를 뺏지 않는다.
 */
import { useT } from "../../i18n/index.ts"
import type { GameChip } from "./gameChips.ts"
import styles from "./Items.module.css"

export function GameChipBar({
  chips,
  current,
  onPick,
}: {
  chips: readonly GameChip[]
  current: string
  onPick: (versionGroup: string) => void
}) {
  const t = useT()
  return (
    <div
      className={styles.chips}
      role="group"
      aria-label={t("기준 게임")}
      onMouseDown={(e) => e.preventDefault()}
    >
      {chips.map((chip) => (
        <button
          key={chip.versionGroup}
          type="button"
          className={styles.chip}
          aria-pressed={chip.versionGroup === current}
          title={chip.tooltip}
          onClick={() => onPick(chip.versionGroup)}
        >
          {chip.label && <span className={styles.chipLabel}>{chip.label}</span>}
          <span className={styles.badge}>
            {chip.badges.map((b) => (
              <span
                key={b.short}
                className={styles.badgeCell}
                style={{ background: b.background, color: b.color }}
              >
                {b.short}
              </span>
            ))}
          </span>
        </button>
      ))}
    </div>
  )
}
