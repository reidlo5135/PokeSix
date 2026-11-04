/**
 * 비전셔틀(7번째 멤버) — 비전머신 기술만 대신 드는 요원. 분석 · 멤버 수에 넣지 않는다(1–6세대).
 * 창: 셔틀 포켓몬 · 기술 4칸 + 이 게임의 비전머신 목록(셔틀 · 멤버 중 누가 배우는지).
 */
import { useState } from "react"

import { Button, PokemonIcon, TypeChip } from "../../components/index.ts"
import { learnableTable } from "../../core/rules/learn.ts"
import { hiddenMachineMoves } from "../../data/repository/index.ts"
import { text } from "../../data/text/localizedText.ts"
import { useT } from "../../i18n/index.ts"
import { useNameLanguage } from "../../state/settings.ts"
import type { Squad } from "../../state/squads.ts"
import { Modal } from "./Modal.tsx"
import { MovePicker, PokemonPicker } from "./Pickers.tsx"
import type { SquadContext } from "./session.ts"
import { resolveMember } from "./squadData.ts"
import {
  clearShuttle,
  setShuttleMove,
  setShuttlePokemon,
} from "./squadEdits.ts"
import styles from "./Squad.module.css"

export function ShuttleDialog({
  ctx,
  squad,
  onEdit,
  onClose,
}: {
  ctx: SquadContext
  squad: Squad
  onEdit: (change: (s: Squad) => Squad) => void
  onClose: () => void
}) {
  const t = useT()
  const lang = useNameLanguage()
  const [picking, setPicking] = useState<"pokemon" | number | null>(null)
  const g = ctx.generation
  const shuttle = resolveMember(squad.shuttle, g, ctx.versionGroup)
  const detail = shuttle.detail
  const machines = hiddenMachineMoves(ctx.versionGroup, g)
  const shuttleTable = detail ? learnableTable(detail) : new Map()
  const memberTables = squad.members.map((m) => {
    const d = resolveMember(m, g, ctx.versionGroup).detail
    return d ? { name: text(d.name, lang), table: learnableTable(d) } : null
  })

  if (picking === "pokemon")
    return (
      <PokemonPicker
        ctx={ctx}
        shuttle
        currentPokemonId={squad.shuttle.pokemonId}
        warningFor={() => null}
        onPick={(id) => onEdit((s) => setShuttlePokemon(s, id))}
        onClose={() => setPicking(null)}
      />
    )
  if (typeof picking === "number" && detail)
    return (
      <MovePicker
        ctx={ctx}
        detail={detail}
        currentMoveId={squad.shuttle.moves[picking] ?? 0}
        onPick={(id) => onEdit((s) => setShuttleMove(s, picking, id))}
        onClose={() => setPicking(null)}
      />
    )

  return (
    <Modal
      title={t("비전셔틀")}
      onClose={onClose}
      width={640}
      footer={
        <>
          {detail && (
            <Button
              size="S"
              variant="danger"
              onClick={() => onEdit(clearShuttle)}
            >
              {t("셔틀 비우기")}
            </Button>
          )}
          <Button size="S" onClick={() => setPicking("pokemon")}>
            {detail ? t("셔틀 바꾸기") : t("셔틀 고르기")}
          </Button>
        </>
      }
    >
      <div className={styles.shuttleBody}>
        <p className={styles.shuttleNote}>
          {t("비전머신 기술만 대신 드는 7번째 멤버예요. 분석에는 넣지 않아요.")}
        </p>
        {detail ? (
          <div className={styles.shuttleHead}>
            <PokemonIcon pokemonId={detail.pokemonId} alt="" box="search" />
            <span className={styles.shuttleName}>
              {text(detail.name, lang)}
            </span>
            {detail.types.map((type) => (
              <TypeChip key={type} type={type} size="sm" />
            ))}
          </div>
        ) : (
          <p className={styles.shuttleNote}>{t("아직 셔틀이 없어요.")}</p>
        )}
        {detail && (
          <div className={styles.shuttleMoves}>
            {shuttle.moves.map((m, i) => (
              <button
                key={i}
                type="button"
                className={m ? styles.moveCell : styles.moveEmpty}
                onClick={() => setPicking(i)}
              >
                {m ? (
                  <>
                    <span
                      className={styles.moveSquare}
                      style={{ background: `var(--type-${m.move.type})` }}
                      aria-hidden="true"
                    />
                    <span className={styles.moveName}>
                      {text(m.move.name, lang)}
                    </span>
                  </>
                ) : (
                  t("기술 추가")
                )}
              </button>
            ))}
          </div>
        )}
        {machines.length > 0 && (
          <table className={styles.hmTable}>
            <thead>
              <tr>
                <th>{t("비전머신")}</th>
                <th>{t("셔틀")}</th>
                <th>{t("배우는 멤버")}</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => {
                const held = squad.shuttle.moves.includes(m.moveId)
                const learners = memberTables
                  .filter((x) => x?.table.has(m.moveId))
                  .map((x) => x!.name)
                return (
                  <tr key={m.moveId}>
                    <td>
                      <span className={styles.hmNumber}>
                        {`HM${String(m.machineNumber).padStart(2, "0")}`}
                      </span>
                      {text(m.name, lang)}
                    </td>
                    <td>
                      {held
                        ? "✓"
                        : shuttleTable.has(m.moveId)
                          ? t("배울 수 있어요")
                          : "—"}
                    </td>
                    <td className={styles.hmLearners}>
                      {learners.length > 0 ? learners.join(" · ") : "—"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  )
}
