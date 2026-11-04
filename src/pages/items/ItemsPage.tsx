/**
 * 아이템 대백과 (v1 SCR-03). 이 파일은 기본 내보내기 컴포넌트 하나로 둔다:
 * AppShell이 lazy(() => import("../pages/items/ItemsPage.tsx"))로 불러 살려 둔다.
 */
import { DataGate } from "../../components/DataGate.tsx"
import { ItemsScreen } from "./ItemsScreen.tsx"
import styles from "./Items.module.css"

export default function ItemsPage() {
  return (
    <div className={styles.page}>
      <DataGate>
        <ItemsScreen />
      </DataGate>
    </div>
  )
}
