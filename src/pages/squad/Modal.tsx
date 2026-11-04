/**
 * 스쿼드 화면의 창(모달) — 선택 창 · 비전셔틀 · 확인 · 알림이 같이 쓴다.
 * 뒤를 어둡게 덮고, Esc · 바깥 클릭으로 닫는다. 열릴 때 첫 초점은 autoFocus 요소(없으면 창).
 */
import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"

import { Button } from "../../components/index.ts"
import { useT } from "../../i18n/index.ts"
import styles from "./Modal.module.css"

export interface ModalProps {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  /** 머리 오른쪽(개수 등) */
  headerExtra?: ReactNode
  footer?: ReactNode
  width?: number
  height?: number
  /** 화면 읽기용 이름(제목이 글자가 아닐 때) */
  ariaLabel?: string
}

export function Modal({
  title,
  onClose,
  children,
  headerExtra,
  footer,
  width = 600,
  height,
  ariaLabel,
}: ModalProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const titleId = useId()
  const t = useT()

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const box = ref.current
    if (box && !box.contains(document.activeElement)) box.focus()
    return () => previous?.focus?.()
  }, [])

  const style: CSSProperties = { width, height }
  return createPortal(
    <div
      className={styles.backdrop}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabel ? undefined : titleId}
        aria-label={ariaLabel}
        tabIndex={-1}
        className={styles.modal}
        style={style}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation()
            onClose()
          }
        }}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {headerExtra}
          <button
            type="button"
            className={styles.close}
            aria-label={t("닫기")}
            title={t("닫기")}
            onClick={onClose}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

/** 확인 · 알림 창의 요청 */
export interface AskRequest {
  title: string
  message: string
  /** 확인 창이면 true(예/아니요), 알림이면 false(확인) */
  confirm: boolean
  resolve: (ok: boolean) => void
}

export function AskDialog({ request }: { request: AskRequest }) {
  const t = useT()
  const done = (ok: boolean) => request.resolve(ok)
  return (
    <Modal
      title={request.title}
      onClose={() => done(false)}
      width={440}
      footer={
        request.confirm ? (
          <>
            <Button size="S" onClick={() => done(false)}>
              {t("아니요")}
            </Button>
            <Button
              size="S"
              variant="primary"
              autoFocus
              onClick={() => done(true)}
            >
              {t("예")}
            </Button>
          </>
        ) : (
          <Button size="S" variant="info" autoFocus onClick={() => done(true)}>
            {t("확인")}
          </Button>
        )
      }
    >
      <p className={styles.message}>{request.message}</p>
    </Modal>
  )
}
