import { useState, useCallback } from 'react';
import type { FileEntry } from '../types';

export function useFileSystem() {
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [rootName, setRootName] = useState<string>('');
  const [fileTree, setFileTree] = useState<FileEntry[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const readDir = useCallback(async (dirPath: string): Promise<FileEntry[]> => {
    const result = await window.electronAPI.readDir(dirPath);
    if ('error' in result) return [];
    return result as FileEntry[];
  }, []);

  const openFolder = useCallback(async () => {
    const folderPath = await window.electronAPI.openFolder();
    if (!folderPath) return;

    setIsLoading(true);
    const entries = await readDir(folderPath);
    setRootPath(folderPath);
    setRootName(folderPath.split('/').pop() ?? folderPath);
    setFileTree(entries);
    setExpandedDirs(new Set([folderPath]));
    setIsLoading(false);
    return folderPath;
  }, [readDir]);

  const loadFolder = useCallback(async (folderPath: string) => {
    setIsLoading(true);
    const entries = await readDir(folderPath);
    setRootPath(folderPath);
    setRootName(folderPath.split('/').pop() ?? folderPath);
    setFileTree(entries);
    setExpandedDirs(new Set([folderPath]));
    setIsLoading(false);
  }, [readDir]);

  const toggleDir = useCallback(async (dirPath: string): Promise<FileEntry[]> => {
    if (expandedDirs.has(dirPath)) {
      setExpandedDirs(prev => {
        const next = new Set(prev);
        next.delete(dirPath);
        return next;
      });
      return [];
    }
    setExpandedDirs(prev => new Set([...prev, dirPath]));
    const entries = await readDir(dirPath);
    return entries;
  }, [expandedDirs, readDir]);

  const refreshDir = useCallback(async (dirPath: string): Promise<FileEntry[]> => {
    const entries = await readDir(dirPath);
    if (dirPath === rootPath) {
      setFileTree(entries);
    }
    return entries;
  }, [readDir, rootPath]);

  const createFile = useCallback(async (dirPath: string, fileName: string) => {
    const result = await window.electronAPI.createFile(dirPath, fileName);
    if ('error' in result) throw new Error((result as any).error);
    await refreshDir(dirPath === rootPath ? rootPath : dirPath);
    if (dirPath !== rootPath) {
      await refreshRootIfNeeded(dirPath);
    }
    return (result as any).path as string;
  }, [refreshDir, rootPath]);

  const createFolder = useCallback(async (dirPath: string, folderName: string) => {
    const result = await window.electronAPI.createFolder(dirPath, folderName);
    if ('error' in result) throw new Error((result as any).error);
    await refreshDir(rootPath ?? dirPath);
    return (result as any).path as string;
  }, [refreshDir, rootPath]);

  const deleteEntry = useCallback(async (entryPath: string) => {
    await window.electronAPI.deleteEntry(entryPath);
    await refreshDir(rootPath ?? '');
  }, [refreshDir, rootPath]);

  const renameEntry = useCallback(async (entryPath: string, newName: string) => {
    const result = await window.electronAPI.renameEntry(entryPath, newName);
    if ('error' in result) throw new Error((result as any).error);
    await refreshDir(rootPath ?? '');
    return (result as any).path as string;
  }, [refreshDir, rootPath]);

  // helper – refreshes root when a nested dir changes
  const refreshRootIfNeeded = useCallback(async (changedPath: string) => {
    if (rootPath && changedPath.startsWith(rootPath)) {
      const entries = await readDir(rootPath);
      setFileTree(entries);
    }
  }, [rootPath, readDir]);

  return {
    rootPath,
    rootName,
    fileTree,
    expandedDirs,
    isLoading,
    openFolder,
    loadFolder,
    toggleDir,
    refreshDir,
    createFile,
    createFolder,
    deleteEntry,
    renameEntry,
    readDir
  };
}
