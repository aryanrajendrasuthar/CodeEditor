export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  children?: FileEntry[];
  isOpen?: boolean;
}

export interface Tab {
  id: string;
  filePath: string;
  fileName: string;
  content: string;
  savedContent: string;
  language: string;
  isUntitled: boolean;
  cursorPosition?: { line: number; column: number };
}

export interface EditorSettings {
  theme: string;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  autoSave: boolean;
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap: boolean;
  lastOpenedFolder: string;
}

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  target?: FileEntry;
  type: 'file' | 'folder' | 'background';
}

export interface ElectronAPI {
  openFile: (filePath?: string) => Promise<{ path: string; content: string; name: string } | { error: string } | null>;
  saveFile: (filePath: string, content: string) => Promise<{ success: boolean } | { error: string }>;
  saveFileAs: (content: string, defaultPath?: string) => Promise<{ path: string; name: string } | null>;
  openFolder: () => Promise<string | null>;
  readDir: (dirPath: string) => Promise<FileEntry[] | { error: string }>;
  createFile: (dirPath: string, fileName: string) => Promise<{ path: string } | { error: string }>;
  createFolder: (dirPath: string, folderName: string) => Promise<{ path: string } | { error: string }>;
  deleteEntry: (entryPath: string) => Promise<{ success: boolean } | { error: string }>;
  renameEntry: (oldPath: string, newName: string) => Promise<{ path: string } | { error: string }>;
  createTerminal: (cwd: string) => Promise<{ id: number; error?: string }>;
  terminalInput: (id: number, data: string) => void;
  resizeTerminal: (id: number, cols: number, rows: number) => void;
  destroyTerminal: (id: number) => Promise<{ success: boolean }>;
  onTerminalData: (callback: (id: number, data: string) => void) => () => void;
  onTerminalExit: (callback: (id: number) => void) => () => void;
  getSettings: () => Promise<EditorSettings>;
  setSettings: (settings: Partial<EditorSettings>) => Promise<{ success: boolean }>;
  getGitBranch: (cwd: string) => Promise<string | null>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
