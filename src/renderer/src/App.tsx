import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Editor } from './components/Editor';
import { FileTree } from './components/FileTree';
import { TabBar } from './components/TabBar';
import { Terminal } from './components/Terminal';
import { StatusBar } from './components/StatusBar';
import { Settings } from './components/Settings';
import { useTabs } from './hooks/useTabs';
import { useFileSystem } from './hooks/useFileSystem';
import { useTerminal } from './hooks/useTerminal';
import type { EditorSettings } from './types';

const DEFAULT_SETTINGS: EditorSettings = {
  theme: 'catppuccin',
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Cascadia Code', Menlo, Consolas, monospace",
  tabSize: 2,
  autoSave: true,
  wordWrap: 'on',
  minimap: true,
  lastOpenedFolder: ''
};

type SidebarView = 'explorer' | 'search' | null;

export const App: React.FC = () => {
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState<SidebarView>('explorer');
  const [terminalHeight, setTerminalHeight] = useState(220);
  const [showTerminal, setShowTerminal] = useState(false);
  const [gitBranch, setGitBranch] = useState<string | null>(null);
  const autoSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isResizingTerminal = useRef(false);

  const tabs = useTabs();
  const fs = useFileSystem();
  const terminal = useTerminal();

  // ─── Load settings on mount ───────────────────────────────────────────────
  useEffect(() => {
    window.electronAPI.getSettings().then((s) => {
      if (s) setSettings(prev => ({ ...prev, ...(s as Partial<EditorSettings>) }));
    });
  }, []);

  // ─── Git branch when folder changes ──────────────────────────────────────
  useEffect(() => {
    if (fs.rootPath) {
      window.electronAPI.getGitBranch(fs.rootPath).then(setGitBranch);
    } else {
      setGitBranch(null);
    }
  }, [fs.rootPath]);

  // ─── Open file ────────────────────────────────────────────────────────────
  const openFile = useCallback(async (filePath?: string) => {
    const result = await window.electronAPI.openFile(filePath);
    if (!result || 'error' in result) return;
    tabs.openTab(result.path, result.content, result.name);
  }, [tabs]);

  // ─── Save file ────────────────────────────────────────────────────────────
  const saveFile = useCallback(async (tabId?: string) => {
    const tab = tabId ? tabs.tabs.find(t => t.id === tabId) : tabs.activeTab;
    if (!tab) return;

    if (tab.isUntitled) {
      const result = await window.electronAPI.saveFileAs(tab.content);
      if (!result) return;
      tabs.markTabSaved(tab.id, tab.content, result.path, result.name);
    } else {
      await window.electronAPI.saveFile(tab.filePath, tab.content);
      tabs.markTabSaved(tab.id, tab.content);
    }
  }, [tabs]);

  // ─── Auto save ───────────────────────────────────────────────────────────
  const scheduleAutoSave = useCallback((tabId: string) => {
    if (!settings.autoSave) return;
    const existing = autoSaveTimers.current.get(tabId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      saveFile(tabId);
      autoSaveTimers.current.delete(tabId);
    }, 2000);
    autoSaveTimers.current.set(tabId, timer);
  }, [settings.autoSave, saveFile]);

  // ─── Content change ───────────────────────────────────────────────────────
  const handleContentChange = useCallback((tabId: string, content: string) => {
    tabs.updateTabContent(tabId, content);
    scheduleAutoSave(tabId);
  }, [tabs, scheduleAutoSave]);

  // ─── Close tab (confirm if dirty) ────────────────────────────────────────
  const handleCloseTab = useCallback((tabId: string) => {
    if (tabs.isTabDirty(tabId)) {
      if (!window.confirm('This file has unsaved changes. Close anyway?')) return;
    }
    tabs.closeTab(tabId);
  }, [tabs]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      switch (e.key.toLowerCase()) {
        case 'o':
          e.preventDefault();
          if (e.shiftKey) fs.openFolder();
          else openFile();
          break;
        case 's':
          e.preventDefault();
          if (e.shiftKey) {
            // Save As
            if (tabs.activeTab) {
              window.electronAPI.saveFileAs(tabs.activeTab.content).then(result => {
                if (result && tabs.activeTabId) {
                  tabs.markTabSaved(tabs.activeTabId, tabs.activeTab!.content, result.path, result.name);
                }
              });
            }
          } else {
            saveFile();
          }
          break;
        case 'n':
          e.preventDefault();
          tabs.openNewTab();
          break;
        case 'w':
          e.preventDefault();
          if (tabs.activeTabId) handleCloseTab(tabs.activeTabId);
          break;
        case 'tab':
          e.preventDefault();
          tabs.cycleTabs(e.shiftKey ? 'prev' : 'next');
          break;
        case '`':
          e.preventDefault();
          setShowTerminal(prev => !prev);
          break;
        case 'b':
          e.preventDefault();
          setSidebarView(prev => prev === 'explorer' ? null : 'explorer');
          break;
        case ',':
          e.preventDefault();
          setSettingsOpen(true);
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tabs, fs, openFile, saveFile, handleCloseTab]);

  // ─── Terminal resizer ─────────────────────────────────────────────────────
  const handleResizerMouseDown = useCallback((e: React.MouseEvent) => {
    isResizingTerminal.current = true;
    const startY = e.clientY;
    const startH = terminalHeight;

    const onMove = (ev: MouseEvent) => {
      if (!isResizingTerminal.current) return;
      const delta = startY - ev.clientY;
      setTerminalHeight(Math.max(100, Math.min(600, startH + delta)));
    };
    const onUp = () => {
      isResizingTerminal.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [terminalHeight]);

  // ─── Settings save ────────────────────────────────────────────────────────
  const handleSaveSettings = useCallback((updated: Partial<EditorSettings>) => {
    const next = { ...settings, ...updated };
    setSettings(next);
    window.electronAPI.setSettings(next as any);
  }, [settings]);

  // ─── New terminal session ─────────────────────────────────────────────────
  const handleNewTerminal = useCallback(async () => {
    const cwd = fs.rootPath ?? '';
    setShowTerminal(true);
    await terminal.createSession(cwd);
  }, [fs.rootPath, terminal]);

  const isMac = navigator.platform.includes('Mac');

  return (
    <div className="app">
      {/* Title Bar */}
      <div className="titlebar">
        {isMac && (
          <div className="titlebar-controls" style={{ marginRight: 8 }}>
            <button className="titlebar-btn close" onClick={() => window.electronAPI.close()} />
            <button className="titlebar-btn minimize" onClick={() => window.electronAPI.minimize()} />
            <button className="titlebar-btn maximize" onClick={() => window.electronAPI.maximize()} />
          </div>
        )}
        <span className="titlebar-title">
          {tabs.activeTab ? tabs.activeTab.fileName : 'Code Editor'}
        </span>
        {!isMac && (
          <div className="titlebar-controls">
            <button className="titlebar-btn minimize" onClick={() => window.electronAPI.minimize()} />
            <button className="titlebar-btn maximize" onClick={() => window.electronAPI.maximize()} />
            <button className="titlebar-btn close" onClick={() => window.electronAPI.close()} />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Activity Bar */}
        <div className="activity-bar">
          <button
            className={`activity-btn ${sidebarView === 'explorer' ? 'active' : ''}`}
            onClick={() => setSidebarView(v => v === 'explorer' ? null : 'explorer')}
            title="Explorer (⌘B)"
          >
            📁
          </button>
          <button
            className={`activity-btn`}
            onClick={() => openFile()}
            title="Open File (⌘O)"
          >
            📄
          </button>
          <button
            className={`activity-btn`}
            onClick={() => tabs.openNewTab()}
            title="New File (⌘N)"
          >
            ✚
          </button>
          <button
            className={`activity-btn ${showTerminal ? 'active' : ''} bottom`}
            onClick={() => setShowTerminal(v => !v)}
            title="Toggle Terminal (⌘`)"
          >
            ⚡
          </button>
          <button
            className="activity-btn"
            onClick={() => setSettingsOpen(true)}
            title="Settings (⌘,)"
          >
            ⚙️
          </button>
        </div>

        {/* Sidebar */}
        <div className={`sidebar ${sidebarView === null ? 'hidden' : ''}`}>
          {sidebarView === 'explorer' && (
            <>
              <div className="sidebar-header">
                <span>{fs.rootName || 'Explorer'}</span>
                <div className="sidebar-header-actions">
                  <button className="icon-btn" onClick={() => fs.rootPath && fs.createFile(fs.rootPath, 'new-file.txt')} title="New File">📄</button>
                  <button className="icon-btn" onClick={() => fs.rootPath && fs.createFolder(fs.rootPath, 'new-folder')} title="New Folder">📁</button>
                  <button className="icon-btn" onClick={fs.openFolder} title="Open Folder">🗂️</button>
                </div>
              </div>
              <FileTree
                rootPath={fs.rootPath}
                rootName={fs.rootName}
                entries={fs.fileTree}
                expandedDirs={fs.expandedDirs}
                onFileOpen={openFile}
                onToggleDir={fs.toggleDir}
                onOpenFolder={fs.openFolder}
                onCreateFile={fs.createFile}
                onCreateFolder={fs.createFolder}
                onDeleteEntry={fs.deleteEntry}
                onRenameEntry={fs.renameEntry}
                onReadDir={fs.readDir}
              />
            </>
          )}
        </div>

        {/* Editor Area */}
        <div className="editor-area">
          <TabBar
            tabs={tabs.tabs}
            activeTabId={tabs.activeTabId}
            onTabClick={tabs.setActiveTabId}
            onTabClose={handleCloseTab}
            isTabDirty={tabs.isTabDirty}
          />

          {tabs.activeTab ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Editor
                tab={tabs.activeTab}
                settings={settings}
                onContentChange={handleContentChange}
                onCursorChange={tabs.updateCursorPosition}
              />
            </div>
          ) : (
            <div className="editor-welcome" style={{ flex: 1 }}>
              <div style={{ fontSize: 48 }}>⌨️</div>
              <h1>Code Editor</h1>
              <p>Built with Electron · React · Monaco Editor</p>
              <div className="shortcuts">
                <div className="shortcut"><kbd>⌘O</kbd> Open File</div>
                <div className="shortcut"><kbd>⌘⇧O</kbd> Open Folder</div>
                <div className="shortcut"><kbd>⌘N</kbd> New File</div>
                <div className="shortcut"><kbd>⌘S</kbd> Save</div>
                <div className="shortcut"><kbd>⌘`</kbd> Terminal</div>
                <div className="shortcut"><kbd>⌘B</kbd> Sidebar</div>
                <div className="shortcut"><kbd>⌘W</kbd> Close Tab</div>
                <div className="shortcut"><kbd>⌘,</kbd> Settings</div>
              </div>
            </div>
          )}

          {/* Terminal Panel */}
          {showTerminal && (
            <>
              <div className="resizer" onMouseDown={handleResizerMouseDown} />
              <div className="terminal-panel" style={{ height: terminalHeight }}>
                <Terminal
                  sessions={terminal.sessions}
                  activeSessionId={terminal.activeSessionId}
                  onNewSession={handleNewTerminal}
                  onCloseSession={terminal.destroySession}
                  onActivate={terminal.setActiveSessionId}
                  onInput={terminal.sendInput}
                  onResize={terminal.resizeTerminal}
                  onDataSubscribe={terminal.onData}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        activeTab={tabs.activeTab}
        settings={settings}
        gitBranch={gitBranch}
        onLanguageClick={() => {}}
        onThemeClick={() => setSettingsOpen(true)}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      {/* Settings Modal */}
      {settingsOpen && (
        <Settings
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
};
