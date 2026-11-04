// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { MapView } from "./MapView.tsx"
import { regionMap } from "./townmapBook.ts"

const names: Record<string, string> = {
  "cherrygrove-city": "무궁시티",
  "new-bark-town": "연두마을",
}
const nameOf = (id: string) => names[id] ?? id

function setup(selected = "") {
  const onSelect = vi.fn()
  const view = render(
    <MapView
      map={regionMap("johto-kanto")}
      nameOf={nameOf}
      layerLabels={["성도", "관동"]}
      selected={selected}
      onSelect={onSelect}
      ariaLabel="성도 · 관동 타운맵"
    />
  )
  return { onSelect, ...view }
}

afterEach(cleanup)

describe("MapView", () => {
  it("지도가 없으면 준비 중 안내", () => {
    render(
      <MapView
        map={null}
        nameOf={nameOf}
        layerLabels={[]}
        selected=""
        onSelect={() => {}}
        ariaLabel="타운맵"
      />
    )
    expect(screen.getByText("이 지방의 지도는 아직 준비 중이에요")).toBeTruthy()
  })

  it("장소마다 버튼 하나 · 레이어 이름표 · 그림 받는 중 안내", () => {
    setup()
    expect(screen.getAllByRole("button")).toHaveLength(91)
    expect(screen.getByText("성도")).toBeTruthy()
    expect(screen.getByText("관동")).toBeTruthy()
    expect(screen.getByText("지도 그림을 받는 중이에요…")).toBeTruthy()
  })

  it("키보드로 고르고 Esc로 푼다", () => {
    const { onSelect, rerender } = setup()
    fireEvent.click(screen.getByRole("button", { name: "연두마을" }))
    expect(onSelect).toHaveBeenLastCalledWith("new-bark-town")
    rerender(
      <MapView
        map={regionMap("johto-kanto")}
        nameOf={nameOf}
        layerLabels={["성도", "관동"]}
        selected="new-bark-town"
        onSelect={onSelect}
        ariaLabel="성도 · 관동 타운맵"
      />
    )
    expect(
      screen
        .getByRole("button", { name: "연두마을" })
        .getAttribute("aria-pressed")
    ).toBe("true")
    fireEvent.keyDown(screen.getByRole("group"), { key: "Escape" })
    expect(onSelect).toHaveBeenLastCalledWith("")
  })

  it("포인터 클릭 = 그 자리의 가장 작은 노드", () => {
    const { onSelect } = setup()
    const view = screen.getByRole("group")
    // jsdom: 뷰 크기 0 → 배율 1, 원점 (0, 0)
    fireEvent.pointerDown(view, { button: 0, clientX: 113, clientY: 112 })
    fireEvent.pointerUp(view, { button: 0, clientX: 113, clientY: 112 })
    expect(onSelect).toHaveBeenLastCalledWith("cherrygrove-city")
  })

  it("그림을 받지 못하면 실패 안내로 바뀐다", () => {
    const { container } = setup()
    const img = container.querySelector("img")
    expect(img?.getAttribute("src")).toBe(
      "https://www.serebii.net/pokearth/johto.png"
    )
    fireEvent.error(img!)
    expect(screen.getByText("지도 그림을 받지 못했어요")).toBeTruthy()
  })
})
