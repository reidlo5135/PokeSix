/**
 * 테마 적용: 저장값(light · dark · system) + 시스템 설정 → 실제 테마 → <html data-theme>.
 * 처음 그리기 전의 결정은 index.html 인라인 스크립트가 같은 규칙으로 한다(번쩍임 방지).
 */
import type { ThemeChoice } from "../state/settings.ts"

export type ResolvedTheme = "light" | "dark"

export function resolveTheme(
  choice: ThemeChoice,
  systemDark: boolean
): ResolvedTheme {
  return choice === "system" ? (systemDark ? "dark" : "light") : choice
}

const DARK_QUERY = "(prefers-color-scheme: dark)"

export function systemPrefersDark(): boolean {
  return typeof matchMedia === "function" && matchMedia(DARK_QUERY).matches
}

declare global {
  interface Window {
    /** Electron preload가 주면 쓴다(파일 창 등 네이티브 색). 없으면 건너뛴다 */
    pokesix?: { setThemeSource?: (choice: ThemeChoice) => void }
  }
}

/** <html>에 테마를 적용하고 실제 테마를 돌려준다 */
export function applyTheme(
  choice: ThemeChoice,
  root: HTMLElement = document.documentElement
): ResolvedTheme {
  const resolved = resolveTheme(choice, systemPrefersDark())
  root.dataset.theme = resolved
  root.style.colorScheme = resolved
  window.pokesix?.setThemeSource?.(choice)
  return resolved
}

/** 시스템 다크 설정이 바뀔 때 알림. 해제 함수를 돌려준다 */
export function watchSystemTheme(
  onChange: (dark: boolean) => void
): () => void {
  if (typeof matchMedia !== "function") return () => {}
  const mq = matchMedia(DARK_QUERY)
  const listener = (e: MediaQueryListEvent) => onChange(e.matches)
  mq.addEventListener("change", listener)
  return () => mq.removeEventListener("change", listener)
}
