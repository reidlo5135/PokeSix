/**
 * 앱 막대 전체 검색 (C-06 · spec §6). 지금 세대의 포켓몬 · 기술 · 아이템을 묶음별로 보여 준다.
 * 넓은 창: 막대 안 검색 칸 + 아래 결과 창. 1099 이하: 아이콘 버튼 → 검색 칸이 든 떠 있는 창.
 * Ctrl/⌘+K = 열기 · ↑↓ 고르기(돌아감) · Enter 열기 · Esc 한 번 = 결과 닫기, 두 번 = 지우고 나가기.
 */
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"

import {
  CategoryCell,
  MoveTypeSquare,
  TypeChip,
} from "../../components/TypeChip.tsx"
import { Cursor } from "../../components/Cursor.tsx"
import { Icon } from "../../components/Icon.tsx"
import { SearchField } from "../../components/SearchField.tsx"
import { ItemIcon, PokemonIcon } from "../../components/Sprite.tsx"
import { ctx, useT } from "../../i18n/index.ts"
import { accelLabel } from "../../shared/platform.ts"
import { displayNameOf, textOf } from "../../shared/text.ts"
import { useMediaQuery } from "../../shared/useMediaQuery.ts"
import { useDataStatus, useDataVersion } from "../../state/data.ts"
import { useGeneration, useSettings } from "../../state/settings.ts"
import { onGlobalSearchRequest } from "../searchBus.ts"
import {
  corpusFor,
  filterCorpus,
  isEmptyResult,
  type SearchResult,
} from "./searchCorpus.ts"
import styles from "./GlobalSearch.module.css"

const COMPACT_QUERY = "(max-width: 1099px)" // breakpoint.medium − 1

/** 키보드로 고를 수 있는 줄 */
type Option =
  | { key: string; kind: "pokemon"; href: string }
  | { key: string; kind: "item"; href: string }
  | { key: string; kind: "more"; href: string }

export function GlobalSearch() {
  const t = useT()
  const navigate = useNavigate()
  const listId = useId()
  const generation = useGeneration()
  const dataVersion = useDataVersion()
  const dataStatus = useDataStatus()
  const lang = useSettings((s) => s.nameLanguage)
  const showOriginal = useSettings((s) => s.showOriginalName)
  const compact = useMediaQuery(COMPACT_QUERY)

  const [raw, setRaw] = useState("")
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)

  const hasQuery = query.trim() !== ""
  const result: SearchResult | null = useMemo(
    () =>
      hasQuery ? filterCorpus(corpusFor(generation, dataVersion), query) : null,
    [hasQuery, query, generation, dataVersion]
  )

  const options: Option[] = useMemo(() => {
    if (!result) return []
    const q = encodeURIComponent(query.trim())
    const out: Option[] = []
    for (const p of result.pokemon.rows)
      out.push({ key: `p${p.id}`, kind: "pokemon", href: `/dex/${p.id}` })
    if (result.pokemon.total > result.pokemon.rows.length)
      out.push({ key: "more-p", kind: "more", href: `/dex?q=${q}` })
    for (const i of result.items.rows)
      out.push({ key: `i${i.id}`, kind: "item", href: `/items?item=${i.id}` })
    if (result.items.total > result.items.rows.length)
      out.push({ key: "more-i", kind: "more", href: `/items?q=${q}` })
    return out
  }, [result, query])

  const popupVisible = compact ? open : open && hasQuery
  const optionId = (key: string) => `${listId}-${key}`
  const activeOption = active >= 0 ? options[active] : undefined

  // Ctrl+K
  useEffect(
    () =>
      onGlobalSearchRequest(() => {
        setOpen(true)
        if (!compact) {
          inputRef.current?.focus()
          inputRef.current?.select()
        }
      }),
    [compact]
  )

  // 결과 창 자리 (앵커 아래, 오른쪽 끝 맞춤)
  useLayoutEffect(() => {
    const popup = popupRef.current
    const anchor = compact ? buttonRef.current : anchorRef.current
    if (!popupVisible || !popup || !anchor) return
    const r = anchor.getBoundingClientRect()
    const w = Math.max(360, compact ? 0 : r.width)
    popup.style.width = `${w}px`
    popup.style.left = `${Math.max(4, r.right - w)}px`
    popup.style.top = `${r.bottom + 6}px`
    popup.style.maxHeight = `${Math.min(480, window.innerHeight - r.bottom - 26)}px`
  }, [popupVisible, compact, result])

  // 바깥 클릭 → 닫기
  useEffect(() => {
    if (!popupVisible) return
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (
        popupRef.current?.contains(target) ||
        anchorRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      )
        return
      setOpen(false)
    }
    document.addEventListener("pointerdown", onDown, true)
    return () => document.removeEventListener("pointerdown", onDown, true)
  }, [popupVisible])

  const reset = () => {
    setRaw("")
    setQuery("")
    setActive(-1)
  }

  const go = (href: string) => {
    setOpen(false)
    reset()
    inputRef.current?.blur()
    navigate(href)
    if (compact) buttonRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      setOpen(true)
      if (options.length === 0) return
      const delta = e.key === "ArrowDown" ? 1 : -1
      setActive((a) =>
        a < 0
          ? delta > 0
            ? 0
            : options.length - 1
          : (a + delta + options.length) % options.length
      )
    } else if (e.key === "Enter") {
      const target = activeOption ?? options[0]
      if (target && popupVisible) {
        e.preventDefault()
        go(target.href)
      }
    } else if (e.key === "Escape") {
      e.preventDefault()
      if (popupVisible && !(compact && raw === "")) {
        if (compact) {
          setOpen(false)
          buttonRef.current?.focus()
        } else setOpen(false)
      } else {
        reset()
        setOpen(false)
        inputRef.current?.blur()
        if (compact) buttonRef.current?.focus()
      }
    } else if (e.key === "Tab") setOpen(false)
  }

  const field = (
    <SearchField
      ariaLabel={t("전체 검색")}
      placeholder={t("포켓몬 · 기술 · 아이템")}
      value={raw}
      onValueChange={(v) => {
        setRaw(v)
        setOpen(true)
        setActive(-1)
      }}
      onQuery={(q) => {
        setQuery(q)
        setActive(-1)
      }}
      shortcutHint={compact ? undefined : accelLabel("K")}
      inputRef={inputRef}
      autoFocus={compact}
      onKeyDown={onKeyDown}
      onFocus={() => setOpen(true)}
      inputProps={{
        role: "combobox",
        "aria-expanded": popupVisible && hasQuery,
        "aria-controls": listId,
        "aria-autocomplete": "list",
        "aria-activedescendant": activeOption
          ? optionId(activeOption.key)
          : undefined,
      }}
    />
  )

  const renderResults = () => {
    if (!result) return null
    if (dataStatus === "missing")
      return <p className={styles.empty}>{t("데이터가 필요해요")}</p>
    if (isEmptyResult(result))
      return <p className={styles.empty}>{t("검색 결과가 없어요")}</p>
    const optionProps = (key: string, href: string) => {
      const index = options.findIndex((o) => o.key === key)
      return {
        id: optionId(key),
        role: "option" as const,
        "aria-selected": index === active,
        className: styles.row,
        onMouseEnter: () => setActive(index),
        onMouseDown: (e: MouseEvent) => e.preventDefault(),
        onClick: () => go(href),
      }
    }
    const more = (key: string, total: number, shown: number, href: string) =>
      total > shown && (
        <div {...optionProps(key, href)} data-more="">
          <Cursor visible={options[active]?.key === key} />
          <span>{t("%1개 더 보기", total - shown)}</span>
        </div>
      )
    return (
      <>
        {result.pokemon.total > 0 && (
          <div role="group" aria-label={t("포켓몬")} className={styles.group}>
            <div className={styles.groupHead} aria-hidden="true">
              <span>{t("포켓몬")}</span>
              <span className={styles.count}>
                {t("%1개", result.pokemon.total)}
              </span>
            </div>
            {result.pokemon.rows.map((p) => (
              <div key={p.id} {...optionProps(`p${p.id}`, `/dex/${p.id}`)}>
                <Cursor visible={options[active]?.key === `p${p.id}`} />
                <PokemonIcon pokemonId={p.id} alt="" box="search" />
                <span className={styles.no}>
                  No.{String(p.dexNumber).padStart(3, "0")}
                </span>
                <span className={styles.name}>
                  {displayNameOf(p.name, lang, showOriginal)}
                </span>
                <span className={styles.types}>
                  {p.types.map((ty) => (
                    <TypeChip key={ty} type={ty} size="sm" />
                  ))}
                </span>
              </div>
            ))}
            {more(
              "more-p",
              result.pokemon.total,
              result.pokemon.rows.length,
              `/dex?q=${encodeURIComponent(query.trim())}`
            )}
          </div>
        )}
        {result.moves.total > 0 && (
          <div
            role="group"
            aria-label={t(ctx("기술", "GlobalSearch"))}
            className={styles.group}
          >
            <div className={styles.groupHead} aria-hidden="true">
              <span>{t(ctx("기술", "GlobalSearch"))}</span>
              <span className={styles.count}>
                {t("%1개", result.moves.total)}
              </span>
            </div>
            {result.moves.rows.map((m) => (
              <div
                key={m.id}
                role="option"
                aria-selected={false}
                aria-disabled="true"
                className={styles.row}
                data-static=""
              >
                <Cursor visible={false} />
                {m.type ? <MoveTypeSquare type={m.type} /> : <span />}
                <span className={styles.name}>
                  {displayNameOf(m.name, lang, showOriginal)}
                </span>
                <span className={styles.power}>
                  {m.power > 0 ? m.power : "—"}
                </span>
                <CategoryCell damageClass={m.damageClass} />
              </div>
            ))}
          </div>
        )}
        {result.items.total > 0 && (
          <div role="group" aria-label={t("아이템")} className={styles.group}>
            <div className={styles.groupHead} aria-hidden="true">
              <span>{t("아이템")}</span>
              <span className={styles.count}>
                {t("%1개", result.items.total)}
              </span>
            </div>
            {result.items.rows.map((i) => (
              <div
                key={i.id}
                {...optionProps(`i${i.id}`, `/items?item=${i.id}`)}
                data-kind="item"
              >
                <Cursor visible={options[active]?.key === `i${i.id}`} />
                <ItemIcon
                  identifier={i.identifier}
                  machineType={i.machineType || null}
                  generation={generation}
                  alt=""
                />
                <span className={styles.name}>{textOf(i.name, lang)}</span>
              </div>
            ))}
            {more(
              "more-i",
              result.items.total,
              result.items.rows.length,
              `/items?q=${encodeURIComponent(query.trim())}`
            )}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {compact ? (
        <button
          ref={buttonRef}
          type="button"
          className={styles.iconButton}
          aria-label={t("전체 검색 (%1)", accelLabel("K"))}
          title={t("전체 검색 (%1)", accelLabel("K"))}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name="search" size={16} strokeWidth={2.4} />
        </button>
      ) : (
        <div ref={anchorRef} className={styles.inline}>
          {field}
        </div>
      )}
      {popupVisible &&
        createPortal(
          <div
            ref={popupRef}
            className={styles.popup}
            data-compact={compact ? "" : undefined}
          >
            {compact && <div className={styles.popField}>{field}</div>}
            <div
              id={listId}
              role="listbox"
              aria-label={t("검색 결과")}
              className={styles.list}
            >
              {renderResults()}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
