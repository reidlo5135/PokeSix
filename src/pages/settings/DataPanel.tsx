/** 설정 > 데이터 (파랑 머리) — 데이터 버전 · 마지막 확인 · 지금 갱신 · 시작할 때 확인 */
import { Button } from "../../components/Button.tsx"
import { Icon } from "../../components/Icon.tsx"
import { Panel } from "../../components/Panel.tsx"
import { SegmentProgress } from "../../components/SegmentProgress.tsx"
import { ToggleSwitch } from "../../components/ToggleSwitch.tsx"
import { useT } from "../../i18n/index.ts"
import {
  startDataUpdate,
  useDataInfo,
  useDataStatus,
  useDataUpdate,
} from "../../state/data.ts"
import { settingsActions, useSettings } from "../../state/settings.ts"
import { formatLocalDateTime } from "./format.ts"
import { SettingsRow } from "./SettingsRow.tsx"
import styles from "./Settings.module.css"

export function DataPanel() {
  const t = useT()
  const status = useDataStatus()
  const info = useDataInfo()
  const update = useDataUpdate()
  const checkOnStart = useSettings((s) => s.checkOnStart)
  const running = update.phase === "running"

  const stage =
    update.stage === "done"
      ? t("준비 완료")
      : update.stage === "import"
        ? t("데이터 정리하는 중")
        : t("데이터 받는 중")

  const description = running ? (
    <span className={styles.progressBox}>
      <span className={styles.progressHead}>
        <span>{t("데이터 갱신 중 — %1", stage)}</span>
        <span className={styles.mono}>{update.percent}%</span>
      </span>
      <SegmentProgress percent={update.percent} label={stage} />
      <span className={styles.progressNote}>
        {t("갱신 중에도 기존 데이터로 계속 탐색할 수 있어요.")}
      </span>
    </span>
  ) : status === "ready" && info ? (
    t(
      "버전 %1 · 마지막 확인 %2",
      info.sourceCommit.slice(0, 7),
      formatLocalDateTime(info.importedAt)
    )
  ) : status === "checking" ? (
    t("확인하는 중…")
  ) : (
    t("데이터가 아직 없어요")
  )

  return (
    <Panel
      id="settings-data"
      tabIndex={-1}
      className={styles.panel}
      header={{ title: t("데이터"), tone: "blue" }}
    >
      <SettingsRow
        title={t("도감 · 기술 · 아이템 데이터")}
        description={
          <>
            {description}
            {update.phase === "failed" && (
              <span className={styles.error}>
                {t("데이터를 받지 못했어요")} — {update.error}
              </span>
            )}
          </>
        }
        monoDescription={!running && status === "ready"}
        control={
          <Button
            variant="info"
            disabled={running}
            onClick={startDataUpdate}
            icon={
              <Icon
                name={status === "ready" ? "refresh" : "download"}
                size={14}
                strokeWidth={2.6}
              />
            }
          >
            {status === "ready" ? t("지금 갱신") : t("데이터 받기")}
          </Button>
        }
      />
      <SettingsRow
        title={t("시작할 때 새 데이터 확인")}
        description={t("갱신 중에도 기존 데이터로 계속 쓸 수 있어요")}
        control={
          <ToggleSwitch
            checked={checkOnStart}
            label={t("시작할 때 새 데이터 확인")}
            onChange={(v) => settingsActions().setFlag("checkOnStart", v)}
          />
        }
      />
    </Panel>
  )
}
