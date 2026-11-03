/**
 * CSV 받기 — 매니페스트 순서대로 하나씩. 이미 받아 둔(크기 · SHA-256이 맞는) 파일은 건너뛴다.
 * 오류 문구는 첫 실행 패널에 그대로 보인다.
 */
import { csvKey, readBytes, writeBytes } from "../db/storage.ts"
import {
  CSV_FILES,
  CSV_TOTAL_SIZE,
  POKEAPI_COMMIT,
  csvUrl,
} from "./manifest.ts"

export type DownloadErrorKind = "network" | "checksum" | "disk" | "cancelled"

export class DownloadError extends Error {
  readonly kind: DownloadErrorKind
  constructor(kind: DownloadErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource)
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function isValidCopy(
  bytes: Uint8Array | null,
  size: number,
  sha256: string
): Promise<boolean> {
  if (!bytes || bytes.length !== size) return false
  return (await sha256Hex(bytes)) === sha256.toLowerCase()
}

/** bytesDone = 다 받은(건너뛴) 파일 크기 합 + 지금 파일에서 받은 만큼 */
export type DownloadProgress = (bytesDone: number, totalBytes: number) => void

export async function downloadAll(
  onProgress: DownloadProgress,
  signal: AbortSignal
): Promise<void> {
  let before = 0
  for (const file of CSV_FILES) {
    if (signal.aborted) throw new DownloadError("cancelled", "취소했어요")
    const key = csvKey(POKEAPI_COMMIT, file.name)
    const cached = await readBytes(key).catch(() => null)
    if (!(await isValidCopy(cached, file.size, file.sha256))) {
      const bytes = await fetchOne(file.name, file.size, signal, (received) =>
        onProgress(before + received, CSV_TOTAL_SIZE)
      )
      if (!(await isValidCopy(bytes, file.size, file.sha256))) {
        throw new DownloadError(
          "checksum",
          `${file.name}의 내용이 예상과 달라요(크기 또는 SHA-256)`
        )
      }
      try {
        await writeBytes(key, bytes)
      } catch (error) {
        throw new DownloadError(
          "disk",
          `파일을 저장할 수 없어요: ${file.name} (${String(error)})`
        )
      }
    }
    before += file.size
    onProgress(before, CSV_TOTAL_SIZE)
  }
}

async function fetchOne(
  name: string,
  size: number,
  signal: AbortSignal,
  onReceived: (bytes: number) => void
): Promise<Uint8Array> {
  let response: Response
  try {
    response = await fetch(csvUrl(name), { signal })
  } catch (error) {
    if (signal.aborted) throw new DownloadError("cancelled", "취소했어요")
    throw new DownloadError(
      "network",
      `${name}을(를) 받지 못했어요: ${String(error)}`
    )
  }
  if (!response.ok || !response.body) {
    throw new DownloadError(
      "network",
      `${name}을(를) 받지 못했어요: HTTP ${response.status}`
    )
  }
  const out = new Uint8Array(size)
  let received = 0
  const reader = response.body.getReader()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (received + value.length > size) {
        throw new DownloadError(
          "checksum",
          `${name}의 내용이 예상과 달라요(크기 또는 SHA-256)`
        )
      }
      out.set(value, received)
      received += value.length
      onReceived(received)
    }
  } catch (error) {
    if (error instanceof DownloadError) throw error
    if (signal.aborted) throw new DownloadError("cancelled", "취소했어요")
    throw new DownloadError(
      "network",
      `${name}을(를) 받지 못했어요: ${String(error)}`
    )
  }
  return received === size ? out : out.subarray(0, received)
}
