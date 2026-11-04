/**
 * 포켓몬 상세(도감 오른쪽 창 420 · 좁은 화면 드로어 380 · 스쿼드 모달이 다시 쓴다).
 * 머리(첫 타입 색) · 개요 · 종족값(+ 성격) · 특성 · 방어/공격 상성 · 습득 기술 탭 · 획득법.
 * 성격 · 탭은 이 컴포넌트가 들고 있어 다른 포켓몬을 봐도 그대로 남는다.
 */
import { useState } from "react"

import {
  Button,
  IconButton,
  PokemonFront,
  TypeChip,
} from "../../../components/index.ts"
import { Icon } from "../../../components/Icon.tsx"
import {
  gamesForGeneration,
  pokemonDetail,
  representativeVersionGroup,
  typeChart,
  versionGroupOf,
  type PokemonDetail,
  type TypeChart,
} from "../../../data/repository/index.ts"
import { text, type Language } from "../../../data/text/localizedText.ts"
import { useT } from "../../../i18n/index.ts"
import { regionOf, type Generation } from "../../../shared/generations.ts"
import { useNameLanguage } from "../../../state/settings.ts"
import { introGenerationOf } from "../model/dexData.ts"
import { padNumber } from "../model/dexList.ts"
import { evolutionStages } from "../model/evolution.ts"
import type { MoveTab } from "../model/moveTable.ts"
import { useDataMemo } from "../model/useDataMemo.ts"
import { AbilityBlock } from "./AbilityBlock.tsx"
import { MatchupBlock } from "./MatchupBlock.tsx"
import { MoveTabs } from "./MoveTabs.tsx"
import { StatsBlock } from "./StatsBlock.tsx"
import styles from "./Detail.module.css"

export type DetailVariant = "pane" | "drawer" | "modal"

export interface DexDetailProps {
  /** 보여 줄 포켓몬(모습 id). null = 고르지 않음 */
  pokemonId: number | null
  generation: number
  /** 기준 게임(버전). 그 세대 게임이 아니면 대표 게임 */
  version: string
  variant: DetailVariant
  /** 진화 줄을 눌렀을 때 */
  onSelectPokemon?: (pokemonId: number) => void
  /** 없으면 스쿼드 버튼을 숨긴다 */
  onAddToSquad?: (pokemonId: number, name: string) => void
  /** 드로어 × · 모달 닫기 */
  onClose?: () => void
  /** 지방 도감을 보고 있으면 그 도감 번호 줄 */
  regional?: { label: string; number: number }
  /** 스쿼드 모달: 세이브에서 온 실제 능력치(그 포켓몬을 볼 때만) */
  trainedStats?: { pokemonId: number; stats: readonly number[] }
  /** 스쿼드 모달: 미리 고를 성격 */
  presetNatureId?: number
}

export function DexDetail(props: DexDetailProps) {
  const t = useT()
  const lang = useNameLanguage()
  const { pokemonId, generation: g, version, variant } = props

  const games = useDataMemo(() => gamesForGeneration(g), [g])
  const versionGroup =
    versionGroupOf(games, version) || representativeVersionGroup(g)
  const detail = useDataMemo(
    () =>
      pokemonId !== null ? pokemonDetail(pokemonId, g, versionGroup) : null,
    [pokemonId, g, versionGroup]
  )
  // 성격 · 탭: 다른 포켓몬을 보거나 잠깐 비어도 남는다
  const [natureId, setNatureId] = useState(props.presetNatureId ?? 0)
  const [tab, setTab] = useState<MoveTab>("level")
  const label =
    variant === "drawer"
      ? t("선택한 포켓몬 상세 (드로어)")
      : t("선택한 포켓몬 상세")

  if (!detail || detail.pokemonId <= 0 || detail.types.length === 0) {
    const missing =
      detail && detail.pokemonId > 0 && detail.types.length === 0
        ? t(
            "%1은(는) %2세대부터 나와요",
            text(detail.name, lang),
            introGenerationOf(detail.speciesId)
          )
        : t("목록에서 포켓몬을 고르면 여기에 자세히 보여요")
    return (
      <aside
        className={styles.detail}
        data-variant={variant}
        aria-label={label}
      >
        <div className={styles.head} data-tone="empty">
          <span className={styles.headSpacer} />
          {props.onClose && <CloseButton onClose={props.onClose} />}
        </div>
        <div className={styles.emptyBody}>{missing}</div>
      </aside>
    )
  }

  return (
    <DetailBody
      {...props}
      detail={detail}
      versionGroup={versionGroup}
      label={label}
      language={lang}
      natureId={natureId}
      onNature={setNatureId}
      tab={tab}
      onTab={setTab}
    />
  )
}

function CloseButton({ onClose }: { onClose: () => void }) {
  const t = useT()
  return (
    <IconButton
      label={t("상세 닫기 (Esc)")}
      icon={<Icon name="close" size={14} strokeWidth={3} />}
      className={styles.close}
      onClick={onClose}
    />
  )
}

function DetailBody({
  detail,
  versionGroup,
  label,
  language: lang,
  generation: g,
  version,
  variant,
  onSelectPokemon,
  onAddToSquad,
  onClose,
  regional,
  trainedStats,
  natureId,
  onNature,
  tab,
  onTab,
}: DexDetailProps & {
  detail: PokemonDetail
  versionGroup: string
  label: string
  language: Language
  natureId: number
  onNature: (natureId: number) => void
  tab: MoveTab
  onTab: (tab: MoveTab) => void
}) {
  const t = useT()
  // 상성표: 그 세대 + (없는 타입 계산용) 처음 나온 세대
  const chart = useDataMemo(() => typeChart(g), [g])
  const chartOf = useDataMemo(() => {
    const charts = new Map<number, TypeChart>()
    return (generation: number): TypeChart => {
      let c = charts.get(generation)
      if (!c) {
        c = typeChart(generation)
        charts.set(generation, c)
      }
      return c
    }
  }, [])
  const name = text(detail.name, lang)
  const first = detail.types[0]
  const drawer = variant === "drawer"
  const trained =
    trainedStats && trainedStats.pokemonId === detail.pokemonId
      ? trainedStats.stats
      : undefined

  const add = onAddToSquad
    ? () => onAddToSquad(detail.pokemonId, name)
    : undefined

  return (
    <aside className={styles.detail} data-variant={variant} aria-label={label}>
      <div
        className={styles.head}
        style={{
          background: `var(--type-${first})`,
          color: `var(--type-${first}-text)`,
        }}
      >
        <span className={styles.headNumber}>
          {`No.${padNumber(detail.speciesId)}`}
        </span>
        <h2 className={styles.headName}>{name}</h2>
        <span className={styles.headSpacer} />
        {!drawer && add && (
          <button type="button" className={styles.addButton} onClick={add}>
            <Icon name="plus" size={13} strokeWidth={3} />
            {t("스쿼드에")}
          </button>
        )}
        {(drawer || variant === "modal") && onClose && (
          <CloseButton onClose={onClose} />
        )}
      </div>
      <div className={styles.body}>
        <Overview
          detail={detail}
          generation={g}
          language={lang}
          drawer={drawer}
          regional={regional}
          onAdd={drawer ? add : undefined}
          onSelectPokemon={onSelectPokemon}
        />
        <StatsBlock
          detail={detail}
          generation={g}
          natureId={natureId}
          onNature={onNature}
          trained={trained}
        />
        <AbilityBlock detail={detail} generation={g} />
        <MatchupBlock
          types={detail.types}
          generation={g}
          chart={chart}
          chartOf={chartOf}
          compact={drawer}
        />
        <MoveTabs
          detail={detail}
          generation={g}
          version={version}
          versionGroup={versionGroup}
          drawer={drawer}
          tab={tab}
          onTab={onTab}
          onSelectPokemon={onSelectPokemon}
        />
      </div>
    </aside>
  )
}

function Overview({
  detail,
  generation: g,
  language: lang,
  drawer,
  regional,
  onAdd,
  onSelectPokemon,
}: {
  detail: PokemonDetail
  generation: number
  language: Language
  drawer: boolean
  regional?: { label: string; number: number }
  onAdd?: () => void
  onSelectPokemon?: (pokemonId: number) => void
}) {
  const t = useT()
  const name = text(detail.name, lang)
  const introGen = introGenerationOf(detail.speciesId) || g
  const region = text(regionOf(introGen as Generation), lang)
  const stages = evolutionStages(detail.evolution)
  const otherNames = (["ko", "ja", "en"] as const)
    .filter((l) => l !== lang)
    .map((l) => detail.name[l])
    .filter((n) => n !== "" && n !== name)
  const genus = text(detail.genus, lang)
  const size = t(
    "%1 m · %2 kg",
    (detail.height / 10).toFixed(1),
    (detail.weight / 10).toFixed(1)
  )

  return (
    <div className={styles.overview}>
      <PokemonFront
        generation={g}
        pokemonId={detail.pokemonId}
        alt={name}
        box={drawer ? "drawer" : "detail"}
      />
      <div className={styles.overviewText}>
        <div className={styles.typeRow}>
          {detail.types.map((type) => (
            <TypeChip key={type} type={type} size="md" />
          ))}
        </div>
        {onAdd && (
          <Button
            variant="accent"
            size="XS"
            className={styles.drawerAdd}
            onClick={onAdd}
          >
            {t("스쿼드에 추가")}
          </Button>
        )}
        <p className={styles.line}>{genus ? `${genus} · ${size}` : size}</p>
        <p className={styles.line}>
          {regional
            ? t(
                "%1 도감 No.%2 · %3세대 첫 등장",
                regional.label,
                padNumber(regional.number),
                introGen
              )
            : t("%1 도감 · %2세대 첫 등장", region, introGen)}
        </p>
        {stages.length >= 2 && (
          <p className={styles.line}>
            {t("진화:")}{" "}
            {stages.map((stage, depth) => (
              <span key={depth}>
                {depth > 0 && " → "}
                {stage.map((step, i) => (
                  <span key={step.speciesId}>
                    {i > 0 && " · "}
                    {step.speciesId === detail.speciesId ? (
                      <b className={styles.current}>{text(step.name, lang)}</b>
                    ) : (
                      <button
                        type="button"
                        className={styles.link}
                        onClick={() => onSelectPokemon?.(step.pokemonId)}
                      >
                        {text(step.name, lang)}
                      </button>
                    )}
                  </span>
                ))}
              </span>
            ))}
          </p>
        )}
        {otherNames.length > 0 && (
          <p className={styles.lineSoft}>{otherNames.join(" · ")}</p>
        )}
      </div>
    </div>
  )
}
