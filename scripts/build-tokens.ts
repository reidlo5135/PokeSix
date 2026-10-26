import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { buildTokenCss } from "./token.ts"

const SOURCE = "design/handoff-v3/design/tokens.json"
const OUTPUT = "src/styles/tokens.css"

const tokens = JSON.parse(readFileSync(SOURCE, "utf8"))

async function main(): Promise<void> {
  mkdirSync("src/styles", { recursive: true })
  writeFileSync(OUTPUT, buildTokenCss(tokens))
}

await main()
