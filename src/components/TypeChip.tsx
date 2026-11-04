/**
 * 타입 칩 (C-10). 글자는 이름 표기 언어(설정 > 언어)를 따른다.
 * 그 세대에 없는 타입은 absentUntil(처음 나온 세대)을 주면 점선 칩 "페어리 · 6세대부터".
 */
import { useT } from "../i18n/index.ts"
import { typeAbbr, typeName } from "../shared/pokemonTypes.ts"
import { useNameLanguage } from "../state/settings.ts"
import styles from "./TypeChip.module.css"

export type TypeChipSize = "md" | "slot" | "sm" | "card" | "move" | "xs"

export interface TypeChipProps {
  /** PokéAPI identifier ("fire") */
  type: string
  /** md 24 · slot 22 · sm 20(표) · card 18 · move 18 · xs 정사각 약자 */
  size?: TypeChipSize
  /** 그 세대에 없으면 처음 나온 세대 — 점선 칩으로 그린다 */
  absentUntil?: number
  /** absent 글자 꼴: "부터"(기본) · "~" */
  absentStyle?: "from" | "tilde"
  className?: string
}

export function TypeChip({
  type,
  size = "md",
  absentUntil,
  absentStyle = "from",
  className,
}: TypeChipProps) {
  const lang = useNameLanguage()
  const t = useT()
  const name = typeName(type, lang)
  const absent = absentUntil !== undefined
  let label = size === "xs" ? typeAbbr(type) : name
  if (absent && size !== "xs")
    label =
      absentStyle === "tilde"
        ? t("%1 · %2세대~", name, absentUntil)
        : t("%1 · %2세대부터", name, absentUntil)
  return (
    <span
      className={[styles.chip, className].filter(Boolean).join(" ")}
      data-size={size}
      data-absent={absent ? "" : undefined}
      style={
        absent
          ? undefined
          : {
              background: `var(--type-${type})`,
              color: `var(--type-${type}-text)`,
            }
      }
      title={size === "xs" ? name : undefined}
    >
      {label}
    </span>
  )
}

/** 표 안의 두 타입 한 칸 [드래곤│땅] */
export function DualTypeChip({ types }: { types: readonly string[] }) {
  const lang = useNameLanguage()
  return (
    <span className={styles.dual}>
      {types.slice(0, 2).map((type) => (
        <span
          key={type}
          className={styles.part}
          style={{
            background: `var(--type-${type})`,
            color: `var(--type-${type}-text)`,
          }}
        >
          {typeName(type, lang)}
        </span>
      ))}
    </span>
  )
}

/** 기술 타입 작은 네모 (C-25) */
export function MoveTypeSquare({
  type,
  compact = false,
}: {
  type: string
  compact?: boolean
}) {
  const lang = useNameLanguage()
  return (
    <span
      className={styles.square}
      data-compact={compact ? "" : undefined}
      style={{ background: `var(--type-${type})` }}
      title={typeName(type, lang)}
      aria-hidden="true"
    />
  )
}

/** 물리 · 특수 · 변화 칸 (C-25). damageClass: PokéAPI 1 변화 · 2 물리 · 3 특수 */
export function CategoryCell({ damageClass }: { damageClass: number }) {
  const t = useT()
  const kind =
    damageClass === 2 ? "physical" : damageClass === 3 ? "special" : "status"
  const short =
    kind === "physical" ? t("물") : kind === "special" ? t("특") : t("변")
  const full =
    kind === "physical" ? t("물리") : kind === "special" ? t("특수") : t("변화")
  return (
    <span
      className={styles.category}
      data-kind={kind}
      title={full}
      aria-label={full}
    >
      {short}
    </span>
  )
}
