/**
 * 바로 가기 3개 (C-38) — 새 스쿼드 만들기 · 도감 대백과 · 아이템 대백과.
 * 데이터가 없으면(첫 실행) 잠기고 설명 대신 "데이터가 필요해요".
 */
import { Link } from "react-router-dom"

import { Icon, type IconName } from "../../components/Icon.tsx"
import { useT } from "../../i18n/index.ts"
import { useGeneration } from "../../state/settings.ts"
import styles from "./Home.module.css"

interface QuickLink {
  to: string
  title: string
  subtitle: string
  icon: IconName
  tone: "primary" | "blue" | "green"
}

export function QuickLinks({ locked }: { locked: boolean }) {
  const t = useT()
  const g = useGeneration()
  const links: QuickLink[] = [
    {
      to: "/squad",
      title: t("새 스쿼드 만들기"),
      subtitle: t("%1세대 규칙으로 여섯 자리를 짜요", g),
      icon: "squadPlus",
      tone: "primary",
    },
    {
      to: "/dex",
      title: t("도감 대백과"),
      subtitle: t("종족값 · 타입 상성 · 습득 기술"),
      icon: "dex",
      tone: "blue",
    },
    {
      to: "/items",
      title: t("아이템 대백과"),
      subtitle: t("회복 · 기술머신 · 진화 · 배틀 · 기타"),
      icon: "items",
      tone: "green",
    },
  ]
  return (
    <section className={styles.quick} aria-label={t("바로 가기")}>
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={styles.quickLink}
          data-tone={link.tone}
          data-locked={locked ? "" : undefined}
          aria-disabled={locked || undefined}
          tabIndex={locked ? -1 : undefined}
          onClick={(e) => {
            if (locked) e.preventDefault()
          }}
        >
          {link.tone === "primary" ? (
            <span className={styles.quickIconBare}>
              <Icon name={link.icon} size={36} strokeWidth={2} />
            </span>
          ) : (
            <span className={styles.quickIconBox} data-tone={link.tone}>
              <Icon name={link.icon} size={22} strokeWidth={2} />
            </span>
          )}
          <span className={styles.quickText}>
            <span className={styles.quickTitle}>{link.title}</span>
            <span className={styles.quickSub}>
              {locked ? t("데이터가 필요해요") : link.subtitle}
            </span>
          </span>
          <Icon
            name="chevronRight"
            size={16}
            strokeWidth={2.6}
            className={styles.chevron}
          />
        </Link>
      ))}
    </section>
  )
}
