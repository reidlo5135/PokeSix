/**
 * 버튼 (C-09). 변형: primary(확정 · 빨강) · secondary(보조 · 흰) · info(파랑) · accent(노랑) · text · danger.
 * 크기: L 38 · M 36(기본) · S 34 · XS 28. 눌림 = 2px 내려가고 그림자 없음.
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"

import styles from "./Button.module.css"

export type ButtonVariant =
  "primary" | "secondary" | "info" | "accent" | "text" | "danger"
export type ButtonSize = "L" | "M" | "S" | "XS"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** 글자 앞 아이콘 (<Icon …/>) */
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "secondary",
      size = "M",
      icon,
      className,
      children,
      type = "button",
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        {...rest}
        className={[styles.button, className].filter(Boolean).join(" ")}
        data-variant={variant}
        data-size={size}
      >
        {icon}
        {children}
      </button>
    )
  }
)

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 화면 읽기 · 풍선 도움말 글자 (필수) */
  label: string
  icon: ReactNode
  /** box = 흰 판 + 먹선(기본) · plain = 투명(머리 안 ⋯) · soft = 가는 선(이름 바꾸기) */
  look?: "box" | "plain" | "soft"
  /** 정사각 한 변 또는 [가로, 세로] */
  dimension?: number | [number, number]
  shadow?: boolean
}

/** 아이콘만 있는 버튼 — aria-label과 title이 늘 붙는다 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      label,
      icon,
      look = "box",
      dimension = 34,
      shadow = false,
      className,
      style,
      type = "button",
      ...rest
    },
    ref
  ) {
    const [w, h] =
      typeof dimension === "number" ? [dimension, dimension] : dimension
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={label}
        {...rest}
        className={[styles.iconButton, className].filter(Boolean).join(" ")}
        data-look={look}
        data-shadow={shadow ? "" : undefined}
        style={{ width: w, height: h, ...style }}
      >
        {icon}
      </button>
    )
  }
)
