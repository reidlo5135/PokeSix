/** "2026-10-12T02:56:12Z" → 지역 시각 "2026-10-12 11:56". 읽지 못하면 원문 그대로 */
export function formatLocalDateTime(iso: string): string {
  const d = new Date(iso)
  if (iso === "" || Number.isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
