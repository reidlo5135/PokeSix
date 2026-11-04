/**
 * 데이터가 있어야 하는 화면을 감싼다. 데이터가 없으면 빈 상태 "데이터가 필요해요" + "홈에서 받기".
 * 확인 중에는 SkeletonRows. <DataGate><DexBody/></DataGate>
 */
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { useT } from "../i18n/index.ts"
import { useDataStatus } from "../state/data.ts"
import { Button } from "./Button.tsx"
import { EmptyState } from "./EmptyState.tsx"
import { SkeletonRows } from "./SkeletonRows.tsx"

export function DataGate({ children }: { children: ReactNode }) {
  const status = useDataStatus()
  const t = useT()
  const navigate = useNavigate()
  if (status === "ready") return <>{children}</>
  if (status === "checking") return <SkeletonRows rows={8} />
  return (
    <EmptyState
      title={t("데이터가 필요해요")}
      reason={t(
        "처음 한 번 PokéAPI에서 데이터를 받아야 이 화면을 쓸 수 있어요."
      )}
      actions={
        <Button variant="primary" size="S" onClick={() => navigate("/")}>
          {t("홈에서 받기")}
        </Button>
      }
    />
  )
}
