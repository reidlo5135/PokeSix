/**
 * 스쿼드 슬롯 카드(v1 §5-6 + Qt SlotCard) — 채운 카드 · 빈 카드, 넓은/좁은 배치.
 * 채운 카드: 머리(첫 타입 색 · 번호 · 아이콘 · 이름 · 경고 · ⋯) · 타입 줄 · 메모 · 특성/성격/물건 · 기술 2×2 · 약점.
 * 머리를 끌어 다른 카드에 놓으면 순서가 바뀐다.
 */
import { useRef, type DragEvent, type RefObject } from "react"

import {
  CategoryCell,
  ItemIcon,
  MemoInput,
  PokemonIcon,
  TypeChip,
} from "../../components/index.ts"
import { Icon } from "../../components/Icon.tsx"
import { learnBadge } from "../../core/rules/learn.ts"
import { featuresOf } from "../../core/rules/generationFeatures.ts"
import { weaknessesOf, type MatchupChart } from "../../core/typechart/index.ts"
import type { ItemRow, Nature } from "../../data/repository/index.ts"
import { text } from "../../data/text/localizedText.ts"
import { useT } from "../../i18n/index.ts"
import { typeAbbr } from "../../shared/pokemonTypes.ts"
import { useNameLanguage } from "../../state/settings.ts"
import type { SquadMember } from "../../state/squads.ts"
import type { ResolvedMember, SlotMove } from "./squadData.ts"
import styles from "./Squad.module.css"

export const DRAG_TYPE = "application/x-pokesix-slot"

export type FieldKind = "ability" | "nature" | "item"

export interface SlotCardProps {
  slot: number
  member: SquadMember
  resolved: ResolvedMember
  generation: number
  chart: MatchupChart
  compact: boolean
  selected: boolean
  /** 문제 줄에 마우스를 올린 동안: 배지 글("땅 약점") */
  hot: string
  warning: string
  nature: Nature | null
  item: ItemRow | null
  onSelect: () => void
  /** 머리 버튼 셋(0.5.1): 바꾸기 · 비우기 · 자세히 */
  onChange: () => void
  onClear: () => void
  onDetail: () => void
  onPickMove: (index: number) => void
  onMemo: (memo: string) => void
  onField: (
    kind: FieldKind,
    anchor: RefObject<HTMLButtonElement | null>
  ) => void
  onDrop: (from: number) => void
}

const pad = (slot: number): string => String(slot + 1).padStart(2, "0")

export function SlotCard(props: SlotCardProps) {
  const t = useT()
  const lang = useNameLanguage()
  const { slot, resolved, member, compact, selected, hot, warning } = props
  const detail = resolved.detail
  if (!detail) return null
  const name = text(detail.name, lang)
  const first = detail.types[0] ?? "normal"
  const weaknesses = weaknessesOf(props.chart, detail.types)

  const onDragStart = (e: DragEvent) => {
    e.dataTransfer.setData(DRAG_TYPE, String(slot))
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <article
      className={styles.card}
      data-selected={selected ? "" : undefined}
      data-hot={hot ? "" : undefined}
      data-compact={compact ? "" : undefined}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(DRAG_TYPE)) e.preventDefault()
      }}
      onDrop={(e) => {
        const from = Number(e.dataTransfer.getData(DRAG_TYPE))
        if (Number.isInteger(from) && from !== slot) props.onDrop(from)
      }}
    >
      <div
        className={styles.cardHead}
        style={{
          background: `var(--type-${first})`,
          color: `var(--type-${first}-text)`,
        }}
        draggable
        onDragStart={onDragStart}
      >
        {selected && <span className={styles.cursor} aria-hidden="true" />}
        <span className={styles.slotNumber}>{pad(slot)}</span>
        <button
          type="button"
          className={styles.pickButton}
          aria-label={t("%1 선택", name)}
          aria-pressed={selected}
          title={t("누르면 선택, 끌면 순서를 바꿔요")}
          onClick={props.onSelect}
        >
          {!compact && (
            <span className={styles.iconBox}>
              <PokemonIcon pokemonId={detail.pokemonId} alt="" />
            </span>
          )}
          <span className={styles.cardName}>{name}</span>
          {member.level > 0 && (
            <span className={styles.level}>{`Lv.${member.level}`}</span>
          )}
        </button>
        {warning && (
          <span
            className={styles.warnDot}
            title={warning}
            role="img"
            aria-label={warning}
          >
            !
          </span>
        )}
        {hot && (
          <span className={styles.hotBadge}>
            <Icon name="warning" size={11} strokeWidth={3} />
            {hot}
          </span>
        )}
        {/* 좁은 배치 · 키가 낮은 카드: 타입을 머리에 작게(본문 타입 줄 대신) */}
        <span className={styles.headTypes}>
          {detail.types.map((type) => (
            <TypeChip key={type} type={type} size="xs" />
          ))}
        </span>
        <span className={styles.headButtons}>
          <button
            type="button"
            className={styles.headButton}
            aria-label={t("%1 바꾸기", name)}
            title={t("포켓몬 바꾸기")}
            onClick={props.onChange}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M5 9h14M15.5 5.5 19 9l-3.5 3.5" />
              <path d="M19 15H5M8.5 11.5 5 15l3.5 3.5" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.headButton}
            aria-label={t("%1 비우기", name)}
            title={t("슬롯 비우기")}
            onClick={props.onClear}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M5 7h14M10 4.5h4" />
              <rect x="7" y="9" width="10" height="11" rx="1.6" />
              <path d="M12 12v5" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.headButton}
            aria-label={t("%1 자세히 보기", name)}
            title={t("자세히 보기")}
            onClick={props.onDetail}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M12 5.5v13M5.5 12h13" />
            </svg>
          </button>
        </span>
      </div>
      <div className={styles.cardBody}>
        {!compact && (
          <>
            <div className={styles.typeLine}>
              {detail.types.map((type) => (
                <TypeChip key={type} type={type} size="slot" />
              ))}
            </div>
            <MemoInput
              className={styles.memo}
              value={member.memo}
              onValueChange={props.onMemo}
              placeholder={t("역할 메모 (예: 선봉 · 고속 스위퍼)")}
              aria-label={t("%1 역할 메모", name)}
            />
            <FieldRow {...props} />
          </>
        )}
        <div className={styles.moves}>
          {resolved.moves.map((m, i) => (
            <MoveCell
              key={i}
              move={m}
              index={i}
              compact={compact}
              detail={detail}
              generation={props.generation}
              onPick={() => props.onPickMove(i)}
            />
          ))}
        </div>
        <div className={styles.weakLine}>
          <span className={styles.weakLabel}>{t("약점")}</span>
          {weaknesses.length === 0 ? (
            <span className={styles.weakNone}>{t("없음")}</span>
          ) : (
            weaknesses.map((w) =>
              w.multiplier >= 4 ? (
                <span key={w.type} className={styles.weakChip} data-quad="">
                  {`${typeAbbr(w.type, lang)}×4`}
                </span>
              ) : (
                <span
                  key={w.type}
                  className={styles.weakChip}
                  style={{
                    background: `var(--type-${w.type})`,
                    color: `var(--type-${w.type}-text)`,
                  }}
                >
                  {typeAbbr(w.type, lang)}
                </span>
              )
            )
          )}
        </div>
      </div>
    </article>
  )
}

function FieldRow({
  member,
  resolved,
  generation,
  nature,
  item,
  onField,
}: SlotCardProps) {
  const t = useT()
  const lang = useNameLanguage()
  const abilityRef = useRef<HTMLButtonElement | null>(null)
  const natureRef = useRef<HTMLButtonElement | null>(null)
  const itemRef = useRef<HTMLButtonElement | null>(null)
  const f = featuresOf(generation)
  if (!f.abilities && !f.natures && !f.heldItems)
    return (
      <p className={styles.fieldNone}>
        {t("1세대에는 특성 · 성격 · 지닌 물건이 없어요")}
      </p>
    )
  const ability = resolved.detail?.abilities.find(
    (a) => a.abilityId === member.abilityId
  )
  return (
    <div className={styles.fields}>
      {f.abilities && (
        <button
          ref={abilityRef}
          type="button"
          className={styles.field}
          title={
            ability
              ? `${text(ability.name, lang)}\n${text(ability.effect, lang)}`
              : undefined
          }
          onClick={() => onField("ability", abilityRef)}
        >
          <span className={styles.fieldLabel}>{t("특성")}</span>
          <span
            className={styles.fieldValue}
            data-empty={ability ? undefined : ""}
          >
            {ability ? text(ability.name, lang) : "—"}
          </span>
          <span className={styles.fieldCaret}>▾</span>
        </button>
      )}
      {f.natures && (
        <button
          ref={natureRef}
          type="button"
          className={styles.field}
          onClick={() => onField("nature", natureRef)}
        >
          <span className={styles.fieldLabel}>{t("성격")}</span>
          <span
            className={styles.fieldValue}
            data-empty={nature ? undefined : ""}
          >
            {nature ? text(nature.name, lang) : "—"}
          </span>
          <span className={styles.fieldCaret}>▾</span>
        </button>
      )}
      {f.heldItems && (
        <button
          ref={itemRef}
          type="button"
          className={styles.field}
          title={
            item
              ? `${text(item.name, lang)}\n${text(item.effect, lang)}`
              : undefined
          }
          onClick={() => onField("item", itemRef)}
        >
          {item ? (
            <span className={styles.fieldIcon}>
              <ItemIcon
                identifier={item.identifier}
                machineType={item.machineType || null}
                generation={generation}
                alt=""
              />
            </span>
          ) : (
            <span className={styles.fieldLabel}>{t("물건")}</span>
          )}
          <span
            className={styles.fieldValue}
            data-empty={item ? undefined : ""}
          >
            {item ? text(item.name, lang) : t("없음")}
          </span>
          <span className={styles.fieldCaret}>▾</span>
        </button>
      )}
    </div>
  )
}

function MoveCell({
  move,
  index,
  compact,
  detail,
  generation,
  onPick,
}: {
  move: SlotMove | null
  index: number
  compact: boolean
  detail: NonNullable<ResolvedMember["detail"]>
  generation: number
  onPick: () => void
}) {
  const t = useT()
  const lang = useNameLanguage()
  if (!move)
    return (
      <button
        type="button"
        className={styles.moveEmpty}
        aria-label={t("기술 %1 추가", index + 1)}
        onClick={onPick}
      >
        <Icon name="plus" size={12} strokeWidth={2.6} />
        {compact ? t("기술") : t("기술 추가")}
      </button>
    )
  const m = move.move
  const name = text(m.name, lang)
  const badge = move.learnable ? learnBadge(detail, m.moveId) : null
  const num = (v: number) => (v > 0 ? String(v) : "—")
  const tip = move.learnable
    ? t("위력 %1 · 명중 %2 · PP %3", num(m.power), num(m.accuracy), num(m.pp))
    : t("이 게임에서는 배울 수 없는 기술이에요. 다시 골라 주세요.")
  return (
    <button
      type="button"
      className={styles.moveCell}
      data-bad={move.learnable ? undefined : ""}
      title={tip}
      onClick={onPick}
    >
      <span
        className={styles.moveSquare}
        style={{ background: m.type ? `var(--type-${m.type})` : undefined }}
        aria-hidden="true"
      />
      <span className={styles.moveName}>{name}</span>
      {!compact && badge && (
        <span className={styles.learn}>
          {badge.kind === "level" ? (
            `Lv.${badge.level}`
          ) : badge.kind === "reminder" ? (
            <span className={styles.learnIcon}>
              <ItemIcon
                identifier="heart-scale"
                generation={generation}
                alt={t("하트비늘")}
              />
            </span>
          ) : badge.kind === "machine" ? (
            badge.label
          ) : badge.kind === "tutor" ? (
            "NPC"
          ) : (
            t("알")
          )}
        </span>
      )}
      {!compact && <CategoryCell damageClass={m.damageClass} />}
    </button>
  )
}

export function EmptySlotCard({
  slot,
  compact,
  suggestion,
  onAdd,
  onDrop,
}: {
  slot: number
  compact: boolean
  suggestion: string
  onAdd: () => void
  onDrop: (from: number) => void
}) {
  const t = useT()
  return (
    <article
      className={styles.emptyCard}
      data-compact={compact ? "" : undefined}
      onClick={onAdd}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(DRAG_TYPE)) e.preventDefault()
      }}
      onDrop={(e) => {
        const from = Number(e.dataTransfer.getData(DRAG_TYPE))
        if (Number.isInteger(from) && from !== slot) onDrop(from)
      }}
    >
      {!compact && (
        <svg width="40" height="40" viewBox="0 0 100 100" aria-hidden="true">
          <polygon
            points="50,6 88.1,28 88.1,72 50,94 11.9,72 11.9,28"
            className={styles.hexFill}
          />
          <path d="M50 34v32M34 50h32" className={styles.hexPlus} />
        </svg>
      )}
      <span className={styles.emptyTitle}>
        <span className={styles.emptyNumber}>{pad(slot)}</span>
        {t("빈 슬롯")}
      </span>
      <button
        type="button"
        className={styles.addMember}
        onClick={(e) => {
          e.stopPropagation()
          onAdd()
        }}
      >
        <Icon name="plus" size={compact ? 13 : 14} strokeWidth={3} />
        {t("개체 추가")}
      </button>
      {!compact && suggestion && (
        <p className={styles.suggestion}>{suggestion}</p>
      )}
    </article>
  )
}
