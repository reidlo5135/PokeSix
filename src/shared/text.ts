/**
 * 화면 쪽에서 쓰는 언어 · 다국어 이름 도우미.
 * 바탕(LocalizedText · 대체 순서)은 데이터 층(src/data/text)의 정의를 그대로 쓴다.
 */
import {
  allText,
  LANGUAGES,
  text,
  type Language,
  type LocalizedText,
} from "../data/text/localizedText.ts"

export type Lang = Language
export type { LocalizedText }

export const LANGS: readonly Lang[] = LANGUAGES

export function isLang(v: unknown): v is Lang {
  return v === "ko" || v === "en" || v === "ja"
}

/** 고른 언어 → 없으면 대체 순서(ko→en→ja · en→ko→ja · ja→en→ko) */
export const textOf = (t: LocalizedText, lang: Lang): string => text(t, lang)

/** 검색용: 세 언어를 이어 붙인 글 */
export const searchTextOf = (t: LocalizedText): string => allText(t)

/**
 * "원어 이름 함께 보기"의 둘째 이름: 표시 언어가 영어가 아니면 영어, 영어면 일본어.
 * 비었거나 첫 이름과 같으면 "".
 */
export function secondaryNameOf(t: LocalizedText, lang: Lang): string {
  const primary = textOf(t, lang)
  const second = lang === "en" ? t.ja : t.en
  return second === "" || second === primary ? "" : second
}

/** "한카리아스 (Garchomp)" — showOriginal이 꺼져 있으면 첫 이름만 */
export function displayNameOf(
  t: LocalizedText,
  lang: Lang,
  showOriginal: boolean
): string {
  const primary = textOf(t, lang)
  if (!showOriginal) return primary
  const second = secondaryNameOf(t, lang)
  return second ? `${primary} (${second})` : primary
}
