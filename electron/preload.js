const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getVersion: () => ipcRenderer.invoke('app:version'),
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  openDownload: (url) => ipcRenderer.invoke('update:open', url),
  onUpdate: (cb) => ipcRenderer.on('update', (_e, info) => cb(info)),
  openManual: (lang) => ipcRenderer.invoke('help:manual', lang),
  licenseStatus: () => ipcRenderer.invoke('license:status'),
  activateLicense: (key) => ipcRenderer.invoke('license:activate', key),
  saveImage: (dataUrl, name) => ipcRenderer.invoke('file:saveImage', dataUrl, name),
  savePdf: (name) => ipcRenderer.invoke('file:savePdf', name),
  onMenu: (cb) => ipcRenderer.on('menu', (_e, cmd) => cb(cmd)),
});
