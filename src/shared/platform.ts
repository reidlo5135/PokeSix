/** 실행 환경 판별 — 단축키 표기(⌘ / Ctrl)에 쓴다 */

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false
  const data = (
    navigator as Navigator & { userAgentData?: { platform?: string } }
  ).userAgentData
  const platform = data?.platform ?? navigator.platform ?? ""
  return platform.toLowerCase().includes("mac")
}

/** 단축키 글자: Windows/Linux "Ctrl K", macOS "⌘K" */
export function accelLabel(key: string, mac = isMacPlatform()): string {
  return mac ? `⌘${key}` : `Ctrl ${key}`
}
