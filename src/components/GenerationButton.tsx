/**
 * 세대 버튼 + 세대 메뉴 (C-04 · C-05). 앱 막대 · 설정 > 기준 세대가 같은 상태(설정 저장소)를 쓴다.
 * 고르면 setGeneration — 모든 화면이 그 세대로 다시 계산된다.
 */
import { useCallback, useRef, useState } from "react"

import { useT } from "../i18n/index.ts"
import { ALL_GENERATIONS, regionOf } from "../shared/generations.ts"
import { textOf } from "../shared/text.ts"
import {
  settingsActions,
  useGeneration,
  useNameLanguage,
} from "../state/settings.ts"
import { Icon } from "./Icon.tsx"
import { MenuPopup } from "./MenuPopup.tsx"
import { GenBadge } from "./Pill.tsx"
import styles from "./GenerationButton.module.css"

export interface GenerationButtonProps {
  /** bar = 빨간 앱 막대 위(좁은 창에서 "GEN n ▾"만) · settings = 설정 화면(메뉴 왼쪽 맞춤) */
  variant?: "bar" | "settings"
}

export function GenerationButton({ variant = "bar" }: GenerationButtonProps) {
  const t = useT()
  const generation = useGeneration()
  const lang = useNameLanguage()
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement | null>(null)
  const close = useCallback(() => setOpen(false), [])
  const region = textOf(regionOf(generation), lang)

  return (
    <>
      <button
        ref={anchor}
        type="button"
        className={styles.button}
        data-variant={variant}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("세대 선택: %1", t("%1세대 %2", generation, region))}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      >
        <span className={styles.full}>
          <GenBadge generation={generation} />
          {region}
        </span>
        <span className={styles.compact}>GEN {generation}</span>
        <Icon
          name="chevronDown"
          size={14}
          strokeWidth={2.6}
          className={styles.chevron}
        />
      </button>
      <MenuPopup
        open={open}
        anchorRef={anchor}
        ariaLabel={t("세대 선택")}
        align={variant === "bar" ? "end" : "start"}
        width={300}
        density="gen"
        items={ALL_GENERATIONS.map((g) => ({
          key: String(g),
          checked: g === generation,
          content: (
            <span className={styles.row}>
              <span className={styles.rowGen}>GEN {g}</span>
              <span className={styles.rowRegion}>
                {textOf(regionOf(g), lang)}
              </span>
            </span>
          ),
        }))}
        onPick={(key) => settingsActions().setGeneration(Number(key))}
        onClose={close}
      />
    </>
  )
}
