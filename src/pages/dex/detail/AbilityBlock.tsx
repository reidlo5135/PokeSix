/**
 * 특성(그 세대 칸 순): 이름 + "숨겨진 특성" 꼬리표, 아래 효과 두 줄(전체는 풍선 도움말).
 */
import type { PokemonDetail } from "../../../data/repository/index.ts"
import { text } from "../../../data/text/localizedText.ts"
import { useT } from "../../../i18n/index.ts"
import { useNameLanguage } from "../../../state/settings.ts"
import styles from "./Detail.module.css"

const FIRST_ABILITY_GENERATION = 3

export function AbilityBlock({
  detail,
  generation: g,
}: {
  detail: PokemonDetail
  generation: number
}) {
  const t = useT()
  const lang = useNameLanguage()
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{t("특성")}</h3>
      {detail.abilities.length === 0 ? (
        <p className={styles.muted}>
          {g < FIRST_ABILITY_GENERATION
            ? t("특성은 3세대부터 있어요.")
            : t("특성 정보가 없어요.")}
        </p>
      ) : (
        <ul className={styles.abilities}>
          {detail.abilities.map((a) => {
            const effect = text(a.effect, lang)
            return (
              <li key={`${a.slot}-${a.abilityId}`} className={styles.ability}>
                <span className={styles.abilityName}>
                  {text(a.name, lang)}
                  {a.hidden && (
                    <span className={styles.hiddenTag}>{t("숨겨진 특성")}</span>
                  )}
                </span>
                {effect && (
                  <span className={styles.abilityEffect} title={effect}>
                    {effect}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
