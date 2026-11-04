/**
 * 스쿼드 화면 본체(v1 SCR-04) — 상단 줄 · 슬롯 6 · 실시간 분석.
 * 스쿼드는 (세대, 게임 버전)마다 하나: 앱 전체 게임을 따른다. 고치는 일은 모두 session을 거쳐
 * 되돌리기 기록에 남는다(메모만 기록 없이 저장).
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react"
import { useLocation } from "react-router-dom"

import { Button, IconButton, MenuPopup } from "../../components/index.ts"
import { Icon, MoreIcon } from "../../components/Icon.tsx"
import { memberWarning } from "../../core/analysis/memberWarning.ts"
import {
  problemSummary,
  problemText,
  suggestion,
} from "../../core/analysis/problemText.ts"
import { unknownSupply } from "../../core/analysis/resourceLedger.ts"
import { resourceReport } from "../../core/analysis/resourceReport.ts"
import type { Problem } from "../../core/analysis/squadAnalyzer.ts"
import {
  cachedAcquisitionBook,
  costLabel,
  itemSupply,
  loadAcquisitionBook,
  tutorCostAmounts,
  type AcquisitionBook,
} from "../../core/rules/acquisition.ts"
import { featuresOf } from "../../core/rules/generationFeatures.ts"
import { starterLineOf } from "../../core/rules/starters.ts"
import {
  gamesForGeneration,
  resolveVersion,
  type Nature,
} from "../../data/repository/index.ts"
import { emptyText, text } from "../../data/text/localizedText.ts"
import { useT } from "../../i18n/index.ts"
import { isGeneration } from "../../shared/generations.ts"
import { typeName } from "../../shared/pokemonTypes.ts"
import { useMediaQuery } from "../../shared/useMediaQuery.ts"
import { useDataVersion } from "../../state/data.ts"
import {
  settingsActions,
  useGame,
  useGeneration,
  useNameLanguage,
} from "../../state/settings.ts"
import {
  filledCount,
  isEmptyMember,
  SQUAD_SIZE,
  squadStore,
  useSquadSaveState,
  useSquadsDocument,
} from "../../state/squads.ts"
import { NaturePicker } from "../dex/detail/NaturePicker.tsx"
import { GameChips } from "../dex/GameChips.tsx"
import { gameChips } from "../dex/model/dexstyle.ts"
import { AnalysisPanel, type ProblemView } from "./AnalysisPanel.tsx"
import { importFile, IMPORT_EXTENSIONS } from "./importSquad.ts"
import { AskDialog, type AskRequest } from "./Modal.tsx"
import { MemberDetail } from "./MemberDetail.tsx"
import { ItemPicker, MovePicker, PokemonPicker } from "./Pickers.tsx"
import { warningText } from "./pickerText.ts"
import { session, useUndoState, type SquadContext } from "./session.ts"
import { ShuttleDialog } from "./ShuttleDialog.tsx"
import { EmptySlotCard, SlotCard, type FieldKind } from "./SlotCard.tsx"
import {
  analyzeResolved,
  chartOf,
  evolutionMapOf,
  itemsIn,
  naturesList,
  resolveMember,
  resolveSquad,
  syncDataEpoch,
  versionGroupFor,
} from "./squadData.ts"
import {
  clearAll,
  clearSlot,
  moveSlot,
  NAME_LENGTH,
  setField,
  setMemo,
  setMove,
  setName,
  setPokemon,
} from "./squadEdits.ts"
import { portableFileName, serializePortable } from "./squadFile.ts"
import styles from "./Squad.module.css"

const NOTICE_MS = 2500
const SHUTTLE = 6

type Dialog =
  | { kind: "pokemon"; slot: number }
  | { kind: "move"; slot: number; index: number }
  | { kind: "item"; slot: number }
  | { kind: "detail"; slot: number }
  | { kind: "shuttle" }

type Anchored =
  | {
      kind: "ability"
      slot: number
      anchor: RefObject<HTMLButtonElement | null>
    }
  | {
      kind: "nature"
      slot: number
      anchor: RefObject<HTMLButtonElement | null>
    }
  | { kind: "more"; anchor: RefObject<HTMLButtonElement | null> }

/** 그 게임 묶음의 입수 사전(처음 쓸 때 불러온다) */
function useAcquisition(versionGroup: string): AcquisitionBook | null {
  const [, setLoaded] = useState(0)
  const book = versionGroup ? cachedAcquisitionBook(versionGroup) : null
  useEffect(() => {
    if (!versionGroup || cachedAcquisitionBook(versionGroup)) return
    let alive = true
    void loadAcquisitionBook(versionGroup).then(() => {
      if (alive) setLoaded((n) => n + 1)
    })
    return () => {
      alive = false
    }
  }, [versionGroup])
  return book
}

export function SquadScreen() {
  const t = useT()
  const lang = useNameLanguage()
  const g = useGeneration()
  const appGame = useGame()
  const dataVersion = useDataVersion()
  const location = useLocation()
  const compact = useMediaQuery("(max-width: 1279px)") // breakpoint.squadSplit
  syncDataEpoch(dataVersion)
  useSquadsDocument() // 저장소가 바뀌면 다시 그린다
  const saveState = useSquadSaveState()

  const games = useMemo(() => {
    void dataVersion
    return gamesForGeneration(g)
  }, [g, dataVersion])
  const version = useMemo(() => {
    void dataVersion
    return resolveVersion(g, appGame)
  }, [g, appGame, dataVersion])
  const versionGroup = useMemo(() => {
    void dataVersion
    return versionGroupFor(g, version)
  }, [g, version, dataVersion])
  const ctx: SquadContext = useMemo(
    () => ({ generation: g, version, versionGroup }),
    [g, version, versionGroup]
  )
  const book = useAcquisition(versionGroup)

  const [selected, setSelected] = useState(-1)
  const [hover, setHover] = useState<Problem | null>(null)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [anchored, setAnchored] = useState<Anchored | null>(null)
  const [ask, setAsk] = useState<AskRequest | null>(null)
  const [notice, setNotice] = useState("")
  const [editingName, setEditingName] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)
  const moreRef = useRef<HTMLButtonElement | null>(null)

  const squad = session.current(ctx)
  const resolved = resolveSquad(squad, g, versionGroup)
  const analysis = analyzeResolved(resolved, g)
  const chart = chartOf(g)
  const features = featuresOf(g)
  const filled = filledCount(squad)
  const names = resolved.map((r) => (r.detail ? text(r.detail.name, lang) : ""))
  const versionName =
    text(
      games
        .flatMap((x) =>
          x.versions.map((v, i) => [v, x.versionNames[i]] as const)
        )
        .find(([v]) => v === version)?.[1] ?? emptyText(),
      lang
    ) || ""
  const defaultName = versionName
    ? t("%1 스쿼드", versionName)
    : t("%1세대 스쿼드", g)
  const tn = (type: string) => typeName(type, lang)
  const problems: ProblemView[] = analysis.problems.map((p) => ({
    problem: p,
    ...problemText(p, analysis, {
      t,
      typeName: tn,
      memberName: (slot) => names[slot] ?? "",
    }),
    summary: problemSummary(p, analysis, { t, typeName: tn }),
  }))
  const emptyHint = suggestion(analysis, { t, typeName: tn })
  const resources = resourceReport(
    resolved.flatMap((r, slot) =>
      r.detail
        ? [
            {
              slot,
              detail: r.detail,
              moves: r.moves.flatMap((m) => (m && m.learnable ? [m.move] : [])),
            },
          ]
        : []
    ),
    {
      t,
      moveName: (m) => text(m.name, lang),
      supply: (item) =>
        book ? itemSupply(book, item, version) : unknownSupply(),
      tutorCost: (identifier) =>
        book ? tutorCostAmounts(book, identifier, version) : [],
      costLabel: (amount, unit) => costLabel(t, amount, unit),
    }
  )

  const others = resolved.map((r, slot) => ({
    slot,
    speciesId: r.detail?.speciesId ?? 0,
    name: names[slot] ?? "",
  }))
  const warningFor = (slot: number, speciesId: number) =>
    memberWarning(slot, speciesId, others, evolutionMapOf(), (sp) =>
      starterLineOf(versionGroup, sp)
    )
  const natures = features.natures ? naturesList() : []
  const items = features.heldItems ? itemsIn(g, versionGroup) : []

  const edit = (change: Parameters<typeof session.edit>[1]) =>
    session.edit(ctx, change)
  const visible = location.pathname === "/squad"

  // 잠깐 알림
  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(""), NOTICE_MS)
    return () => window.clearTimeout(id)
  }, [notice])

  // Ctrl+Z · Ctrl+Shift+Z / Ctrl+Y — 이 화면이 보일 때, 입력 칸 밖에서만
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target?.closest("input, textarea, [contenteditable]")) return
      const key = e.key.toLowerCase()
      if (key === "z" && !e.shiftKey) session.undo(ctx)
      else if ((key === "z" && e.shiftKey) || key === "y") session.redo(ctx)
      else return
      e.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [visible, ctx])

  const confirm = (title: string, message: string) =>
    new Promise<boolean>((resolve) =>
      setAsk({
        title,
        message,
        confirm: true,
        resolve: (ok) => {
          setAsk(null)
          resolve(ok)
        },
      })
    )
  const alertBox = (title: string, message: string) =>
    new Promise<void>((resolve) =>
      setAsk({
        title,
        message,
        confirm: false,
        resolve: () => {
          setAsk(null)
          resolve()
        },
      })
    )

  // ── 불러오기 · 내보내기 ──
  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const title = t("스쿼드 불러오기")
    const result = await importFile(file)
    if (!result.ok) {
      await alertBox(title, t(result.error.key, result.error.arg ?? ""))
      return
    }
    const p = result.portable
    const gen = p.generation
    const target = isGeneration(gen) ? resolveVersion(gen, p.game) : ""
    if (!isGeneration(gen) || target === "") {
      await alertBox(title, t("%1세대는 아직 준비되지 않았어요", gen))
      return
    }
    const existing = squadStore.api.squad(gen, target)
    if (filledCount(existing) > 0 || !isEmptyMember(existing.shuttle)) {
      const name = p.squad.name || t("불러온 스쿼드")
      const ok = await confirm(
        title,
        t("지금 저장된 스쿼드를 '%1'(으)로 바꿔요. 계속할까요?", name)
      )
      if (!ok) return
    }
    const next: SquadContext = {
      generation: gen,
      version: target,
      versionGroup: versionGroupFor(gen, target),
    }
    if (gen !== g) settingsActions().setGeneration(gen)
    settingsActions().setGameFor(gen, target)
    session.edit(next, () => structuredClone(p.squad))
    setSelected(-1)
    setNotice(
      result.kind === "save"
        ? t("✓ 세이브에서 파티를 불러왔어요")
        : t("✓ 스쿼드를 불러왔어요")
    )
  }

  const onExport = () => {
    const portable = { generation: g, game: version, squad }
    const blob = new Blob([serializePortable(portable)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = portableFileName(portable)
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice(t("✓ 스쿼드 파일을 내보냈어요"))
  }

  // ── 슬롯 동작 ──
  const pickPokemon = (slot: number, pokemonId: number) => {
    if (slot === SHUTTLE) return
    const detail = resolveMember(
      { ...squad.members[slot], pokemonId, moves: [0, 0, 0, 0] },
      g,
      versionGroup
    ).detail
    const firstAbility = detail?.abilities[0]?.abilityId ?? 0
    edit((s) =>
      setPokemon(s, slot, pokemonId, features.abilities ? firstAbility : 0)
    )
  }

  const hotFor = (slot: number): string => {
    if (!hover || !hover.members.includes(slot)) return ""
    return hover.kind === "quad"
      ? t("%1 ×4", tn(hover.type))
      : t("%1 약점", tn(hover.type))
  }

  const commitName = () => {
    if (editingName === null) return
    const next = editingName.trim().slice(0, NAME_LENGTH)
    setEditingName(null)
    edit((s) => setName(s, next === defaultName ? "" : next))
  }

  const chips = gameChips(games, lang)
  const pips = resolved.map((r) => r.detail?.types[0] ?? "")
  const shuttleDetail = resolveMember(squad.shuttle, g, versionGroup).detail
  const { canUndo, canRedo } = useUndoState(ctx)

  const moreItems = [
    { key: "import", content: t("불러오기") },
    { key: "export", content: t("내보내기") },
    ...(features.hiddenMachines
      ? [{ key: "shuttle", content: t("비전셔틀") }]
      : []),
    { key: "undo", content: t("되돌리기"), disabled: !canUndo },
    { key: "redo", content: t("다시 실행"), disabled: !canRedo },
    { key: "clearAll", content: t("일괄 비우기"), disabled: filled === 0 },
  ]
  const onMore = (key: string) => {
    if (key === "import") fileInput.current?.click()
    else if (key === "export") onExport()
    else if (key === "shuttle") setDialog({ kind: "shuttle" })
    else if (key === "undo") session.undo(ctx)
    else if (key === "redo") session.redo(ctx)
    else if (key === "clearAll") edit(clearAll)
  }

  return (
    <div className={styles.screen} data-compact={compact ? "" : undefined}>
      <input
        ref={fileInput}
        type="file"
        hidden
        accept={IMPORT_EXTENSIONS.join(",")}
        onChange={(e) => void onImport(e)}
      />
      <div className={styles.toolbar}>
        {editingName !== null ? (
          <input
            className={styles.nameInput}
            value={editingName}
            maxLength={NAME_LENGTH}
            aria-label={t("스쿼드 이름")}
            autoFocus
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) commitName()
              else if (e.key === "Escape") setEditingName(null)
            }}
          />
        ) : (
          <h1 className={styles.squadName}>{squad.name || defaultName}</h1>
        )}
        {!compact && (
          <IconButton
            label={t("스쿼드 이름 변경")}
            icon={<Icon name="pencil" size={14} strokeWidth={2.2} />}
            className={styles.renameButton}
            onClick={() => setEditingName(squad.name || defaultName)}
          />
        )}
        <span
          className={styles.rulePill}
          data-size="toolbar"
          title={t(
            "분석이 이 세대의 규칙을 따라요 — 상성표(페어리는 6세대부터),\n물리·특수 구분(3세대까지 타입, 4세대부터 기술),\n특성·성격(3세대부터) · 지닌 물건(2세대부터)"
          )}
        >
          {t("%1세대 규칙", g)}
        </span>
        {!compact && chips.length > 1 && (
          <GameChips
            chips={chips}
            version={version}
            onPick={(v) => settingsActions().setGame(v)}
          />
        )}
        {!compact && (
          <span className={styles.pips} aria-hidden="true">
            {pips.map((type, i) => (
              <span
                key={i}
                className={styles.pip}
                style={type ? { background: `var(--type-${type})` } : undefined}
              />
            ))}
          </span>
        )}
        <span
          className={styles.filledCount}
        >{`${filled} / ${SQUAD_SIZE}`}</span>
        {!compact && features.hiddenMachines && (
          <button
            type="button"
            className={styles.shuttleButton}
            onClick={() => setDialog({ kind: "shuttle" })}
          >
            {shuttleDetail
              ? t("비전셔틀 · %1", text(shuttleDetail.name, lang))
              : t("+ 비전셔틀")}
          </button>
        )}
        {!compact && (
          <span className={styles.history}>
            <button
              type="button"
              className={styles.historyButton}
              aria-label={t("되돌리기")}
              title={t("되돌리기 (Ctrl+Z)")}
              disabled={!canUndo}
              onClick={() => session.undo(ctx)}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.historyButton}
              aria-label={t("다시 실행")}
              title={t("다시 실행 (Ctrl+Shift+Z)")}
              disabled={!canRedo}
              onClick={() => session.redo(ctx)}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path d="M15 14l5-5-5-5" />
                <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.historyButton}
              aria-label={t("일괄 비우기")}
              title={t("일괄 비우기 — 되돌리기로 복구할 수 있어요")}
              disabled={filled === 0 && isEmptyMember(squad.shuttle)}
              onClick={() => edit(clearAll)}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path d="M22 4v6h-6" />
                <path d="M20.5 15a8.5 8.5 0 1 1-2-8.9L22 10" />
              </svg>
            </button>
          </span>
        )}
        <span className={styles.spacer} />
        <SaveState state={saveState} />
        {compact ? (
          <button
            ref={moreRef}
            type="button"
            className={styles.moreButton}
            aria-label={t("더 보기 (불러오기 · 내보내기)")}
            aria-haspopup="menu"
            onClick={() => setAnchored({ kind: "more", anchor: moreRef })}
          >
            <MoreIcon />
          </button>
        ) : (
          <>
            <Button
              variant="secondary"
              size="M"
              onClick={() => fileInput.current?.click()}
            >
              {t("불러오기")}
            </Button>
            <Button variant="info" size="M" onClick={onExport}>
              {t("내보내기")}
            </Button>
          </>
        )}
      </div>

      <div className={styles.main}>
        <div className={styles.slots}>
          {resolved.map((r, slot) =>
            r.detail ? (
              <SlotCard
                key={slot}
                slot={slot}
                member={squad.members[slot]}
                resolved={r}
                generation={g}
                chart={chart}
                compact={compact}
                selected={selected === slot}
                hot={hotFor(slot)}
                warning={warningText(t, warningFor(slot, r.detail.speciesId))}
                nature={
                  natures.find((n) => n.id === squad.members[slot].natureId) ??
                  null
                }
                item={
                  items.find((i) => i.id === squad.members[slot].itemId) ?? null
                }
                onSelect={() => setSelected((s) => (s === slot ? -1 : slot))}
                onChange={() => setDialog({ kind: "pokemon", slot })}
                onClear={() => {
                  edit((s) => clearSlot(s, slot))
                  if (selected === slot) setSelected(-1)
                }}
                onDetail={() => setDialog({ kind: "detail", slot })}
                onPickMove={(index) => setDialog({ kind: "move", slot, index })}
                onMemo={(memo) =>
                  session.store(ctx, setMemo(squad, slot, memo))
                }
                onField={(kind: FieldKind, anchor) => {
                  if (kind === "item") setDialog({ kind: "item", slot })
                  else setAnchored({ kind, slot, anchor })
                }}
                onDrop={(from) => edit((s) => moveSlot(s, from, slot))}
              />
            ) : (
              <EmptySlotCard
                key={slot}
                slot={slot}
                compact={compact}
                suggestion={emptyHint}
                onAdd={() => setDialog({ kind: "pokemon", slot })}
                onDrop={(from) => edit((s) => moveSlot(s, from, slot))}
              />
            )
          )}
        </div>
        <AnalysisPanel
          analysis={analysis}
          chart={chart}
          generation={g}
          names={names}
          problems={problems}
          resources={resources}
          selectedSlot={selected}
          onSelectSlot={(slot) => setSelected((s) => (s === slot ? -1 : slot))}
          onHover={setHover}
          hoverType={hover?.type ?? ""}
          compact={compact}
        />
      </div>

      {/* ── 떠 있는 메뉴 ── */}
      {anchored?.kind === "more" && (
        <MenuPopup
          open
          anchorRef={anchored.anchor}
          items={moreItems}
          ariaLabel={t("더 보기")}
          align="end"
          width={180}
          density="compact"
          marks={false}
          onPick={onMore}
          onClose={() => setAnchored(null)}
        />
      )}
      {anchored?.kind === "ability" && (
        <MenuPopup
          open
          anchorRef={anchored.anchor}
          items={(resolved[anchored.slot]?.detail?.abilities ?? []).map(
            (a) => ({
              key: String(a.abilityId),
              content: a.hidden
                ? `${text(a.name, lang)} · ${t("숨겨진 특성")}`
                : text(a.name, lang),
              checked: a.abilityId === squad.members[anchored.slot].abilityId,
              title: text(a.effect, lang),
            })
          )}
          ariaLabel={t("특성")}
          width={220}
          density="compact"
          onPick={(key) =>
            edit((s) => setField(s, anchored.slot, "abilityId", Number(key)))
          }
          onClose={() => setAnchored(null)}
        />
      )}
      {anchored?.kind === "nature" && (
        <NaturePicker
          anchorRef={anchored.anchor}
          natures={natures as Nature[]}
          natureId={squad.members[anchored.slot].natureId}
          onPick={(id) => {
            edit((s) => setField(s, anchored.slot, "natureId", id))
            setAnchored(null)
          }}
          onClose={() => setAnchored(null)}
        />
      )}

      {/* ── 창 ── */}
      {dialog?.kind === "pokemon" && (
        <PokemonPicker
          ctx={ctx}
          shuttle={false}
          currentPokemonId={squad.members[dialog.slot]?.pokemonId ?? 0}
          warningFor={(speciesId) => warningFor(dialog.slot, speciesId)}
          onPick={(id) => pickPokemon(dialog.slot, id)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "move" && resolved[dialog.slot]?.detail && (
        <MovePicker
          ctx={ctx}
          detail={resolved[dialog.slot].detail!}
          currentMoveId={squad.members[dialog.slot].moves[dialog.index] ?? 0}
          onPick={(id) =>
            edit((s) => setMove(s, dialog.slot, dialog.index, id))
          }
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "item" && (
        <ItemPicker
          generation={g}
          versionGroup={versionGroup}
          currentItemId={squad.members[dialog.slot].itemId}
          onPick={(id) => edit((s) => setField(s, dialog.slot, "itemId", id))}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "detail" && resolved[dialog.slot]?.detail && (
        <MemberDetail
          member={squad.members[dialog.slot]}
          pokemonId={resolved[dialog.slot].detail!.pokemonId}
          generation={g}
          version={version}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "shuttle" && (
        <ShuttleDialog
          ctx={ctx}
          squad={squad}
          onEdit={edit}
          onClose={() => setDialog(null)}
        />
      )}
      {ask && <AskDialog request={ask} />}
      {notice && (
        <div className={styles.notice} role="status">
          {notice}
        </div>
      )}
    </div>
  )
}

function SaveState({ state }: { state: ReturnType<typeof useSquadSaveState> }) {
  const t = useT()
  if (state === "idle") return null
  const label =
    state === "saved"
      ? t("저장됨")
      : state === "pending"
        ? t("저장 중…")
        : t("저장하지 못했어요")
  return (
    <span className={styles.saveState} data-state={state}>
      {state === "saved" && <Icon name="check" size={14} strokeWidth={3} />}
      {label}
    </span>
  )
}
