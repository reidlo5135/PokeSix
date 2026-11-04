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
    children: [
      { index: true },
      { path: "dex" },
      { path: "dex/:pokemonId" },
      { path: "items" },
      { path: "squad" },
      { path: "editor" },
      { path: "townmap" },
      { path: "settings" },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]

export function createAppRouter() {
  return createBrowserRouter(routes)
}
