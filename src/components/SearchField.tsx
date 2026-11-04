/**
 * 검색 칸 (C-12 / Qt SearchField). 한글 조합 규칙: 자모만 조합 중이면 그 부분은 빼고 찾는다.
 * onQuery는 150ms 디바운스(지우기 버튼 · Enter는 바로). 값은 제어(value) · 비제어(defaultValue) 둘 다 된다.
 */
import {
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type Ref,
} from "react"

import { useT } from "../i18n/index.ts"
import { effectiveQuery, SEARCH_DEBOUNCE_MS } from "../shared/search.ts"
import { Icon } from "./Icon.tsx"
import styles from "./SearchField.module.css"

export interface SearchFieldProps {
  /** 화면 읽기용 이름 (필수) */
  ariaLabel: string
  placeholder?: string
  value?: string
  defaultValue?: string
  /** 칸 글자가 바뀔 때마다 (조합 중 글자 포함) */
  onValueChange?: (raw: string) => void
  /** 실제로 찾을 글자 — 조합 규칙 + 디바운스 적용 */
  onQuery?: (query: string) => void
  debounceMs?: number
  /** 34 · 36(기본) · 38 */
  height?: 34 | 36 | 38
  iconSize?: number
  /** 오른쪽 단축키 표시 ("Ctrl K"). 글자가 있으면 지우기 버튼으로 바뀐다 */
  shortcutHint?: string
  /** 넓이: fill(기본 — 부모를 채움) 또는 px */
  width?: "fill" | number
  autoFocus?: boolean
  inputRef?: Ref<HTMLInputElement>
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  onFocus?: () => void
  onBlur?: () => void
  /** combobox 등 input에 그대로 넘길 속성 */
  inputProps?: InputHTMLAttributes<HTMLInputElement>
  className?: string
}

export function SearchField({
  ariaLabel,
  placeholder,
  value,
  defaultValue = "",
  onValueChange,
  onQuery,
  debounceMs = SEARCH_DEBOUNCE_MS,
  height = 36,
  iconSize = 16,
  shortcutHint,
  width = "fill",
  autoFocus,
  inputRef,
  onKeyDown,
  onFocus,
  onBlur,
  inputProps,
  className,
}: SearchFieldProps) {
  const t = useT()
  const [inner, setInner] = useState(defaultValue)
  const raw = value ?? inner
  const timer = useRef<number | undefined>(undefined)
  const composing = useRef(false)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const emit = (q: string, now = false) => {
    if (!onQuery) return
    window.clearTimeout(timer.current)
    if (now || debounceMs <= 0) onQuery(q)
    else timer.current = window.setTimeout(() => onQuery(q), debounceMs)
  }

  const change = (next: string, isComposing: boolean) => {
    if (value === undefined) setInner(next)
    onValueChange?.(next)
    emit(effectiveQuery(next, isComposing))
  }

  const clear = () => {
    if (value === undefined) setInner("")
    onValueChange?.("")
    emit("", true)
  }

  return (
    <label
      className={[styles.field, className].filter(Boolean).join(" ")}
      style={{ height, width: width === "fill" ? undefined : width }}
      data-fill={width === "fill" ? "" : undefined}
    >
      <Icon name="search" size={iconSize} className={styles.icon} />
      <input
        {...inputProps}
        ref={inputRef}
        type="text"
        className={styles.input}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={raw}
        autoFocus={autoFocus}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => {
          const native = e.nativeEvent as InputEvent
          change(
            e.target.value,
            composing.current || native.isComposing === true
          )
        }}
        onCompositionStart={() => {
          composing.current = true
        }}
        onCompositionEnd={(e) => {
          composing.current = false
          emit(effectiveQuery(e.currentTarget.value, false))
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing)
            emit(effectiveQuery(raw, false), true)
          onKeyDown?.(e)
        }}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {raw !== "" ? (
        <button
          type="button"
          className={styles.clear}
          aria-label={t("지우기")}
          title={t("지우기")}
          onClick={clear}
        >
          <Icon name="close" size={14} strokeWidth={2.6} />
        </button>
      ) : (
        shortcutHint && (
          <kbd className={styles.hint} aria-hidden="true">
            {shortcutHint}
          </kbd>
        )
      )}
    </label>
  )
}
