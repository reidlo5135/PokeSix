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

// tokens.json color.light에 없는(다크에만 있는) 키의 라이트 값
const LIGHT_SUPPLEMENT: ColorMap = {
  "red.asText": "#D8322B",
  "danger.asText": "#B8241D",
  "glyph.ink": "#2A2A33",
  raised: "#FFFFFF",
}

/*
 * 면(face)으로 쓸 때 다크에서도 그대로인 색 · 고정 글리프 색 (design-system §1.4, 01b).
 * --color-white는 다크에서 #25252D(창 바탕)라 흰 글자에 쓰면 안 된다 → on-color.
 */
const FIXED_COLORS: ColorMap = {
  onColor: "#FFFFFF",
  onYellow: "#22222A",
  "glyph.onYellow": "#2A2A33",
  "blue.face": "#2C64B0",
  "blue.deepFace": "#1D4E8F",
  "green.face": "#2A7D38",
  "ink.face": "#2A2A33",
  // shell 사양의 이름(-surface)도 같은 값으로 둔다
  "blue.surface": "#2C64B0",
  "blue.deepSurface": "#1D4E8F",
  "green.surface": "#2A7D38",
  "ink.surface": "#2A2A33",
  "alert.line": "#D8322B",
  "cat.physicalText": "#22222A",
  "cat.specialText": "#FFFFFF",
  "cat.statusText": "#22222A",
  // 마크(캡슐) 전용 — 테마와 상관없는 그림 색
  "mark.ink": "#2A2A33",
  "mark.rim": "#FFFFFF",
  // 설정 > 테마 견본 — 지금 테마와 상관없이 늘 그 테마를 보여 준다
  "preview.lightBg": "#F3EFE6",
  "preview.lightLine": "#2A2A33",
  "preview.lightBar": "#D8322B",
  "preview.lightTile": "#FFFFFF",
  "preview.darkBg": "#1B1B21",
  "preview.darkLine": "#0E0E12",
  "preview.darkBar": "#B8241D",
  "preview.darkTileRaised": "#33333D",
  "preview.darkTile": "#25252D",
}

// 테마마다 다른 보충 색 [라이트, 다크]
const THEMED_COLORS: Record<string, [string, string]> = {
  "toggle.knob": ["#FFFFFF", "#E9E6EF"],
  "drawer.shadow": ["rgba(42, 42, 51, 0.18)", "rgba(0, 0, 0, 0.4)"],
  // 확정 버튼 hover — 라이트는 v1 qss, 다크는 디자인에 없어 탭 hover(라이트) 값을 빌린다
  "button.primaryHover": ["#E0443C", "#CF3A31"],
  // 입력 칸 placeholder — 라이트 text-3 · 다크 text-disabled (HomeDark)
  placeholder: ["#6B6872", "#6A6675"],
  backdrop: ["rgba(42, 42, 51, 0.4)", "rgba(0, 0, 0, 0.55)"],
}

const OPACITY: Record<string, number> = {
  absent: 0.55,
  locked: 0.45,
  capsuleGloss: 0.6,
  versionDimmed: 0.72,
}

// 글자 크기 단계 (design-system §1.5) → --fs-<n>
const FONT_SIZES = [
  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 28, 36, 38,
]

// 모서리 단계 (design-system §1.6) → --radius-<n>
const RADII = [1, 2, 3, 4, 5, 6, 8, 10]

// tokens.json size에 없는 치수 (AppBar7 · 02c · 화면 소스)
const EXTRA_SIZES: Record<string, number> = {
  tabInactiveCompact: 35,
  tabActiveCompact: 41,
  tabFont: 18,
  tabFontCompact: 16,
  tabPadXIconOnly: 10,
  appBarMarkCompact: 30,
  appBarPadX: 20,
  appBarPadXCompact: 14,
  appBarGap: 18,
  appBarGapCompact: 14,
  appBarControl: 36,
  appBarControlCompact: 34,
  focusOffset: 2,
  drawerWidth: 380,
  settingsNav: 220,
  homeSide: 440,
  buttonL: 38,
  buttonM: 36,
  buttonS: 34,
  buttonXs: 28,
  menuRow: 34,
  menuRowSmall: 30,
}

// 테마 범위마다 다시 계산해야 하는 값(다른 변수를 참조) — 무늬 · 그림자
const SCOPED: Record<string, string> = {
  "--shadow-2": "0 2px 0 var(--color-ink)",
  "--shadow-3": "0 3px 0 var(--color-ink)",
  "--shadow-4": "0 4px 0 var(--color-ink)",
  "--shadow-drawer": "-6px 0 0 var(--color-drawer-shadow)",
  "--shadow-alert-3": "0 3px 0 var(--color-alert-line)",
  "--pattern-empty-slot":
    "repeating-linear-gradient(135deg, var(--color-paper) 0 8px, var(--color-paper-stripe) 8px 16px)",
  "--pattern-sprite":
    "repeating-linear-gradient(135deg, var(--color-paper-alt) 0 6px, var(--color-paper-stripe) 6px 12px)",
  "--pattern-out-of-gen":
    "repeating-linear-gradient(135deg, var(--color-line-soft) 0 3px, var(--color-white) 3px 6px)",
  "--pattern-empty-move":
    "repeating-linear-gradient(135deg, var(--color-white) 0 2px, var(--color-line) 2px 4px)",
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

  // 라이트 = 기본. 다크 안에 라이트 견본을 둘 수 있게 [data-theme="light"]도 같이
  lines.push(':root,\n[data-theme="light"] {')
  for (const [key, value] of Object.entries({
    ...tokens.color.light,
    ...LIGHT_SUPPLEMENT,
  }))
    add(toCssName("color", key), value)
  for (const [key, [light]] of Object.entries(THEMED_COLORS))
    add(toCssName("color", key), light)

  for (const [key, value] of Object.entries(tokens.color.lightStates))
    add(toCssName("state", key), value)
  lines.push("}")

  lines.push("")
  lines.push(":root {")
  for (const [key, value] of Object.entries(FIXED_COLORS))
    add(toCssName("color", key), value)
  for (const t of tokens.type) {
    add(`--type-${t.key}`, t.fill)
    add(`--type-${t.key}-text`, t.text)
  }
  for (const [key, value] of Object.entries(tokens.size)) {
    if (NOT_A_SET.has(key)) continue
    add(toCssName("size", key), `${value}px`)
  }
  for (const [key, value] of Object.entries(EXTRA_SIZES))
    add(toCssName("size", key), `${value}px`)
  tokens.space.forEach((value, i) => add(`--space-${i + 1}`, `${value}px`))
  for (const n of FONT_SIZES) add(`--fs-${n}`, `${n}px`)
  for (const n of RADII) add(`--radius-${n}`, `${n}px`)
  for (const [key, value] of Object.entries(OPACITY))
    add(toCssName("opacity", key), String(value))
  // 표 밀도 — <html data-density="compact">면 30
  add("--row-h", "var(--size-table-row)")
  lines.push("}")

  lines.push("")
  lines.push('[data-theme="dark"] {')
  for (const [key, value] of Object.entries({ ...tokens.color.darkOverrides }))
    add(toCssName("color", key), value)
  for (const [key, [, dark]] of Object.entries(THEMED_COLORS))
    add(toCssName("color", key), dark)
  for (const [key, value] of Object.entries(tokens.color.darkStates))
    add(toCssName("state", key), value)
  lines.push("}")

  lines.push("")
  lines.push(':root,\n[data-theme="light"],\n[data-theme="dark"] {')
  for (const [name, value] of Object.entries(SCOPED)) add(name, value)
  lines.push("}")

  lines.push("")
  lines.push(':root[data-density="compact"] {')
  add("--row-h", "var(--size-table-row-dense)")
  lines.push("}")

  return lines.join("\n") + "\n"
}
