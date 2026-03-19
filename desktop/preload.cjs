const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("wfDesktop", {
  isDesktop: true,
  storage: {
    get: () => ipcRenderer.invoke("wf-storage:get"),
    set: (payload) => ipcRenderer.invoke("wf-storage:set", payload),
  },
});

