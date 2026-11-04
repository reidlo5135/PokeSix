import { useSyncExternalStore } from "react"

/** CSS 미디어 질의를 구독한다 (예: "(max-width: 1099px)") */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof matchMedia !== "function") return () => {}
      const mq = matchMedia(query)
      mq.addEventListener("change", notify)
      return () => mq.removeEventListener("change", notify)
    },
    () => typeof matchMedia === "function" && matchMedia(query).matches,
    () => false
  )
}
