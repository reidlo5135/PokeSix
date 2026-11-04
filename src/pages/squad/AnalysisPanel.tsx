/**
 * 실시간 분석 창(v1 §5-5) — ① 문제 목록 ② 방어 상성 히트맵 ③ 물리 · 특수 분포 ④ 리소스 투자.
 * 좁은 배치는 문제 요약 띠 + 탭(문제 · 히트맵 · 물리 · 특수).
 */
import { useState, type CSSProperties } from "react"

import { HeaderTabs } from "../../components/index.ts"
import { Icon } from "../../components/Icon.tsx"
import type { ResourceReport } from "../../core/analysis/resourceReport.ts"
import {
  problemColumns,
  splitTotal,
  type Problem,
  type SquadAnalysis,
} from "../../core/analysis/squadAnalyzer.ts"
import { featuresOf } from "../../core/rules/generationFeatures.ts"
import {
  DISPLAY_ORDER,
  chartHasType,
  heatLevel,
  multiplierGlyph,
  type MatchupChart,
} from "../../core/typechart/index.ts"
import { useT } from "../../i18n/index.ts"
import { typeAbbr } from "../../shared/pokemonTypes.ts"
import { useNameLanguage } from "../../state/settings.ts"
import styles from "./Squad.module.css"

export interface ProblemView {
  problem: Problem
  title: string
  detail: string
  tag: string
  summary: string
}

export interface AnalysisPanelProps {
  analysis: SquadAnalysis
  chart: MatchupChart
  generation: number
  /** 슬롯 이름(빈 자리 = "") */
  names: readonly string[]
  problems: readonly ProblemView[]
  resources: ResourceReport
  selectedSlot: number
  onSelectSlot: (slot: number) => void
  onHover: (problem: Problem | null) => void
  hoverType: string
  compact: boolean
}

type Tab = "problems" | "heatmap" | "split"

export function AnalysisPanel(props: AnalysisPanelProps) {
  const t = useT()
  const { analysis, generation: g, compact } = props
  const [tab, setTab] = useState<Tab>("problems")
  const count = props.problems.length
  const subtitle = t("%1세대 상성표 · %2타입", g, props.chart.types.length)
  const badge =
    analysis.filled === 0 ? null : count > 0 ? (
      <span className={styles.problemPill} data-tone="bad">
        <Icon name="warning" size={12} strokeWidth={3} />
        {t("문제 %1", count)}
      </span>
    ) : (
      <span className={styles.problemPill} data-tone="good">
        {t("✓ 문제 없음")}
      </span>
    )

  if (analysis.filled === 0)
    return (
      <section className={styles.analysis} aria-label={t("실시간 분석")}>
        <div className={styles.analysisHead}>
          <h2 className={styles.analysisTitle}>{t("실시간 분석")}</h2>
          <span className={styles.analysisSub}>{subtitle}</span>
        </div>
        <p className={styles.analysisEmpty}>
          {t("첫 포켓몬을 추가하면 분석이 시작돼요")}
        </p>
      </section>
    )

  if (compact)
    return (
      <section className={styles.analysis} aria-label={t("실시간 분석")}>
        <HeaderTabs<Tab>
          tabs={[
            { id: "problems", label: t("문제"), count },
            { id: "heatmap", label: t("히트맵") },
            { id: "split", label: t("물리 · 특수") },
          ]}
          selected={tab}
          onSelect={setTab}
          ariaLabel={t("실시간 분석")}
          idPrefix="squad-analysis"
        />
        <div
          className={styles.summaryBand}
          data-tone={count > 0 ? "bad" : "good"}
        >
          {count > 0 ? (
            <>
              <Icon name="warning" size={13} strokeWidth={3} />
              <span className={styles.summaryText}>
                {t(
                  "문제 %1 — %2",
                  count,
                  props.problems.map((p) => p.summary).join(" · ")
                )}
              </span>
            </>
          ) : (
            t("✓ 문제 없음")
          )}
        </div>
        <div className={styles.analysisBody} role="tabpanel">
          {tab === "problems" && <ProblemList {...props} />}
          {tab === "heatmap" && <Heatmap {...props} />}
          {tab === "split" && (
            <>
              <SplitBlock {...props} />
              <Resources resources={props.resources} />
            </>
          )}
        </div>
      </section>
    )

  return (
    <section className={styles.analysis} aria-label={t("실시간 분석")}>
      <div className={styles.analysisHead}>
        <h2 className={styles.analysisTitle}>{t("실시간 분석")}</h2>
        <span className={styles.analysisSub}>{subtitle}</span>
        <span className={styles.spacer} />
        {badge}
      </div>
      <div className={styles.analysisBody}>
        <ProblemList {...props} />
        <Heatmap {...props} />
        <SplitBlock {...props} />
        <Resources resources={props.resources} />
      </div>
    </section>
  )
}

function ProblemList({ problems, onHover }: AnalysisPanelProps) {
  const t = useT()
  const lang = useNameLanguage()
  if (problems.length === 0)
    return (
      <p className={styles.noProblem}>
        {t("문제가 없어요 — 약점이 고르게 나뉘어 있어요")}
      </p>
    )
  return (
    <ul className={styles.problems}>
      {problems.map((p) => (
        <li
          key={`${p.problem.kind}-${p.problem.type}`}
          className={styles.problem}
          onPointerEnter={() => onHover(p.problem)}
          onPointerLeave={() => onHover(null)}
        >
          <span
            className={styles.problemType}
            style={{
              background: `var(--type-${p.problem.type})`,
              color: `var(--type-${p.problem.type}-text)`,
            }}
          >
            {typeAbbr(p.problem.type, lang)}
          </span>
          <span className={styles.problemText}>
            <span className={styles.problemTitle} title={p.title}>
              {p.title}
            </span>
            <span className={styles.problemDetail} title={p.detail}>
              {p.detail}
            </span>
          </span>
          <span className={styles.problemTag}>{p.tag}</span>
        </li>
      ))}
    </ul>
  )
}

function Heatmap({
  analysis,
  chart,
  names,
  selectedSlot,
  onSelectSlot,
  hoverType,
  compact,
}: AnalysisPanelProps) {
  const t = useT()
  const lang = useNameLanguage()
  const columns = problemColumns(analysis)
  const marked = DISPLAY_ORDER.map((type, i) => [type, i] as const).filter(
    ([type]) => columns.has(type) || type === hoverType
  )
  const exists = (type: string) => chartHasType(chart, type)
  const anyAttack = analysis.hasAttackingMove

  return (
    <div className={styles.block}>
      {!compact && (
        <div className={styles.blockHead}>
          <h3 className={styles.blockTitle}>{t("방어 상성 히트맵")}</h3>
          <span className={styles.blockNote}>
            {t("행 = 포켓몬 · 열 = 공격 타입 · 숫자 = 받는 배율")}
          </span>
        </div>
      )}
      <div className={styles.heatmap} data-compact={compact ? "" : undefined}>
        <div className={styles.heatRow}>
          <span />
          {DISPLAY_ORDER.map((type) => (
            <span
              key={type}
              className={styles.heatHead}
              data-absent={exists(type) ? undefined : ""}
              data-problem={compact && columns.has(type) ? "" : undefined}
              style={
                exists(type)
                  ? {
                      background: `var(--type-${type})`,
                      color: `var(--type-${type}-text)`,
                    }
                  : undefined
              }
            >
              {typeAbbr(type, lang)}
            </span>
          ))}
        </div>
        {names.map((name, slot) => {
          const filled = analysis.filledSlots.includes(slot)
          const received = analysis.received[slot] ?? {}
          return (
            <div key={slot} className={styles.heatRow}>
              <button
                type="button"
                className={styles.heatLabel}
                data-selected={slot === selectedSlot ? "" : undefined}
                data-empty={filled ? undefined : ""}
                disabled={!filled}
                onClick={() => onSelectSlot(slot)}
              >
                {!compact && (
                  <span className={styles.heatNumber}>
                    {String(slot + 1).padStart(2, "0")}
                  </span>
                )}
                {filled ? name : t("빈 슬롯")}
              </button>
              {DISPLAY_ORDER.map((type) => {
                if (!filled)
                  return (
                    <span
                      key={type}
                      className={styles.heatCell}
                      data-level="empty"
                    />
                  )
                if (!exists(type))
                  return (
                    <span
                      key={type}
                      className={styles.heatCell}
                      data-level="absent"
                    >
                      —
                    </span>
                  )
                const m = received[type] ?? 1
                const level = heatLevel(m)
                return (
                  <span
                    key={type}
                    className={styles.heatCell}
                    data-level={level}
                    data-selected={slot === selectedSlot ? "" : undefined}
                  >
                    {level === "neutral" ? "" : multiplierGlyph(m)}
                  </span>
                )
              })}
            </div>
          )
        })}
        {!compact && (
          <>
            <div className={styles.heatGap} />
            <SummaryRow
              label={t("약점 수")}
              render={(type) => {
                const v = analysis.weak[type] ?? 0
                return [
                  String(v),
                  v >= 3 ? "x4" : v === 2 ? "x2" : v === 0 ? "zero" : "plain",
                ]
              }}
              exists={exists}
            />
            <SummaryRow
              label={t("내성 · 무효")}
              render={(type) => {
                const v = analysis.resist[type] ?? 0
                return [String(v), v > 0 ? "resist" : "zero"]
              }}
              exists={exists}
            />
            <SummaryRow
              label={t("공격 커버")}
              render={(type) =>
                !anyAttack
                  ? ["—", "zero"]
                  : analysis.covered[type]
                    ? ["✓", "covered"]
                    : ["✕", "uncovered"]
              }
              exists={exists}
            />
            {marked.map(([type, i]) => (
              <span
                key={type}
                className={styles.problemColumn}
                data-hover={type === hoverType ? "" : undefined}
                style={{ "--col": i } as CSSProperties}
                aria-hidden="true"
              />
            ))}
          </>
        )}
      </div>
      {!compact && (
        <div className={styles.legend}>
          {(
            [
              ["x4", "×4"],
              ["x2", "×2"],
              ["half", "×½"],
              ["quarter", "×¼"],
              ["zero", t("무효")],
            ] as const
          ).map(([level, label]) => (
            <span key={level} className={styles.legendItem}>
              <span className={styles.legendSwatch} data-level={level} />
              {label}
            </span>
          ))}
          <span className={styles.legendItem}>
            <span className={styles.legendSwatch} data-level="problem" />
            {t("문제 열")}
          </span>
          <span className={styles.legendNote}>
            {t("포켓몬 이름을 누르면 행이 노랗게 강조돼요")}
          </span>
        </div>
      )}
    </div>
  )
}

function SummaryRow({
  label,
  render,
  exists,
}: {
  label: string
  render: (type: string) => [string, string]
  exists: (type: string) => boolean
}) {
  return (
    <div className={styles.heatRow}>
      <span className={styles.sumLabel}>{label}</span>
      {DISPLAY_ORDER.map((type) => {
        if (!exists(type))
          return (
            <span key={type} className={styles.sumCell} data-tone="absent">
              —
            </span>
          )
        const [value, tone] = render(type)
        return (
          <span key={type} className={styles.sumCell} data-tone={tone}>
            {value}
          </span>
        )
      })}
    </div>
  )
}

function SplitBlock({ analysis, generation: g }: AnalysisPanelProps) {
  const t = useT()
  const s = analysis.split
  const total = splitTotal(s)
  const byMove = featuresOf(g).splitByMove
  const parts = [
    ["physical", s.physical, t("물리")],
    ["special", s.special, t("특수")],
    ["status", s.status, t("변화")],
    ["empty", s.empty, t("빈칸")],
  ] as const
  const o = analysis.otherSplit
  return (
    <div className={styles.split}>
      <div className={styles.blockHead}>
        <h3 className={styles.blockTitle}>{t("물리 · 특수 분포")}</h3>
        <span className={styles.rulePill}>
          {byMove ? t("4세대~ 기술마다 판정") : t("1–3세대 타입마다 판정")}
        </span>
        <span className={styles.spacer} />
        <span className={styles.splitCount}>
          {t("기술 %1 / %2", total - s.empty, total)}
        </span>
      </div>
      <div className={styles.splitBar}>
        {parts
          .filter(([, n]) => n > 0)
          .map(([kind, n]) => (
            <span
              key={kind}
              className={styles.splitPart}
              data-kind={kind}
              style={{
                width: `${((n / Math.max(total, 1)) * 100).toFixed(2)}%`,
              }}
            />
          ))}
      </div>
      <div className={styles.splitLegend}>
        {parts.map(([kind, n, label]) => (
          <span key={kind} className={styles.legendItem}>
            <span className={styles.splitSwatch} data-kind={kind} />
            {label} <b className={styles.splitNumber}>{n}</b>
          </span>
        ))}
        <span className={styles.legendNote}>
          {byMove
            ? t("1–3세대 규칙(타입 기준)이면")
            : t("4세대 이후 규칙(기술 기준)이면")}{" "}
          <b>{t("물리 %1 · 특수 %2", o.physical, o.special)}</b>
        </span>
      </div>
    </div>
  )
}

function Resources({ resources }: { resources: ResourceReport }) {
  const t = useT()
  if (!resources.totals && resources.lines.length === 0) return null
  return (
    <div className={styles.split}>
      <div className={styles.blockHead}>
        <h3 className={styles.blockTitle}>{t("리소스 투자")}</h3>
        <span className={styles.spacer} />
        <span className={styles.splitCount}>{resources.totals}</span>
      </div>
      <ul className={styles.resourceLines}>
        {resources.lines.map((line, i) => (
          <li key={i}>
            {line.warn && <span className={styles.resourceWarn}>⚠ </span>}
            {line.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
