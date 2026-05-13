import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { FileEntry, ContextMenuState } from '../types';
import { getFileIcon } from '../themes';

interface FileTreeProps {
  rootPath: string | null;
  rootName: string;
  entries: FileEntry[];
  expandedDirs: Set<string>;
  onFileOpen: (path: string) => void;
  onToggleDir: (path: string) => void;
  onOpenFolder: () => void;
  onCreateFile: (dirPath: string, name: string) => void;
  onCreateFolder: (dirPath: string, name: string) => void;
  onDeleteEntry: (path: string) => void;
  onRenameEntry: (path: string, newName: string) => void;
  onReadDir: (path: string) => Promise<FileEntry[]>;
}

interface TreeNodeData extends FileEntry {
  level: number;
  children?: TreeNodeData[];
}

export const FileTree: React.FC<FileTreeProps> = ({
  rootPath, rootName, entries, expandedDirs,
  onFileOpen, onToggleDir, onOpenFolder,
  onCreateFile, onCreateFolder, onDeleteEntry, onRenameEntry, onReadDir
}) => {
  const [childrenMap, setChildrenMap] = useState<Map<string, FileEntry[]>>(new Map());
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, type: 'background'
  });
  const [creatingIn, setCreatingIn] = useState<{ dir: string; type: 'file' | 'folder' } | null>(null);
  const [createName, setCreateName] = useState('');
  const renameRef = useRef<HTMLInputElement>(null);
  const createRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingPath && renameRef.current) renameRef.current.select();
  }, [renamingPath]);

  useEffect(() => {
    if (creatingIn && createRef.current) createRef.current.focus();
  }, [creatingIn]);

  const handleToggleDir = useCallback(async (path: string) => {
    onToggleDir(path);
    if (!expandedDirs.has(path)) {
      const children = await onReadDir(path);
      setChildrenMap(prev => new Map(prev).set(path, children));
    }
  }, [expandedDirs, onToggleDir, onReadDir]);

  const handleContextMenu = useCallback((e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      target: entry,
      type: entry.isDirectory ? 'folder' : 'file'
    });
  }, []);

  const handleBackgroundContext = useCallback((e: React.MouseEvent) => {
    if (!rootPath) return;
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type: 'background' });
  }, [rootPath]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    const handler = () => closeContextMenu();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [closeContextMenu]);

  const handleRename = useCallback((entry: FileEntry) => {
    setRenamingPath(entry.path);
    setRenameValue(entry.name);
    closeContextMenu();
  }, [closeContextMenu]);

  const submitRename = useCallback(() => {
    if (renamingPath && renameValue.trim()) {
      onRenameEntry(renamingPath, renameValue.trim());
    }
    setRenamingPath(null);
  }, [renamingPath, renameValue, onRenameEntry]);

  const handleDelete = useCallback((entry: FileEntry) => {
    if (window.confirm(`Delete "${entry.name}"?`)) {
      onDeleteEntry(entry.path);
    }
    closeContextMenu();
  }, [onDeleteEntry, closeContextMenu]);

  const startCreate = useCallback((type: 'file' | 'folder') => {
    const dir = contextMenu.target?.isDirectory
      ? contextMenu.target.path
      : rootPath ?? '';
    setCreatingIn({ dir, type });
    setCreateName('');
    closeContextMenu();
  }, [contextMenu, rootPath, closeContextMenu]);

  const submitCreate = useCallback(async () => {
    if (!creatingIn || !createName.trim()) { setCreatingIn(null); return; }
    try {
      if (creatingIn.type === 'file') {
        const path = await onCreateFile(creatingIn.dir, createName.trim());
        if (path) onFileOpen(path);
      } else {
        await onCreateFolder(creatingIn.dir, createName.trim());
      }
    } catch (e) { console.error(e); }
    setCreatingIn(null);
    setCreateName('');
  }, [creatingIn, createName, onCreateFile, onCreateFolder, onFileOpen]);

  const refreshChildren = useCallback(async (dirPath: string) => {
    const children = await onReadDir(dirPath);
    setChildrenMap(prev => new Map(prev).set(dirPath, children));
  }, [onReadDir]);

  const renderEntry = useCallback((entry: FileEntry, level: number): React.ReactNode => {
    const isExpanded = expandedDirs.has(entry.path);
    const icon = getFileIcon(entry.name, entry.isDirectory);
    const isRenaming = renamingPath === entry.path;
    const children = childrenMap.get(entry.path) ?? [];

    return (
      <React.Fragment key={entry.path}>
        <div
          className="file-tree-item"
          style={{ paddingLeft: `${8 + level * 14}px` }}
          onClick={() => entry.isDirectory ? handleToggleDir(entry.path) : onFileOpen(entry.path)}
          onContextMenu={e => handleContextMenu(e, entry)}
          title={entry.path}
        >
          {entry.isDirectory && (
            <span className={`chevron ${isExpanded ? 'open' : ''}`}>▶</span>
          )}
          <span className="icon">{icon}</span>
          {isRenaming ? (
            <input
              ref={renameRef}
              className="rename-input"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={submitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') setRenamingPath(null);
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="file-tree-item-name">{entry.name}</span>
          )}
        </div>

        {entry.isDirectory && isExpanded && children.length > 0 && (
          <>
            {creatingIn?.dir === entry.path && (
              <div className="file-tree-item" style={{ paddingLeft: `${8 + (level + 1) * 14}px` }}>
                <span className="icon">{creatingIn.type === 'file' ? '📄' : '📁'}</span>
                <input
                  ref={createRef}
                  className="rename-input"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  onBlur={submitCreate}
                  onKeyDown={e => {
                    if (e.key === 'Enter') submitCreate();
                    if (e.key === 'Escape') setCreatingIn(null);
                  }}
                  placeholder={creatingIn.type === 'file' ? 'filename.ext' : 'folder name'}
                />
              </div>
            )}
            {children.map(child => renderEntry(child, level + 1))}
          </>
        )}

        {entry.isDirectory && isExpanded && children.length === 0 && (
          <>
            {creatingIn?.dir === entry.path && (
              <div className="file-tree-item" style={{ paddingLeft: `${8 + (level + 1) * 14}px` }}>
                <span className="icon">{creatingIn.type === 'file' ? '📄' : '📁'}</span>
                <input
                  ref={createRef}
                  className="rename-input"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  onBlur={submitCreate}
                  onKeyDown={e => {
                    if (e.key === 'Enter') submitCreate();
                    if (e.key === 'Escape') setCreatingIn(null);
                  }}
                  placeholder={creatingIn.type === 'file' ? 'filename.ext' : 'folder name'}
                />
              </div>
            )}
          </>
        )}
      </React.Fragment>
    );
  }, [expandedDirs, childrenMap, renamingPath, renameValue, creatingIn, createName,
      handleToggleDir, onFileOpen, handleContextMenu, submitRename, submitCreate]);

  if (!rootPath) {
    return (
      <div className="file-tree">
        <div className="file-tree-empty">
          <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No folder open</div>
          <div>Open a folder to see its files</div>
          <button
            onClick={onOpenFolder}
            style={{
              marginTop: 12, padding: '6px 16px', background: 'var(--accent)',
              color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer',
              fontSize: 12, fontWeight: 600
            }}
          >
            Open Folder
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="file-tree" onContextMenu={handleBackgroundContext}>
        <div
          className="file-tree-item"
          style={{ paddingLeft: 8, fontWeight: 600, color: 'var(--text-primary)' }}
          title={rootPath}
        >
          <span className="icon">📁</span>
          <span className="file-tree-item-name" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {rootName}
          </span>
        </div>

        {creatingIn?.dir === rootPath && (
          <div className="file-tree-item" style={{ paddingLeft: 22 }}>
            <span className="icon">{creatingIn.type === 'file' ? '📄' : '📁'}</span>
            <input
              ref={createRef}
              className="rename-input"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              onBlur={submitCreate}
              onKeyDown={e => {
                if (e.key === 'Enter') submitCreate();
                if (e.key === 'Escape') setCreatingIn(null);
              }}
              placeholder={creatingIn.type === 'file' ? 'filename.ext' : 'folder name'}
            />
          </div>
        )}

        {entries.map(entry => renderEntry(entry, 0))}
      </div>

      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.type !== 'background' && contextMenu.target && (
            <>
              {contextMenu.target.isDirectory && (
                <>
                  <div className="context-menu-item" onClick={() => startCreate('file')}>
                    📄 New File
                  </div>
                  <div className="context-menu-item" onClick={() => startCreate('folder')}>
                    📁 New Folder
                  </div>
                  <div className="context-menu-separator" />
                </>
              )}
              <div className="context-menu-item" onClick={() => handleRename(contextMenu.target!)}>
                ✏️ Rename
              </div>
              <div className="context-menu-item danger" onClick={() => handleDelete(contextMenu.target!)}>
                🗑️ Delete
              </div>
            </>
          )}
          {contextMenu.type === 'background' && (
            <>
              <div className="context-menu-item" onClick={() => startCreate('file')}>
                📄 New File
              </div>
              <div className="context-menu-item" onClick={() => startCreate('folder')}>
                📁 New Folder
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
