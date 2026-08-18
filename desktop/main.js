const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 5000;
const URL = `http://localhost:${PORT}`;

let mainWindow = null;
let serverProc = null;
let serverReady = false;

function waitForServer(timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryConnect = () => {
      fetch(URL)
        .then(() => resolve())
        .catch((err) => {
          if (Date.now() - start > timeoutMs) reject(new Error('Server tidak kunjung siap'));
          else setTimeout(tryConnect, 400);
        });
    };
    tryConnect();
  });
}

function startServer() {
  const isWin = process.platform === 'win32';
  const tsx = path.join(ROOT, 'node_modules', '.bin', isWin ? 'tsx.cmd' : 'tsx');
  serverProc = spawn(tsx, ['agent-chat-server.ts'], {
    cwd: ROOT,
    shell: isWin,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProc.stdout?.on('data', (d) => console.log(`[server] ${String(d).trimEnd()}`));
  serverProc.stderr?.on('data', (d) => console.error(`[server] ${String(d).trimEnd()}`));
  serverProc.on('exit', (code) => {
    console.log(`[server] exited (${code})`);
    serverReady = false;
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'NANDO AGENT AI — Desktop',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Buka link eksternal di browser default, sisanya di window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith(URL)) {
      e.preventDefault();
      if (url.startsWith('http')) shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function boot() {
  if (!serverReady) {
    startServer();
    serverReady = true;
    try {
      await waitForServer();
    } catch (err) {
      console.error(err.message);
    }
  }
  createWindow();
  mainWindow.loadURL(URL);
}

app.whenReady().then(boot);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  if (serverProc) {
    try {
      serverProc.kill();
    } catch {}
    serverProc = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) boot();
});
