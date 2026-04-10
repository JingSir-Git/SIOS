// ============================================================
// Electron Main Process — SIOS Desktop Application
// ============================================================
// Loads the Next.js standalone server internally and opens
// the app in a native window. Only network needed is for LLM API calls.

const { app, BrowserWindow, Menu, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const net = require("net");

let mainWindow = null;
let serverProcess = null;
const PORT = 3456;

// ---- Find a free port ----
function findFreePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on("error", () => resolve(findFreePort(startPort + 1)));
  });
}

// ---- Start the Next.js standalone server ----
async function startServer() {
  const port = await findFreePort(PORT);
  const serverPath = path.join(__dirname, "..", ".next", "standalone", "server.js");

  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      NODE_ENV: "production",
    };

    serverProcess = spawn(process.execPath, [serverPath], {
      env,
      cwd: path.join(__dirname, "..", ".next", "standalone"),
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

    // Fallback: resolve after 5 seconds even if no "Ready" message
    setTimeout(() => {
      if (!started) {
        started = true;
        resolve(port);
      }
    }, 5000);
  });
}

// ---- Create the main window ----
function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: "SIOS — Social Intelligence OS",
    icon: path.join(__dirname, "..", "public", "icon-512.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: "#09090b",
    autoHideMenuBar: true,
    titleBarStyle: "hiddenInset",
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

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
        { label: "刷新", accelerator: "CmdOrCtrl+R", click: () => mainWindow?.webContents.reload() },
        { label: "开发者工具", accelerator: "F12", click: () => mainWindow?.webContents.toggleDevTools() },
        { type: "separator" },
        { label: "放大", accelerator: "CmdOrCtrl+=", role: "zoomIn" },
        { label: "缩小", accelerator: "CmdOrCtrl+-", role: "zoomOut" },
        { label: "重置缩放", accelerator: "CmdOrCtrl+0", role: "resetZoom" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---- App Lifecycle ----
app.whenReady().then(async () => {
  buildMenu();

  try {
    const port = await startServer();
    console.log(`Server started on port ${port}`);
    createWindow(port);
  } catch (err) {
    console.error("Failed to start:", err);
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
