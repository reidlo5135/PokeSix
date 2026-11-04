/**
 * 짧은 메모 칸 (C-13, 스쿼드 역할 메모) — 최대 40자.
 */
import { forwardRef, type InputHTMLAttributes } from "react"

import styles from "./MemoInput.module.css"

export const MEMO_MAX_LENGTH = 40

export interface MemoInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> {
  value: string
  onValueChange: (value: string) => void
  /** 흰 바탕 + 2px 먹선 (숫자 입력 등) */
  strong?: boolean
}

export const MemoInput = forwardRef<HTMLInputElement, MemoInputProps>(
  function MemoInput(
    {
      value,
      onValueChange,
      strong,
      className,
      maxLength = MEMO_MAX_LENGTH,
      ...rest
    },
    ref
  ) {
    return (
      <input
        ref={ref}
        type="text"
        {...rest}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={[styles.memo, className].filter(Boolean).join(" ")}
        data-strong={strong ? "" : undefined}
      />
    )
  }
)
