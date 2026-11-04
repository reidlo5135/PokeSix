/**
 * 오른쪽 상세 패널 — 고른 장소의 [야생] · [아이템] · [랜드마크]. 노드에 하위 장소(also)가 있으면
 * 그 장소들도 이름 소제목으로 이어 보인다.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { useNavigate } from "react-router-dom"

import { ItemIcon, PokemonIcon } from "../../components/Sprite.tsx"
import { Panel } from "../../components/Panel.tsx"
import { encountersAt, existsIn } from "../../data/repository/index.ts"
import { text, type Language } from "../../data/text/localizedText.ts"
import { methodName } from "../../data/text/places.ts"
import { tKey, useT } from "../../i18n/index.ts"
import { displayNameOf } from "../../shared/text.ts"
import {
  groupItemsHere,
  itemsAt,
  loadAcquisitionBook,
  pokemonAt,
  sourceTextHere,
  type AcquisitionBook,
} from "./acquisition.ts"
import { landmarksAt } from "./townmapBook.ts"
import { itemRowsFor, speciesByIdentifier } from "./townmapData.ts"
import { spotInfo, wildGroups, type WildGroup } from "./wild.ts"
import styles from "./TownMap.module.css"

export type InfoTab = "wild" | "items" | "landmarks"

const TABS: readonly { id: InfoTab; label: string }[] = [
  { id: "wild", label: tKey("야생") },
  { id: "items", label: tKey("아이템") },
  { id: "landmarks", label: tKey("랜드마크") },
]

interface BookState {
  versionGroup: string
  book: AcquisitionBook | null
  done: boolean
}

/** 게임 묶음의 입수 사전(처음 한 번 비동기로 읽는다) */
function useAcquisitionBook(versionGroup: string): BookState {
  const [state, setState] = useState<BookState>({
    versionGroup: "",
    book: null,
    done: false,
  })
  useEffect(() => {
    let alive = true
    void loadAcquisitionBook(versionGroup).then((book) => {
      if (alive) setState({ versionGroup, book, done: true })
    })
    return () => {
      alive = false
    }
  }, [versionGroup])
  return state.versionGroup === versionGroup
    ? state
    : { versionGroup, book: null, done: false }
}

export interface DetailPanelProps {
  /** [고른 장소, ...하위 장소]. 비면 안내 */
  locations: readonly string[]
  placeOf: (location: string) => string
  tab: InfoTab
  onTab: (tab: InfoTab) => void
  generation: number
  version: string
  versionGroup: string
  language: Language
  showOriginal: boolean
  dataVersion: number
}

export function DetailPanel(props: DetailPanelProps) {
  const { locations, placeOf, tab, onTab } = props
  const t = useT()
  const main = locations[0] ?? ""
  return (
    <Panel
      as="aside"
      className={styles.detailPanel}
      bodyClassName={styles.detailBody}
      header={{
        title: main === "" ? t("장소") : placeOf(main),
        tone: "blue",
        right: <InfoTabs tab={tab} onTab={onTab} />,
      }}
    >
      {main === "" ? (
        <p className={styles.detailEmpty}>
          {t("지도에서 장소를 고르면\n그 게임의 야생 출현이 보여요")}
        </p>
      ) : (
        <div
          className={styles.detailScroll}
          role="tabpanel"
          id={`townmap-panel-${tab}`}
          aria-labelledby={`townmap-tab-${tab}`}
        >
          {tab === "wild" && <WildList {...props} />}
          {tab === "items" && <ItemList {...props} />}
          {tab === "landmarks" && <LandmarkList {...props} />}
        </div>
      )}
    </Panel>
  )
}

/** 머리 띠 안 작은 탭(Qt #mapInfoTab) */
function InfoTabs({
  tab,
  onTab,
}: {
  tab: InfoTab
  onTab: (tab: InfoTab) => void
}) {
  const t = useT()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const pos = TABS.findIndex((x) => x.id === tab)
    let next = -1
    if (e.key === "ArrowRight") next = (pos + 1) % TABS.length
    else if (e.key === "ArrowLeft") next = (pos - 1 + TABS.length) % TABS.length
    if (next < 0) return
    e.preventDefault()
    onTab(TABS[next].id)
    refs.current[next]?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label={t("장소 정보")}
      className={styles.infoTabs}
      onKeyDown={onKeyDown}
    >
      {TABS.map((x, i) => (
        <button
          key={x.id}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="tab"
          id={`townmap-tab-${x.id}`}
          aria-selected={x.id === tab}
          aria-controls={`townmap-panel-${x.id}`}
          tabIndex={x.id === tab ? 0 : -1}
          className={styles.infoTab}
          onClick={() => onTab(x.id)}
        >
          {t(x.label)}
        </button>
      ))}
    </div>
  )
}

/** 하위 장소 묶음 머리(첫 장소는 패널 제목이 대신한다) */
function Section({
  heading,
  children,
}: {
  heading: string
  children: ReactNode
}) {
  return (
    <section className={styles.section}>
      {heading !== "" && <h3 className={styles.placeHeading}>{heading}</h3>}
      {children}
    </section>
  )
}

function WildList({
  locations,
  placeOf,
  version,
  versionGroup,
  language,
  showOriginal,
  dataVersion,
}: DetailPanelProps) {
  const t = useT()
  const navigate = useNavigate()
  const { book } = useAcquisitionBook(versionGroup)
  const sections = useMemo(() => {
    void dataVersion // 데이터를 다시 받으면 다시 묻는다
    const extras = locations.map((loc) =>
      book ? pokemonAt(book, loc, version) : []
    )
    const species = speciesByIdentifier(extras.flat().map((e) => e.species))
    return locations
      .map((loc, i) => ({
        location: loc,
        groups: wildGroups(
          encountersAt(loc, version),
          extras[i],
          (id) => species.get(id) ?? null
        ),
      }))
      .filter((s) => s.groups.length > 0)
  }, [locations, version, book, dataVersion])

  if (sections.length === 0)
    return (
      <p className={styles.note}>
        {t("이 게임에는 이곳의 야생 출현 자료가 없어요")}
      </p>
    )
  return sections.map((s) => (
    <Section
      key={s.location}
      heading={s.location === locations[0] ? "" : placeOf(s.location)}
    >
      {s.groups.map((g: WildGroup) => (
        <div key={g.method} className={styles.group}>
          <h4 className={styles.groupLabel}>
            {methodName(g.method, language)}
          </h4>
          {g.rows.map((row) => {
            const name = displayNameOf(row.name, language, showOriginal)
            const sub = row.source
              ? sourceTextHere({ ...row.source, how: "" }, language, t)
              : ""
            return (
              <div key={row.key} className={styles.entry}>
                <button
                  type="button"
                  className={styles.row}
                  title={t("도감에서 보기")}
                  onClick={() => navigate(`/dex/${row.pokemonId}`)}
                >
                  <PokemonIcon pokemonId={row.pokemonId} alt="" />
                  <span className={styles.rowName}>{name}</span>
                  <span className={styles.rowInfo}>
                    {spotInfo(row.minLevel, row.maxLevel, row.rarity, t)}
                  </span>
                </button>
                {sub !== "" && <p className={styles.rowLine}>{sub}</p>}
              </div>
            )
          })}
        </div>
      ))}
    </Section>
  ))
}

function ItemList({
  locations,
  placeOf,
  generation,
  version,
  versionGroup,
  language,
  dataVersion,
}: DetailPanelProps) {
  const t = useT()
  const navigate = useNavigate()
  const { book, done } = useAcquisitionBook(versionGroup)
  const sections = useMemo(() => {
    if (!book) return []
    const rows = itemRowsFor(generation, versionGroup, dataVersion)
    const infoOf = (item: string) => {
      const row = rows.get(item)
      return row && existsIn(row, generation) ? row : null
    }
    return locations
      .map((loc) => ({
        location: loc,
        items: groupItemsHere(itemsAt(book, loc, version), infoOf, language, t),
      }))
      .filter((s) => s.items.length > 0)
  }, [
    book,
    locations,
    generation,
    version,
    versionGroup,
    language,
    t,
    dataVersion,
  ])

  if (!done) return <p className={styles.note}>{t("불러오는 중이에요…")}</p>
  if (sections.length === 0)
    return (
      <p className={styles.note}>
        {t("이곳의 아이템 자료가 없어요(사전 준비 중)")}
      </p>
    )
  return sections.map((s) => (
    <Section
      key={s.location}
      heading={s.location === locations[0] ? "" : placeOf(s.location)}
    >
      {s.items.map((it) => (
        <div key={it.title} className={styles.entry}>
          <button
            type="button"
            className={styles.row}
            title={t("아이템 백과에서 보기")}
            onClick={() => navigate(`/items?item=${it.info.id}`)}
          >
            <ItemIcon
              identifier={it.item}
              machineType={it.info.machineType || null}
              generation={generation}
              alt=""
            />
            <span className={styles.rowName}>{it.title}</span>
          </button>
          {it.lines.map((line, i) => (
            <p key={i} className={styles.itemLine}>
              {line}
            </p>
          ))}
        </div>
      ))}
    </Section>
  ))
}

function LandmarkList({
  locations,
  placeOf,
  versionGroup,
  language,
}: DetailPanelProps) {
  const t = useT()
  const sections = locations
    .map((loc) => ({ location: loc, list: landmarksAt(versionGroup, loc) }))
    .filter((s) => s.list.length > 0)
  if (sections.length === 0)
    return <p className={styles.note}>{t("기록해 둔 랜드마크가 없어요")}</p>
  return sections.map((s) => (
    <Section
      key={s.location}
      heading={s.location === locations[0] ? "" : placeOf(s.location)}
    >
      {s.list.map((lm, i) => {
        const detail = text(lm.detail, language)
        return (
          <div key={i} className={styles.landmark}>
            <p className={styles.landmarkName}>{text(lm.name, language)}</p>
            {detail !== "" && <p className={styles.landmarkLine}>{detail}</p>}
          </div>
        )
      })}
    </Section>
  ))
}
