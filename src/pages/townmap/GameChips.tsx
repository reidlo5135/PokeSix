/**
 * 게임 칩(묶음형) — 묶음 하나 = 칩 하나, 칩 안의 조각 = 버전. 조각을 누르면 앱 전역 게임이 바뀐다.
 * 모든 조각이 한 radiogroup이라 ←/→로 옮기며 고른다.
 */
import { useRef, type KeyboardEvent } from "react"

import { Tooltip } from "../../components/Tooltip.tsx"
import type { GameChip } from "./versionLabels.ts"
import styles from "./TownMap.module.css"

export function GameChips({
  chips,
  version,
  onSelect,
  ariaLabel,
}: {
  chips: readonly GameChip[]
  version: string
  onSelect: (version: string) => void
  ariaLabel: string
}) {
  const refs = useRef(new Map<string, HTMLButtonElement>())
  const order = chips.flatMap((c) => c.segments.map((s) => s.version))

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const pos = order.indexOf(version)
    let next = -1
    if (e.key === "ArrowRight" || e.key === "ArrowDown")
      next = (pos + 1) % order.length
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = (pos - 1 + order.length) % order.length
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = order.length - 1
    if (next < 0 || order.length === 0) return
    e.preventDefault()
    onSelect(order[next])
    refs.current.get(order[next])?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={styles.gameChips}
      onKeyDown={onKeyDown}
    >
      {chips.map((chip) => {
        const current = chip.segments.some((s) => s.version === version)
        return (
          <Tooltip key={chip.versionGroup} text={chip.tooltip}>
            <span
              className={styles.gameChip}
              data-current={current ? "" : undefined}
            >
              {chip.segments.map((s) => {
                const on = s.version === version
                return (
                  <button
                    key={s.version}
                    ref={(el) => {
                      if (el) refs.current.set(s.version, el)
                      else refs.current.delete(s.version)
                    }}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={s.name}
                    tabIndex={
                      on || (!order.includes(version) && s.version === order[0])
                        ? 0
                        : -1
                    }
                    className={styles.gameSegment}
                    onClick={() => onSelect(s.version)}
                  >
                    {s.short}
                  </button>
                )
              })}
              {chip.suffix && (
                <span className={styles.gameSuffix}>{chip.suffix}</span>
              )}
            </span>
          </Tooltip>
        )
      })}
    </div>
  )
}
