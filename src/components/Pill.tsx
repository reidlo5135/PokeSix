/**
 * 알약 · 배지 · 꼬리표 (C-28, C-06 GEN 배지).
 */
import type { ReactNode } from "react"

import { useT } from "../i18n/index.ts"
import { bandOf, type Generation } from "../shared/generations.ts"
import { Cursor } from "./Cursor.tsx"
import { Icon } from "./Icon.tsx"
import styles from "./Pill.module.css"

export type PillTone =
  | "rules" // "4세대 규칙" — 노랑 옅은 면
  | "problem" // 분석 머리의 "⚠ 문제 3" — 빨강 면
  | "problemOk" // "✓ 문제 없음" — 초록 옅은 면
  | "status" // 홈 최근 스쿼드 "문제 3"
  | "statusOk" // 홈 최근 스쿼드 "문제 없음"
  | "filter" // 빨강 머리 안 흰 알약 "합계 500+"
  | "category" // 아이템 분류 (face로 색을 준다)

export interface PillProps {
  tone: PillTone
  children: ReactNode
  /** category 알약의 면 색 (CSS 값, 예: "var(--color-green-face)") */
  face?: string
  compact?: boolean
  className?: string
}

export function Pill({ tone, children, face, compact, className }: PillProps) {
  return (
    <span
      className={[styles.pill, className].filter(Boolean).join(" ")}
      data-tone={tone}
      data-compact={compact ? "" : undefined}
      style={face ? { background: face } : undefined}
    >
      {tone === "problem" && <Icon name="warning" size={12} strokeWidth={3} />}
      {tone === "problemOk" && <Icon name="check" size={12} strokeWidth={3} />}
      {children}
    </span>
  )
}

export type TagTone = "problem" | "rule" | "absent"

/** 작은 꼬리표: 문제 종류(방어 · 공격) · 판정 규칙 · "n세대 없음" */
export function Tag({
  tone,
  children,
}: {
  tone: TagTone
  children: ReactNode
}) {
  return (
    <span className={styles.tag} data-tone={tone}>
      {children}
    </span>
  )
}

/** "✓ 자동 저장됨" 같은 저장 표시 */
export function SavedIndicator({ children }: { children: ReactNode }) {
  return (
    <span className={styles.saved} role="status">
      <Icon name="check" size={14} strokeWidth={3} />
      {children}
    </span>
  )
}

/** GEN 배지. bar = 앱 막대/설정 버튼 안("GEN 4", 먹 면) · row = 홈 최근 줄("GEN4", 띠 색) */
export function GenBadge({
  generation,
  variant = "bar",
}: {
  generation: Generation
  variant?: "bar" | "row"
}) {
  if (variant === "row")
    return (
      <span className={styles.genRow} data-band={bandOf(generation)}>
        GEN{generation}
      </span>
    )
  return <span className={styles.genBar}>GEN {generation}</span>
}

/** 세대 카드의 "▶ 진행 중" */
export function CurrentBadge() {
  const t = useT()
  return (
    <span className={styles.current}>
      <Cursor size="xs" tone="onYellow" />
      {t("진행 중")}
    </span>
  )
}
