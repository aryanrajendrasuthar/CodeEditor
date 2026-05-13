import { useState, useCallback, useRef, useEffect } from 'react';

export interface TerminalSession {
  id: number;
  name: string;
  cwd: string;
  isReady: boolean;
}

export function useTerminal() {
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const dataCallbacks = useRef<Map<number, (data: string) => void>>(new Map());
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsub = window.electronAPI.onTerminalData((id, data) => {
      const cb = dataCallbacks.current.get(id);
      if (cb) cb(data);
    });
    unsubRef.current = unsub;

    const unsubExit = window.electronAPI.onTerminalExit((id) => {
      setSessions(prev => prev.filter(s => s.id !== id));
      dataCallbacks.current.delete(id);
    });

    return () => {
      unsub();
      unsubExit();
    };
  }, []);

  const createSession = useCallback(async (cwd: string): Promise<number | null> => {
    const result = await window.electronAPI.createTerminal(cwd);
    if (!result || !result.id) return null;

    const name = `Terminal ${sessions.length + 1}`;
    const session: TerminalSession = {
      id: result.id,
      name,
      cwd,
      isReady: !result.error
    };

    setSessions(prev => [...prev, session]);
    setActiveSessionId(result.id);
    return result.id;
  }, [sessions.length]);

  const destroySession = useCallback(async (id: number) => {
    await window.electronAPI.destroyTerminal(id);
    dataCallbacks.current.delete(id);
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (id === activeSessionId) {
        setActiveSessionId(next[next.length - 1]?.id ?? null);
      }
      return next;
    });
  }, [activeSessionId]);

  const sendInput = useCallback((id: number, data: string) => {
    window.electronAPI.terminalInput(id, data);
  }, []);

  const resizeTerminal = useCallback((id: number, cols: number, rows: number) => {
    window.electronAPI.resizeTerminal(id, cols, rows);
  }, []);

  const onData = useCallback((id: number, cb: (data: string) => void) => {
    dataCallbacks.current.set(id, cb);
    return () => dataCallbacks.current.delete(id);
  }, []);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    destroySession,
    sendInput,
    resizeTerminal,
    onData
  };
}
