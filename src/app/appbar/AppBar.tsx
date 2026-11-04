/**
 * 앱 막대 (SCR-00, v3 7탭) — 마크 · 탭 7개 · (빈칸) · 세대 버튼 · 전체 검색 · 테마.
 * Tab 순서도 이 순서다. 폭이 좁아지면 CSS가 높이 · 글자 · 아이콘만 남는 탭을 바꾼다.
 */
import { Link } from "react-router-dom"

import { CapsuleMark } from "../../components/CapsuleMark.tsx"
import { GenerationButton } from "../../components/GenerationButton.tsx"
import { Icon } from "../../components/Icon.tsx"
import { Tooltip } from "../../components/Tooltip.tsx"
import { useT } from "../../i18n/index.ts"
import { useMediaQuery } from "../../shared/useMediaQuery.ts"
import { GlobalSearch } from "../search/GlobalSearch.tsx"
import { TABS, type TabId } from "../tabs.ts"
import { ThemeSwitch } from "./ThemeSwitch.tsx"
import styles from "./AppBar.module.css"

export interface AppBarProps {
  /** 지금 탭 (모르는 경로면 null) */
  activeTab: TabId | null
  /** 탭 링크 주소 — 도감은 마지막으로 본 도감 위치 */
  hrefOf: (tab: TabId) => string
}

export function AppBar({ activeTab, hrefOf }: AppBarProps) {
  const t = useT()
  const narrow = useMediaQuery("(max-width: 1099px)") // breakpoint.medium − 1
  const min = useMediaQuery("(max-width: 1023px)") // breakpoint.narrow − 1
  const iconOnly = (tab: TabId) =>
    (narrow && tab === "settings") ||
    (min && (tab === "townmap" || tab === "editor"))

  return (
    <header className={styles.bar}>
      <Link
        to="/"
        className={styles.mark}
        aria-label={t("PokeSix 홈")}
        title={t("홈으로")}
      >
        <span className={styles.markWide}>
          <CapsuleMark size={36} />
        </span>
        <span className={styles.markNarrow}>
          <CapsuleMark size={30} />
        </span>
        <span className={styles.wordmark} aria-hidden="true">
          POKE<span className={styles.six}>SIX</span>
        </span>
      </Link>
      <nav aria-label={t("주 메뉴")} className={styles.nav}>
        {TABS.map((tab) => {
          const label = t(tab.label)
          const only = iconOnly(tab.id)
          const link = (
            <Link
              key={tab.id}
              to={hrefOf(tab.id)}
              className={styles.tab}
              data-icon-only={only ? "" : undefined}
              aria-current={activeTab === tab.id ? "page" : undefined}
              aria-label={only ? label : undefined}
            >
              <Icon name={tab.icon} size={15} className={styles.tabIcon} />
              {!only && <span>{label}</span>}
            </Link>
          )
          return only ? (
            <Tooltip key={tab.id} text={label}>
              {link}
            </Tooltip>
          ) : (
            link
          )
        })}
      </nav>
      <span className={styles.spacer} />
      <GenerationButton variant="bar" />
      <GlobalSearch />
      <ThemeSwitch />
    </header>
  )
}
