/**
 * 앱 데이터 보관소(IndexedDB) — 키 하나에 바이트 하나.
 * "db" = 완성된 SQLite 파일, "csv:<commit>:<name>" = 받아 둔 CSV(다음에 이어 받기용).
 */

const DB_NAME = "pokesix"
const STORE = "files"

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("indexedDB.open"))
  })
}

async function run<T>(
  mode: IDBTransactionMode,
  body: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode)
      const request = body(tx.objectStore(STORE))
      tx.oncomplete = () => resolve(request.result)
      tx.onerror = () => reject(tx.error ?? new Error("indexedDB transaction"))
      tx.onabort = () => reject(tx.error ?? new Error("indexedDB abort"))
    })
  } finally {
    db.close()
  }
}

export async function readBytes(key: string): Promise<Uint8Array | null> {
  const value: unknown = await run("readonly", (s) => s.get(key))
  if (value instanceof Uint8Array) return value
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  return null
}

export async function writeBytes(
  key: string,
  bytes: Uint8Array
): Promise<void> {
  await run("readwrite", (s) => s.put(bytes, key))
}

export async function removeKeys(prefix: string): Promise<void> {
  await run("readwrite", (s) =>
    s.delete(IDBKeyRange.bound(prefix, `${prefix}￿`))
  )
}

export const DB_KEY = "db"
export const csvKey = (commit: string, name: string) => `csv:${commit}:${name}`
