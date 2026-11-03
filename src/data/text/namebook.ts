/**
 * 이름 · 설명 보충 사전(names.json). PokéAPI에 한국어(또는 일본어) 값이 없는 것을 읽을 때 채운다.
 * 보통은 빈 칸만 채우고, "fix": true 항목은 PokéAPI 오탈자라 비어 있지 않아도 덮는다.
 */
import names from "../bundled/names.json" with { type: "json" }

import { isRecord, localizedOf, type LocalizedText } from "./localizedText.ts"

export type NameKind =
  | "items"
  | "moves"
  | "abilities"
  | "versions"
  | "item-effects"
  | "move-effects"
  | "ability-effects"

const KINDS: readonly NameKind[] = [
  "items",
  "moves",
  "abilities",
  "versions",
  "item-effects",
  "move-effects",
  "ability-effects",
]

interface Entry {
  text: LocalizedText
  fix: boolean
}

type Book = Record<NameKind, Map<string, Entry>>

let book: Book | null = null

/** JSON을 믿지 않고 좁힌다 — 모양이 틀린 칸은 버린다 */
export function parseNameBook(root: unknown): Book {
  const out = Object.fromEntries(
    KINDS.map((k) => [k, new Map<string, Entry>()])
  ) as Book
  if (!isRecord(root)) return out
  for (const kind of KINDS) {
    const section = root[kind]
    if (!isRecord(section)) continue
    for (const [identifier, value] of Object.entries(section)) {
      if (typeof value !== "string" && !isRecord(value)) continue
      const fix = isRecord(value) && value.fix === true
      out[kind].set(identifier, { text: localizedOf(value), fix })
    }
  }
  return out
}

function loaded(): Book {
  book ??= parseNameBook(names as unknown)
  return book
}

/** 사전 값으로 보충한 새 LocalizedText(받은 것은 고치지 않는다) */
export function supplement(
  kind: NameKind,
  identifier: string,
  t: LocalizedText
): LocalizedText {
  const entry = loaded()[kind].get(identifier)
  if (!entry) return t
  const take = (current: string, value: string) =>
    value !== "" && (current === "" || entry.fix) ? value : current
  return {
    ko: take(t.ko, entry.text.ko),
    en: take(t.en, entry.text.en),
    ja: take(t.ja, entry.text.ja),
  }
}
