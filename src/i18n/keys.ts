import { CTX_SEPARATOR } from "./types.ts"

/** 맥락이 붙은 키: 같은 한국어가 화면마다 다르게 번역될 때 — t(ctx("특성", "SlotCard")) */
export const ctx = (source: string, context: string): string =>
  `${source}${CTX_SEPARATOR}${context}`

/**
 * 번역할 원문 표시(그대로 돌려준다) — 상수 배열에 둔 글자를 나중에 t(label)로 번역할 때.
 * 사전 검사 테스트가 tKey("…")도 찾아 사전에 있는지 본다. 예: { label: tKey("홈") } → t(tab.label)
 */
export const tKey = (source: string): string => source
