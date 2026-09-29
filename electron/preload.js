const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  version: '1.0.0',
  licenseStatus: () => ipcRenderer.invoke('license:status'),
  activateLicense: (key) => ipcRenderer.invoke('license:activate', key),
  saveImage: (dataUrl, name) => ipcRenderer.invoke('file:saveImage', dataUrl, name),
  savePdf: (name) => ipcRenderer.invoke('file:savePdf', name),
  onMenu: (cb) => ipcRenderer.on('menu', (_e, cmd) => cb(cmd)),
});
