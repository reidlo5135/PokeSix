/**
 * 게임 데이터의 표기 언어와 세 언어 글자 묶음(LocalizedText).
 * 화면 문구의 언어와는 별개 경로다 — 둘 다 같은 설정을 따를 뿐.
 */

export type Language = "ko" | "en" | "ja"

export const LANGUAGES: readonly Language[] = ["ko", "en", "ja"]

/** "ko" · "en" · "ja"만 정확히 받는다. 'KO' · 'ko-KR' 같은 값은 fallback */
export function languageFromCode(
  code: string,
  fallback: Language = "ko"
): Language {
  return code === "ko" || code === "en" || code === "ja" ? code : fallback
}

/** 세 언어 글자. 없음 = "" */
export interface LocalizedText {
  ko: string
  en: string
  ja: string
}

export const emptyText = (): LocalizedText => ({ ko: "", en: "", ja: "" })

// 빈 칸이면 대신 보일 언어 — 그 언어 사용자가 읽을 가능성이 큰 쪽부터
const FALLBACK: Record<Language, readonly Language[]> = {
  ko: ["ko", "en", "ja"], // 한국어판이 없던 3세대 아이템은 영어로
  en: ["en", "ko", "ja"],
  ja: ["ja", "en", "ko"], // PokéAPI의 일본어는 거의 빠짐없다
}

/** 그 언어 글자. 비었으면 정해진 순서로 다음 언어, 모두 비면 "" */
export function text(t: LocalizedText, language: Language): string {
  for (const candidate of FALLBACK[language])
    if (t[candidate] !== "") return t[candidate]
  return ""
}

/** 대체 없이 그 언어 칸 그대로 */
export const exact = (t: LocalizedText, language: Language): string =>
  t[language]

export const isEmptyText = (t: LocalizedText): boolean =>
  !t.ko && !t.en && !t.ja

/** 검색용: 세 언어를 이어 붙인다(어느 언어로 쳐도 찾게) */
export const allText = (t: LocalizedText): string => `${t.ko} ${t.en} ${t.ja}`

/** JSON 값 → LocalizedText: 글자 하나 = 한국어, 객체 = 있는 언어만. 그 밖은 빈 칸 */
export function localizedOf(value: unknown): LocalizedText {
  if (typeof value === "string") return { ko: value, en: "", ja: "" }
  if (!isRecord(value)) return emptyText()
  const pick = (key: Language) =>
    typeof value[key] === "string" ? value[key] : ""
  return { ko: pick("ko"), en: pick("en"), ja: pick("ja") }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
