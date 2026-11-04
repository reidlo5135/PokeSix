/**
 * 앱 뿌리 — 라우터만 단다. 화면 틀은 app/AppShell.tsx.
 */
import { useState } from "react"
import { RouterProvider } from "react-router-dom"

import { createAppRouter } from "./app/router.tsx"

export default function App() {
  const [router] = useState(createAppRouter)
  return <RouterProvider router={router} />
}
