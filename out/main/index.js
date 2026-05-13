"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const path = require("path");
const fsp = require("fs/promises");
const os = require("os");
const Store = require("electron-store");
const simpleGit = require("simple-git");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const fsp__namespace = /* @__PURE__ */ _interopNamespaceDefault(fsp);
const os__namespace = /* @__PURE__ */ _interopNamespaceDefault(os);
const store = new Store();
const terminals = /* @__PURE__ */ new Map();
let terminalIdCounter = 0;
function getDefaultShell() {
  if (process.platform === "win32") return "powershell.exe";
  if (process.platform === "darwin") {
    const shellFromEnv = process.env.SHELL;
    return shellFromEnv || "/bin/zsh";
  }
  return process.env.SHELL || "/bin/bash";
}
function setupIpcHandlers(win) {
  electron.ipcMain.handle("file:open", async (_, filePath) => {
    if (!filePath) {
      const result = await electron.dialog.showOpenDialog(win, {
        properties: ["openFile"],
        filters: [
          { name: "All Files", extensions: ["*"] },
          { name: "Source Code", extensions: ["ts", "tsx", "js", "jsx", "py", "java", "c", "cpp", "cs", "go", "rs", "rb", "php", "swift", "kt"] },
          { name: "Web", extensions: ["html", "css", "scss", "json", "xml", "yaml", "yml"] },
          { name: "Markdown", extensions: ["md", "mdx"] }
        ]
      });
      if (result.canceled || result.filePaths.length === 0) return null;
      filePath = result.filePaths[0];
    }
    try {
      const content = await fsp__namespace.readFile(filePath, "utf-8");
      return { path: filePath, content, name: path__namespace.basename(filePath) };
    } catch (err) {
      return { error: err.message };
    }
  });
  electron.ipcMain.handle("file:save", async (_, filePath, content) => {
    try {
      await fsp__namespace.writeFile(filePath, content, "utf-8");
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  });
  electron.ipcMain.handle("file:saveAs", async (_, content, defaultPath) => {
    const result = await electron.dialog.showSaveDialog(win, {
      defaultPath,
      filters: [{ name: "All Files", extensions: ["*"] }]
    });
    if (result.canceled || !result.filePath) return null;
    try {
      await fsp__namespace.writeFile(result.filePath, content, "utf-8");
      return { path: result.filePath, name: path__namespace.basename(result.filePath) };
    } catch (err) {
      return { error: err.message };
    }
  });
  electron.ipcMain.handle("file:openFolder", async () => {
    const result = await electron.dialog.showOpenDialog(win, {
      properties: ["openDirectory"]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    store.set("lastOpenedFolder", result.filePaths[0]);
    return result.filePaths[0];
  });
  electron.ipcMain.handle("file:readDir", async (_, dirPath) => {
    try {
      const entries = await fsp__namespace.readdir(dirPath, { withFileTypes: true });
      const result = entries.map((e) => ({
        name: e.name,
        path: path__namespace.join(dirPath, e.name),
        isDirectory: e.isDirectory(),
        isFile: e.isFile()
      })).sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      return result;
    } catch (err) {
      return { error: err.message };
    }
  });
  electron.ipcMain.handle("file:create", async (_, dirPath, fileName) => {
    const fullPath = path__namespace.join(dirPath, fileName);
    try {
      await fsp__namespace.writeFile(fullPath, "", "utf-8");
      return { path: fullPath };
    } catch (err) {
      return { error: err.message };
    }
  });
  electron.ipcMain.handle("file:createFolder", async (_, dirPath, folderName) => {
    const fullPath = path__namespace.join(dirPath, folderName);
    try {
      await fsp__namespace.mkdir(fullPath, { recursive: true });
      return { path: fullPath };
    } catch (err) {
      return { error: err.message };
    }
  });
  electron.ipcMain.handle("file:delete", async (_, entryPath) => {
    try {
      const stat = await fsp__namespace.stat(entryPath);
      if (stat.isDirectory()) {
        await fsp__namespace.rm(entryPath, { recursive: true });
      } else {
        await fsp__namespace.unlink(entryPath);
      }
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  });
  electron.ipcMain.handle("file:rename", async (_, oldPath, newName) => {
    const newPath = path__namespace.join(path__namespace.dirname(oldPath), newName);
    try {
      await fsp__namespace.rename(oldPath, newPath);
      return { path: newPath };
    } catch (err) {
      return { error: err.message };
    }
  });
  electron.ipcMain.handle("terminal:create", async (_, cwd) => {
    const id = ++terminalIdCounter;
    try {
      const pty = await import("node-pty");
      const shell = getDefaultShell();
      const ptyProcess = pty.spawn(shell, [], {
        name: "xterm-256color",
        cols: 80,
        rows: 24,
        cwd: cwd || os__namespace.homedir(),
        env: { ...process.env, TERM: "xterm-256color", COLORTERM: "truecolor" }
      });
      ptyProcess.onData((data) => {
        if (!win.isDestroyed()) {
          win.webContents.send("terminal:data", id, data);
        }
      });
      ptyProcess.onExit(() => {
        terminals.delete(id);
        if (!win.isDestroyed()) {
          win.webContents.send("terminal:exit", id);
        }
      });
      terminals.set(id, ptyProcess);
      return { id };
    } catch (err) {
      return { id, error: `Terminal unavailable: ${err.message}` };
    }
  });
  electron.ipcMain.on("terminal:input", (_, id, data) => {
    const ptyProcess = terminals.get(id);
    if (ptyProcess) ptyProcess.write(data);
  });
  electron.ipcMain.on("terminal:resize", (_, id, cols, rows) => {
    const ptyProcess = terminals.get(id);
    if (ptyProcess) {
      try {
        ptyProcess.resize(cols, rows);
      } catch (_2) {
      }
    }
  });
  electron.ipcMain.handle("terminal:destroy", async (_, id) => {
    const ptyProcess = terminals.get(id);
    if (ptyProcess) {
      try {
        ptyProcess.kill();
      } catch (_2) {
      }
      terminals.delete(id);
    }
    return { success: true };
  });
  electron.ipcMain.handle("settings:get", () => {
    return {
      theme: store.get("theme", "vs-dark"),
      fontSize: store.get("fontSize", 14),
      fontFamily: store.get("fontFamily", "'JetBrains Mono', 'Cascadia Code', Menlo, Consolas, monospace"),
      tabSize: store.get("tabSize", 2),
      autoSave: store.get("autoSave", true),
      wordWrap: store.get("wordWrap", "on"),
      minimap: store.get("minimap", true),
      lastOpenedFolder: store.get("lastOpenedFolder", os__namespace.homedir())
    };
  });
  electron.ipcMain.handle("settings:set", (_, settings) => {
    for (const [key, value] of Object.entries(settings)) {
      store.set(key, value);
    }
    return { success: true };
  });
  electron.ipcMain.handle("git:branch", async (_, cwd) => {
    try {
      const git = simpleGit(cwd);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) return null;
      const branch = await git.revparse(["--abbrev-ref", "HEAD"]);
      return branch.trim();
    } catch {
      return null;
    }
  });
  electron.ipcMain.on("window:minimize", () => win.minimize());
  electron.ipcMain.on("window:maximize", () => {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  electron.ipcMain.on("window:close", () => win.close());
}
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["ELECTRON_RENDERER_URL"];
const RENDERER_DIST = path.join(process.env.APP_ROOT, "out/renderer");
let mainWindow = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#1E1E2E",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: { x: 12, y: 14 },
    frame: process.platform !== "darwin",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) electron.shell.openExternal(url);
    return { action: "deny" };
  });
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  setupIpcHandlers(mainWindow);
}
electron.app.whenReady().then(() => {
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("window-all-closed", () => {
  mainWindow = null;
  if (process.platform !== "darwin") electron.app.quit();
});
exports.RENDERER_DIST = RENDERER_DIST;
exports.VITE_DEV_SERVER_URL = VITE_DEV_SERVER_URL;
