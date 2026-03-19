const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("node:fs/promises");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");
const { spawn, execFile } = require("node:child_process");

let serverProcess = null;
let mainWindow = null;
let backendOwnedByApp = false;
const DEFAULT_APP_PORT = 3444;
let resolvedPort = Number(process.env.PORT || DEFAULT_APP_PORT);
const APP_SIGNATURE = "warframe-craft-tracker";
const STATE_FILE_NAME = "wf-state.json";
const LEGACY_BUSY_PORTS = [3000, 3001, 3002, 3003, 3004, 3005];

if (!Number.isInteger(resolvedPort) || resolvedPort <= 0 || resolvedPort > 65535) {
  resolvedPort = DEFAULT_APP_PORT;
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

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

function getHealth(port) {
  return new Promise((resolve) => {
    const request = http.get(`http://localhost:${port}/api/health`, (response) => {
      let raw = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        raw += chunk;
      });
      response.on("end", () => {
        if (response.statusCode !== 200) {
          resolve(null);
          return;
        }

        try {
          resolve(JSON.parse(raw));
        } catch {
          resolve(null);
        }
      });
    });

    request.on("error", () => resolve(null));
    request.setTimeout(1200, () => {
      request.destroy();
      resolve(null);
    });
  });
}

function isKnownBackend(health) {
  return Boolean(health?.ok && health?.appSignature === APP_SIGNATURE);
}

function runCommand(file, args) {
  return new Promise((resolve, reject) => {
    execFile(file, args, { windowsHide: true, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function parseJsonOutput(raw) {
  const text = String(raw || "").trim();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function getListeningPids(port) {
  if (process.platform !== "win32") {
    return [];
  }

  const command =
    `$rows = Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue ` +
    `| Select-Object -ExpandProperty OwningProcess -Unique; if ($rows) { $rows | ConvertTo-Json -Compress }`;

  try {
    const result = await runCommand("powershell.exe", ["-NoProfile", "-Command", command]);
    const parsed = parseJsonOutput(result.stdout);
    if (!parsed) {
      return [];
    }

    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0);
  } catch {
    return [];
  }
}

async function getProcessInfo(pid) {
  if (process.platform !== "win32") {
    return null;
  }

  const command =
    `Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" -ErrorAction SilentlyContinue ` +
    `| Select-Object ProcessId,Name,CommandLine | ConvertTo-Json -Compress`;

  try {
    const result = await runCommand("powershell.exe", ["-NoProfile", "-Command", command]);
    return parseJsonOutput(result.stdout);
  } catch {
    return null;
  }
}

function isTrackerRelatedProcess(processInfo) {
  const name = String(processInfo?.Name || "").toLowerCase();
  const commandLine = String(processInfo?.CommandLine || "").toLowerCase();
  return (
    commandLine.includes("warframe-todo") ||
    commandLine.includes("src\\server.js") ||
    commandLine.includes("warframe craft tracker") ||
    name.includes("warframe")
  );
}

async function killProcessTree(pid) {
  if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) {
    return false;
  }

  try {
    await runCommand("taskkill", ["/PID", String(pid), "/T", "/F"]);
    return true;
  } catch {
    return false;
  }
}

async function cleanupStaleBackends(targetPort) {
  const candidatePorts = [...new Set([targetPort, ...LEGACY_BUSY_PORTS])].filter(
    (port) => Number.isInteger(port) && port > 0 && port <= 65535,
  );
  const pidsToKill = new Set();

  for (const port of candidatePorts) {
    // eslint-disable-next-line no-await-in-loop
    const health = await getHealth(port);
    if (isKnownBackend(health) && Number.isInteger(health.pid)) {
      pidsToKill.add(health.pid);
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const listeners = await getListeningPids(port);
    for (const pid of listeners) {
      if (pid === process.pid) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const processInfo = await getProcessInfo(pid);
      if (isTrackerRelatedProcess(processInfo)) {
        pidsToKill.add(pid);
      }
    }
  }

  for (const pid of pidsToKill) {
    // eslint-disable-next-line no-await-in-loop
    const killed = await killProcessTree(pid);
    if (killed) {
      console.log(`Stopped stale tracker process PID=${pid}`);
    }
  }

  if (pidsToKill.size > 0) {
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
}

function canBindPort(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();

    probe.once("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        resolve(false);
        return;
      }
      resolve(false);
    });

    probe.once("listening", () => {
      probe.close(() => resolve(true));
    });

    probe.listen(port);
  });
}

function startBackend(port) {
  const serverPath = path.join(__dirname, "..", "src", "server.js");
  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      PORT: String(port),
      // Electron binary'yi Node davranisinda calistirarak backend scriptini dogrudan baslatir.
      ELECTRON_RUN_AS_NODE: "1",
    },
    stdio: "inherit",
    windowsHide: true,
  });
  backendOwnedByApp = true;

  serverProcess.on("error", (error) => {
    console.error("Backend process start error:", error);
  });

  serverProcess.on("exit", (code, signal) => {
    serverProcess = null;
    backendOwnedByApp = false;
    if (code !== 0 && signal !== "SIGTERM") {
      console.error(`Backend process exited unexpectedly. code=${code} signal=${signal}`);
    }
  });
}

function stopBackend() {
  if (!backendOwnedByApp || !serverProcess) {
    return;
  }

  if (!serverProcess.killed) {
    serverProcess.kill();
  }

  backendOwnedByApp = false;
  serverProcess = null;
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#0b1220",
    autoHideMenuBar: true,
    title: "Warframe Craft Tracker",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      devTools: !app.isPackaged,
      spellcheck: false,
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadURL(`http://localhost:${port}`);
}

async function checkServerReady(port) {
  const health = await getHealth(port);
  return isKnownBackend(health);
}

async function waitForServerReady(port, maxAttempts = 45) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const ready = await checkServerReady(port);
    if (ready) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
}

function createFallbackWindow(port, details = "") {
  const fallback = new BrowserWindow({
    width: 900,
    height: 620,
    autoHideMenuBar: true,
    backgroundColor: "#0b1220",
    title: "Warframe Craft Tracker",
  });

  fallback.loadURL(
    "data:text/html;charset=utf-8," +
      encodeURIComponent(
        `<html lang='tr'><body style='font-family:Segoe UI, sans-serif;background:#0b1220;color:#eaf0ff;padding:24px;'><h2>Uygulama baslatilamadi</h2><p>Backend hazir degil (port: ${port}). Lutfen uygulamayi tekrar ac veya bu portu kullanan sureci kapat.</p><p style='opacity:.8'>${details}</p></body></html>`,
      ),
  );
}

app.whenReady().then(async () => {
  ipcMain.handle("wf-storage:get", async () => readDesktopState());
  ipcMain.handle("wf-storage:set", async (_event, payload) => writeDesktopState(payload));

  await cleanupStaleBackends(resolvedPort);

  const portIsFree = await canBindPort(resolvedPort);
  if (!portIsFree) {
    createFallbackWindow(resolvedPort, "Hedef port bosta degil. Portu kullanan sureci kapatip tekrar deneyin.");
    return;
  }

  startBackend(resolvedPort);

  const isReady = await waitForServerReady(resolvedPort);
  if (isReady) {
    createWindow(resolvedPort);
  } else {
    createFallbackWindow(resolvedPort);
  }

  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(resolvedPort);
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

