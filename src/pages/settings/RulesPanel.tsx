/** 설정 > 세대 규칙 (빨강 머리) */
import { GenerationButton } from "../../components/GenerationButton.tsx"
import { Panel } from "../../components/Panel.tsx"
import { SegmentedControl } from "../../components/SegmentedControl.tsx"
import { ToggleSwitch } from "../../components/ToggleSwitch.tsx"
import { useT } from "../../i18n/index.ts"
import {
  settingsActions,
  useSettings,
  type SplitRule,
} from "../../state/settings.ts"
import { SettingsRow } from "./SettingsRow.tsx"
import styles from "./Settings.module.css"

export function RulesPanel() {
  const t = useT()
  const s = useSettings((x) => x)
  const a = settingsActions()
  const flag = (
    key:
      | "hideFairyBeforeGen6"
      | "steelLegacyResist"
      | "useHistoricTypes"
      | "useHistoricStats",
    title: string,
    desc: string
  ) => (
    <SettingsRow
      title={t(title)}
      description={t(desc)}
      control={
        <ToggleSwitch
          checked={s[key]}
          label={t(title)}
          onChange={(v) => a.setFlag(key, v)}
        />
      }
    />
  )
  return (
    <Panel
      id="settings-rules"
      tabIndex={-1}
      className={styles.panel}
      header={{
        title: t("세대 규칙"),
        tone: "red",
        right: (
          <span className={styles.headNote}>
            {t("모든 화면의 계산에 적용")}
          </span>
        ),
      }}
    >
      <SettingsRow
        title={t("기준 세대")}
        description={t("도감 범위와 상성표를 이 세대로 맞춰요")}
        control={<GenerationButton variant="settings" />}
      />
      <SettingsRow
        stacked
        title={t("물리 · 특수 판정")}
        description={t("1–3세대는 타입 기준, 4세대부터 기술마다 판정")}
        control={
          <SegmentedControl<SplitRule>
            ariaLabel={t("물리 · 특수 판정")}
            padX={14}
            value={s.splitRule}
            onChange={(v) => a.setSplitRule(v)}
            options={[
              { value: "auto", label: t("세대 자동") },
              { value: "type", label: t("항상 타입 기준") },
              { value: "move", label: t("항상 기술 기준") },
            ]}
          />
        }
      />
      {flag(
        "hideFairyBeforeGen6",
        "페어리 타입",
        "6세대 이전 세대에서는 숨기고 히트맵 열을 비활성으로"
      )}
      {flag(
        "steelLegacyResist",
        "강철 내성 (2–5세대)",
        "해당 세대에서 강철이 고스트 · 악을 반감"
      )}
      {flag(
        "useHistoricTypes",
        "당시 타입 사용",
        "선택 세대 당시의 타입으로 계산 (타입 변경 이력 반영)"
      )}
      {flag(
        "useHistoricStats",
        "당시 종족값 사용",
        "이후 세대에서 조정된 종족값을 선택 세대 기준으로"
      )}
      <p className={styles.note}>
        {t(
          "예: 4세대 기준에서 토게키스는 노말/비행, 강철은 고스트 · 악을 반감, 페어리 열은 히트맵에서 비활성으로 표시돼요."
        )}
      </p>
    </Panel>
  )
}
