/**
 * 홈 (v1 SCR-01) — 제목 줄 · 세대 카드 9장 · 최근 스쿼드(또는 첫 실행 데이터 창) · 바로 가기.
 */
import { useT } from "../../i18n/index.ts"
import { nationalRange } from "../../shared/generations.ts"
import { useDataStatus } from "../../state/data.ts"
import { FirstRunPanel } from "./FirstRunPanel.tsx"
import { GenerationCards } from "./GenerationCards.tsx"
import { QuickLinks } from "./QuickLinks.tsx"
import { RecentSquads } from "./RecentSquads.tsx"
import styles from "./Home.module.css"

export default function HomePage() {
  const t = useT()
  const status = useDataStatus()
  const range = nationalRange()
  const needsData = status === "missing"
  return (
    <main className={styles.home}>
      <div className={styles.titleRow}>
        <div className={styles.titleText}>
          <h1 className={styles.title}>{t("어느 세대를 여행할까요?")}</h1>
          <p className={styles.subtitle}>
            {t(
              "고른 세대의 도감 범위 · 타입 상성표 · 물리/특수 판정 규칙이 모든 화면에 적용돼요."
            )}
          </p>
        </div>
        <span className={styles.range}>
          {t(
            "전국도감 No.%1–%2 · %3세대",
            range.from,
            range.to,
            range.generations
          )}
        </span>
      </div>
      <GenerationCards />
      <div className={styles.bottom}>
        {needsData ? <FirstRunPanel /> : <RecentSquads />}
        <QuickLinks locked={needsData} />
      </div>
    </main>
  )
}
