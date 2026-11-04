import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./styles/tokens.css"
import "./styles/fonts.css"
import "./styles/base.css"
import App from "./App.tsx"

const root = document.getElementById("root")
if (!root) throw new Error("#root가 없어요")

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
