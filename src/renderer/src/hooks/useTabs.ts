import { useState, useCallback } from 'react';
import type { Tab } from '../types';
import { getLanguageFromPath } from '../themes';

let tabIdCounter = 0;

export function useTabs() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) ?? null;

  const openTab = useCallback((filePath: string, content: string, name?: string) => {
    setTabs(prev => {
      const existing = prev.find(t => t.filePath === filePath);
      if (existing) {
        setActiveTabId(existing.id);
        return prev;
      }
      const id = `tab-${++tabIdCounter}`;
      const fileName = name ?? filePath.split('/').pop() ?? filePath;
      const newTab: Tab = {
        id,
        filePath,
        fileName,
        content,
        savedContent: content,
        language: getLanguageFromPath(fileName),
        isUntitled: filePath.startsWith('untitled://')
      };
      setActiveTabId(id);
      return [...prev, newTab];
    });
  }, []);

  const openNewTab = useCallback(() => {
    const id = `tab-${++tabIdCounter}`;
    const fileName = 'Untitled';
    const newTab: Tab = {
      id,
      filePath: `untitled://${id}`,
      fileName,
      content: '',
      savedContent: '',
      language: 'plaintext',
      isUntitled: true
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(id);
    return id;
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === tabId);
      const next = prev.filter(t => t.id !== tabId);
      if (tabId === activeTabId) {
        const newActive = next[idx] ?? next[idx - 1] ?? next[0] ?? null;
        setActiveTabId(newActive?.id ?? null);
      }
      return next;
    });
  }, [activeTabId]);

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, content } : t
    ));
  }, []);

  const markTabSaved = useCallback((tabId: string, savedContent?: string, newPath?: string, newName?: string) => {
    setTabs(prev => prev.map(t =>
      t.id === tabId ? {
        ...t,
        savedContent: savedContent ?? t.content,
        filePath: newPath ?? t.filePath,
        fileName: newName ?? t.fileName,
        isUntitled: false,
        language: newName ? getLanguageFromPath(newName) : t.language
      } : t
    ));
  }, []);

  const updateCursorPosition = useCallback((tabId: string, line: number, column: number) => {
    setTabs(prev => prev.map(t =>
      t.id === tabId ? { ...t, cursorPosition: { line, column } } : t
    ));
  }, []);

  const cycleTabs = useCallback((direction: 'next' | 'prev') => {
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex(t => t.id === activeTabId);
    const next = direction === 'next'
      ? (idx + 1) % tabs.length
      : (idx - 1 + tabs.length) % tabs.length;
    setActiveTabId(tabs[next].id);
  }, [tabs, activeTabId]);

  const isTabDirty = useCallback((tabId: string): boolean => {
    const tab = tabs.find(t => t.id === tabId);
    return tab ? tab.content !== tab.savedContent : false;
  }, [tabs]);

  return {
    tabs,
    activeTabId,
    activeTab,
    openTab,
    openNewTab,
    closeTab,
    updateTabContent,
    markTabSaved,
    updateCursorPosition,
    cycleTabs,
    isTabDirty,
    setActiveTabId
  };
}
