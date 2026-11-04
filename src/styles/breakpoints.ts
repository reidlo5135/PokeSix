/**
 * 화면 폭 기준 (tokens.json breakpoint). CSS 변수는 @media에 못 쓰므로
 * CSS에는 숫자를 그대로 적고 옆에 이 이름을 주석으로 단다.
 */
export const BREAKPOINT = {
  wide: 1360, // ≥1360: 넓은 배치
  medium: 1100, // 1100–1359
  narrow: 1024, // 1024–1099
  min: 960, // 960–1023 (가장 작은 창)
  squadSplit: 1280, // 스쿼드: 미만이면 슬롯 3×2 + 분석 탭
  minHeight: 640,
} as const

export type WidthClass = "wide" | "medium" | "narrow" | "min"

export function widthClass(w: number): WidthClass {
  return w >= BREAKPOINT.wide
    ? "wide"
    : w >= BREAKPOINT.medium
      ? "medium"
      : w >= BREAKPOINT.narrow
        ? "narrow"
        : "min"
}
