/**
 * 앱 막대 탭 7개 (v3 02c — 이 순서 고정) · 폭에 따른 막대 모양.
 */
import type { IconName } from "../components/Icon.tsx"
import { tKey } from "../i18n/keys.ts"

export type TabId =
  "home" | "dex" | "items" | "squad" | "editor" | "townmap" | "settings"

export interface TabDef {
  id: TabId
  /** 한국어 원문 — 화면에서는 t(label) */
  label: string
  route: string
  icon: IconName
}

export const TABS: readonly TabDef[] = [
  { id: "home", label: tKey("홈"), route: "/", icon: "home" },
  { id: "dex", label: tKey("도감"), route: "/dex", icon: "dex" },
  { id: "items", label: tKey("아이템"), route: "/items", icon: "items" },
  { id: "squad", label: tKey("스쿼드"), route: "/squad", icon: "squad" },
  { id: "editor", label: tKey("에디터"), route: "/editor", icon: "editor" },
  { id: "townmap", label: tKey("타운맵"), route: "/townmap", icon: "townmap" },
  { id: "settings", label: tKey("설정"), route: "/settings", icon: "settings" },
]

/** 경로 → 탭. 모르는 경로는 null */
export function tabOfPath(pathname: string): TabId | null {
  const first = pathname.split("/").filter(Boolean)[0] ?? ""
  if (first === "") return "home"
  const tab = TABS.find((t) => t.route === `/${first}`)
  return tab ? tab.id : null
}

export type BarVariant = "wide" | "medium" | "narrow" | "min"

export function barVariant(width: number): BarVariant {
  return width >= 1360
    ? "wide"
    : width >= 1100
      ? "medium"
      : width >= 1024
        ? "narrow"
        : "min"
}

/** 이름을 떼고 아이콘만 남길 탭 — 설정 → 타운맵 → 에디터 순으로 뗀다 */
export function iconOnlyTabs(v: BarVariant): ReadonlySet<TabId> {
  return v === "narrow"
    ? new Set<TabId>(["settings"])
    : v === "min"
      ? new Set<TabId>(["settings", "townmap", "editor"])
      : new Set<TabId>()
}

/**
 * 도감 탭 주소: 이미 도감 안이면 목록(/dex) — 상세를 보다가 도감 탭을 다시 누르면 목록으로(Qt showList).
 * 다른 탭에서 오면 마지막으로 본 도감 위치(목록이든 상세든).
 */
export function dexTabHref(currentPath: string, lastDexPath: string): string {
  return currentPath === "/dex" || currentPath.startsWith("/dex/")
    ? "/dex"
    : lastDexPath
}
