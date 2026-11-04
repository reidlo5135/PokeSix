/**
 * 토글 스위치 (C-15) — role="switch". 켬 = 초록 면, 끔 = line 면. 움직임 없이 바로 바뀐다.
 */
import styles from "./ToggleSwitch.module.css"

export interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** 화면 읽기용 이름 (보통 행 제목) */
  label: string
  disabled?: boolean
  id?: string
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled,
  id,
}: ToggleSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={styles.switch}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.knob} aria-hidden="true" />
    </button>
  )
}
