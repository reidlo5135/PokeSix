/** 설정 > 단축키 — macOS면 Ctrl 대신 ⌘ */
import { Panel } from "../../components/Panel.tsx"
import { useT } from "../../i18n/index.ts"
import { isMacPlatform } from "../../shared/platform.ts"
import styles from "./Settings.module.css"

export function KeysPanel() {
  const t = useT()
  const mac = isMacPlatform()
  const mod = mac ? "⌘" : "Ctrl "
  const rows: [string, string][] = [
    [
      `${mod}1 – ${mod}7`,
      t("홈 · 도감 · 아이템 · 스쿼드 · 에디터 · 타운맵 · 설정으로 가요"),
    ],
    [`${mod}K`, t("전체 검색")],
    ["Esc", t("메뉴 · 상세 · 검색을 닫아요")],
    ["↑ ↓ · Enter", t("목록에서 고르고 열어요")],
  ]
  return (
    <Panel
      id="settings-keys"
      tabIndex={-1}
      className={styles.panel}
      header={{ title: t("단축키"), tone: "normal" }}
    >
      <dl className={styles.keys}>
        {rows.map(([keys, desc]) => (
          <div key={keys} className={styles.keyRow}>
            <dt>
              <kbd className={styles.kbd}>{keys}</kbd>
            </dt>
            <dd>{desc}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  )
}
