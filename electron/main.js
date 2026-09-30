const { app, BrowserWindow, Menu, ipcMain, dialog, shell, protocol, net } = require('electron');
const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');
const { LicenseStore } = require('./license.js');

let win;
let store;

// Serve the renderer from a private app:// scheme so fetch() of local assets (HDR sky, textures) works
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);
const APP_DIR = path.join(__dirname, '..', 'app');

function send(cmd) { win?.webContents.send('menu', cmd); }

/** Open the bundled PDF user manual (resources/manual in the installed app, docs/manual in development). */
function openManual(lang) {
  const name = `FireTwin_User_Manual_${lang}.pdf`;
  const candidates = [path.join(process.resourcesPath || '', 'manual', name), path.join(__dirname, '..', 'docs', 'manual', name)];
  const file = candidates.find((f) => fs.existsSync(f));
  if (file) shell.openPath(file);
  else dialog.showMessageBox(win, { type: 'info', message: 'User manual not found', detail: name });
}

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
      { label: 'User manual (English)', accelerator: 'F11', registerAccelerator: false, click: () => openManual('EN') },
      { label: 'دليل المستخدم (العربية)', click: () => openManual('AR') },
      { type: 'separator' },
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
  win.loadURL('app://local/index.html');
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  // Automated smoke test: FTW_SMOKE=<png path> captures the window after start-up and exits
  if (process.env.FTW_SMOKE) {
    win.webContents.once('did-finish-load', () => setTimeout(async () => {
      if (process.env.FTW_SMOKE_JS) { console.log('SMOKE_JS:', await win.webContents.executeJavaScript(process.env.FTW_SMOKE_JS)); await new Promise((r) => setTimeout(r, 1500)); }
      const img = await win.webContents.capturePage();
      fs.writeFileSync(process.env.FTW_SMOKE, img.toPNG());
      app.quit();
    }, +(process.env.FTW_SMOKE_MS || 9000)));
  }
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^(https?|mailto):/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app:')) { e.preventDefault(); shell.openExternal(url); } });
}

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const rel = decodeURIComponent(new URL(req.url).pathname);
    const file = path.normalize(path.join(APP_DIR, rel));
    if (!file.startsWith(APP_DIR)) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  store = new LicenseStore(app.getPath('userData'));
  ipcMain.handle('license:status', () => store.status());
  ipcMain.handle('help:manual', (_e, lang) => openManual(lang === 'ar' ? 'AR' : 'EN'));
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
