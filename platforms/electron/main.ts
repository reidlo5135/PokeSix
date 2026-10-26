import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { app, BrowserWindow, net, protocol, shell } from "electron"

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

function createWindow(entryUrl: string): BrowserWindow {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: "PokeSix",
    backgroundColor: "#F3EFE6",
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
