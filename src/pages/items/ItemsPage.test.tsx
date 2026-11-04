// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import initSqlJs from "sql.js"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { importCsv } from "../../data/pipeline/importer.ts"
import { bindDatabase } from "../../data/repository/index.ts"
import { dataStore } from "../../state/data.ts"
import { DEFAULT_SETTINGS, settingsStore } from "../../state/settings.ts"
import ItemsPage from "./ItemsPage.tsx"

const CSV = import.meta.glob<string>("/tests/fixtures/pokeapi-csv/*.csv", {
  query: "?raw",
  import: "default",
  eager: true,
})

beforeAll(async () => {
  const SQL = await initSqlJs()
  const db = new SQL.Database()
  importCsv(db, (name) => {
    const text = CSV[`/tests/fixtures/pokeapi-csv/${name}.csv`]
    if (text === undefined) throw new Error(`cannot open ${name}.csv`)
    return text
  })
  bindDatabase(() => db)
})

beforeEach(() => {
  settingsStore.setState({ ...DEFAULT_SETTINGS, games: {} })
  dataStore.setState({ status: "ready", version: 1 })
})
afterEach(() => cleanup())

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ItemsPage />
    </MemoryRouter>
  )
}

describe("아이템 화면 (시드 DB)", () => {
  it("분류 · 목록 · 상세 빈 상태", () => {
    renderAt("/items")
    expect(screen.getByRole("heading", { name: "아이템 대백과" })).toBeTruthy()
    expect(screen.getByRole("button", { name: /진화/ })).toBeTruthy()
    expect(screen.getByRole("option", { name: /각성의돌/ })).toBeTruthy()
    // 4세대에 없는 얼음의돌은 기본(지금 세대만)에서 안 보인다
    expect(screen.queryByRole("option", { name: /얼음의돌/ })).toBeNull()
    expect(screen.getByText(/목록에서 아이템을 고르면/)).toBeTruthy()
  })

  it("분류를 고르면 개수가 바뀌고, 줄을 누르면 상세", () => {
    renderAt("/items")
    fireEvent.click(screen.getByRole("button", { name: /진화/ }))
    expect(screen.getByText("진화 · 2개")).toBeTruthy()
    fireEvent.click(screen.getByRole("option", { name: /각성의돌/ }))
    expect(screen.getByRole("heading", { name: "각성의돌" })).toBeTruthy()
    expect(screen.getByText("4세대에 처음 등장")).toBeTruthy()
    expect(screen.getByText("3,000원")).toBeTruthy()
    // ↓로 다음 줄
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "ArrowDown" })
    expect(screen.getByRole("heading", { name: "불꽃의돌" })).toBeTruthy()
  })

  it("체크를 끄면 다른 세대 아이템도 'n세대 없음'으로", () => {
    renderAt("/items")
    fireEvent.click(screen.getByRole("button", { name: /진화/ }))
    fireEvent.click(screen.getByRole("checkbox", { name: /4세대에 있는 것만/ }))
    expect(screen.getByText("진화 · 3개")).toBeTruthy()
    expect(screen.getByText("4세대 없음")).toBeTruthy()
  })

  it("?item=<id>로 들어오면 그 아이템을 고른다(다른 세대면 체크를 끈다)", async () => {
    renderAt("/items?item=885")
    await act(async () => {})
    expect(screen.getByRole("heading", { name: "얼음의돌" })).toBeTruthy()
    expect(
      (
        screen.getByRole("checkbox", {
          name: /4세대에 있는 것만/,
        }) as HTMLInputElement
      ).checked
    ).toBe(false)
  })

  it("?q=…로 들어오면 검색어를 채운다", () => {
    renderAt("/items?q=%EB%B6%88%EA%BD%83")
    const input = screen.getByRole("textbox", {
      name: "아이템 검색",
    }) as HTMLInputElement
    expect(input.value).toBe("불꽃")
    // 이름 · 효과 · 기술머신의 기술 설명까지 찾는다
    const names = screen.getAllByRole("option").map((o) => o.textContent)
    expect(names.some((n) => n?.startsWith("불꽃의돌"))).toBe(true)
    expect(names.every((n) => n?.includes("불꽃"))).toBe(true)
  })
})
