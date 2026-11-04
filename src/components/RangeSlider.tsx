/**
 * 두 손잡이 범위 슬라이더 (C-20, 도감 "종족값 합계"). 손잡이는 role="slider".
 * 끌면 가까운 손잡이가 움직이고, 둘은 서로 넘지 않는다. 값은 step에 맞춘다.
 * 키: ←/→ ±step · PgUp/PgDn ±5step · Home/End.
 */
import { useRef, type KeyboardEvent, type PointerEvent } from "react"

import { useT } from "../i18n/index.ts"
import { snapValue } from "./logic.ts"
import styles from "./RangeSlider.module.css"

export interface RangeSliderProps {
  min: number
  max: number
  step?: number
  value: readonly [number, number]
  onChange: (value: [number, number]) => void
  /** 제목 (예: "종족값 합계") — 없으면 머리 줄을 그리지 않는다 */
  label?: string
  /** 아래 눈금 (기본: 최소 · 가운데 · 최대) */
  scale?: readonly number[]
}

export function RangeSlider({
  min,
  max,
  step = 10,
  value,
  onChange,
  label,
  scale,
}: RangeSliderProps) {
  const t = useT()
  const track = useRef<HTMLDivElement | null>(null)
  const dragging = useRef<0 | 1 | null>(null)
  const [lo, hi] = value
  const pct = (v: number) => ((v - min) / (max - min)) * 100

  const set = (which: 0 | 1, v: number) => {
    const s = snapValue(v, min, max, step)
    if (which === 0) onChange([Math.min(s, hi), hi])
    else onChange([lo, Math.max(s, lo)])
  }

  const valueAt = (clientX: number) => {
    const r = track.current?.getBoundingClientRect()
    if (!r || r.width === 0) return min
    return min + ((clientX - r.left) / r.width) * (max - min)
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const v = valueAt(e.clientX)
    const dLo = Math.abs(v - lo)
    const dHi = Math.abs(v - hi)
    const which: 0 | 1 = dLo < dHi ? 0 : dHi < dLo ? 1 : v < lo ? 0 : 1
    dragging.current = which
    e.currentTarget.setPointerCapture(e.pointerId)
    set(which, v)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current === null) return
    set(dragging.current, valueAt(e.clientX))
  }

  const keys = (which: 0 | 1) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const cur = which === 0 ? lo : hi
    const map: Record<string, number> = {
      ArrowLeft: cur - step,
      ArrowDown: cur - step,
      ArrowRight: cur + step,
      ArrowUp: cur + step,
      PageDown: cur - step * 5,
      PageUp: cur + step * 5,
      Home: min,
      End: max,
    }
    if (!(e.key in map)) return
    e.preventDefault()
    set(which, map[e.key])
  }

  const marks = scale ?? [min, snapValue((min + max) / 2, min, max, step), max]

  return (
    <div className={styles.wrap}>
      {label && (
        <div className={styles.head}>
          <span className={styles.label}>{label}</span>
          <span className={styles.readout}>
            {lo} – {hi}
          </span>
        </div>
      )}
      <div
        ref={track}
        className={styles.box}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => {
          dragging.current = null
        }}
      >
        <div className={styles.track} />
        <div
          className={styles.range}
          style={{
            left: `${pct(lo)}%`,
            right: `${100 - pct(hi)}%`,
            borderTopLeftRadius: lo === min ? 4 : 0,
            borderBottomLeftRadius: lo === min ? 4 : 0,
            borderTopRightRadius: hi === max ? 4 : 0,
            borderBottomRightRadius: hi === max ? 4 : 0,
          }}
        />
        {([0, 1] as const).map((which) => {
          const v = which === 0 ? lo : hi
          return (
            <button
              key={which}
              type="button"
              role="slider"
              className={styles.thumb}
              style={{ left: `calc(${pct(v)}% - 9px)` }}
              aria-label={which === 0 ? t("최솟값 %1", v) : t("최댓값 %1", v)}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={v}
              onKeyDown={keys(which)}
              onPointerDown={(e) => {
                e.stopPropagation()
                dragging.current = which
                track.current?.setPointerCapture(e.pointerId)
              }}
            />
          )
        })}
      </div>
      <div className={styles.scale} aria-hidden="true">
        {marks.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  )
}
