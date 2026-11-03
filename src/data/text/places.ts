/**
 * 장소 · 출현 방법 이름(place-names.json · encounter-methods.json).
 * PokéAPI에는 신오 · 성도 · 관동 장소의 한국어 이름이 없어 사전과 도로 번호 규칙이 채운다.
 */
import methodsJson from "../bundled/encounter-methods.json" with { type: "json" }
import placesJson from "../bundled/place-names.json" with { type: "json" }

import {
  emptyText,
  isRecord,
  localizedOf,
  text,
  type Language,
  type LocalizedText,
} from "./localizedText.ts"

/** {"<묶음 키>": {"<identifier>": 글자 | {ko, en, ja}}} → Map. 모양이 틀린 칸은 버린다 */
export function parseTextSection(
  root: unknown,
  key: string
): Map<string, LocalizedText> {
  const out = new Map<string, LocalizedText>()
  const section = isRecord(root) ? root[key] : undefined
  if (!isRecord(section)) return out
  for (const [identifier, value] of Object.entries(section))
    if (typeof value === "string" || isRecord(value))
      out.set(identifier, localizedOf(value))
  return out
}

let places: Map<string, LocalizedText> | null = null
let methods: Map<string, LocalizedText> | null = null

// 도로 · 수로: "sinnoh-route-201" · "sinnoh-sea-route-220" · "kanto-route-1"
const ROUTE = /(?:^|-)(sea-)?route-(\d+)$/

/** 장소 이름: 사전 → 도로 번호 규칙 → PokéAPI 이름 → identifier를 읽기 좋게 */
export function placeName(
  identifier: string,
  pokeapiName: LocalizedText,
  language: Language
): string {
  places ??= parseTextSection(placesJson as unknown, "places")
  const name = { ...(places.get(identifier) ?? emptyText()) }
  const route = ROUTE.exec(identifier)
  if (route) {
    const sea = route[1] !== undefined
    const number = route[2]
    if (name.ko === "") name.ko = sea ? `${number}번 수로` : `${number}번 도로`
    if (name.ja === "")
      name.ja = sea ? `${number}ばんすいどう` : `${number}ばんどうろ`
  }
  // 사전 · 규칙이 비운 칸은 PokéAPI 이름으로(영어는 거의 늘 있다)
  if (name.ko === "") name.ko = pokeapiName.ko
  if (name.en === "") name.en = pokeapiName.en
  if (name.ja === "") name.ja = pokeapiName.ja
  const found = text(name, language)
  if (found !== "") return found
  // 둘 다 없으면 "oreburgh-mine" → "Oreburgh Mine"
  return identifier
    .split("-")
    .filter((word) => word !== "")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ")
}

/** 출현 방법 이름. 사전에 없으면 identifier의 '-'를 띄어쓰기로 */
export function methodName(identifier: string, language: Language): string {
  methods ??= parseTextSection(methodsJson as unknown, "methods")
  const name = methods.get(identifier)
  const found = name ? text(name, language) : ""
  return found !== "" ? found : identifier.replaceAll("-", " ")
}
