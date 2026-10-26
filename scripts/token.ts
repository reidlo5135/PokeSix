type ColorMap = Record<string, string>

type TypeColor = {
  key: string
  fill: string
  text: string
}

export type Tokens = {
  color: {
    light: ColorMap
    darkOverrides: ColorMap
    lightStates: ColorMap
    darkStates: ColorMap
  }
  type: TypeColor[]
  size: Record<string, number>
  space: number[]
}

const LIGHT_SUPPLEMENT: ColorMap = {
  "red.asText": "#D8322B",
  "danger.asText": "#B8241D",
  "glyph.ink": "#2A2A33",
  raised: "#FFFFFF",
}

const NOT_A_SET: Set<string> = new Set(["appBarTabs"])

export function toCssName(group: string, key: string): string {
  const kebab = key
    .replaceAll(".", "-")
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
  return `--${group}-${kebab}`
}

export function buildTokenCss(tokens: Tokens): string {
  const lines: string[] = []
  const add = (name: string, value: string) =>
    lines.push(`  ${name}: ${value};`)

  lines.push(":root {")
  for (const [key, value] of Object.entries({
    ...tokens.color.light,
    ...LIGHT_SUPPLEMENT,
  }))
    add(toCssName("color", key), value)

  for (const [key, value] of Object.entries(tokens.color.lightStates))
    add(toCssName("state", key), value)
  for (const t of tokens.type) {
    add(`--type-${t.key}`, t.fill)
    add(`--type-${t.key}-text`, t.text)
  }
  for (const [key, value] of Object.entries(tokens.size)) {
    if (NOT_A_SET.has(key)) continue
    add(toCssName("size", key), `${value}px`)
  }
  tokens.space.forEach((value, i) => add(`--space-${i + 1}`, `${value}px`))
  lines.push("}")

  lines.push("")
  lines.push('[data-theme="dark"] {')
  for (const [key, value] of Object.entries({ ...tokens.color.darkOverrides }))
    add(toCssName("color", key), value)
  for (const [key, value] of Object.entries(tokens.color.darkStates))
    add(toCssName("state", key), value)
  lines.push("}")

  return lines.join("\n") + "\n"
}
