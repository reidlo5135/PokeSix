// 진짜 세이브로 확인 — 세이브는 리포 밖에 두고 환경 변수로 알려 준다(없으면 건너뜀):
//   POKESIX_SAVE_PT · POKESIX_SAVE_HGSS · POKESIX_SAVE_BW · POKESIX_SAVE_B2W2 = 파일 하나
//   POKESIX_SAVE_DIR = 폴더(안의 .sav · .dsv 모두)
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { STATIC_SAVE_LOOKUPS } from "../../src/core/save/gameIndex.ts"
import { fileKindOf, openSave } from "../../src/core/save/saveFile.ts"
import { toSquadImport } from "../../src/core/save/toSquad.ts"

function checkRealSave(path: string, expectedGroup?: string): void {
  const result = openSave(new Uint8Array(readFileSync(path)), path)
  if (!result.ok) throw new Error(`${path}: ${result.error}`)
  const save = result.save
  if (expectedGroup) expect(save.versionGroup).toBe(expectedGroup)
  save.members.forEach((m, i) => {
    const at = `${path} #${i + 1}`
    expect(m.checksumOk, at).toBe(true)
    expect(m.species, at).toBeGreaterThanOrEqual(1)
    expect(m.species, at).toBeLessThanOrEqual(649)
    if (!m.egg) {
      expect(m.stats[0], at).toBe(m.maxHp) // 능력치 첫 칸 = 최대 HP
      expect(m.level, at).toBeGreaterThanOrEqual(1)
      expect(m.level, at).toBeLessThanOrEqual(100)
    }
  })
  const squad = toSquadImport(save, STATIC_SAVE_LOOKUPS)
  for (const m of squad.members) {
    if (m) expect(m.pokemonId).toBeGreaterThan(0)
  }
}

const singles: [string, string][] = [
  ["POKESIX_SAVE_PT", "platinum"],
  ["POKESIX_SAVE_HGSS", "heartgold-soulsilver"],
  ["POKESIX_SAVE_BW", "black-white"],
  ["POKESIX_SAVE_B2W2", "black-2-white-2"],
]

describe("진짜 세이브", () => {
  for (const [name, group] of singles) {
    const path = process.env[name]
    it.skipIf(!path)(`${name} → ${group}`, () => {
      if (path) checkRealSave(path, group)
    })
  }

  const dir = process.env.POKESIX_SAVE_DIR
  it.skipIf(!dir)("POKESIX_SAVE_DIR의 세이브 모두", () => {
    if (!dir) return
    const files = readdirSync(dir).filter((f) => fileKindOf(f) === "save")
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) checkRealSave(join(dir, file))
  })
})
