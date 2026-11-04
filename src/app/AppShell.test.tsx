// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { DEFAULT_SETTINGS, settingsStore } from "../state/settings.ts"
import { routes } from "./router.tsx"

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

const press = (code: string) =>
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { code, ctrlKey: true, bubbles: true })
    )
  })

describe("앱 셸", () => {
  beforeEach(() => settingsStore.setState({ ...DEFAULT_SETTINGS, games: {} }))
  afterEach(() => cleanup())

  it("홈: 제목 · 세대 카드 9장(지금 세대 표시)", async () => {
    renderAt("/")
    expect(
      await screen.findByRole("heading", { name: "어느 세대를 여행할까요?" })
    ).toBeTruthy()
    const cards = screen.getAllByRole("link", { name: /세대 .+ 선택$/ })
    expect(cards).toHaveLength(9)
    expect(cards[3].getAttribute("aria-current")).toBe("true")
    expect(screen.getByText("전국도감 No.1–1025 · 9세대")).toBeTruthy()
  })

  it("Ctrl+2 → 도감, Ctrl+7 → 설정, 모르는 주소 → 홈", async () => {
    const router = renderAt("/")
    await screen.findByRole("heading", { name: "어느 세대를 여행할까요?" })
    await press("Digit2")
    expect(router.state.location.pathname).toBe("/dex")
    await press("Digit7")
    expect(router.state.location.pathname).toBe("/settings")
    expect(
      await screen.findByRole("navigation", { name: "설정 분류" })
    ).toBeTruthy()
    await act(() => router.navigate("/nowhere"))
    expect(router.state.location.pathname).toBe("/")
  })

  it("세대 카드를 누르면 그 세대로 바꾸고 도감으로", async () => {
    const router = renderAt("/")
    const card = await screen.findByRole("link", { name: "2세대 성도 선택" })
    await act(async () => card.click())
    expect(settingsStore.getState().generation).toBe(2)
    expect(router.state.location.pathname).toBe("/dex")
  })
})
