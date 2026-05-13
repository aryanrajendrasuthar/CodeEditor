"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // ─── File Operations ───────────────────────────────────────────────────────
  openFile: (filePath) => electron.ipcRenderer.invoke("file:open", filePath),
  saveFile: (filePath, content) => electron.ipcRenderer.invoke("file:save", filePath, content),
  saveFileAs: (content, defaultPath) => electron.ipcRenderer.invoke("file:saveAs", content, defaultPath),
  openFolder: () => electron.ipcRenderer.invoke("file:openFolder"),
  readDir: (dirPath) => electron.ipcRenderer.invoke("file:readDir", dirPath),
  createFile: (dirPath, fileName) => electron.ipcRenderer.invoke("file:create", dirPath, fileName),
  createFolder: (dirPath, folderName) => electron.ipcRenderer.invoke("file:createFolder", dirPath, folderName),
  deleteEntry: (entryPath) => electron.ipcRenderer.invoke("file:delete", entryPath),
  renameEntry: (oldPath, newName) => electron.ipcRenderer.invoke("file:rename", oldPath, newName),
  // ─── Terminal ──────────────────────────────────────────────────────────────
  createTerminal: (cwd) => electron.ipcRenderer.invoke("terminal:create", cwd),
  terminalInput: (id, data) => electron.ipcRenderer.send("terminal:input", id, data),
  resizeTerminal: (id, cols, rows) => electron.ipcRenderer.send("terminal:resize", id, cols, rows),
  destroyTerminal: (id) => electron.ipcRenderer.invoke("terminal:destroy", id),
  onTerminalData: (callback) => {
    const listener = (_, id, data) => callback(id, data);
    electron.ipcRenderer.on("terminal:data", listener);
    return () => electron.ipcRenderer.off("terminal:data", listener);
  },
  onTerminalExit: (callback) => {
    const listener = (_, id) => callback(id);
    electron.ipcRenderer.on("terminal:exit", listener);
    return () => electron.ipcRenderer.off("terminal:exit", listener);
  },
  // ─── Settings ─────────────────────────────────────────────────────────────
  getSettings: () => electron.ipcRenderer.invoke("settings:get"),
  setSettings: (settings) => electron.ipcRenderer.invoke("settings:set", settings),
  // ─── Git ──────────────────────────────────────────────────────────────────
  getGitBranch: (cwd) => electron.ipcRenderer.invoke("git:branch", cwd),
  // ─── Window Controls ──────────────────────────────────────────────────────
  minimize: () => electron.ipcRenderer.send("window:minimize"),
  maximize: () => electron.ipcRenderer.send("window:maximize"),
  close: () => electron.ipcRenderer.send("window:close")
});
