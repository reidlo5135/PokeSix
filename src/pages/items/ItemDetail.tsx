/**
 * 상세 창(파랑 머리) — ① 아이콘 · 분류 · 담긴 기술 · 첫 등장 · 가격 ② 세대별 존재 ③ 효과
 * ④ 진화 대상 ⑤ 입수처(이 화면의 게임 묶음 기준) ⑥ 배울 수 있는 포켓몬(기술머신만).
 * 진화 칩 · 포켓몬 칸을 누르면 도감 상세로 간다.
 */
import { useMemo } from "react"

import { Panel } from "../../components/Panel.tsx"
import { PokemonIcon, Sprite } from "../../components/Sprite.tsx"
import { TypeChip } from "../../components/TypeChip.tsx"
import {
  gameSpecies,
  machineLearners,
  otherVersionSpecies,
} from "../../data/repository/index.ts"
import {
  existsIn,
  introGeneration,
  type GameInfo,
  type ItemRow,
} from "../../data/repository/types.ts"
import { text } from "../../data/text/localizedText.ts"
import { ctx, useT, type TFunction } from "../../i18n/index.ts"
import { itemIconKey } from "../../shared/sprites.ts"
import { useDataVersion } from "../../state/data.ts"
import { useNameLanguage, useUiLanguage } from "../../state/settings.ts"
import {
  formatNumber,
  itemSources,
  type AcquisitionBook,
} from "./acquisition.ts"
import { DEX_STYLE, versionShort } from "./gameChips.ts"
import { findGroup, groupOf, ITEM_STYLE } from "./itemGroups.ts"
import { itemEvolutions, type ItemEvolutionRow } from "./itemsData.ts"
import {
  evolutionNoteParts,
  onlyIn,
  type EvolutionNoteParts,
} from "./itemView.ts"
import styles from "./Items.module.css"

const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export interface ItemDetailProps {
  item: ItemRow | null
  generation: number
  versionGroup: string
  game: GameInfo | undefined
  book: AcquisitionBook | null
  placeOf: (where: string) => string
  onOpenPokemon: (pokemonId: number) => void
}

interface Learner {
  pokemonId: number
  name: string
  note: string
}

function noteText(parts: EvolutionNoteParts, t: TFunction): string {
  const out: string[] = []
  if (parts.gender === "male") out.push(t("수컷"))
  if (parts.gender === "female") out.push(t("암컷"))
  if (parts.held === "trade") out.push(t("지니고 교환"))
  if (parts.held === "levelUp") out.push(t("지니고 레벨업"))
  if (parts.held === "other") out.push(t("지니고"))
  if (parts.versions.length > 0)
    out.push(t("%1 한정", parts.versions.join("/")))
  return out.join(" · ")
}

export function ItemDetail(props: ItemDetailProps) {
  const t = useT()
  const lang = useNameLanguage()
  const { item } = props
  return (
    <Panel
      as="aside"
      className={styles.detailPanel}
      aria-label={t("선택한 아이템 상세")}
      header={{
        title: item ? text(item.name, lang) : t(ctx("상세", "Items")),
        tone: "blue",
      }}
      bodyClassName={styles.detailBody}
    >
      {item ? (
        <DetailBody {...props} item={item} />
      ) : (
        <p className={styles.detailEmpty}>
          {t("목록에서 아이템을 고르면\n여기에 자세히 보여요")}
        </p>
      )}
    </Panel>
  )
}

function DetailBody({
  item,
  generation,
  versionGroup,
  game,
  book,
  placeOf,
  onOpenPokemon,
}: ItemDetailProps & { item: ItemRow }) {
  const t = useT()
  const lang = useNameLanguage()
  const uiLang = useUiLanguage()
  const dataVersion = useDataVersion()
  const itemId = item.id
  const identifier = item.identifier
  const isMachine = item.pocket === "machines"

  // 그 게임에서 만나는 종만(빈 집합 = 모른다 → 거르지 않음), 버전 한정은 표시
  const { evolutions, learners } = useMemo(() => {
    void dataVersion
    const inGame = gameSpecies(versionGroup)
    const meets = (speciesId: number) =>
      inGame.size === 0 || inGame.has(speciesId)
    const shortsOf = (speciesId: number) =>
      onlyIn(game, speciesId, otherVersionSpecies).map((v) =>
        versionShort(DEX_STYLE, v)
      )
    const evolutions = itemEvolutions(itemId, generation)
      .filter((e) => meets(e.speciesId))
      .map((e) => ({ evolution: e, shorts: shortsOf(e.speciesId) }))
    const learners = isMachine
      ? machineLearners(identifier, versionGroup)
          .filter((s) => meets(s.speciesId))
          .map((s) => ({ species: s, shorts: shortsOf(s.speciesId) }))
      : []
    return { evolutions, learners }
  }, [
    itemId,
    identifier,
    isMachine,
    generation,
    versionGroup,
    game,
    dataVersion,
  ])

  const learnerCells: Learner[] = learners.map(({ species, shorts }) => {
    const names = shorts.filter((s) => s !== "")
    return {
      pokemonId: species.pokemonId,
      name: text(species.name, lang),
      note: names.length > 0 ? t("%1 한정", names.join("/")) : "",
    }
  })

  const places = itemSources(book, identifier, {
    language: lang,
    t,
    placeOf,
    shortOf: (v) => versionShort(DEX_STYLE, v),
  })

  const group = findGroup(
    ITEM_STYLE,
    groupOf(ITEM_STYLE, item.category, item.pocket)
  )
  const intro = introGeneration(item)
  const name = text(item.name, lang)
  const effect = text(item.effect, lang)
  const move = text(item.machineMove, lang)

  return (
    <>
      <div className={styles.detailHead}>
        <Sprite
          kind="item"
          spriteKey={itemIconKey(identifier, item.machineType, generation)}
          alt={name}
          box="itemDetail"
          pixelated
          className={styles.detailIcon}
        />
        <div className={styles.detailFacts}>
          {group && group.key !== "all" && (
            <span
              className={styles.groupPill}
              style={{ background: group.color, color: group.textColor }}
            >
              {text(group.label, uiLang)}
            </span>
          )}
          {move !== "" && (
            <span className={styles.detailMove}>
              {item.machineType !== "" && (
                <TypeChip type={item.machineType} size="sm" />
              )}
              <span>{move}</span>
            </span>
          )}
          {intro > 0 && (
            <span className={styles.detailIntro}>
              {t("%1세대에 처음 등장", intro)}
            </span>
          )}
          <span className={styles.detailPrice}>
            {item.cost > 0 ? t("%1원", formatNumber(item.cost)) : t("비매품")}
          </span>
        </div>
      </div>

      <section className={styles.section} data-gap="8">
        <h3 className={styles.sectionTitle}>{t("세대별 존재")}</h3>
        <div className={styles.genBars}>
          {GENERATIONS.map((g) => (
            <span key={g} className={styles.genBarCol}>
              <span
                className={styles.genBar}
                data-present={existsIn(item, g) ? "" : undefined}
                data-current={g === generation ? "" : undefined}
                aria-label={
                  existsIn(item, g)
                    ? t("%1세대에 있어요", g)
                    : t("%1세대에 없어요", g)
                }
              />
              <span
                className={styles.genBarNumber}
                data-current={g === generation ? "" : undefined}
              >
                {g}
              </span>
            </span>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t(ctx("효과", "Items"))}</h3>
        <p className={styles.effectBox}>
          {effect !== "" ? effect : t("효과 설명이 없어요")}
        </p>
      </section>

      {evolutions.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t("진화 대상")}</h3>
          <div className={styles.evoGrid}>
            {evolutions.map(({ evolution, shorts }) => (
              <EvolutionLine
                key={`${evolution.speciesId}-${evolution.held ? 1 : 0}`}
                evolution={evolution}
                note={noteText(
                  evolutionNoteParts(
                    evolution.held,
                    evolution.gender,
                    evolution.trigger,
                    shorts
                  ),
                  t
                )}
                onOpenPokemon={onOpenPokemon}
              />
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          {t("입수처 · %1세대", generation)}
        </h3>
        {places.length > 0 ? (
          <ul className={styles.places}>
            {places.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.placesEmpty}>
            {t("이 게임의 입수 정보가 아직 없어요")}
          </p>
        )}
      </section>

      {isMachine && learnerCells.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            {t("배울 수 있는 포켓몬 · %1마리", learnerCells.length)}
          </h3>
          <div className={styles.learners}>
            {learnerCells.map((l) => {
              const tip = l.note ? `${l.name} (${l.note})` : l.name
              return (
                <button
                  key={l.pokemonId}
                  type="button"
                  className={styles.learner}
                  data-limited={l.note ? "" : undefined}
                  title={tip}
                  aria-label={tip}
                  onClick={() => onOpenPokemon(l.pokemonId)}
                >
                  <PokemonIcon pokemonId={l.pokemonId} alt="" box="search" />
                </button>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}

function EvolutionLine({
  evolution,
  note,
  onOpenPokemon,
}: {
  evolution: ItemEvolutionRow
  note: string
  onOpenPokemon: (pokemonId: number) => void
}) {
  const lang = useNameLanguage()
  const from = text(evolution.from, lang)
  const to = text(evolution.to, lang)
  // 보조 글자는 전 칩에(전이 없으면 후 칩에)
  const hasFrom = from !== "" && evolution.fromPokemonId > 0
  return (
    <>
      {hasFrom ? (
        <EvolutionChip
          pokemonId={evolution.fromPokemonId}
          name={from}
          note={note}
          onOpen={onOpenPokemon}
        />
      ) : (
        <span />
      )}
      <svg
        className={styles.evoArrow}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
      <EvolutionChip
        pokemonId={evolution.toPokemonId}
        name={to}
        note={hasFrom ? "" : note}
        target
        onOpen={onOpenPokemon}
      />
    </>
  )
}

function EvolutionChip({
  pokemonId,
  name,
  note,
  target = false,
  onOpen,
}: {
  pokemonId: number
  name: string
  note: string
  target?: boolean
  onOpen: (pokemonId: number) => void
}) {
  const full = note ? `${name} ${note}` : name
  return (
    <button
      type="button"
      className={styles.evoChip}
      data-target={target ? "" : undefined}
      title={full}
      disabled={pokemonId <= 0}
      onClick={() => onOpen(pokemonId)}
    >
      {pokemonId > 0 && (
        <PokemonIcon pokemonId={pokemonId} alt="" box="search" />
      )}
      <span className={styles.evoName}>{name}</span>
      {note && <span className={styles.evoNote}>{note}</span>}
    </button>
  )
}
