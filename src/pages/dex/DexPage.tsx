/**
 * 도감 대백과 (v1 SCR-02). 이 파일은 기본 내보내기 컴포넌트 하나로 둔다:
 * AppShell이 lazy(() => import("../pages/dex/DexPage.tsx"))로 불러 살려 둔다.
 */
import { DataGate } from "../../components/DataGate.tsx"
import { DexScreen } from "./DexScreen.tsx"
import styles from "./Dex.module.css"

export default function DexPage() {
  return (
    <div className={styles.page}>
      <DataGate>
        <DexScreen />
      </DataGate>
    </div>
  )
}
