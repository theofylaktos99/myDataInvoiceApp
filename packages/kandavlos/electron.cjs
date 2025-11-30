const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let backendProcess;

const isDev = process.env.NODE_ENV === 'development';

// ========== AUTO-UPDATER CONFIGURATION ==========
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Configure logging
autoUpdater.logger = require('electron').app;
autoUpdater.logger = {
  info: (msg) => console.log('[AutoUpdater] INFO:', msg),
  warn: (msg) => console.warn('[AutoUpdater] WARN:', msg),
  error: (msg) => console.error('[AutoUpdater] ERROR:', msg),
  debug: (msg) => console.log('[AutoUpdater] DEBUG:', msg),
};

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('[AutoUpdater] Checking for updates...');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'checking' });
  }
});

autoUpdater.on('update-available', (info) => {
  console.log('[AutoUpdater] Update available:', info.version);
  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Διαθέσιμη Ενημέρωση',
      message: `Νέα έκδοση ${info.version} είναι διαθέσιμη!`,
      detail: 'Θέλετε να κατεβάσετε και να εγκαταστήσετε την ενημέρωση;',
      buttons: ['Ναι', 'Αργότερα'],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
        mainWindow.webContents.send('update-status', { status: 'downloading', version: info.version });
      }
    });
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('[AutoUpdater] No update available');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'up-to-date' });
  }
});

autoUpdater.on('error', (err) => {
  console.error('[AutoUpdater] Error:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'error', error: err.message });
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  const percent = Math.round(progressObj.percent);
  console.log(`[AutoUpdater] Download progress: ${percent}%`);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'downloading', 
      percent: percent,
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[AutoUpdater] Update downloaded:', info.version);
  if (mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Ενημέρωση Έτοιμη',
      message: 'Η ενημέρωση κατέβηκε επιτυχώς!',
      detail: 'Η εφαρμογή θα επανεκκινηθεί για να εγκατασταθεί η νέα έκδοση.',
      buttons: ['Επανεκκίνηση Τώρα', 'Αργότερα'],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  }
});

function checkForUpdates() {
  if (!isDev) {
    console.log('[AutoUpdater] Checking for updates...');
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[AutoUpdater] Check failed:', err);
    });
  } else {
    console.log('[AutoUpdater] Skipping update check in dev mode');
  }
}
// ========== END AUTO-UPDATER ==========
const appPath = app.getAppPath();
const backendPath = isDev 
  ? path.join(appPath, '..', 'backendaade', 'aade-backend-standalone.cjs')
  : path.join(appPath, '..', 'backendaade', 'aade-backend-standalone.cjs');

function startBackend() {
  console.log('[Electron] Starting backend server...');
  try {
    backendProcess = spawn('node', [backendPath], {
      cwd: path.dirname(backendPath),
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`[Backend] ${data.toString().trim()}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error] ${data.toString().trim()}`);
    });

    backendProcess.on('error', (err) => {
      console.error('[Electron] Failed to start backend:', err);
    });

    backendProcess.on('exit', (code) => {
      console.log(`[Backend] Process exited with code ${code}`);
    });
  } catch (err) {
    console.error('[Electron] Error starting backend:', err);
  }
}

function stopBackend() {
  if (backendProcess) {
    console.log('[Electron] Stopping backend server...');
    try {
      backendProcess.kill();
    } catch (err) {
      console.error('[Electron] Error stopping backend:', err);
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  const isDev = process.env.NODE_ENV === 'development' || process.defaultApp;
  
  let startURL;
  if (isDev) {
    startURL = 'http://localhost:5173';
  } else {
    // In production (packaged), use multiple fallback paths
    let distPath = null;
    
    // Try 1: appPath/dist (for unpacked resources)
    let tryPath = path.join(app.getAppPath(), 'dist', 'index.html');
    console.log('[Electron] Trying path 1:', tryPath);
    if (fs.existsSync(tryPath)) {
      distPath = tryPath;
    }
    
    // Try 2: app root/dist (for portable exe)
    if (!distPath) {
      tryPath = path.join(path.dirname(process.execPath), 'dist', 'index.html');
      console.log('[Electron] Trying path 2:', tryPath);
      if (fs.existsSync(tryPath)) {
        distPath = tryPath;
      }
    }
    
    // Try 3: resourcesPath/dist (for asar archives)
    if (!distPath) {
      tryPath = path.join(process.resourcesPath, 'dist', 'index.html');
      console.log('[Electron] Trying path 3:', tryPath);
      if (fs.existsSync(tryPath)) {
        distPath = tryPath;
      }
    }
    
    // Try 4: ../dist (relative from executable)
    if (!distPath) {
      tryPath = path.resolve(path.dirname(process.execPath), '..', 'dist', 'index.html');
      console.log('[Electron] Trying path 4:', tryPath);
      if (fs.existsSync(tryPath)) {
        distPath = tryPath;
      }
    }
    
    if (distPath) {
      startURL = `file://${distPath}`;
      console.log('[Electron] Found dist at:', distPath);
    } else {
      console.error('[Electron] dist/index.html NOT FOUND at any location!');
      console.error('[Electron] app.getAppPath():', app.getAppPath());
      console.error('[Electron] process.execPath:', process.execPath);
      console.error('[Electron] process.resourcesPath:', process.resourcesPath);
      console.error('[Electron] __dirname:', __dirname);
      startURL = 'about:blank';
    }
  }

  console.log('[Electron] Final URL:', startURL);
  mainWindow.loadURL(startURL);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  startBackend();
  setTimeout(createWindow, 1000);
  
  // Check for updates after window is ready (with delay)
  setTimeout(() => {
    checkForUpdates();
  }, 5000);

  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit', label: 'Exit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('get-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('check-for-updates', () => {
  checkForUpdates();
  return { checking: true };
});

module.exports = { app, mainWindow };
