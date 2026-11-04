/**
 * 멤버 자세히 보기 — 도감 상세를 창으로(Qt SquadPage::showMemberDetail).
 * 세이브에서 온 멤버는 실제 능력치(파랑)를 종족값 옆에 보이고 성격을 미리 고른다.
 */
import { useState } from "react"

import { useT } from "../../i18n/index.ts"
import type { SquadMember } from "../../state/squads.ts"
import { DexDetail } from "../dex/detail/DexDetail.tsx"
import { Modal } from "./Modal.tsx"

export function MemberDetail({
  member,
  pokemonId,
  generation,
  version,
  onClose,
}: {
  member: SquadMember
  pokemonId: number
  generation: number
  version: string
  onClose: () => void
}) {
  const t = useT()
  // 진화 줄을 누르면 창 안에서 그 포켓몬으로
  const [shown, setShown] = useState(pokemonId)
  const trained =
    member.level > 0 && member.stats.length === 6
      ? { pokemonId, stats: member.stats }
      : undefined
  return (
    <Modal
      title={t("자세히 보기")}
      ariaLabel={t("멤버 자세히 보기")}
      onClose={onClose}
      width={460}
      height={760}
    >
      <DexDetail
        pokemonId={shown}
        generation={generation}
        version={version}
        variant="modal"
        onSelectPokemon={setShown}
        trainedStats={trained}
        presetNatureId={member.natureId || undefined}
      />
    </Modal>
  )
}
