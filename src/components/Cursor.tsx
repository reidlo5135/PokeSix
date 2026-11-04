/**
 * 선택 커서 ▶ (CSS 삼각형, C-27). 글자가 밀리지 않게 자리는 늘 두고 visible로만 켠다.
 */
import styles from "./Cursor.module.css"

export interface CursorProps {
  /** md 9×12 · sm 8×10 · xs 6×8 */
  size?: "md" | "sm" | "xs"
  /** ink = 판 위 · onYellow = 노랑 면 위 · yellow = 선택된 슬롯 머리 */
  tone?: "ink" | "onYellow" | "yellow" | "current"
  visible?: boolean
}

export function Cursor({
  size = "md",
  tone = "ink",
  visible = true,
}: CursorProps) {
  return (
    <span
      aria-hidden="true"
      className={styles.cursor}
      data-size={size}
      data-tone={tone}
      style={visible ? undefined : { visibility: "hidden" }}
    />
  )
}
