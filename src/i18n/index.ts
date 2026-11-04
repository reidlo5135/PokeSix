/**
 * 화면 글자 번역 — t("한국어 원문", ...인자).
 *
 * 사전은 src/i18n/catalogs/*.ts 파일마다 한 권(도메인)이고, 여기서 자동으로 모은다.
 * 새 화면은 catalogs/<도메인>.ts 하나를 더하면 된다 — 이 파일은 고칠 필요가 없다.
 * 자리표시자는 Qt처럼 %1 … %9 (번역문 안에서 순서를 바꿔도 된다).
 */
import { useCallback } from "react"

import { settingsStore, useUiLanguage } from "../state/settings.ts"
import type { Lang } from "../shared/text.ts"
import { CTX_SEPARATOR, type Catalog } from "./types.ts"

export type { Catalog } from "./types.ts"

const modules = import.meta.glob<{ default: Catalog }>("./catalogs/*.ts", {
  eager: true,
})

/** 모든 사전을 하나로. 같은 키가 두 권에 있으면 개발 모드에서 경고 */
function mergeCatalogs(
  all: Record<string, { default: Catalog }>
): Map<string, { en: string; ja: string }> {
  const merged = new Map<string, { en: string; ja: string }>()
  for (const [file, mod] of Object.entries(all)) {
    for (const [key, value] of Object.entries(mod.default)) {
      if (merged.has(key) && import.meta.env.DEV)
        console.warn(`[i18n] 중복 키 "${key}" (${file})`)
      merged.set(key, value)
    }
  }
  return merged
}

const CATALOG = mergeCatalogs(modules)

/** 사전에 있는 모든 키 (테스트용) */
export const catalogKeys = (): string[] => [...CATALOG.keys()]
export const catalogEntry = (key: string) => CATALOG.get(key)

export { ctx, tKey } from "./keys.ts"

export type FormatArg = string | number

/** %1 … %9를 인자로 바꾼다 (왼쪽부터 한 번에 — 인자 안의 %n은 다시 바꾸지 않는다) */
export function format(s: string, ...args: FormatArg[]): string {
  return s.replace(/%([1-9])/g, (whole, n: string) => {
    const v = args[Number(n) - 1]
    return v === undefined ? whole : String(v)
  })
}

const warned = new Set<string>()

/** 원문 → 언어별 글자. 맥락 키 → 맥락 없는 키 → 원문 순으로 찾는다 */
export function lookup(lang: Lang, key: string): string {
  const sep = key.indexOf(CTX_SEPARATOR)
  const source = sep >= 0 ? key.slice(0, sep) : key
  if (lang === "ko") return source
  const entry = CATALOG.get(key) ?? (sep >= 0 ? CATALOG.get(source) : undefined)
  if (entry) return entry[lang]
  if (import.meta.env.DEV && !import.meta.env.VITEST && !warned.has(key)) {
    warned.add(key)
    console.warn(`[i18n] 번역 없음: "${source}"`)
  }
  return source
}

/** 언어를 정해 번역한다 */
export function translate(
  lang: Lang,
  key: string,
  ...args: FormatArg[]
): string {
  return format(lookup(lang, key), ...args)
}

export type TFunction = (key: string, ...args: FormatArg[]) => string

/** 렌더 밖(이벤트 · 문서 제목 등)에서 지금 화면 언어로 번역 */
export const tNow: TFunction = (key, ...args) =>
  translate(settingsStore.getState().uiLanguage, key, ...args)

/** 컴포넌트용: 화면 언어가 바뀌면 다시 그린다 */
export function useT(): TFunction {
  const lang = useUiLanguage()
  return useCallback(
    (key: string, ...args: FormatArg[]) => translate(lang, key, ...args),
    [lang]
  )
}
