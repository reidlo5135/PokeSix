/**
 * 스쿼드 (v1 SCR-04). 이 파일은 기본 내보내기 컴포넌트 하나로 둔다:
 * AppShell이 lazy(() => import("../pages/squad/SquadPage.tsx"))로 불러 살려 둔다.
 */
import { DataGate } from "../../components/DataGate.tsx"
import { SquadScreen } from "./SquadScreen.tsx"
import styles from "./Squad.module.css"

export default function SquadPage() {
  return (
    <div className={styles.page}>
      <DataGate>
        <SquadScreen />
      </DataGate>
    </div>
  )
}
