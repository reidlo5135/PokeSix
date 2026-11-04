import { useEffect, useState } from "react"

import { bookNow, loadBook, type GameBook } from "./guidebook.ts"

/** 그 게임 묶음의 입수 사전. 불러오는 동안은 undefined(다 오면 다시 그린다) */
export function useGameBook(versionGroup: string): GameBook | undefined {
  const [, setLoaded] = useState(0)
  const book = versionGroup ? bookNow(versionGroup) : undefined
  useEffect(() => {
    if (!versionGroup || bookNow(versionGroup)) return
    let alive = true
    void loadBook(versionGroup).then(() => {
      if (alive) setLoaded((n) => n + 1)
    })
    return () => {
      alive = false
    }
  }, [versionGroup])
  return book
}
