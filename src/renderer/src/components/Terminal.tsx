import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { TerminalSession } from '../hooks/useTerminal';

interface TerminalProps {
  sessions: TerminalSession[];
  activeSessionId: number | null;
  onNewSession: () => void;
  onCloseSession: (id: number) => void;
  onActivate: (id: number) => void;
  onInput: (id: number, data: string) => void;
  onResize: (id: number, cols: number, rows: number) => void;
  onDataSubscribe: (id: number, cb: (data: string) => void) => () => void;
}

interface XTermInstance {
  open: (el: HTMLElement) => void;
  write: (data: string) => void;
  onData: (cb: (data: string) => void) => { dispose: () => void };
  dispose: () => void;
  loadAddon: (addon: any) => void;
  cols: number;
  rows: number;
}

const TerminalInstance: React.FC<{
  sessionId: number;
  isActive: boolean;
  onInput: (data: string) => void;
  onResize: (cols: number, rows: number) => void;
  onDataSubscribe: (id: number, cb: (data: string) => void) => () => void;
}> = ({ sessionId, isActive, onInput, onResize, onDataSubscribe }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTermInstance | null>(null);
  const fitRef = useRef<any>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let term: XTermInstance | null = null;

    const init = async () => {
      if (!containerRef.current) return;

      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');
      const { WebLinksAddon } = await import('xterm-addon-web-links');

      term = new Terminal({
        theme: {
          background: '#181825',
          foreground: '#CDD6F4',
          cursor: '#F5C2E7',
          black: '#45475A', brightBlack: '#585B70',
          red: '#F38BA8', brightRed: '#F38BA8',
          green: '#A6E3A1', brightGreen: '#A6E3A1',
          yellow: '#F9E2AF', brightYellow: '#F9E2AF',
          blue: '#89B4FA', brightBlue: '#89B4FA',
          magenta: '#CBA6F7', brightMagenta: '#CBA6F7',
          cyan: '#89DCEB', brightCyan: '#89DCEB',
          white: '#BAC2DE', brightWhite: '#A6ADC8'
        },
        fontFamily: "'JetBrains Mono', 'Cascadia Code', Menlo, Consolas, monospace",
        fontSize: 13,
        lineHeight: 1.3,
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 5000,
        convertEol: true
      }) as unknown as XTermInstance;

      const fitAddon = new FitAddon();
      const linksAddon = new WebLinksAddon();

      term.loadAddon(fitAddon as any);
      term.loadAddon(linksAddon as any);
      term.open(containerRef.current);

      fitRef.current = fitAddon;
      termRef.current = term;

      // Fit to container
      setTimeout(() => {
        fitAddon.fit();
        onResize(term!.cols, term!.rows);
      }, 50);

      // Listen for user input
      term.onData((data: string) => onInput(data));

      // Subscribe to data from main process
      const unsub = onDataSubscribe(sessionId, (data) => {
        term?.write(data);
      });
      unsubRef.current = unsub;
    };

    init();

    return () => {
      unsubRef.current?.();
      term?.dispose();
    };
  }, [sessionId]);

  // Handle resize
  useEffect(() => {
    if (!isActive) return;
    const fit = () => {
      if (fitRef.current && termRef.current) {
        fitRef.current.fit();
        onResize(termRef.current.cols, termRef.current.rows);
      }
    };
    const observer = new ResizeObserver(fit);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isActive, onResize]);

  // Focus when activated
  useEffect(() => {
    if (isActive && containerRef.current) {
      containerRef.current.querySelector('.xterm')?.querySelector('textarea')?.focus();
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className="terminal-container"
      style={{ display: isActive ? 'block' : 'none', height: '100%' }}
    />
  );
};

export const Terminal: React.FC<TerminalProps> = ({
  sessions, activeSessionId, onNewSession, onCloseSession,
  onActivate, onInput, onResize, onDataSubscribe
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="terminal-header">
        <span className="terminal-title">Terminal</span>

        <div className="terminal-tabs">
          {sessions.map(s => (
            <button
              key={s.id}
              className={`terminal-tab ${s.id === activeSessionId ? 'active' : ''}`}
              onClick={() => onActivate(s.id)}
            >
              {s.name}
              <span
                style={{ marginLeft: 4, opacity: 0.6 }}
                onClick={e => { e.stopPropagation(); onCloseSession(s.id); }}
              >
                ×
              </span>
            </button>
          ))}
          <button
            className="terminal-tab"
            onClick={onNewSession}
            title="New Terminal"
            style={{ padding: '2px 8px' }}
          >
            +
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', background: '#181825' }}>
        {sessions.length === 0 ? (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', flexDirection: 'column', gap: 8
          }}>
            <span style={{ fontSize: 24 }}>⚡</span>
            <span style={{ fontSize: 13 }}>Click + to start a terminal session</span>
          </div>
        ) : (
          sessions.map(s => (
            <TerminalInstance
              key={s.id}
              sessionId={s.id}
              isActive={s.id === activeSessionId}
              onInput={(data) => onInput(s.id, data)}
              onResize={(cols, rows) => onResize(s.id, cols, rows)}
              onDataSubscribe={onDataSubscribe}
            />
          ))
        )}
      </div>
    </div>
  );
};
