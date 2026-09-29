const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { LicenseStore } = require('./license.js');

let win;
let store;

function send(cmd) { win?.webContents.send('menu', cmd); }

function buildMenu() {
  const template = [
    { label: 'File', submenu: [
      { label: 'Screenshot', accelerator: 'CmdOrCtrl+Shift+S', click: () => send('screenshot') },
      { label: 'Simulation report…', accelerator: 'CmdOrCtrl+P', click: () => send('report') },
      { type: 'separator' },
      { role: 'quit', label: 'Exit' },
    ] },
    { label: 'View', submenu: [
      { label: '3D Digital Twin', accelerator: 'F1', click: () => send('page:twin') },
      { label: 'Dashboard', accelerator: 'F2', click: () => send('page:dash') },
      { label: 'Design Data', accelerator: 'F3', click: () => send('page:data') },
      { label: 'Learn', accelerator: 'F4', click: () => send('page:learn') },
      { type: 'separator' },
      { role: 'togglefullscreen' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
    ] },
    { label: 'Simulation', submenu: [
      { label: 'Play / Pause', accelerator: 'Space', registerAccelerator: false, click: () => send('play') },
      { label: 'Reset', accelerator: 'CmdOrCtrl+R', click: () => send('reset') },
    ] },
    { label: 'Help', submenu: [
      { label: 'License…', click: () => send('license') },
      { label: 'Contact support (WhatsApp)', click: () => shell.openExternal('https://wa.me/962776140404') },
      { label: 'E-mail info@asfanco.com', click: () => shell.openExternal('mailto:info@asfanco.com') },
      { type: 'separator' },
      { label: 'About', click: () => send('about') },
    ] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 960, minWidth: 1200, minHeight: 720, backgroundColor: '#eef1f4',
    title: 'Fire Protection Digital Twin', icon: path.join(__dirname, '..', 'build', 'icon.png'), show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.loadFile(path.join(__dirname, '..', 'app', 'index.html'));
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  // Automated smoke test: FTW_SMOKE=<png path> captures the window after start-up and exits
  if (process.env.FTW_SMOKE) {
    win.webContents.once('did-finish-load', () => setTimeout(async () => {
      const img = await win.webContents.capturePage();
      fs.writeFileSync(process.env.FTW_SMOKE, img.toPNG());
      app.quit();
    }, 9000));
  }
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^(https?|mailto):/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); shell.openExternal(url); } });
}

app.whenReady().then(() => {
  store = new LicenseStore(app.getPath('userData'));
  ipcMain.handle('license:status', () => store.status());
  ipcMain.handle('license:activate', (_e, key) => store.activate(key));
  ipcMain.handle('file:saveImage', async (_e, dataUrl, name) => {
    const r = await dialog.showSaveDialog(win, { defaultPath: name, filters: [{ name: 'PNG', extensions: ['png'] }] });
    if (r.canceled || !r.filePath) return false;
    fs.writeFileSync(r.filePath, Buffer.from(String(dataUrl).split(',')[1], 'base64'));
    return true;
  });
  ipcMain.handle('file:savePdf', async (_e, name) => {
    const r = await dialog.showSaveDialog(win, { defaultPath: name, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
    if (r.canceled || !r.filePath) return false;
    const pdf = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4', margins: { marginType: 'default' } });
    fs.writeFileSync(r.filePath, pdf);
    shell.openPath(r.filePath);
    return true;
  });
  buildMenu();
  createWindow();
});

app.on('window-all-closed', () => app.quit());
