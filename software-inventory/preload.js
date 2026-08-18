const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('inventoryAPI', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.invoke('data:save', data),
  exportExcel: (data) => ipcRenderer.invoke('export:excel', data),
  exportPDF: (data) => ipcRenderer.invoke('export:pdf', data),
});