/**
 * 세대 카드 9장 (C-36). 누르면 그 세대로 바꾸고 도감으로. ←/→로 카드 사이를 옮긴다.
 */
import { useRef, type KeyboardEvent } from "react"
import { useNavigate } from "react-router-dom"

import { CurrentBadge } from "../../components/Pill.tsx"
import { useT } from "../../i18n/index.ts"
import {
  bandOf,
  countOf,
  GENERATIONS,
  regionOf,
} from "../../shared/generations.ts"
import { textOf } from "../../shared/text.ts"
import {
  settingsActions,
  useGeneration,
  useNameLanguage,
} from "../../state/settings.ts"
import styles from "./Home.module.css"

export function GenerationCards() {
  const t = useT()
  const navigate = useNavigate()
  const current = useGeneration()
  const lang = useNameLanguage()
  const refs = useRef<(HTMLAnchorElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
    const i = refs.current.findIndex((el) => el === document.activeElement)
    if (i < 0) return
    e.preventDefault()
    const next =
      (i + (e.key === "ArrowRight" ? 1 : -1) + GENERATIONS.length) %
      GENERATIONS.length
    refs.current[next]?.focus()
  }

  return (
    <div className={styles.cards} onKeyDown={onKeyDown}>
      {GENERATIONS.map((info, i) => {
        const g = info.generation
        const region = textOf(regionOf(g), lang)
        return (
          <a
            key={g}
            ref={(el) => {
              refs.current[i] = el
            }}
            href="/dex"
            className={styles.card}
            aria-current={g === current ? "true" : undefined}
            aria-label={t("%1세대 %2 선택", g, region)}
            title={info.regions.map((r) => textOf(r, lang)).join(" · ")}
            onClick={(e) => {
              e.preventDefault()
              settingsActions().setGeneration(g)
              navigate("/dex")
            }}
          >
            <span className={styles.band} data-band={bandOf(g)}>
              <span className={styles.bandGen}>GEN</span>
              <span className={styles.bandNum}>{g}</span>
            </span>
            <span className={styles.cardBody}>
              {g === current && <CurrentBadge />}
              <span className={styles.grow} />
              <span className={styles.region}>{region}</span>
              <span className={styles.cardRange}>
                No.{info.from}–{info.to}
              </span>
              <span className={styles.cardCount}>
                {t("%1마리", countOf(g))}
              </span>
            </span>
          </a>
        )
      })}
    </div>
  )
}
