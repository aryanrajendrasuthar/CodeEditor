import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import Store from 'electron-store';
import simpleGit from 'simple-git';

const store = new Store<{
  theme: string;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  autoSave: boolean;
  wordWrap: string;
  minimap: boolean;
  lastOpenedFolder: string;
}>();

const terminals = new Map<number, any>();
let terminalIdCounter = 0;

function getDefaultShell(): string {
  if (process.platform === 'win32') return 'powershell.exe';
  if (process.platform === 'darwin') {
    const shellFromEnv = process.env.SHELL;
    return shellFromEnv || '/bin/zsh';
  }
  return process.env.SHELL || '/bin/bash';
}

export function setupIpcHandlers(win: BrowserWindow): void {
  // ─── File Operations ───────────────────────────────────────────────────────

  ipcMain.handle('file:open', async (_, filePath?: string) => {
    if (!filePath) {
      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Source Code', extensions: ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'c', 'cpp', 'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt'] },
          { name: 'Web', extensions: ['html', 'css', 'scss', 'json', 'xml', 'yaml', 'yml'] },
          { name: 'Markdown', extensions: ['md', 'mdx'] }
        ]
      });
      if (result.canceled || result.filePaths.length === 0) return null;
      filePath = result.filePaths[0];
    }
    try {
      const content = await fsp.readFile(filePath, 'utf-8');
      return { path: filePath, content, name: path.basename(filePath) };
    } catch (err: any) {
      return { error: err.message };
    }
  });

  ipcMain.handle('file:save', async (_, filePath: string, content: string) => {
    try {
      await fsp.writeFile(filePath, content, 'utf-8');
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  });

  ipcMain.handle('file:saveAs', async (_, content: string, defaultPath?: string) => {
    const result = await dialog.showSaveDialog(win, {
      defaultPath,
      filters: [{ name: 'All Files', extensions: ['*'] }]
    });
    if (result.canceled || !result.filePath) return null;
    try {
      await fsp.writeFile(result.filePath, content, 'utf-8');
      return { path: result.filePath, name: path.basename(result.filePath) };
    } catch (err: any) {
      return { error: err.message };
    }
  });

  ipcMain.handle('file:openFolder', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    store.set('lastOpenedFolder', result.filePaths[0]);
    return result.filePaths[0];
  });

  ipcMain.handle('file:readDir', async (_, dirPath: string) => {
    try {
      const entries = await fsp.readdir(dirPath, { withFileTypes: true });
      const result = entries
        .map(e => ({
          name: e.name,
          path: path.join(dirPath, e.name),
          isDirectory: e.isDirectory(),
          isFile: e.isFile()
        }))
        .sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
      return result;
    } catch (err: any) {
      return { error: err.message };
    }
  });

  ipcMain.handle('file:create', async (_, dirPath: string, fileName: string) => {
    const fullPath = path.join(dirPath, fileName);
    try {
      await fsp.writeFile(fullPath, '', 'utf-8');
      return { path: fullPath };
    } catch (err: any) {
      return { error: err.message };
    }
  });

  ipcMain.handle('file:createFolder', async (_, dirPath: string, folderName: string) => {
    const fullPath = path.join(dirPath, folderName);
    try {
      await fsp.mkdir(fullPath, { recursive: true });
      return { path: fullPath };
    } catch (err: any) {
      return { error: err.message };
    }
  });

  ipcMain.handle('file:delete', async (_, entryPath: string) => {
    try {
      const stat = await fsp.stat(entryPath);
      if (stat.isDirectory()) {
        await fsp.rm(entryPath, { recursive: true });
      } else {
        await fsp.unlink(entryPath);
      }
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  });

  ipcMain.handle('file:rename', async (_, oldPath: string, newName: string) => {
    const newPath = path.join(path.dirname(oldPath), newName);
    try {
      await fsp.rename(oldPath, newPath);
      return { path: newPath };
    } catch (err: any) {
      return { error: err.message };
    }
  });

  // ─── Terminal ──────────────────────────────────────────────────────────────

  ipcMain.handle('terminal:create', async (_, cwd: string) => {
    const id = ++terminalIdCounter;
    try {
      const pty = await import('node-pty');
      const shell = getDefaultShell();
      const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: cwd || os.homedir(),
        env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' } as any
      });

      ptyProcess.onData((data: string) => {
        if (!win.isDestroyed()) {
          win.webContents.send('terminal:data', id, data);
        }
      });

      ptyProcess.onExit(() => {
        terminals.delete(id);
        if (!win.isDestroyed()) {
          win.webContents.send('terminal:exit', id);
        }
      });

      terminals.set(id, ptyProcess);
      return { id };
    } catch (err: any) {
      // Fallback: return an id without a real pty (terminal will show error)
      return { id, error: `Terminal unavailable: ${err.message}` };
    }
  });

  ipcMain.on('terminal:input', (_, id: number, data: string) => {
    const ptyProcess = terminals.get(id);
    if (ptyProcess) ptyProcess.write(data);
  });

  ipcMain.on('terminal:resize', (_, id: number, cols: number, rows: number) => {
    const ptyProcess = terminals.get(id);
    if (ptyProcess) {
      try { ptyProcess.resize(cols, rows); } catch (_) {}
    }
  });

  ipcMain.handle('terminal:destroy', async (_, id: number) => {
    const ptyProcess = terminals.get(id);
    if (ptyProcess) {
      try { ptyProcess.kill(); } catch (_) {}
      terminals.delete(id);
    }
    return { success: true };
  });

  // ─── Settings ─────────────────────────────────────────────────────────────

  ipcMain.handle('settings:get', () => {
    return {
      theme: store.get('theme', 'vs-dark'),
      fontSize: store.get('fontSize', 14),
      fontFamily: store.get('fontFamily', "'JetBrains Mono', 'Cascadia Code', Menlo, Consolas, monospace"),
      tabSize: store.get('tabSize', 2),
      autoSave: store.get('autoSave', true),
      wordWrap: store.get('wordWrap', 'on'),
      minimap: store.get('minimap', true),
      lastOpenedFolder: store.get('lastOpenedFolder', os.homedir())
    };
  });

  ipcMain.handle('settings:set', (_, settings: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(settings)) {
      store.set(key as any, value as any);
    }
    return { success: true };
  });

  // ─── Git ──────────────────────────────────────────────────────────────────

  ipcMain.handle('git:branch', async (_, cwd: string) => {
    try {
      const git = simpleGit(cwd);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) return null;
      const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
      return branch.trim();
    } catch {
      return null;
    }
  });

  // ─── Window Controls ──────────────────────────────────────────────────────

  ipcMain.on('window:minimize', () => win.minimize());
  ipcMain.on('window:maximize', () => {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });
  ipcMain.on('window:close', () => win.close());
}
