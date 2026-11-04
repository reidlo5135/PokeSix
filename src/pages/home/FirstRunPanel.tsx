/**
 * 첫 실행 데이터 창 (Qt FirstRunPanel) — 받을 준비 · 받는 중 · 실패. 세 상태의 높이는 같게(겹쳐 두고 하나만 보인다).
 * 초점: 처음 뜰 때와 상태가 바뀔 때(초점이 창 안에 있었다면) 지금 상태의 버튼으로.
 */
import { useEffect, useRef } from "react"

import { Button } from "../../components/Button.tsx"
import { Icon } from "../../components/Icon.tsx"
import { SegmentProgress } from "../../components/SegmentProgress.tsx"
import { useT } from "../../i18n/index.ts"
import {
  cancelDataUpdate,
  expectedDownloadMb,
  startDataUpdate,
  useDataUpdate,
} from "../../state/data.ts"
import styles from "./FirstRunPanel.module.css"

type PanelState = "ready" | "downloading" | "failed"

export function FirstRunPanel() {
  const t = useT()
  const update = useDataUpdate()
  const state: PanelState =
    update.phase === "running"
      ? "downloading"
      : update.phase === "failed"
        ? "failed"
        : "ready"
  const root = useRef<HTMLElement | null>(null)
  const buttons = useRef<Record<PanelState, HTMLButtonElement | null>>({
    ready: null,
    downloading: null,
    failed: null,
  })
  const first = useRef(true)

  useEffect(() => {
    const inside = root.current?.contains(document.activeElement) ?? false
    const nothingFocused = document.activeElement === document.body
    if (first.current || inside || nothingFocused)
      buttons.current[state]?.focus({ preventScroll: first.current })
    first.current = false
  }, [state])

  const stageLabel =
    update.stage === "done"
      ? t("준비 완료")
      : update.stage === "import"
        ? t("데이터 정리하는 중")
        : t("데이터 받는 중")

  return (
    <section
      ref={root}
      className={styles.panel}
      data-state={state}
      aria-live="polite"
    >
      <div className={styles.page} hidden={state !== "ready"}>
        <h2 className={styles.title}>{t("도감 데이터가 아직 없어요")}</h2>
        <p className={styles.body}>
          {t(
            "PokéAPI에서 포켓몬 · 기술 · 아이템 정보를 받아 와요. 한 번만 받으면 인터넷 없이도 써요."
          )}
        </p>
        <p className={styles.meta}>
          {t("예상 크기 약 %1 MB", expectedDownloadMb())}
        </p>
        <Button
          ref={(el) => {
            buttons.current.ready = el
          }}
          variant="primary"
          size="L"
          className={styles.button}
          icon={<Icon name="download" size={15} strokeWidth={2.8} />}
          onClick={startDataUpdate}
        >
          {t("데이터 받기")}
        </Button>
      </div>

      <div className={styles.page} hidden={state !== "downloading"}>
        <h2 className={styles.title}>{t("데이터 받는 중…")}</h2>
        <div className={styles.progressHead}>
          <span className={styles.stage}>{stageLabel}</span>
          <span className={styles.percent}>{update.percent}%</span>
        </div>
        <SegmentProgress percent={update.percent} label={stageLabel} />
        <p className={styles.note}>{t("창을 닫아도 다음에 이어서 받아요.")}</p>
        <Button
          ref={(el) => {
            buttons.current.downloading = el
          }}
          variant="secondary"
          className={styles.button}
          disabled={update.stage !== "download"}
          onClick={cancelDataUpdate}
        >
          {t("취소")}
        </Button>
      </div>

      <div className={styles.page} hidden={state !== "failed"}>
        <h2 className={styles.title} data-failed="">
          <Icon
            name="warning"
            size={18}
            strokeWidth={2.8}
            className={styles.warn}
          />
          {t("데이터를 받지 못했어요")}
        </h2>
        <p className={styles.body}>
          {t(
            "네트워크 연결을 확인하고 다시 시도해 주세요. 받은 부분은 남아 있어요."
          )}
        </p>
        <p className={styles.meta}>{update.error}</p>
        <Button
          ref={(el) => {
            buttons.current.failed = el
          }}
          variant="primary"
          size="L"
          className={styles.button}
          onClick={startDataUpdate}
        >
          {t("다시 시도")}
        </Button>
      </div>
    </section>
  )
}
