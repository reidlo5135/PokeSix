/**
 * 분류 창(초록 머리) — 묶음 버튼 8개 + 맨 아래 "n세대에 있는 것만" 체크.
 * 버튼을 마우스로 눌러도 검색 칸의 포커스를 뺏지 않는다(Qt TabFocus).
 */
import { Checkbox } from "../../components/Checkbox.tsx"
import { NavList, NavListItem } from "../../components/NavListItem.tsx"
import { Panel } from "../../components/Panel.tsx"
import { text } from "../../data/text/localizedText.ts"
import { ctx, useT } from "../../i18n/index.ts"
import { useUiLanguage } from "../../state/settings.ts"
import type { ItemGroup } from "./itemGroups.ts"
import styles from "./Items.module.css"

export interface CategoryNavProps {
  groups: readonly ItemGroup[]
  current: string
  onPick: (key: string) => void
  generation: number
  onlyThisGeneration: boolean
  onOnlyThisGenerationChange: (value: boolean) => void
}

export function CategoryNav({
  groups,
  current,
  onPick,
  generation,
  onlyThisGeneration,
  onOnlyThisGenerationChange,
}: CategoryNavProps) {
  const t = useT()
  const lang = useUiLanguage()
  return (
    <Panel
      as="aside"
      aria-label={t(ctx("분류", "Items"))}
      header={{ title: t(ctx("분류", "Items")), tone: "green" }}
      bodyClassName={styles.navBody}
    >
      <div className={styles.navList} onMouseDown={(e) => e.preventDefault()}>
        <NavList>
          {groups.map((g) => (
            <NavListItem
              key={g.key}
              selected={g.key === current}
              swatch={g.color}
              onClick={() => onPick(g.key)}
            >
              {text(g.label, lang)}
            </NavListItem>
          ))}
        </NavList>
      </div>
      <div className={styles.genCheck}>
        <Checkbox
          checked={onlyThisGeneration}
          onChange={onOnlyThisGenerationChange}
          label={t("%1세대에 있는 것만", generation)}
          hint={t("끄면 다른 세대 아이템도 흐리게 함께 보여요.")}
        />
      </div>
    </Panel>
  )
}
