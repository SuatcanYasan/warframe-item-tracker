const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

let serverProcess = null;
const APP_PORT = process.env.PORT || "3000";
const STATE_FILE_NAME = "wf-state.json";

function getStateFilePath() {
  return path.join(app.getPath("userData"), STATE_FILE_NAME);
}

async function readDesktopState() {
  try {
    const raw = await fs.readFile(getStateFilePath(), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeDesktopState(payload) {
  const filePath = getStateFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  return true;
}

function startBackend() {
  const serverPath = path.join(__dirname, "..", "src", "server.js");
  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      PORT: APP_PORT,
    },
    stdio: "inherit",
    windowsHide: true,
  });
}

function stopBackend() {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
  serverProcess = null;
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#0b1220",
    autoHideMenuBar: true,
    title: "Warframe Craft Tracker",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  window.loadURL(`http://localhost:${APP_PORT}`);
}

function checkServerReady() {
  return new Promise((resolve) => {
    const request = http.get(`http://localhost:${APP_PORT}/api/health`, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });

    request.on("error", () => resolve(false));
    request.setTimeout(1200, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServerReady(maxAttempts = 45) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const ready = await checkServerReady();
    if (ready) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
}

app.whenReady().then(() => {
  ipcMain.handle("wf-storage:get", async () => readDesktopState());
  ipcMain.handle("wf-storage:set", async (_event, payload) => writeDesktopState(payload));

  startBackend();

  waitForServerReady().then((isReady) => {
    if (isReady) {
      createWindow();
      return;
    }

    const fallback = new BrowserWindow({
      width: 900,
      height: 620,
      autoHideMenuBar: true,
      backgroundColor: "#0b1220",
      title: "Warframe Craft Tracker",
    });

    fallback.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent("<html><body style='font-family:Segoe UI;background:#0b1220;color:#eaf0ff;padding:24px;'><h2>Uygulama baslatilamadi</h2><p>Backend hazir degil. Lutfen uygulamayi tekrar ac veya terminal ciktisini kontrol et.</p></body></html>"),
    );
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopBackend();
});

