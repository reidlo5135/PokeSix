/**
 * 번역 사전 한 권(도메인 하나). 키 = 한국어 원문(한국어는 사전 없이 원문 그대로).
 * 같은 원문이 화면마다 다르게 번역돼야 하면 키를 ctx("원문", "맥락")로 만든다.
 */
export type Catalog = Readonly<
  Record<string, { readonly en: string; readonly ja: string }>
>

/** 맥락 구분자 (gettext msgctxt와 같은 방식) */
export const CTX_SEPARATOR = "\u0004"
