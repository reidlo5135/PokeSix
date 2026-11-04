/**
 * 상세 아래 탭: 레벨업 · 기술머신 · 교배 · (있으면) 가르침 · 획득법.
 * 기술 표는 고른 게임의 묶음 기준. 두 번째 줄 = 변화 기술 효과 · 기술머신 입수처 · 가르침 비용.
 */
import type { CSSProperties, ReactNode } from "react"

import {
  CategoryCell,
  ItemIcon,
  PokemonIcon,
  SubTabs,
  TypeChip,
  type TabItem,
} from "../../../components/index.ts"
import { tabId, tabPanelId } from "../../../components/logic.ts"
import type {
  EvolutionStep,
  MoveEntry,
  PokemonDetail,
} from "../../../data/repository/types.ts"
import { STATUS_CLASS } from "../../../data/repository/rules.ts"
import {
  emptyText,
  text,
  type Language,
} from "../../../data/text/localizedText.ts"
import { useT, type TFunction } from "../../../i18n/index.ts"
import { typeName } from "../../../shared/pokemonTypes.ts"
import { useNameLanguage } from "../../../state/settings.ts"
import {
  groupHasLearnsets,
  speciesIdentifier,
  versionHasEncounters,
  versionNames,
} from "../model/dexData.ts"
import { VersionBadge } from "../GameChips.tsx"
import { versionStyle } from "../model/dexstyle.ts"
import { encounterView } from "../model/encounters.ts"
import { conditionsOf, hasPreEvolution, itemLines } from "../model/evolution.ts"
import {
  itemSources,
  pokemonSources,
  tutorCost,
  type GameBook,
} from "../model/guidebook.ts"
import {
  describeMove,
  effectTooltip,
  type EffectPart,
} from "../model/moveEffect.ts"
import {
  accuracyText,
  firstCell,
  isStab,
  powerText,
  ppText,
  reminderTooltip,
  VARIABLE_POWER,
  type MoveTab,
} from "../model/moveTable.ts"
import { useDataMemo } from "../model/useDataMemo.ts"
import { useGameBook } from "../model/useGameBook.ts"
import styles from "./Detail.module.css"

const ID_PREFIX = "dex-detail"

export interface MoveTabsProps {
  detail: PokemonDetail
  generation: number
  version: string
  versionGroup: string
  drawer: boolean
  tab: MoveTab
  onTab: (tab: MoveTab) => void
  onSelectPokemon?: (pokemonId: number) => void
}

export function MoveTabs(props: MoveTabsProps) {
  const t = useT()
  const lang = useNameLanguage()
  const { detail, version, versionGroup, drawer, onTab } = props
  const book = useGameBook(versionGroup)
  const names = useDataMemo(() => versionNames(), [])
  const versionName = (v: string): string =>
    text(names.get(v) ?? emptyText(), lang) || v

  const tabs: TabItem<MoveTab>[] = [
    { id: "level", label: t("레벨업") },
    { id: "machine", label: t("기술머신") },
    { id: "egg", label: t("교배") },
  ]
  if (detail.tutorMoves.length > 0)
    tabs.push({ id: "tutor", label: t("가르침") })
  tabs.push({ id: "acquisition", label: t("획득법") })
  // 가르침이 없는 포켓몬으로 넘어오면 레벨업으로 보인다(고른 탭은 그대로 둔다)
  const tab = tabs.some((x) => x.id === props.tab) ? props.tab : "level"
  const style = versionStyle(version, versionName(version))

  return (
    <section className={styles.section}>
      <div className={styles.tabRow}>
        <SubTabs
          tabs={tabs}
          selected={tab}
          onSelect={onTab}
          ariaLabel={drawer ? t("더 보기") : t("습득 기술")}
          idPrefix={ID_PREFIX}
          className={styles.tabList}
        />
        <span className={styles.basis}>
          <VersionBadge
            style={style}
            size="inline"
            title={versionName(version)}
          />
          {t("기준")}
        </span>
      </div>
      <div
        role="tabpanel"
        id={tabPanelId(ID_PREFIX, tab)}
        aria-labelledby={tabId(ID_PREFIX, tab)}
        className={styles.tabPanel}
      >
        {tab === "acquisition" ? (
          <Acquisition
            {...props}
            book={book}
            language={lang}
            versionName={versionName}
          />
        ) : (
          <MoveTable {...props} tab={tab} book={book} language={lang} />
        )}
      </div>
    </section>
  )
}

// ── 기술 표 ──────────────────────────────────────────────

function movesOf(detail: PokemonDetail, tab: MoveTab): MoveEntry[] {
  switch (tab) {
    case "level":
      return detail.levelMoves
    case "machine":
      return detail.machineMoves
    case "egg":
      return detail.eggMoves
    case "tutor":
      return detail.tutorMoves
    default:
      return []
  }
}

function MoveTable({
  detail,
  generation: g,
  version,
  versionGroup,
  tab,
  book,
  language,
}: MoveTabsProps & { book: GameBook | undefined; language: Language }) {
  const t = useT()
  const moves = movesOf(detail, tab)
  const inherited = tab === "level" ? detail.inheritedMoves : []
  const numbered = tab === "level" || tab === "machine"

  if (moves.length === 0 && inherited.length === 0)
    return (
      <p className={styles.emptyText}>
        {groupHasLearnsets(versionGroup)
          ? t("이 게임에서는 배울 수 없어요")
          : t("이 게임의 기술 데이터가 아직 없어요")}
      </p>
    )

  const row = (move: MoveEntry, key: string) => (
    <MoveRow
      key={key}
      move={move}
      tab={tab}
      numbered={numbered}
      generation={g}
      version={version}
      detail={detail}
      book={book}
      language={language}
      t={t}
    />
  )
  const stab = detail.types.map((type) => typeName(type, language))

  return (
    <div className={styles.moveTable} data-numbered={numbered ? "" : undefined}>
      <div className={styles.moveHead} role="presentation">
        {numbered && <span>{tab === "level" ? t("Lv") : t("번호")}</span>}
        <span>{t("기술")}</span>
        <span>{t("타입")}</span>
        <span>{t("분류")}</span>
        <span className={styles.num}>{t("위력")}</span>
        <span className={styles.num}>{t("명중")}</span>
        <span className={styles.num}>{t("PP")}</span>
      </div>
      {moves.map((m, i) => row(m, `${m.moveId}-${i}`))}
      {inherited.length > 0 && (
        <>
          <div className={styles.moveSub}>
            {t("진화 전 단계에서 배우는 기술")}
          </div>
          {inherited.map((m, i) => row(m, `from-${m.moveId}-${i}`))}
        </>
      )}
      <p className={styles.blockCaption}>
        {t("빨간 위력 = 자속 보정 (%1)", stab.join(" · "))}
      </p>
    </div>
  )
}

const TONE_CLASS: Record<EffectPart["tone"], string | undefined> = {
  text1: styles.toneText1,
  text2: styles.toneText2,
  text3: styles.toneText3,
  up: styles.toneUp,
  down: styles.toneDown,
  heal: styles.toneHeal,
}

function MoveRow({
  move,
  tab,
  numbered,
  generation: g,
  version,
  detail,
  book,
  language,
  t,
}: {
  move: MoveEntry
  tab: MoveTab
  numbered: boolean
  generation: number
  version: string
  detail: PokemonDetail
  book: GameBook | undefined
  language: Language
  t: TFunction
}) {
  const name = text(move.name, language)
  const stab = isStab(move, detail.types)
  const isStatus = move.damageClass === STATUS_CLASS
  const effect = isStatus
    ? describeMove(move, g, detail.types, language, t)
    : []

  // 두 번째 줄들
  const extra: { key: string; node: ReactNode; title: string }[] = []
  if (effect.length > 0)
    extra.push({
      key: "effect",
      title: effectTooltip(effect, move, language),
      node: effect.map((p, i) => (
        <span key={i} className={TONE_CLASS[p.tone]}>
          {p.text}
        </span>
      )),
    })
  if (tab === "machine") {
    const sources = itemSources(book, move.machineItem, language, t, version)
    extra.push(
      sources.length > 0
        ? {
            key: "source",
            title: sources.join("\n"),
            node: (
              <span className={styles.toneText2}>{sources.join(" / ")}</span>
            ),
          }
        : {
            key: "source",
            title: "",
            node: (
              <span className={styles.toneDisabled}>
                {t("획득처 정보 없음")}
              </span>
            ),
          }
    )
  }
  if (tab === "tutor") {
    const cost = tutorCost(book, move.identifier, language, t)
    extra.push({
      key: "cost",
      title: cost,
      node: cost ? (
        <span className={styles.toneText2}>{cost}</span>
      ) : (
        <span className={styles.toneDisabled}>—</span>
      ),
    })
  }

  return (
    <div className={styles.moveRow}>
      <div className={styles.moveMain}>
        {numbered && (
          <span className={styles.moveFirst}>
            {firstCell(move, tab, t)}
            {move.needsReminder && (
              <span
                className={styles.reminder}
                title={reminderTooltip(detail.earliestLevel, t)}
              >
                <ItemIcon
                  identifier="heart-scale"
                  generation={g}
                  alt={t("하트비늘")}
                />
              </span>
            )}
          </span>
        )}
        <span className={styles.moveName} title={name}>
          {name}
          {move.fromPokemonId > 0 && (
            <span className={styles.moveFrom}>
              {` · ${text(move.fromName, language)}`}
            </span>
          )}
        </span>
        <span>
          {move.type !== "" && <TypeChip type={move.type} size="move" />}
        </span>
        <span>
          <CategoryCell damageClass={move.damageClass} />
        </span>
        <span
          className={styles.num}
          data-tone={
            stab ? "stab" : move.power === VARIABLE_POWER ? "muted" : undefined
          }
        >
          {powerText(move, t)}
        </span>
        <span className={styles.numSoft}>{accuracyText(move)}</span>
        <span className={styles.numSoft}>{ppText(move)}</span>
      </div>
      {extra.map((x) => (
        <div key={x.key} className={styles.moveExtra} title={x.title}>
          {x.node}
        </div>
      ))}
    </div>
  )
}

// ── 획득법: 진화 + 야생 출현 ───────────────────────────────

function Acquisition({
  detail,
  version,
  book,
  language,
  versionName,
  onSelectPokemon,
}: MoveTabsProps & {
  book: GameBook | undefined
  language: Language
  versionName: (version: string) => string
}) {
  const t = useT()
  const hasData = useDataMemo(() => versionHasEncounters(version), [version])
  const identifier = useDataMemo(
    () => speciesIdentifier(detail.speciesId),
    [detail.speciesId]
  )
  const view = encounterView({
    encounters: detail.encounters,
    version,
    groupVersions: detail.groupVersions,
    bookLines: pokemonSources(book, identifier),
    hasPreEvolution: hasPreEvolution(detail.evolution, detail.speciesId),
    versionHasData: hasData,
    versionName,
    language,
    t,
  })
  const style = versionStyle(version, versionName(version))
  const showEvolution =
    new Set(detail.evolution.map((s) => s.speciesId)).size >= 2

  return (
    <div className={styles.acquisition}>
      {showEvolution && (
        <div className={styles.block}>
          <h4 className={styles.subTitle}>{t("진화")}</h4>
          <div className={styles.evolution}>
            {detail.evolution.map((step) => (
              <EvolutionRow
                key={`${step.fromSpeciesId}-${step.speciesId}`}
                step={step}
                current={step.speciesId === detail.speciesId}
                book={book}
                version={version}
                language={language}
                t={t}
                onSelect={onSelectPokemon}
              />
            ))}
          </div>
        </div>
      )}
      <div className={styles.block}>
        <h4 className={styles.subTitle}>{t("야생 출현")}</h4>
        {view.lines.length > 0 ? (
          <div className={styles.encounters}>
            {view.lines.map((line) => (
              <div
                key={line.key}
                className={styles.encounterRow}
                title={line.note || undefined}
              >
                <VersionBadge style={style} />
                <span className={styles.encounterPlace}>
                  {line.place}
                  {line.note && (
                    <span
                      className={styles.encounterNote}
                    >{` · ${line.note}`}</span>
                  )}
                </span>
                <span className={styles.encounterMethod}>{line.method}</span>
                <span className={styles.encounterLevel}>{line.level}</span>
                <span className={styles.encounterRate}>{line.rate}</span>
              </div>
            ))}
          </div>
        ) : (
          view.notice && (
            <p
              className={styles.emptyText}
              title={view.notice.detail || undefined}
            >
              {view.notice.text}
              {view.notice.detail && (
                <span className={styles.noticeDetail}>
                  {view.notice.detail}
                </span>
              )}
            </p>
          )
        )}
      </div>
    </div>
  )
}

function EvolutionRow({
  step,
  current,
  book,
  version,
  language,
  t,
  onSelect,
}: {
  step: EvolutionStep
  current: boolean
  book: GameBook | undefined
  version: string
  language: Language
  t: TFunction
  onSelect?: (pokemonId: number) => void
}) {
  const name = text(step.name, language)
  const conditions = step.depth > 0 ? conditionsOf(step, language, t) : ""
  const items =
    step.depth > 0 ? itemLines(step, book, version, language, t) : []
  const tooltip = [conditions.replaceAll(" / ", "\n"), ...items]
    .filter(Boolean)
    .join("\n")
  const content = (
    <>
      <span className={styles.evolutionMain}>
        <PokemonIcon pokemonId={step.pokemonId} alt={name} box="search" />
        <span className={styles.evolutionName}>{name}</span>
        <span className={styles.evolutionCondition}>{conditions}</span>
      </span>
      {items.map((line) => (
        <span key={line} className={styles.evolutionItem}>
          {line}
        </span>
      ))}
    </>
  )
  const indent = { "--depth": step.depth } as CSSProperties
  if (current || !onSelect)
    return (
      <div
        className={styles.evolutionRow}
        data-current={current ? "" : undefined}
        data-nested={step.depth > 0 ? "" : undefined}
        style={indent}
        title={tooltip || undefined}
      >
        {content}
      </div>
    )
  return (
    <button
      type="button"
      className={styles.evolutionRow}
      data-nested={step.depth > 0 ? "" : undefined}
      style={indent}
      title={tooltip || undefined}
      onClick={() => onSelect(step.pokemonId)}
    >
      {content}
    </button>
  )
}
