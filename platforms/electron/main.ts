import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import {
  app,
  BrowserWindow,
  nativeTheme,
  net,
  protocol,
  screen,
  shell,
} from "electron"

const SCHEME = "app"
const APP_ORIGIN = `${SCHEME}://pokesix`
const DIST_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "dist"
)

const devUrl = process.argv
  .find((arg) => arg.startsWith("--dev-url="))
  ?.slice("--dev-url=".length)

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true, // crypto.subtle(SHA-256 확인) · IndexedDB가 보안 컨텍스트를 요구한다
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
])

function serveDist(): void {
  protocol.handle(SCHEME, async (request) => {
    const { pathname } = new URL(request.url)
    const file = path.normalize(
      path.join(DIST_DIR, decodeURIComponent(pathname))
    )
    if (!file.startsWith(DIST_DIR + path.sep)) {
      return new Response("Not found", { status: 404 })
    }
    const asset = await net
      .fetch(pathToFileURL(file).toString())
      .catch(() => null)
    if (asset?.ok) return asset
    return net.fetch(
      pathToFileURL(path.join(DIST_DIR, "index.html")).toString()
    )
  })
}

function originOf(url: string): string {
  const { protocol: scheme, host } = new URL(url)
  return `${scheme}//${host}`
}

// 처음 창 크기: 화면 작업 영역 안에서 1440 × 960까지. 스쿼드 슬롯 3줄 · 홈 아래 칸이 스크롤 없이 들어가는 높이
const PREFERRED_WIDTH = 1440
const PREFERRED_HEIGHT = 960

function createWindow(entryUrl: string): BrowserWindow {
  const area = screen.getPrimaryDisplay().workAreaSize
  const window = new BrowserWindow({
    width: Math.min(PREFERRED_WIDTH, area.width),
    height: Math.min(PREFERRED_HEIGHT, area.height),
    center: true,
    minWidth: 960,
    minHeight: 640,
    title: "PokeSix",
    // 첫 그림 전 배경 — 화면 테마는 렌더러가 정한다. 여기서는 OS 테마로 번쩍임만 줄인다(토큰 paper 값)
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#1B1B21" : "#F3EFE6",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  })

  const appOrigin = originOf(entryUrl)
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) void shell.openExternal(url)
    return { action: "deny" }
  })
  window.webContents.on("will-navigate", (event, url) => {
    if (originOf(url) === appOrigin) return
    event.preventDefault()
    if (/^https?:/.test(url)) void shell.openExternal(url)
  })

  void window.loadURL(entryUrl)
  return window
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  const entryUrl = devUrl ?? `${APP_ORIGIN}/`

  app.on("second-instance", () => {
    const [window] = BrowserWindow.getAllWindows()
    if (!window) return
    if (window.isMinimized()) window.restore()
    window.focus()
  })

  void app.whenReady().then(() => {
    serveDist()
    createWindow(entryUrl)
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow(entryUrl)
    })
  })

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
  })
}
