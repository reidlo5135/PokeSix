// 시리즈 안의 버전 고르기 — 파티 멤버의 출신 게임 다수결
import type { ReadMember, VersionGroup } from "./party.ts"

const VERSION_OF_ORIGIN: Readonly<Record<number, string>> = {
  7: "heartgold",
  8: "soulsilver",
  10: "diamond",
  11: "pearl",
  12: "platinum",
  20: "white", // 20 = 화이트, 21 = 블랙(블랙이 더 큰 번호)
  21: "black",
  22: "white-2",
  23: "black-2",
}

// 출신 게임 바이트(0x5F) → 버전 이름. 모르는 번호는 ""
export function versionOfOriginGame(originGame: number): string {
  return VERSION_OF_ORIGIN[originGame] ?? ""
}

// 각 묶음의 버전(versions.id 순서)
export const VERSIONS_OF_GROUP: Readonly<
  Record<VersionGroup, readonly string[]>
> = {
  "diamond-pearl": ["diamond", "pearl"],
  platinum: ["platinum"],
  "heartgold-soulsilver": ["heartgold", "soulsilver"],
  "black-white": ["black", "white"],
  "black-2-white-2": ["black-2", "white-2"],
}

// 표가 가장 많은 버전. 동점이면 앞 버전, 아무도 안 맞으면(데려온 포켓몬뿐) 첫 버전.
// 알도 표를 낸다(Qt와 같음)
export function chooseVersion(
  versions: readonly string[],
  members: readonly ReadMember[]
): string {
  const votes = new Map<string, number>()
  for (const member of members) {
    const version = versionOfOriginGame(member.originGame)
    if (versions.includes(version)) {
      votes.set(version, (votes.get(version) ?? 0) + 1)
    }
  }
  let chosen = versions[0] ?? ""
  let best = 0
  for (const version of versions) {
    const count = votes.get(version) ?? 0
    if (count > best) {
      best = count
      chosen = version
    }
  }
  return chosen
}
