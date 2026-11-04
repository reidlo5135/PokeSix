/**
 * 설정 (v1 SCR-05) — 세대 규칙 · 데이터 · 언어 · 테마 · 단축키 · 정보.
 * 바꾸면 바로 적용 · 저장된다(확인 버튼 없음). 왼쪽 목록을 누르면 그 창으로 스크롤, 스크롤하면 목록이 따라온다.
 */
import { useEffect, useRef, useState, type MouseEvent } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { NavList, NavListItem } from "../../components/NavListItem.tsx"
import { Panel } from "../../components/Panel.tsx"
import { tKey, useT } from "../../i18n/index.ts"
import { AboutPanel } from "./AboutPanel.tsx"
import { DataPanel } from "./DataPanel.tsx"
import { KeysPanel } from "./KeysPanel.tsx"
import { LanguagePanel } from "./LanguagePanel.tsx"
import { RulesPanel } from "./RulesPanel.tsx"
import { ThemePanel } from "./ThemePanel.tsx"
import styles from "./Settings.module.css"

const SECTIONS = [
  { id: "rules", label: tKey("세대 규칙"), swatch: "var(--color-red)" },
  { id: "data", label: tKey("데이터"), swatch: "var(--color-blue-face)" },
  { id: "lang", label: tKey("언어"), swatch: "var(--color-green-face)" },
  { id: "theme", label: tKey("테마"), swatch: "var(--color-yellow)" },
  { id: "keys", label: tKey("단축키"), swatch: "var(--type-normal)" },
  { id: "about", label: tKey("정보"), swatch: "var(--color-ink-face)" },
] as const

type SectionId = (typeof SECTIONS)[number]["id"]

const isSection = (v: string): v is SectionId =>
  SECTIONS.some((s) => s.id === v)

export default function SettingsPage() {
  const t = useT()
  const location = useLocation()
  const navigate = useNavigate()
  const hashId = location.hash.slice(1)
  const [current, setCurrent] = useState<SectionId>(
    isSection(hashId) ? hashId : "rules"
  )
  const scroller = useRef<HTMLElement | null>(null)

  // 주소의 #섹션으로 처음 한 번 스크롤
  useEffect(() => {
    if (isSection(hashId))
      document.getElementById(`settings-${hashId}`)?.scrollIntoView()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 처음 열 때만
  }, [])

  // 스크롤하면 맨 위에 보이는 창을 고른다
  useEffect(() => {
    const root = scroller.current
    if (!root || typeof IntersectionObserver === "undefined") return
    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id.replace("settings-", "")
          if (e.isIntersecting) visible.set(id, e.boundingClientRect.top)
          else visible.delete(id)
        }
        const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0]
        if (top && isSection(top[0])) setCurrent(top[0])
      },
      { root, threshold: 0.3 }
    )
    for (const s of SECTIONS) {
      const el = document.getElementById(`settings-${s.id}`)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  const jump = (id: SectionId) => (e: MouseEvent<HTMLElement>) => {
    e.preventDefault()
    setCurrent(id)
    navigate({ hash: `#${id}` }, { replace: true })
    const target = document.getElementById(`settings-${id}`)
    const reduce =
      typeof matchMedia === "function" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches
    target?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    })
    target?.focus({ preventScroll: true })
  }

  return (
    <main ref={scroller} className={styles.settings}>
      <Panel
        as="nav"
        aria-label={t("설정 분류")}
        className={styles.nav}
        header={{ title: t("설정"), tone: "ink", level: 1 }}
      >
        <NavList>
          {SECTIONS.map((s) => (
            <NavListItem
              key={s.id}
              href={`#${s.id}`}
              selected={current === s.id}
              swatch={s.swatch}
              swatchSize={14}
              onClick={jump(s.id)}
            >
              {t(s.label)}
            </NavListItem>
          ))}
        </NavList>
      </Panel>
      <div className={styles.column}>
        <RulesPanel />
      </div>
      <div className={styles.column}>
        <DataPanel />
        <LanguagePanel />
        <ThemePanel />
        <KeysPanel />
        <AboutPanel />
      </div>
    </main>
  )
}
