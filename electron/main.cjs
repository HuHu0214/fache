'use strict';

const path = require('node:path');
const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  session,
  shell,
} = require('electron');
const { FacheDatabase } = require('./database.cjs');

const APP_ID = 'cn.fache.app';
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 1.5;

let mainWindow = null;
let database = null;
let closing = false;

app.setAppUserModelId(APP_ID);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}

function clampZoom(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 1;
  }
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, number));
}

function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, '..', 'build', 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#fffdf5',
    title: '法册',
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: !app.isPackaged,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const current = mainWindow.webContents.getURL();
    if (url !== current && /^https?:\/\//.test(url)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void mainWindow.loadURL(devUrl);
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, '..', 'dist', 'index.html'),
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpc() {
  ipcMain.handle('storage:load', () => database.loadAll());
  ipcMain.handle('storage:save', (_event, snapshot) =>
    database.saveAll(snapshot),
  );
  ipcMain.handle('storage:clear', () => database.clearAll());
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    platform: process.platform,
    dbPath: database.filePath,
  }));
  ipcMain.handle('window:set-zoom', (event, value) => {
    const zoom = clampZoom(value);
    const contents = event.sender;
    if (contents && !contents.isDestroyed()) {
      contents.setZoomFactor(zoom);
    }
    return zoom;
  });
}

app.whenReady().then(() => {
  try {
    database = new FacheDatabase(
      path.join(app.getPath('userData'), 'fache.db'),
    );
  } catch (error) {
    dialog.showErrorBox(
      '法册无法启动',
      `本地数据库初始化失败。\n${String(error)}`,
    );
    app.quit();
    return;
  }

  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  );

  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  if (closing) {
    return;
  }
  closing = true;
  if (database) {
    try {
      database.close();
    } catch {
      // The process is exiting; SQLite has already committed its WAL.
    }
    database = null;
  }
});
