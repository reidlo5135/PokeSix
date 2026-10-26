export function formatDexNumber(id: number): string {
  return `No.${String(id).padStart(3, "0")}`
}
