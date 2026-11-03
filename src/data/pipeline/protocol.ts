/** 메인 스레드 ↔ 데이터 워커 메시지 */
export type ToWorker = { type: "start"; wasmUrl: string } | { type: "cancel" }

export type FromWorker =
  | { type: "progress"; percent: number; stage: "download" | "import" }
  | { type: "finished" }
  | { type: "failed"; message: string }
  | { type: "cancelled" }
