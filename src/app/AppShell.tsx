/**
 * 앱 셸 — 앱 막대 + 화면. 도감 · 아이템 · 스쿼드 · 에디터 · 타운맵은 한 번 열면 살려 두고
 * hidden으로만 숨긴다(Qt QStackedWidget처럼 필터 · 스크롤 · 선택이 그대로 남는다). 홈 · 설정은 다시 그린다.
 * 전역 단축키(Ctrl/⌘ + 1–7, K)와 테마 · 밀도 · 언어 반영도 여기서 한 번.
 */
import {
  Activity,
  lazy,
  startTransition,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
} from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"

import { tNow } from "../i18n/index.ts"
import { isMacPlatform } from "../shared/platform.ts"
import { initData, useDataStatus } from "../state/data.ts"
import { useDocumentSync } from "../theme/useThemeSync.ts"
import HomePage from "../pages/home/HomePage.tsx"
import SettingsPage from "../pages/settings/SettingsPage.tsx"
import { AppBar } from "./appbar/AppBar.tsx"
import { requestGlobalSearch } from "./searchBus.ts"
import { shortcutAction } from "./shortcuts.ts"
import { dexTabHref, tabOfPath, TABS, type TabId } from "./tabs.ts"
import styles from "./AppShell.module.css"

// 살려 두는 화면 — 각 화면 파일은 기본 내보내기 컴포넌트 하나
const KEEP_ALIVE: Partial<Record<TabId, ComponentType>> = {
  dex: lazy(() => import("../pages/dex/DexPage.tsx")),
  items: lazy(() => import("../pages/items/ItemsPage.tsx")),
  squad: lazy(() => import("../pages/squad/SquadPage.tsx")),
  editor: lazy(() => import("../pages/editor/EditorPage.tsx")),
  townmap: lazy(() => import("../pages/townmap/TownMapPage.tsx")),
}

const KEEP_ALIVE_ORDER = TABS.map((t) => t.id).filter((id) => KEEP_ALIVE[id])

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const active = tabOfPath(location.pathname)
  const [visited, setVisited] = useState<ReadonlySet<TabId>>(
    () => new Set(active ? [active] : [])
  )
  const [lastDex, setLastDex] = useState("/dex")
  const dexPath = location.pathname + location.search

  // 렌더 중 파생 상태 갱신 (조건이 있어 한 번만 돈다)
  if (active && KEEP_ALIVE[active] && !visited.has(active))
    setVisited(new Set(visited).add(active))
  if (active === "dex" && lastDex !== dexPath) setLastDex(dexPath)

  useDocumentSync()

  useEffect(() => {
    initData()
  }, [])

  // 데이터가 준비되면 쉬는 틈에 나머지 화면을 숨긴 채 미리 그려 둔다(Activity hidden = 낮은 우선순위).
  // 처음 들어갈 때 기다리지 않고, 숨은 화면은 세대가 바뀌어도 보이는 화면을 막지 않는다
  const dataStatus = useDataStatus()
  useEffect(() => {
    if (dataStatus !== "ready") return
    const prerender = () =>
      startTransition(() => setVisited(new Set(KEEP_ALIVE_ORDER)))
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(prerender, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(prerender, 500)
    return () => window.clearTimeout(id)
  }, [dataStatus])

  useEffect(() => {
    document.title = `PokeSix ${tNow("v%1", __APP_VERSION__)}`
  }, [])

  const hrefOf = (tab: TabId): string =>
    tab === "dex"
      ? dexTabHref(location.pathname, lastDex)
      : (TABS.find((t) => t.id === tab)?.route ?? "/")

  // 전역 단축키 — 입력 칸 안에서도 동작(캡처 단계)
  useEffect(() => {
    const mac = isMacPlatform()
    const onKeyDown = (e: KeyboardEvent) => {
      const action = shortcutAction(e, mac)
      if (!action) return
      e.preventDefault()
      e.stopPropagation()
      if (action.type === "search") requestGlobalSearch()
      else navigate(hrefOf(action.tab))
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  })

  return (
    <div className={styles.shell}>
      <AppBar activeTab={active} hrefOf={hrefOf} />
      <div className={styles.body}>
        {active === "home" && <HomePage />}
        {active === "settings" && <SettingsPage />}
        {KEEP_ALIVE_ORDER.filter((id) => visited.has(id)).map((id) => {
          const Page = KEEP_ALIVE[id] as ComponentType
          return (
            <Activity key={id} mode={id === active ? "visible" : "hidden"}>
              <div className={styles.page}>
                {/* 화면마다 따로 — 한 화면의 코드를 받는 동안 다른 화면이 비지 않게 */}
                <Suspense fallback={null}>
                  <Page />
                </Suspense>
              </div>
            </Activity>
          )
        })}
        <Outlet />
      </div>
    </div>
  )
}
