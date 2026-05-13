import { contextBridge, ipcRenderer } from 'electron';

export type FileEntry = {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
};

export type OpenFileResult = {
  path: string;
  content: string;
  name: string;
} | { error: string } | null;

contextBridge.exposeInMainWorld('electronAPI', {
  // ─── File Operations ───────────────────────────────────────────────────────
  openFile: (filePath?: string): Promise<OpenFileResult> =>
    ipcRenderer.invoke('file:open', filePath),

  saveFile: (filePath: string, content: string): Promise<{ success: boolean } | { error: string }> =>
    ipcRenderer.invoke('file:save', filePath, content),

  saveFileAs: (content: string, defaultPath?: string): Promise<{ path: string; name: string } | null> =>
    ipcRenderer.invoke('file:saveAs', content, defaultPath),

  openFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('file:openFolder'),

  readDir: (dirPath: string): Promise<FileEntry[] | { error: string }> =>
    ipcRenderer.invoke('file:readDir', dirPath),

  createFile: (dirPath: string, fileName: string): Promise<{ path: string } | { error: string }> =>
    ipcRenderer.invoke('file:create', dirPath, fileName),

  createFolder: (dirPath: string, folderName: string): Promise<{ path: string } | { error: string }> =>
    ipcRenderer.invoke('file:createFolder', dirPath, folderName),

  deleteEntry: (entryPath: string): Promise<{ success: boolean } | { error: string }> =>
    ipcRenderer.invoke('file:delete', entryPath),

  renameEntry: (oldPath: string, newName: string): Promise<{ path: string } | { error: string }> =>
    ipcRenderer.invoke('file:rename', oldPath, newName),

  // ─── Terminal ──────────────────────────────────────────────────────────────
  createTerminal: (cwd: string): Promise<{ id: number; error?: string }> =>
    ipcRenderer.invoke('terminal:create', cwd),

  terminalInput: (id: number, data: string): void =>
    ipcRenderer.send('terminal:input', id, data),

  resizeTerminal: (id: number, cols: number, rows: number): void =>
    ipcRenderer.send('terminal:resize', id, cols, rows),

  destroyTerminal: (id: number): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('terminal:destroy', id),

  onTerminalData: (callback: (id: number, data: string) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, id: number, data: string): void =>
      callback(id, data);
    ipcRenderer.on('terminal:data', listener);
    return () => ipcRenderer.off('terminal:data', listener);
  },

  onTerminalExit: (callback: (id: number) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, id: number): void => callback(id);
    ipcRenderer.on('terminal:exit', listener);
    return () => ipcRenderer.off('terminal:exit', listener);
  },

  // ─── Settings ─────────────────────────────────────────────────────────────
  getSettings: (): Promise<Partial<Record<string, unknown>>> =>
    ipcRenderer.invoke('settings:get'),

  setSettings: (settings: Partial<Record<string, unknown>>): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('settings:set', settings),

  // ─── Git ──────────────────────────────────────────────────────────────────
  getGitBranch: (cwd: string): Promise<string | null> =>
    ipcRenderer.invoke('git:branch', cwd),

  // ─── Window Controls ──────────────────────────────────────────────────────
  minimize: (): void => ipcRenderer.send('window:minimize'),
  maximize: (): void => ipcRenderer.send('window:maximize'),
  close: (): void => ipcRenderer.send('window:close')
});
