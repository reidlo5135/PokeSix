import { useEffect, useSyncExternalStore } from "react"

import { useSettings } from "../state/settings.ts"
import {
  applyTheme,
  resolveTheme,
  systemPrefersDark,
  watchSystemTheme,
  type ResolvedTheme,
} from "./theme.ts"

/** 시스템 다크 여부를 구독한다 */
export function useSystemDark(): boolean {
  return useSyncExternalStore(
    (notify) => watchSystemTheme(() => notify()),
    systemPrefersDark,
    () => false
  )
}

/** 지금 실제로 보이는 테마 */
export function useResolvedTheme(): ResolvedTheme {
  const choice = useSettings((s) => s.theme)
  return resolveTheme(choice, useSystemDark())
}

/**
 * 셸에서 한 번 부른다: 테마 · 표 밀도 · 화면 언어를 <html>에 반영하고,
 * "시스템"이면 OS 설정이 바뀌는 대로 다시 적용한다.
 */
export function useDocumentSync(): void {
  const choice = useSettings((s) => s.theme)
  const density = useSettings((s) => s.density)
  const uiLanguage = useSettings((s) => s.uiLanguage)
  const systemDark = useSystemDark()

  useEffect(() => {
    applyTheme(choice)
  }, [choice, systemDark])

  useEffect(() => {
    document.documentElement.dataset.density = density
  }, [density])

  useEffect(() => {
    document.documentElement.lang = uiLanguage
  }, [uiLanguage])
}
