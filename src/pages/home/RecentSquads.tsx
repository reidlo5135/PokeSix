/**
 * 최근 스쿼드 창 (C-37) — 최근 고친 스쿼드 3개. 누르면 그 세대 · 게임으로 바꾸고 스쿼드 화면으로.
 * 스쿼드가 없으면 빈 상태 + "새 스쿼드 만들기".
 */
import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "../../components/Button.tsx"
import { EmptyState } from "../../components/EmptyState.tsx"
import { Icon } from "../../components/Icon.tsx"
import { Panel } from "../../components/Panel.tsx"
import { GenBadge, Pill } from "../../components/Pill.tsx"
import { useT } from "../../i18n/index.ts"
import { textOf } from "../../shared/text.ts"
import { useDataVersion } from "../../state/data.ts"
import { settingsActions, useSettings } from "../../state/settings.ts"
import {
  filledCount,
  recentSquads,
  squadEntries,
  squadProblemCount,
  useSquadSaveState,
  useSquadsDocument,
  type SquadEntry,
} from "../../state/squads.ts"
import { memberTypes, versionName } from "./homeData.ts"
import styles from "./Home.module.css"

export function RecentSquads() {
  const t = useT()
  const navigate = useNavigate()
  const doc = useSquadsDocument()
  const saveState = useSquadSaveState()
  const lang = useSettings((s) => s.nameLanguage)
  const historic = useSettings((s) => s.useHistoricTypes)
  const dataVersion = useDataVersion()
  const recent = useMemo(() => recentSquads(squadEntries(doc)), [doc])

  // 멤버 타입 · 게임 이름 (데이터가 바뀌면 다시)
  const view = useMemo(() => {
    void dataVersion
    return recent.map((entry) => {
      const types = memberTypes(
        entry.squad.members.map((m) => m.pokemonId),
        entry.generation,
        historic
      )
      const version = versionName(entry.generation, entry.game)
      return { entry, types, version }
    })
  }, [recent, historic, dataVersion])

  const nameOf = (
    entry: SquadEntry,
    version: ReturnType<typeof versionName>
  ) => {
    if (entry.squad.name.trim() !== "") return entry.squad.name
    const v = version ? textOf(version, lang) : ""
    return v ? t("%1 스쿼드", v) : t("%1세대 스쿼드", entry.generation)
  }

  const open = (entry: SquadEntry) => {
    settingsActions().setGeneration(entry.generation)
    settingsActions().setGameFor(entry.generation, entry.game)
    navigate("/squad")
  }

  return (
    <Panel
      shadow={4}
      className={styles.recent}
      header={{
        title: t("최근 스쿼드"),
        tone: "red",
        right:
          recent.length > 0 ? (
            <Link to="/squad" className={styles.seeAll}>
              {t("모두 보기")}
            </Link>
          ) : undefined,
      }}
    >
      {recent.length === 0 ? (
        <EmptyState
          title={t("아직 만든 스쿼드가 없어요")}
          reason={t("스쿼드를 짜면 여기에 최근 것부터 보여요.")}
          actions={
            <Button
              variant="primary"
              size="S"
              onClick={() => navigate("/squad")}
            >
              {t("새 스쿼드 만들기")}
            </Button>
          }
        />
      ) : (
        view.map(({ entry, types, version }, i) => {
          const filled = filledCount(entry.squad)
          const problems = squadProblemCount(entry)
          let meta = t("%1세대 규칙 · %2 / 6", entry.generation, filled)
          if (i === 0 && saveState === "saved") meta += ` · ${t("자동 저장됨")}`
          return (
            <a
              key={`${entry.generation}:${entry.game}`}
              href="/squad"
              className={styles.recentRow}
              onClick={(e) => {
                e.preventDefault()
                open(entry)
              }}
            >
              <GenBadge generation={entry.generation} variant="row" />
              <span className={styles.recentText}>
                <span className={styles.recentName}>
                  {nameOf(entry, version)}
                </span>
                <span className={styles.recentMeta}>{meta}</span>
              </span>
              <span className={styles.slots} aria-hidden="true">
                {entry.squad.members.map((m, slot) => {
                  const ty =
                    m.pokemonId > 0 ? (types.get(m.pokemonId) ?? []) : []
                  if (m.pokemonId <= 0)
                    return (
                      <span key={slot} className={styles.slot} data-empty="" />
                    )
                  const top = ty[0] ?? "normal"
                  const bottom = ty[1] ?? top
                  return (
                    <span key={slot} className={styles.slot}>
                      <span style={{ background: `var(--type-${top})` }} />
                      <span style={{ background: `var(--type-${bottom})` }} />
                    </span>
                  )
                })}
              </span>
              <span className={styles.statusCell}>
                {problems !== null &&
                  (problems > 0 ? (
                    <Pill tone="status">{t("문제 %1", problems)}</Pill>
                  ) : (
                    <Pill tone="statusOk">{t("문제 없음")}</Pill>
                  ))}
              </span>
              <Icon
                name="chevronRight"
                size={16}
                strokeWidth={2.6}
                className={styles.chevronInk}
              />
            </a>
          )
        })
      )}
    </Panel>
  )
}
