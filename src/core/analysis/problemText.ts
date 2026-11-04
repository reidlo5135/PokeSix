/**
 * 문제 · 제안 글자 — Qt squadpage.cpp refreshAnalysis · suggestion 그대로(데이터로 만든 해요체 글).
 * 번역 함수 t와 이름 함수는 받아 쓴다(순수 함수로 남게).
 */
import { multiplierGlyph, singleMultiplier } from "../typechart/index.ts"
import type { Problem, SquadAnalysis } from "./squadAnalyzer.ts"

export type TextFn = (key: string, ...args: (string | number)[]) => string

export interface ProblemText {
  title: string
  detail: string
  /** "방어" · "공격" */
  tag: string
}

export interface ProblemTextDeps {
  t: TextFn
  /** 타입 이름(지금 언어) */
  typeName: (type: string) => string
  /** 슬롯 포켓몬 이름 */
  memberName: (slot: number) => string
}

const times = (m: number): string => `×${multiplierGlyph(m)}`

export function problemText(
  p: Problem,
  analysis: SquadAnalysis,
  deps: ProblemTextDeps
): ProblemText {
  const { t, typeName, memberName } = deps
  const type = typeName(p.type)
  if (p.kind === "noCoverage") {
    const attackers = analysis.types
      .filter((a) => singleMultiplier(analysis.chart, a, p.type) > 1)
      .map(typeName)
    return {
      title: t("%1 — 효과가 굉장한 기술 없음", type),
      detail: t("%1 타입 공격 기술이 스쿼드에 없어요", attackers.join(" · ")),
      tag: t("공격"),
    }
  }
  const weak = analysis.weak[p.type] ?? 0
  const resist = analysis.resist[p.type] ?? 0
  const title =
    p.kind === "weakStack"
      ? t("%1 — 약점 %2, 받아낼 포켓몬 %3", type, weak, resist)
      : p.kind === "noResist"
        ? t("%1 — 약점 %2, 받아낼 포켓몬 없음", type, weak)
        : t("%1 — 4배 약점", type)
  const hurt: string[] = []
  const tank: string[] = []
  analysis.received.forEach((row, slot) => {
    if (!analysis.filledSlots.includes(slot)) return
    const m = row[p.type] ?? 1
    if (m > 1) hurt.push(`${memberName(slot)} ${times(m)}`)
    else if (m < 1) tank.push(`${memberName(slot)} ${times(m)}`)
  })
  const detail =
    hurt.join(" · ") +
    " / " +
    (tank.length === 0
      ? t("받아낼 포켓몬이 없어요")
      : t("받아냄: %1", tank.join(" · ")))
  return { title, detail, tag: t("방어") }
}

/** 빈 자리 제안 글(모든 빈 카드에 같은 글) */
export function suggestion(
  analysis: SquadAnalysis,
  deps: Pick<ProblemTextDeps, "t" | "typeName">
): string {
  const { t, typeName } = deps
  const chart = analysis.chart
  const defense: string[] = []
  const offense: string[] = []
  let solvable = 0
  for (const p of analysis.problems) {
    if (p.kind === "noCoverage") {
      solvable += 1
      for (const attack of analysis.types) {
        const name = typeName(attack)
        if (
          singleMultiplier(chart, attack, p.type) > 1 &&
          !offense.includes(name) &&
          offense.length < 3
        )
          offense.push(name)
      }
    } else if (!defense.includes(typeName(p.type))) {
      solvable += 1
      if (defense.length < 3) defense.push(typeName(p.type))
    }
  }
  const d = defense.join(" · ")
  const o = offense.join(" · ")
  if (d && o)
    return t(
      "%1 공격에 강하고 %2 기술을 가진 포켓몬이면 문제 %3건이 함께 풀려요.",
      d,
      o,
      solvable
    )
  if (d) return t("%1 공격에 강한 포켓몬이면 문제 %2건이 풀려요.", d, solvable)
  if (o) return t("%1 기술을 가진 포켓몬이면 문제 %2건이 풀려요.", o, solvable)
  return analysis.filled === 0
    ? t("이 세대의 포켓몬만 고를 수 있어요.")
    : t("빈 자리에 포켓몬을 더해 보세요.")
}

/** 좁은 배치 요약 띠의 조각 */
export function problemSummary(
  p: Problem,
  analysis: SquadAnalysis,
  deps: Pick<ProblemTextDeps, "t" | "typeName">
): string {
  const { t, typeName } = deps
  const type = typeName(p.type)
  const weak = analysis.weak[p.type] ?? 0
  switch (p.kind) {
    case "weakStack":
      return t("%1 약점 %2", type, weak)
    case "noResist":
      return t("%1 약점 %2 · 내성 없음", type, weak)
    case "quad":
      return t("%1 ×4", type)
    case "noCoverage":
      return t("%1 공격 없음", type)
  }
}
