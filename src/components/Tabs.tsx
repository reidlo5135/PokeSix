/**
 * 창 안의 탭 — SubTabs(C-17, 습득 기술 레벨업 · 기술머신 · 교배)와
 * HeaderTabs(C-18, 파랑 머리 안 문제 · 히트맵 · 물리/특수). ARIA 탭 규칙, ←/→로 옮긴다.
 * 탭 패널은 쓰는 쪽이 그린다: id = `${idPrefix}-panel-${tab.id}` 를 aria-labelledby로 잇는다.
 */
import { useRef, type KeyboardEvent, type ReactNode } from "react"

import { tabId, tabPanelId } from "./logic.ts"
import styles from "./Tabs.module.css"

export interface TabItem<T extends string> {
  id: T
  label: ReactNode
  /** HeaderTabs의 빨간 숫자 배지 (0이면 숨김) */
  count?: number
  disabled?: boolean
}

export interface TabsProps<T extends string> {
  tabs: readonly TabItem<T>[]
  selected: T
  onSelect: (id: T) => void
  ariaLabel: string
  /** 탭 · 패널 id 앞붙이 */
  idPrefix: string
  className?: string
}

function useTabKeys<T extends string>(
  tabs: readonly TabItem<T>[],
  selected: T,
  onSelect: (id: T) => void
) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabled = tabs
      .map((t, i) => (t.disabled ? -1 : i))
      .filter((i) => i >= 0)
    const pos = enabled.indexOf(tabs.findIndex((t) => t.id === selected))
    let next: number | undefined
    if (e.key === "ArrowRight") next = enabled[(pos + 1) % enabled.length]
    else if (e.key === "ArrowLeft")
      next = enabled[(pos - 1 + enabled.length) % enabled.length]
    else if (e.key === "Home") next = enabled[0]
    else if (e.key === "End") next = enabled[enabled.length - 1]
    if (next === undefined) return
    e.preventDefault()
    onSelect(tabs[next].id)
    refs.current[next]?.focus()
  }
  return { refs, onKeyDown }
}

function TabList<T extends string>({
  tabs,
  selected,
  onSelect,
  ariaLabel,
  idPrefix,
  className,
  kind,
}: TabsProps<T> & { kind: "sub" | "header" }) {
  const { refs, onKeyDown } = useTabKeys(tabs, selected, onSelect)
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={[
        kind === "sub" ? styles.subList : styles.headerList,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onKeyDown={onKeyDown}
    >
      {tabs.map((tab, i) => {
        const on = tab.id === selected
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            id={tabId(idPrefix, tab.id)}
            aria-selected={on}
            aria-controls={tabPanelId(idPrefix, tab.id)}
            tabIndex={on ? 0 : -1}
            disabled={tab.disabled}
            className={kind === "sub" ? styles.subTab : styles.headerTab}
            onClick={() => onSelect(tab.id)}
          >
            {tab.label}
            {kind === "header" && tab.count !== undefined && tab.count > 0 && (
              <span className={styles.count}>{tab.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** 창 본문 안의 작은 탭 (고른 탭 = 먹색 면) */
export function SubTabs<T extends string>(props: TabsProps<T>) {
  return <TabList {...props} kind="sub" />
}

/** 파랑 머리 안 폴더 탭 — 머리 띠까지 그린다(right로 오른쪽 내용) */
export function HeaderTabs<T extends string>({
  right,
  ...props
}: TabsProps<T> & { right?: ReactNode }) {
  return (
    <div className={styles.header}>
      <TabList {...props} kind="header" />
      {right && <div className={styles.headerRight}>{right}</div>}
    </div>
  )
}
