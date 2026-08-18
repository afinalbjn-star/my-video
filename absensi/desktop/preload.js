const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  exportExcel: (payload) => ipcRenderer.invoke("export-excel", payload),
  exportPdf: (payload) => ipcRenderer.invoke("export-pdf", payload),
});