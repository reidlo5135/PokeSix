// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { DEFAULT_SETTINGS, settingsStore } from "../../state/settings.ts"
import { TABS } from "../tabs.ts"
import { AppBar } from "./AppBar.tsx"

function renderBar(path = "/dex") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppBar
        activeTab="dex"
        hrefOf={(tab) => TABS.find((t) => t.id === tab)?.route ?? "/"}
      />
    </MemoryRouter>
  )
}

describe("앱 막대", () => {
  beforeEach(() => settingsStore.setState({ ...DEFAULT_SETTINGS, games: {} }))
  afterEach(() => cleanup())

  it("마크 → 탭 7개(v3 순서) → 세대 → 검색 → 테마", () => {
    renderBar()
    expect(screen.getByRole("link", { name: "PokeSix 홈" })).toBeTruthy()
    const nav = screen.getByRole("navigation", { name: "주 메뉴" })
    const tabs = within(nav).getAllByRole("link")
    expect(tabs.map((a) => a.textContent)).toEqual([
      "홈",
      "도감",
      "아이템",
      "스쿼드",
      "에디터",
      "타운맵",
      "설정",
    ])
    expect(tabs[1].getAttribute("aria-current")).toBe("page")
    expect(tabs[0].getAttribute("aria-current")).toBeNull()
    expect(
      screen.getByRole("button", { name: "세대 선택: 4세대 신오" })
    ).toBeTruthy()
    expect(screen.getByRole("combobox", { name: "전체 검색" })).toBeTruthy()
    expect(
      screen.getByRole("button", { name: "테마: 시스템 (클릭해 변경)" })
    ).toBeTruthy()
  })

  it("세대 메뉴: 9줄, 지금 세대에 ✓, 고르면 전역 세대가 바뀐다", async () => {
    const user = userEvent.setup()
    renderBar()
    await user.click(screen.getByRole("button", { name: /세대 선택/ }))
    const menu = screen.getByRole("menu", { name: "세대 선택" })
    const rows = within(menu).getAllByRole("menuitemradio")
    expect(rows).toHaveLength(9)
    expect(rows[3].getAttribute("aria-checked")).toBe("true")
    expect(document.activeElement).toBe(rows[3])
    await user.click(rows[5])
    expect(settingsStore.getState().generation).toBe(6)
    expect(screen.queryByRole("menu")).toBeNull()
    expect(
      screen.getByRole("button", { name: "세대 선택: 6세대 칼로스" })
    ).toBeTruthy()
  })

  it("세대 메뉴 키보드: ↓는 돌아가고 Esc는 닫고 버튼으로 초점", async () => {
    const user = userEvent.setup()
    renderBar()
    settingsStore.getState().setGeneration(9)
    const button = screen.getByRole("button", { name: /세대 선택/ })
    button.focus()
    await user.keyboard("{ArrowDown}")
    const rows = screen.getAllByRole("menuitemradio")
    expect(document.activeElement).toBe(rows[8])
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(rows[0])
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("menu")).toBeNull()
    expect(document.activeElement).toBe(button)
  })

  it("테마 메뉴로 다크를 고른다", async () => {
    const user = userEvent.setup()
    renderBar()
    await user.click(screen.getByRole("button", { name: /테마:/ }))
    const menu = screen.getByRole("menu", { name: "테마 선택" })
    await user.click(within(menu).getByRole("menuitemradio", { name: /다크/ }))
    expect(settingsStore.getState().theme).toBe("dark")
  })

  it("전체 검색: 치면 결과 창이 열리고 Esc 두 번이면 지우고 닫는다", async () => {
    const user = userEvent.setup()
    renderBar()
    const input = screen.getByRole("combobox", { name: "전체 검색" })
    await user.click(input)
    await user.keyboard("zz")
    expect(await screen.findByText("검색 결과가 없어요")).toBeTruthy()
    expect(input.getAttribute("aria-expanded")).toBe("true")
    await user.keyboard("{Escape}")
    expect(screen.queryByText("검색 결과가 없어요")).toBeNull()
    expect((input as HTMLInputElement).value).toBe("zz")
    await user.keyboard("{Escape}")
    expect((input as HTMLInputElement).value).toBe("")
  })

  it("화면 언어를 바꾸면 바로 다시 그린다", async () => {
    renderBar()
    settingsStore.getState().setUiLanguage("en")
    const nav = await screen.findByRole("navigation", { name: "Main menu" })
    expect(
      within(nav)
        .getAllByRole("link")
        .map((a) => a.textContent)
    ).toEqual([
      "Home",
      "Pokédex",
      "Items",
      "Squad",
      "Editor",
      "Town Map",
      "Settings",
    ])
  })
})
