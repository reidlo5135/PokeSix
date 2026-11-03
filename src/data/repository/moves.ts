/**
 * 기술 값을 세대 g 기준으로: 이름 · 타입 · 분류 · 위력 · 명중 · PP · 효과 뼈대 · 설명문.
 */
import { isEmptyText } from "../text/localizedText.ts"
import { supplement } from "../text/namebook.ts"
import {
  idList,
  loc,
  num,
  numOrNull,
  select,
  str,
  strOrNull,
  type Row,
} from "./db.ts"
import {
  damageClassIn,
  machineNumberOf,
  pickNearest,
  type EffectRow,
} from "./rules.ts"
import { emptyMove, type MoveEntry } from "./types.ts"

/** effects 표 행 → (대상 id → 세대 오름차순 문구 행). rows는 generation 오름차순으로 읽은 것 */
export function effectRowsBy(
  rows: Row[],
  key: string
): Map<number, EffectRow[]> {
  const out = new Map<number, EffectRow[]>()
  for (const r of rows) {
    const id = num(r[key])
    const row: EffectRow = {
      generation: num(r.generation),
      ko: strOrNull(r.text_ko),
      en: strOrNull(r.text_en),
      ja: strOrNull(r.text_ja),
    }
    const list = out.get(id)
    if (list) list.push(row)
    else out.set(id, [row])
  }
  return out
}

interface PastValue {
  until: number
  power: number | null
  pp: number | null
  accuracy: number | null
}

/**
 * moves의 moveId로 값을 채운다(제자리). level · machineNumber · hiddenMachine · machineItem ·
 * needsReminder · fromPokemonId · fromName은 그대로 둔다. DB에 없는 id는 빈 채로 남는다
 */
export function fillMoves(moves: MoveEntry[], generation: number): void {
  if (moves.length === 0) return
  const g = generation
  const ids = idList(moves.map((m) => m.moveId))

  // 1) 지금 값 + 그 세대 타입
  const info = new Map<number, Row>()
  for (const r of select(
    `SELECT m.id, m.name_ko, m.name_en, m.name_ja, t.identifier AS type, m.power, m.pp,
            m.accuracy, m.damage_class, m.identifier, mm.target, mm.ailment, mm.healing
     FROM moves m LEFT JOIN move_meta mm ON mm.move_id = m.id
     LEFT JOIN move_types mt ON mt.move_id = m.id
       AND mt.gen_from <= ? AND (mt.gen_to IS NULL OR mt.gen_to >= ?)
     LEFT JOIN types t ON t.id = mt.type_id WHERE m.id IN (${ids})`,
    [g, g]
  ))
    info.set(num(r.id), r)

  // 2) 옛 값: until_gen 세대까지는 이 값(NULL 칸 = 그 항목은 안 바뀜)
  const past = new Map<number, PastValue[]>()
  for (const r of select(
    `SELECT move_id, until_gen, power, pp, accuracy FROM move_changelog
     WHERE move_id IN (${ids}) ORDER BY until_gen`
  )) {
    const id = num(r.move_id)
    const value: PastValue = {
      until: num(r.until_gen),
      power: numOrNull(r.power),
      pp: numOrNull(r.pp),
      accuracy: numOrNull(r.accuracy),
    }
    const list = past.get(id)
    if (list) list.push(value)
    else past.set(id, [value])
  }

  // 3) 능력치 변화(지금 값 — 옛 세대 차이는 UI move-effects.json이 덮는다)
  const statChanges = new Map<number, [number, number][]>()
  for (const r of select(
    `SELECT move_id, stat_id, change FROM move_stat_changes
     WHERE move_id IN (${ids}) ORDER BY move_id, stat_id`
  )) {
    const id = num(r.move_id)
    const list = statChanges.get(id) ?? []
    list.push([num(r.stat_id), num(r.change)])
    statChanges.set(id, list)
  }

  // 4) 설명문(가까운 세대 문구)
  const effects = effectRowsBy(
    select(
      `SELECT move_id, generation, text_ko, text_en, text_ja FROM move_effects
       WHERE move_id IN (${ids}) ORDER BY generation`
    ),
    "move_id"
  )

  // 5) 행마다 채우기
  for (const move of moves) {
    const r = info.get(move.moveId)
    if (!r) continue
    move.name = loc(r, "name")
    move.type = str(r.type)
    move.power = num(r.power)
    move.pp = num(r.pp)
    move.accuracy = num(r.accuracy)
    move.identifier = str(r.identifier)
    move.target = num(r.target)
    move.ailment = num(r.ailment)
    move.healing = num(r.healing)
    move.statChanges = (statChanges.get(move.moveId) ?? []).map(([s, c]) => [
      s,
      c,
    ])
    move.effect = pickNearest(effects.get(move.moveId) ?? [], g)
    let powerSet = false
    let ppSet = false
    let accuracySet = false
    for (const p of past.get(move.moveId) ?? []) {
      if (p.until < g) continue
      // 항목마다 따로: until_gen >= g인 가장 이른 줄의 NULL 아닌 값
      if (!powerSet && p.power !== null) {
        move.power = p.power
        powerSet = true
      }
      if (!ppSet && p.pp !== null) {
        move.pp = p.pp
        ppSet = true
      }
      if (!accuracySet && p.accuracy !== null) {
        move.accuracy = p.accuracy
        accuracySet = true
      }
    }
    move.damageClass = damageClassIn(g, num(r.damage_class), move.type)
    move.name = supplement("moves", move.identifier, move.name)
    move.effect = supplement("move-effects", move.identifier, move.effect)
  }
}

/** id마다 기술 하나(순서 그대로, 중복 허용). DB에 없는 id는 뺀다 */
export function moves(ids: readonly number[], generation: number): MoveEntry[] {
  if (ids.length === 0) return []
  const list = ids.map((id) => emptyMove(id))
  fillMoves(list, generation)
  return list.filter((m) => !isEmptyText(m.name))
}

/** 그 게임 묶음의 비전머신 기술 전부(HM 번호 순) — 비전셔틀 커버 현황 기준 목록 */
export function hiddenMachineMoves(
  versionGroup: string,
  generation: number
): MoveEntry[] {
  const list = select(
    `SELECT m.move_id, m.machine_number, i.identifier FROM machines m
     JOIN items i ON i.id = m.item_id
     JOIN version_groups vg ON vg.id = m.version_group_id
     WHERE vg.identifier = ? AND i.identifier LIKE 'hm%' ORDER BY m.machine_number`,
    [versionGroup]
  ).map((r) => {
    const move = emptyMove(num(r.move_id))
    move.machineItem = str(r.identifier)
    move.machineNumber = machineNumberOf(
      move.machineItem,
      num(r.machine_number)
    )
    move.hiddenMachine = true
    return move
  })
  fillMoves(list, generation)
  return list
}
