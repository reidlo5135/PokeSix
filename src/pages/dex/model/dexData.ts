/**
 * 도감 화면만 쓰는 작은 질의 — 저장소에 없는 것(특성 검색 · 종 identifier · 버전 이름 · 자료 유무).
 * 결과는 DB 객체마다 캐시한다(데이터를 다시 받으면 새 DB라 저절로 비워진다).
 */
import type { Database } from "sql.js"

import startersJson from "../../../data/bundled/starters.json" with { type: "json" }
import {
  currentDatabase,
  loc,
  num,
  select,
  str,
} from "../../../data/repository/db.ts"
import {
  allText,
  isRecord,
  type LocalizedText,
} from "../../../data/text/localizedText.ts"
import { supplement } from "../../../data/text/namebook.ts"
import type { SpeciesBrief } from "./dexList.ts"

interface Cache {
  abilities: Map<number, Map<number, string>>
  briefs: SpeciesBrief[] | null
  identifiers: Map<number, string> | null
  versions: Map<string, LocalizedText> | null
  encounterVersions: Set<string> | null
  learnsetGroups: Set<string> | null
}

const caches = new WeakMap<Database, Cache>()

function cache(): Cache | null {
  const db = currentDatabase()
  if (!db) return null
  let c = caches.get(db)
  if (!c) {
    c = {
      abilities: new Map(),
      briefs: null,
      identifiers: null,
      versions: null,
      encounterVersions: null,
      learnsetGroups: null,
    }
    caches.set(db, c)
  }
  return c
}

/** pokemonId → 그 세대 특성 이름(세 언어, 검색용) */
export function abilityTextByPokemon(generation: number): Map<number, string> {
  const c = cache()
  if (!c) return new Map()
  const hit = c.abilities.get(generation)
  if (hit) return hit
  const out = new Map<number, string>()
  for (const r of select(
    `SELECT pa.pokemon_id, a.identifier, a.name_ko, a.name_en, a.name_ja
     FROM pokemon_abilities pa JOIN abilities a ON a.id = pa.ability_id
     WHERE pa.gen_from <= ? AND (pa.gen_to IS NULL OR pa.gen_to >= ?)`,
    [generation, generation]
  )) {
    const id = num(r.pokemon_id)
    const name = allText(
      supplement("abilities", str(r.identifier), loc(r, "name"))
    )
    out.set(id, out.has(id) ? `${out.get(id)} ${name}` : name)
  }
  c.abilities.set(generation, out)
  return out
}

function readSpecies(c: Cache): void {
  c.briefs = []
  c.identifiers = new Map()
  for (const r of select(
    "SELECT id, identifier, intro_gen, name_ko, name_en, name_ja FROM species ORDER BY id"
  )) {
    const speciesId = num(r.id)
    c.briefs.push({
      speciesId,
      name: loc(r, "name"),
      introGen: num(r.intro_gen),
    })
    c.identifiers.set(speciesId, str(r.identifier))
  }
}

/** 모든 종(빈 상태 "n세대부터 나와요" 판정 · 첫 등장 세대) */
export function speciesBriefs(): SpeciesBrief[] {
  const c = cache()
  if (!c) return []
  if (!c.briefs) readSpecies(c)
  return c.briefs ?? []
}

/** 종 identifier("garchomp") — 입수 사전 pokemon 묶음 키. 없으면 "" */
export function speciesIdentifier(speciesId: number): string {
  const c = cache()
  if (!c) return ""
  if (!c.identifiers) readSpecies(c)
  return c.identifiers?.get(speciesId) ?? ""
}

/** 종이 처음 나온 세대. 모르면 0 */
export function introGenerationOf(speciesId: number): number {
  return speciesBriefs().find((s) => s.speciesId === speciesId)?.introGen ?? 0
}

/** 버전 identifier → 이름(보충 사전 반영) */
export function versionNames(): Map<string, LocalizedText> {
  const c = cache()
  if (!c) return new Map()
  if (!c.versions) {
    c.versions = new Map()
    for (const r of select(
      "SELECT identifier, name_ko, name_en, name_ja FROM versions"
    )) {
      const id = str(r.identifier)
      c.versions.set(id, supplement("versions", id, loc(r, "name")))
    }
  }
  return c.versions
}

/** 이 버전에 출현 자료가 있는가(SV DLC · Z-A · MD · Champions는 없다) */
export function versionHasEncounters(version: string): boolean {
  const c = cache()
  if (!c) return false
  c.encounterVersions ??= new Set(
    select(
      `SELECT DISTINCT v.identifier FROM encounters e
       JOIN versions v ON v.id = e.version_id`
    ).map((r) => str(r.identifier))
  )
  return c.encounterVersions.has(version)
}

/** 이 게임 묶음에 습득 기술 자료가 있는가(DLC · Z-A · MD · Champions는 없다) */
export function groupHasLearnsets(versionGroup: string): boolean {
  const c = cache()
  if (!c) return false
  c.learnsetGroups ??= new Set(
    select(
      `SELECT DISTINCT vg.identifier FROM pokemon_moves pm
       JOIN version_groups vg ON vg.id = pm.version_group_id`
    ).map((r) => str(r.identifier))
  )
  return c.learnsetGroups.has(versionGroup)
}

/** DLC 묶음 → 기술 자료를 빌려 올 본편 */
export const LEARNSET_FALLBACK: Readonly<Record<string, string>> = {
  "the-isle-of-armor": "sword-shield",
  "the-crown-tundra": "sword-shield",
  "the-teal-mask": "scarlet-violet",
  "the-indigo-disk": "scarlet-violet",
}

// ── 스타팅(starters.json) ──
let starters: Map<string, number[][]> | null = null

export function parseStarters(root: unknown): Map<string, number[][]> {
  const out = new Map<string, number[][]>()
  const section = isRecord(root) ? root.starters : undefined
  if (!isRecord(section)) return out
  for (const [group, lines] of Object.entries(section)) {
    if (!Array.isArray(lines)) continue
    out.set(
      group,
      lines
        .filter(Array.isArray)
        .map((line: unknown[]) =>
          line.filter((n): n is number => typeof n === "number")
        )
    )
  }
  return out
}

/** 그 게임에서 처음 고르는 스타팅(계통의 첫 종)인가 */
export function isStarter(versionGroup: string, speciesId: number): boolean {
  starters ??= parseStarters(startersJson as unknown)
  return (starters.get(versionGroup) ?? []).some(
    (line) => line[0] === speciesId
  )
}
