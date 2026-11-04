/**
 * 획득법 · 야생 출현(Qt EncounterList + 입수 사전 pokemon 묶음).
 * 고른 버전의 PokéAPI 출현 줄 − 사전이 가린 줄(replaces) + 사전 획득 줄(starter · fossil · static …).
 * 줄이 없으면 안내 한 줄: 다른 버전 한정 → 배포 이벤트 → 데려오기 → 자료 없음 → 진화 전 단계 → 그 밖.
 */
import type { EncounterEntry } from "../../../data/repository/types.ts"
import { text, type Language } from "../../../data/text/localizedText.ts"
import { methodName, placeName } from "../../../data/text/places.ts"
import type { TFunction } from "../../../i18n/index.ts"
import { costText, sourceFitsVersion, type PokemonSource } from "./guidebook.ts"

export interface EncounterLine {
  key: string
  version: string
  place: string
  method: string
  level: string // "Lv 15–17" · "Lv 44" · "—"
  rate: string // "31%" · "" (사전 줄)
  note: string // 사전 줄의 컨텐츠 · 비용 (조건)
  fromBook: boolean
}

export interface EncounterNotice {
  text: string
  detail: string
}

export interface EncounterInput {
  encounters: readonly EncounterEntry[]
  version: string
  /** 고른 버전이 든 묶음의 버전들(다른 버전 한정 판정) */
  groupVersions: readonly string[]
  bookLines: readonly PokemonSource[]
  hasPreEvolution: boolean
  /** 이 버전에 출현 자료가 한 줄이라도 있는가(SV DLC · Z-A는 0) */
  versionHasData: boolean
  versionName: (version: string) => string
  language: Language
  t: TFunction
}

export interface EncounterView {
  lines: EncounterLine[]
  notice: EncounterNotice | null
}

export function levelText(min: number, max: number, t: TFunction): string {
  if (min <= 0 && max <= 0) return "—"
  if (max <= min || min <= 0) return t("Lv %1", Math.max(min, max))
  return t("Lv %1–%2", min, max)
}

const NOTICE_HOWS = new Set(["transfer", "event"])

export function encounterView(input: EncounterInput): EncounterView {
  const { version, language, t } = input
  const fitting = input.bookLines.filter((s) => sourceFitsVersion(s, version))
  const hidden = fitting.filter((s) => s.replaces && s.where)
  const lines: EncounterLine[] = input.encounters
    .filter(
      (e) =>
        e.version === version &&
        !hidden.some((s) => s.where === e.location && s.replaces === e.method)
    )
    .map((e, i) => ({
      key: `api-${i}-${e.location}-${e.method}`,
      version,
      place: placeName(e.location, e.locationName, language),
      method: methodName(e.method, language),
      level: levelText(e.minLevel, e.maxLevel, t),
      rate: `${Math.min(e.rarity, 100)}%`,
      note: "",
      fromBook: false,
    }))
  fitting
    .filter((s) => !NOTICE_HOWS.has(s.how))
    .forEach((s, i) => {
      const content = text(s.content, language)
      const costs = s.cost.map((c) => costText(c.amount, c.unit, t)).join(" + ")
      const detail = text(s.detail, language)
      let note = [content, costs].filter(Boolean).join(" ")
      if (detail) note = note ? `${note} (${detail})` : detail
      lines.push({
        key: `book-${i}-${s.how}-${s.where}`,
        version,
        place:
          text(s.place, language) ||
          (s.where
            ? placeName(s.where, { ko: "", en: "", ja: "" }, language)
            : "") ||
          "—",
        method: s.how ? methodName(s.how, language) : "—",
        level: levelText(s.minLevel, s.maxLevel, t),
        rate: "",
        note,
        fromBook: true,
      })
    })
  if (lines.length > 0) return { lines, notice: null }
  return { lines, notice: emptyNotice(input, fitting) }
}

function emptyNotice(
  input: EncounterInput,
  fitting: readonly PokemonSource[]
): EncounterNotice {
  const { t, language, version } = input
  // G1: 같은 묶음의 다른 버전에서 만난다(버전 한정)
  const others: string[] = []
  for (const e of input.encounters) {
    if (e.version === version || !input.groupVersions.includes(e.version))
      continue
    const name = text(e.versionName, language) || input.versionName(e.version)
    if (!others.includes(name)) others.push(name)
  }
  if (others.length > 0)
    return {
      text: t(
        "이 버전에서는 만날 수 없어요. %1에서 만나요(버전 한정).",
        others.join(" · ")
      ),
      detail: "",
    }
  const event = fitting.find((s) => s.how === "event")
  if (event)
    return {
      text: t("배포 이벤트로만 얻어요."),
      detail: text(event.detail, language),
    }
  const transfer = fitting.find((s) => s.how === "transfer")
  if (transfer) {
    const from = transfer.versionsFrom.map(input.versionName).join(" · ")
    return {
      text: from
        ? t("이 게임에서는 얻을 수 없어요. %1에서 데려와요.", from)
        : t("이 게임에서는 얻을 수 없어요. 다른 게임에서 데려와요."),
      detail: text(transfer.detail, language),
    }
  }
  if (!input.versionHasData)
    return { text: t("이 게임의 출현 데이터가 아직 없어요"), detail: "" }
  if (input.hasPreEvolution)
    return {
      text: t(
        "야생에서는 만날 수 없어요. 위의 진화 전 단계를 잡아 진화시켜요."
      ),
      detail: "",
    }
  return {
    text: t(
      "이 세대에는 야생에서 만날 수 없어요. 교배 · 교환 · 이벤트로 얻어요."
    ),
    detail: "",
  }
}
