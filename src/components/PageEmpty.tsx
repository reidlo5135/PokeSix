/**
 * 아직 만들지 않은 화면의 자리 — 가운데 빈 상태 "이 화면은 준비 중이에요".
 */
import { useT } from "../i18n/index.ts"
import { EmptyState } from "./EmptyState.tsx"
import styles from "./PageEmpty.module.css"

export function PageEmpty({ title }: { title?: string }) {
  const t = useT()
  return (
    <main className={styles.page}>
      <EmptyState title={title ?? t("이 화면은 준비 중이에요")} />
    </main>
  )
}
