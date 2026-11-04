/** 설정 > 언어 (초록 머리) — 화면 언어 · 이름 표기 · 원어 이름 함께 보기. 언어 이름은 번역하지 않는다 */
import { Panel } from "../../components/Panel.tsx"
import {
  SegmentedControl,
  type SegmentOption,
} from "../../components/SegmentedControl.tsx"
import { ToggleSwitch } from "../../components/ToggleSwitch.tsx"
import { useT } from "../../i18n/index.ts"
import type { Lang } from "../../shared/text.ts"
import { settingsActions, useSettings } from "../../state/settings.ts"
import { SettingsRow } from "./SettingsRow.tsx"
import styles from "./Settings.module.css"

const LANG_OPTIONS: readonly SegmentOption<Lang>[] = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
]

export function LanguagePanel() {
  const t = useT()
  const uiLanguage = useSettings((s) => s.uiLanguage)
  const nameLanguage = useSettings((s) => s.nameLanguage)
  const showOriginal = useSettings((s) => s.showOriginalName)
  const a = settingsActions()
  return (
    <Panel
      id="settings-lang"
      tabIndex={-1}
      className={styles.panel}
      header={{ title: t("언어"), tone: "green" }}
    >
      <SettingsRow
        title={t("화면 언어")}
        description={t("버튼 · 제목 같은 화면 글자의 언어")}
        control={
          <SegmentedControl
            ariaLabel={t("화면 언어")}
            options={LANG_OPTIONS}
            value={uiLanguage}
            onChange={(v) => a.setUiLanguage(v)}
          />
        }
      />
      <SettingsRow
        title={t("포켓몬 · 기술 이름 표기")}
        description={t("인터페이스 언어와 따로 정할 수 있어요")}
        control={
          <SegmentedControl
            ariaLabel={t("이름 표기")}
            options={LANG_OPTIONS}
            value={nameLanguage}
            onChange={(v) => a.setNameLanguage(v)}
          />
        }
      />
      <SettingsRow
        title={t("원어 이름 함께 보기")}
        description={t("예: 한카리아스 (Garchomp)")}
        control={
          <ToggleSwitch
            checked={showOriginal}
            label={t("원어 이름 함께 보기")}
            onChange={(v) => a.setFlag("showOriginalName", v)}
          />
        }
      />
    </Panel>
  )
}
