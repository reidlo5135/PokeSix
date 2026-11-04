/** 컴포넌트가 쓰는 순수 계산 (Vitest 대상) */

/** step에 맞추고 범위 안으로 (Qt rangeslider 규칙) */
export function snapValue(
  v: number,
  min: number,
  max: number,
  step: number
): number {
  const snapped = min + Math.round((v - min) / step) * step
  return Math.min(max, Math.max(min, snapped))
}

/** 종족값 막대 색 구간 (C-23) */
export type StatFill = "low" | "mid" | "good" | "high"
export const statFill = (v: number): StatFill =>
  v >= 120 ? "high" : v >= 90 ? "good" : v >= 60 ? "mid" : "low"

/** 표 안 종족값 숫자 꼴 (C-24) */
export type StatTone = "high" | "strong" | "plain" | "low"
export const statTone = (v: number): StatTone =>
  v >= 120 ? "high" : v >= 100 ? "strong" : v >= 60 ? "plain" : "low"

/** 10칸 진행 막대에서 채울 칸 수 (Qt: floor(percent / 10)) */
export const segmentFill = (percent: number): number =>
  Math.max(0, Math.min(10, Math.floor(percent / 10)))

/** 탭 · 탭 패널 id */
export const tabId = (prefix: string, id: string): string =>
  `${prefix}-tab-${id}`
export const tabPanelId = (prefix: string, id: string): string =>
  `${prefix}-panel-${id}`
