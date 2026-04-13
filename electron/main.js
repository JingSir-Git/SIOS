// ============================================================
// Electron Main Process — SIOS Desktop Application
// ============================================================
// Loads the Next.js standalone server internally and opens
// the app in a native window. Only network needed is for LLM API calls.
//
// Paths:
//   Dev:      .next/standalone/server.js  (relative to project root)
//   Packaged: resources/standalone/server.js  (extraResources)

const { app, BrowserWindow, Menu, shell, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const net = require("net");
const fs = require("fs");

let mainWindow = null;
let serverProcess = null;
let splashWindow = null;
const PORT = 3456;

// ---- Resolve paths for both dev and packaged modes ----
function isPackaged() {
  return app.isPackaged;
}

function getStandalonePath() {
  if (isPackaged()) {
    // electron-packager: resources/standalone/
    // electron-builder:  resources/standalone/
    const paths = [
      path.join(process.resourcesPath, "standalone"),
      path.join(process.resourcesPath, ".next", "standalone"),
    ];
    for (const p of paths) {
      if (fs.existsSync(path.join(p, "server.js"))) return p;
    }
    return paths[0]; // fallback
  }
  return path.join(__dirname, "..", ".next", "standalone");
}

function getPublicPath() {
  if (isPackaged()) {
    const paths = [
      path.join(process.resourcesPath, "public"),
      path.join(process.resourcesPath, "standalone", "public"),
    ];
    for (const p of paths) {
      if (fs.existsSync(p)) return p;
    }
    return paths[0];
  }
  return path.join(__dirname, "..", "public");
}

function getServerJsPath() {
  return path.join(getStandalonePath(), "server.js");
}

function getIconPath() {
  const pubPath = getPublicPath();
  const candidates = ["icon-512.svg", "icon-512.png", "favicon.ico"];
  for (const c of candidates) {
    const p = path.join(pubPath, c);
    if (fs.existsSync(p)) return p;
  }
  return path.join(pubPath, "icon-512.svg");
}

// ---- Find a free port ----
function findFreePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on("error", () => resolve(findFreePort(startPort + 1)));
  });
}

// ---- Create a splash/loading window ----
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const html = `
  <!DOCTYPE html>
  <html><head><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      height:100vh; background:rgba(9,9,11,0.95); border-radius:16px;
      font-family:system-ui,-apple-system,sans-serif; color:#f4f4f5;
      -webkit-app-region:drag;
    }
    .title { font-size:28px; font-weight:700; margin-bottom:8px; }
    .subtitle { font-size:13px; color:#a1a1aa; margin-bottom:24px; }
    .spinner {
      width:36px; height:36px; border:3px solid #27272a;
      border-top-color:#8b5cf6; border-radius:50%;
      animation:spin 0.8s linear infinite;
    }
    .status { margin-top:16px; font-size:12px; color:#71717a; }
    @keyframes spin { to { transform:rotate(360deg); } }
  </style></head><body>
    <div class="title">SIOS</div>
    <div class="subtitle">Social Intelligence OS</div>
    <div class="spinner"></div>
    <div class="status">Starting server...</div>
  </body></html>`;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

// ---- Start the Next.js standalone server ----
async function startServer() {
  const port = await findFreePort(PORT);
  const serverPath = getServerJsPath();
  const standalonePath = getStandalonePath();

  // Verify server.js exists
  if (!fs.existsSync(serverPath)) {
    throw new Error(
      `server.js not found at: ${serverPath}\n\n` +
      `Please run 'npm run build' first to generate the standalone output.`
    );
  }

  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
    };

    serverProcess = spawn(process.execPath, [serverPath], {
      env,
      cwd: standalonePath,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let started = false;

    serverProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("[server]", output);
      if (!started && (output.includes("Ready") || output.includes("started") || output.includes("localhost"))) {
        started = true;
        resolve(port);
      }
    });

    serverProcess.stderr.on("data", (data) => {
      console.error("[server:err]", data.toString());
    });

    serverProcess.on("error", (err) => {
      console.error("Failed to start server:", err);
      reject(err);
    });

    serverProcess.on("exit", (code) => {
      if (!started) {
        reject(new Error(`Server exited with code ${code} before starting`));
      }
    });

    // Fallback: resolve after 6 seconds even if no "Ready" message
    setTimeout(() => {
      if (!started) {
        started = true;
        resolve(port);
      }
    }, 6000);
  });
}

// ---- Create the main window ----
function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: "SIOS — Social Intelligence OS",
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: "#09090b",
    autoHideMenuBar: false,
    show: false,
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.once("ready-to-show", () => {
    // Close splash and show main window
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
}

// ---- App Menu ----
function buildMenu() {
  const template = [
    {
      label: "SIOS",
      submenu: [
        { label: "关于 SIOS", role: "about" },
        { type: "separator" },
        { label: "重新加载", accelerator: "CmdOrCtrl+R", click: () => mainWindow?.webContents.reload() },
        { label: "开发者工具", accelerator: "F12", click: () => mainWindow?.webContents.toggleDevTools() },
        { type: "separator" },
        { label: "退出", accelerator: "CmdOrCtrl+Q", click: () => app.quit() },
      ],
    },
    {
      label: "编辑",
      submenu: [
        { label: "撤销", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "重做", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
        { type: "separator" },
        { label: "剪切", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "复制", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "粘贴", accelerator: "CmdOrCtrl+V", role: "paste" },
        { label: "全选", accelerator: "CmdOrCtrl+A", role: "selectAll" },
      ],
    },
    {
      label: "视图",
      submenu: [
        { label: "放大", accelerator: "CmdOrCtrl+=", role: "zoomIn" },
        { label: "缩小", accelerator: "CmdOrCtrl+-", role: "zoomOut" },
        { label: "重置缩放", accelerator: "CmdOrCtrl+Shift+0", role: "resetZoom" },
        { type: "separator" },
        { label: "全屏", accelerator: "F11", click: () => mainWindow?.setFullScreen(!mainWindow?.isFullScreen()) },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---- App Lifecycle ----
app.whenReady().then(async () => {
  buildMenu();
  createSplashWindow();

  try {
    const port = await startServer();
    console.log(`Server started on port ${port}`);
    createWindow(port);
  } catch (err) {
    console.error("Failed to start:", err);
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    dialog.showErrorBox(
      "SIOS 启动失败",
      `无法启动内置服务器：\n\n${err.message}\n\n请确保已运行 npm run build 生成 standalone 构建产物。`
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    startServer().then((port) => createWindow(port));
  }
});
