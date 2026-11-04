/**
 * 창(PanelFrame, C-08) — 2px 먹선 · 둥근 8 · 딱딱한 그림자. 머리 색은 역할로 고른다:
 * red 본 내용 · blue 필터/분석/정보 · green 분류/언어 · yellow 테마/보조 · ink 설정 목록 · {type} 포켓몬 상세.
 */
import type { CSSProperties, HTMLAttributes, ReactNode } from "react"

import styles from "./Panel.module.css"

export type PanelTone =
  "red" | "blue" | "green" | "yellow" | "ink" | "normal" | { type: string }

export interface PanelHeader {
  title: ReactNode
  /** 제목 뒤 숫자 · 설명 (mono 13/700) */
  detail?: ReactNode
  tone: PanelTone
  /** 오른쪽 끝에 붙는 버튼 · 글자 */
  right?: ReactNode
  /** 제목 태그 (기본 h2) */
  level?: 1 | 2 | 3
  /** 머리 높이 (기본 38) */
  height?: 36 | 38 | 40 | 44
}

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  header?: PanelHeader
  /** 그림자 3(화면) · 4(홈 · 보드) · 0(없음) */
  shadow?: 0 | 3 | 4
  as?: "section" | "aside" | "main" | "nav" | "div" | "article"
  bodyClassName?: string
  children?: ReactNode
}

export function Panel({
  header,
  shadow = 3,
  as: Tag = "section",
  className,
  bodyClassName,
  children,
  ...rest
}: PanelProps) {
  return (
    <Tag
      {...rest}
      className={[styles.panel, className].filter(Boolean).join(" ")}
      data-shadow={shadow}
    >
      {header && <PanelHead {...header} />}
      <div className={[styles.body, bodyClassName].filter(Boolean).join(" ")}>
        {children}
      </div>
    </Tag>
  )
}

function PanelHead({
  title,
  detail,
  tone,
  right,
  level = 2,
  height = 38,
}: PanelHeader) {
  const H = `h${level}` as "h1" | "h2" | "h3"
  const isType = typeof tone === "object"
  const style: CSSProperties | undefined = isType
    ? {
        background: `var(--type-${tone.type})`,
        color: `var(--type-${tone.type}-text)`,
      }
    : undefined
  return (
    <div
      className={styles.head}
      data-tone={isType ? "type" : tone}
      style={{ ...style, height }}
      data-has-right={right ? "" : undefined}
    >
      <H className={styles.title}>{title}</H>
      {detail !== undefined && <span className={styles.detail}>{detail}</span>}
      {right && <div className={styles.right}>{right}</div>}
    </div>
  )
}
