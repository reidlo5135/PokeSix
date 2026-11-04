/**
 * 테마 버튼 + 메뉴 (C-07). 아이콘은 "누르면 갈 쪽": 라이트면 달, 다크면 해. 시스템이면 점이 붙는다.
 * 설정 > 테마와 같은 상태를 쓴다.
 */
import { useCallback, useRef, useState } from "react"

import { Icon } from "../../components/Icon.tsx"
import { MenuPopup } from "../../components/MenuPopup.tsx"
import { tKey, useT } from "../../i18n/index.ts"
import {
  settingsActions,
  useSettings,
  type ThemeChoice,
} from "../../state/settings.ts"
import { useResolvedTheme } from "../../theme/useThemeSync.ts"
import styles from "./AppBar.module.css"

const CHOICES: readonly {
  value: ThemeChoice
  label: string
  title: string
  icon: "sun" | "moon" | "monitor"
}[] = [
  { value: "light", label: tKey("라이트"), title: tKey("라이트"), icon: "sun" },
  { value: "dark", label: tKey("다크"), title: tKey("다크"), icon: "moon" },
  {
    value: "system",
    label: tKey("시스템"),
    title: tKey("시스템 설정 따르기"),
    icon: "monitor",
  },
]

export function ThemeSwitch() {
  const t = useT()
  const choice = useSettings((s) => s.theme)
  const resolved = useResolvedTheme()
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement | null>(null)
  const close = useCallback(() => setOpen(false), [])

  const label = open
    ? t("테마 선택 열림")
    : choice === "light"
      ? t("테마: 라이트 (클릭해 변경)")
      : choice === "dark"
        ? t("테마: 다크 (클릭해 변경)")
        : t("테마: 시스템 (클릭해 변경)")

  return (
    <>
      <button
        ref={anchor}
        type="button"
        className={styles.themeButton}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      >
        <Icon
          name={resolved === "dark" ? "sun" : "moon"}
          size={16}
          dot={choice === "system"}
        />
      </button>
      <MenuPopup
        open={open}
        anchorRef={anchor}
        ariaLabel={t("테마 선택")}
        align="end"
        width={150}
        items={CHOICES.map((c) => ({
          key: c.value,
          checked: c.value === choice,
          title: t(c.title),
          content: (
            <>
              <Icon name={c.icon} size={14} />
              {t(c.label)}
            </>
          ),
        }))}
        onPick={(key) => {
          const picked = CHOICES.find((c) => c.value === key)
          if (picked) settingsActions().setTheme(picked.value)
        }}
        onClose={close}
      />
    </>
  )
}
