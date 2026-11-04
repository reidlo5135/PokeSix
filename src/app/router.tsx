/**
 * 경로 7개 (v3 탭 순서). 화면은 AppShell이 직접 그린다(살려 두기) — 여기 경로는 주소 맞추기용.
 * 도감 상세: /dex/:pokemonId (useParams().pokemonId 또는 useMatch("/dex/:pokemonId")).
 */
import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom"

import { AppShell } from "./AppShell.tsx"

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppShell />,
    // 화면은 AppShell이 살려 두고 그린다 — 자식 경로는 주소만 맞추고 그릴 것이 없다(null).
    // element를 비워 두면 React Router가 "leaf route에 element가 없다"고 경고한다
    children: [
      { index: true, element: null },
      { path: "dex", element: null },
      { path: "dex/:pokemonId", element: null },
      { path: "items", element: null },
      { path: "squad", element: null },
      { path: "editor", element: null },
      { path: "townmap", element: null },
      { path: "settings", element: null },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}
