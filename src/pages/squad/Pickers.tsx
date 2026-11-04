/**
 * 스쿼드 선택 창들 — 포켓몬 · 기술 · 지닌 물건 (Qt SquadPage::pickPokemon · pickMove · pickItem).
 */
import { useMemo, useState } from "react"

import {
  CategoryCell,
  ItemIcon,
  PokemonIcon,
  TypeChip,
} from "../../components/index.ts"
import type { MemberWarning } from "../../core/analysis/memberWarning.ts"
import { learnableMoves } from "../../core/rules/learn.ts"
import {
  describeMoveEffect,
  effectPlainText,
  type EffectSegment,
} from "../../core/rules/moveEffect.ts"
import {
  dexesForGeneration,
  otherVersionSpecies,
  speciesForDex,
  speciesForGeneration,
  type ItemRow,
  type PokemonDetail,
  type SpeciesRow,
} from "../../data/repository/index.ts"
import { allText, text } from "../../data/text/localizedText.ts"
import { useT } from "../../i18n/index.ts"
import { typeName } from "../../shared/pokemonTypes.ts"
import { useNameLanguage } from "../../state/settings.ts"
import { dexLabel, isHiddenDex } from "./dexStyle.ts"
import { ListPicker } from "./ListPicker.tsx"
import type { SquadContext } from "./session.ts"
import { itemsIn } from "./squadData.ts"
import {
  heldItemCandidates,
  learnMethodText,
  warningText,
} from "./pickerText.ts"
import styles from "./Picker.module.css"

const NATIONAL = -1
// 게임 묶음마다 마지막에 고른 도감(창을 닫아도 기억한다)
const rememberedDex = new Map<string, number>()

export function PokemonPicker({
  ctx,
  shuttle,
  currentPokemonId,
  warningFor,
  onPick,
  onClose,
}: {
  ctx: SquadContext
  shuttle: boolean
  currentPokemonId: number
  /** 줄마다 경고(셔틀은 없음) */
  warningFor: (speciesId: number) => MemberWarning | null
  onPick: (pokemonId: number) => void
  onClose: () => void
}) {
  const t = useT()
  const lang = useNameLanguage()
  const g = ctx.generation
  const group = ctx.versionGroup
  const dexes = useMemo(
    () => dexesForGeneration(g).filter((d) => !isHiddenDex(d.identifier)),
    [g]
  )
  const [dexId, setDexId] = useState(
    () =>
      rememberedDex.get(group) ??
      dexes.find((d) => d.versionGroups.includes(group))?.pokedexId ??
      NATIONAL
  )
  const rows = useMemo(() => {
    const list =
      dexId === NATIONAL ? speciesForGeneration(g) : speciesForDex(dexId, g)
    // 같은 묶음의 다른 버전에서만 얻는 포켓몬은 뺀다
    const elsewhere = otherVersionSpecies(ctx.version)
    return list.filter((r) => !elsewhere.has(r.speciesId))
  }, [dexId, g, ctx.version])
  const warnings = useMemo(() => {
    const map = new Map<number, string>()
    if (!shuttle)
      for (const r of rows) {
        const w = warningText(t, warningFor(r.speciesId))
        if (w) map.set(r.speciesId, w)
      }
    return map
  }, [rows, shuttle, warningFor, t])
  const current = rows.find((r) => r.pokemonId === currentPokemonId) ?? null

  const chip = (id: number, label: string) => (
    <button
      key={id}
      type="button"
      className={styles.dexChip}
      aria-pressed={dexId === id}
      onClick={() => {
        setDexId(id)
        rememberedDex.set(group, id)
      }}
    >
      {label}
    </button>
  )

  return (
    <ListPicker<SpeciesRow>
      title={shuttle ? t("비전셔틀 고르기") : t("%1세대 포켓몬 고르기", g)}
      heading={t("포켓몬 고르기 · %1마리", rows.length)}
      rows={rows}
      rowKey={(r) => r.pokemonId}
      searchText={(r) => `${r.dexNumber} ${r.speciesId} ${allText(r.name)}`}
      current={current}
      rowHeight={44}
      rowTone={(r) => (warnings.has(r.speciesId) ? "warn" : undefined)}
      toolbar={
        dexes.length > 0 ? (
          <div className={styles.dexChips} role="group" aria-label={t("도감")}>
            {chip(NATIONAL, t("전국"))}
            {dexes.map((d) =>
              chip(
                d.pokedexId,
                text(dexLabel(d.identifier), lang) || text(d.region, lang)
              )
            )}
          </div>
        ) : null
      }
      columns={
        <div className={styles.pokemonRow}>
          <span>{t("No.")}</span>
          <span />
          <span>{t("이름")}</span>
          <span>{t("타입")}</span>
          <span className={styles.right}>{t("합계")}</span>
        </div>
      }
      renderRow={(r) => {
        const warning = warnings.get(r.speciesId)
        return (
          <div className={styles.pokemonRow}>
            <span className={styles.number}>
              {String(r.dexNumber).padStart(3, "0")}
            </span>
            <PokemonIcon pokemonId={r.pokemonId} alt="" box="search" />
            <span className={styles.nameCell}>
              <span className={styles.name}>{text(r.name, lang)}</span>
              {warning && <span className={styles.warning}>! {warning}</span>}
            </span>
            <span className={styles.types}>
              {r.types.map((type) => (
                <TypeChip key={type} type={type} size="sm" />
              ))}
            </span>
            <span className={styles.total}>{r.total}</span>
          </div>
        )
      }}
      onPick={(r) => {
        if (r) onPick(r.pokemonId)
        onClose()
      }}
      onClose={onClose}
    />
  )
}

function EffectLine({ parts }: { parts: readonly EffectSegment[] }) {
  return (
    <span className={styles.effect}>
      {parts.map((p, i) => (
        <span key={i} data-tone={p.tone}>
          {p.text}
        </span>
      ))}
    </span>
  )
}

export function MovePicker({
  ctx,
  detail,
  currentMoveId,
  onPick,
  onClose,
}: {
  ctx: SquadContext
  detail: PokemonDetail
  currentMoveId: number
  onPick: (moveId: number) => void
  onClose: () => void
}) {
  const t = useT()
  const lang = useNameLanguage()
  const rows = useMemo(() => {
    return learnableMoves(detail).map((row) => {
      const method = learnMethodText(t, row, ctx.versionGroup, lang)
      const effect =
        row.move.damageClass === 1
          ? describeMoveEffect(row.move, ctx.generation, detail.types, lang, t)
          : []
      return {
        row,
        method,
        effect,
        search: [
          allText(row.move.name),
          typeName(row.move.type, lang),
          method,
          effectPlainText(effect),
        ].join(" "),
      }
    })
  }, [detail, ctx.versionGroup, ctx.generation, lang, t])
  const current = rows.find((r) => r.row.move.moveId === currentMoveId) ?? null
  const num = (v: number) => (v > 0 ? String(v) : "—")

  return (
    <ListPicker
      title={t("%1의 기술 · %2개", text(detail.name, lang), rows.length)}
      rows={rows}
      rowKey={(r) => r.row.move.moveId}
      searchText={(r) => r.search}
      current={current}
      rowHeight={36}
      width={720}
      noneText={currentMoveId > 0 ? t("기술 비우기") : undefined}
      columns={
        <div className={styles.moveRow}>
          <span>{t("타입")}</span>
          <span>{t("기술")}</span>
          <span>{t("분류")}</span>
          <span className={styles.right}>{t("위력")}</span>
          <span className={styles.right}>{t("명중")}</span>
          <span className={styles.right}>{t("PP")}</span>
          <span className={styles.right}>{t("배우는 방법")}</span>
        </div>
      }
      renderRow={(r) => {
        const m = r.row.move
        return (
          <div className={styles.moveRow}>
            <span>{m.type && <TypeChip type={m.type} size="sm" />}</span>
            <span className={styles.nameCell}>
              <span className={styles.name}>{text(m.name, lang)}</span>
              {r.effect.length > 0 && <EffectLine parts={r.effect} />}
            </span>
            <span>
              <CategoryCell damageClass={m.damageClass} />
            </span>
            <span className={styles.stat}>{num(m.power)}</span>
            <span className={styles.stat}>{num(m.accuracy)}</span>
            <span className={styles.stat}>{m.pp}</span>
            <span className={styles.method} title={r.method}>
              {r.method}
            </span>
          </div>
        )
      }}
      onPick={(r) => {
        onPick(r ? r.row.move.moveId : 0)
        onClose()
      }}
      onClose={onClose}
    />
  )
}

export function ItemPicker({
  generation,
  currentItemId,
  onPick,
  onClose,
}: {
  generation: number
  currentItemId: number
  onPick: (itemId: number) => void
  onClose: () => void
}) {
  const t = useT()
  const lang = useNameLanguage()
  const rows = useMemo(
    () => heldItemCandidates(itemsIn(generation)),
    [generation]
  )
  const current = rows.find((r) => r.id === currentItemId) ?? null
  return (
    <ListPicker<ItemRow>
      title={t("지닌 물건 고르기 · %1개", rows.length)}
      rows={rows}
      rowKey={(r) => r.id}
      searchText={(r) => allText(r.name)}
      current={current}
      rowHeight={40}
      width={640}
      noneText={current ? t("물건 없음") : undefined}
      renderRow={(r) => (
        <div className={styles.itemRow}>
          <ItemIcon
            identifier={r.identifier}
            machineType={r.machineType || null}
            generation={generation}
            alt=""
          />
          <span className={styles.name}>{text(r.name, lang)}</span>
          <span className={styles.itemEffect}>{text(r.effect, lang)}</span>
        </div>
      )}
      onPick={(r) => {
        onPick(r ? r.id : 0)
        onClose()
      }}
      onClose={onClose}
    />
  )
}
