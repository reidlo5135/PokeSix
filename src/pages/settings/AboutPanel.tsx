/** 설정 > 정보 — 버전 · 데이터 출처 · 라이선스 */
import licenseText from "../../../LICENSE?raw"
import oflDoHyeon from "../../styles/fonts/OFL-dohyeon.txt?raw"
import oflNanumGothic from "../../styles/fonts/OFL-nanumgothic.txt?raw"
import oflNanumGothicCoding from "../../styles/fonts/OFL-nanumgothiccoding.txt?raw"
import oflSilkscreen from "../../styles/fonts/OFL-silkscreen.txt?raw"
import { Panel } from "../../components/Panel.tsx"
import { useT } from "../../i18n/index.ts"
import styles from "./Settings.module.css"

const LICENSES: readonly { title: string; text: string }[] = [
  { title: "PokeSix — MIT", text: licenseText },
  { title: "Do Hyeon — SIL OFL 1.1", text: oflDoHyeon },
  { title: "Nanum Gothic — SIL OFL 1.1", text: oflNanumGothic },
  { title: "Nanum Gothic Coding — SIL OFL 1.1", text: oflNanumGothicCoding },
  { title: "Silkscreen — SIL OFL 1.1", text: oflSilkscreen },
]

export function AboutPanel() {
  const t = useT()
  return (
    <Panel
      id="settings-about"
      tabIndex={-1}
      className={styles.panel}
      header={{ title: t("정보"), tone: "ink" }}
    >
      <div className={styles.about}>
        <p className={styles.version}>{t("v%1", __APP_VERSION__)}</p>
        <p>{t("데이터: PokéAPI · 비공식 팬 도구")}</p>
        <ul className={styles.licenseList}>
          <li>{t("PokeSix 코드 — MIT")}</li>
          <li>
            {t(
              "글꼴 — SIL Open Font License 1.1 (Do Hyeon · 나눔고딕 · 나눔고딕코딩 · Silkscreen)"
            )}
          </li>
          <li>{t("게임 데이터 — PokéAPI (BSD-3-Clause)")}</li>
          <li>
            {t(
              "포켓몬 이름 · 그림은 Nintendo · Creatures · GAME FREAK의 상표예요."
            )}
          </li>
        </ul>
        {LICENSES.map((l) => (
          <details key={l.title} className={styles.license}>
            <summary>{t("%1 전문 보기", l.title)}</summary>
            <pre>{l.text}</pre>
          </details>
        ))}
      </div>
    </Panel>
  )
}
