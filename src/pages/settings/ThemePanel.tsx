/**
 * 설정 > 테마 (노랑 머리) — 테마 견본 카드 3장(라이트 · 다크 · 시스템) + 표 밀도.
 * 견본은 지금 테마와 상관없이 늘 그 테마를 그린다(--color-preview-* 고정 토큰).
 */
import { Panel } from "../../components/Panel.tsx"
import { SegmentedControl } from "../../components/SegmentedControl.tsx"
import { tKey, useT } from "../../i18n/index.ts"
import {
  settingsActions,
  useSettings,
  type Density,
  type ThemeChoice,
} from "../../state/settings.ts"
import { SettingsRow } from "./SettingsRow.tsx"
import styles from "./Settings.module.css"

const CARDS: readonly { value: ThemeChoice; label: string }[] = [
  { value: "light", label: tKey("라이트") },
  { value: "dark", label: tKey("다크") },
  { value: "system", label: tKey("시스템 · 기본") },
]

function Preview({ kind }: { kind: "light" | "dark" }) {
  return (
    <span className={styles.preview} data-kind={kind}>
      <span className={styles.previewBar} />
      <span className={styles.previewBody}>
        <span className={styles.previewTile} />
        <span className={styles.previewTileWide} />
      </span>
    </span>
  )
}

export function ThemePanel() {
  const t = useT()
  const theme = useSettings((s) => s.theme)
  const density = useSettings((s) => s.density)
  const a = settingsActions()
  return (
    <Panel
      id="settings-theme"
      tabIndex={-1}
      className={styles.panel}
      header={{ title: t("테마"), tone: "yellow" }}
    >
      <div className={styles.themeCards} role="group" aria-label={t("테마")}>
        {CARDS.map((c) => (
          <button
            key={c.value}
            type="button"
            className={styles.themeCard}
            aria-pressed={theme === c.value}
            onClick={() => a.setTheme(c.value)}
          >
            {c.value === "system" ? (
              <span className={styles.previewSplit}>
                <Preview kind="light" />
                <Preview kind="dark" />
              </span>
            ) : (
              <Preview kind={c.value} />
            )}
            <span className={styles.themeLabel}>{t(c.label)}</span>
          </button>
        ))}
      </div>
      <SettingsRow
        title={t("표 밀도")}
        description={t("조밀: 행 높이 30 · 표준: 34")}
        control={
          <SegmentedControl<Density>
            ariaLabel={t("표 밀도")}
            value={density}
            onChange={(v) => a.setDensity(v)}
            options={[
              { value: "compact", label: t("조밀") },
              { value: "standard", label: t("표준") },
            ]}
          />
        }
      />
    </Panel>
  )
}
