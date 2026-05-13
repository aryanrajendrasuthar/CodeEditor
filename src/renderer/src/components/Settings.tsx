import React, { useState } from 'react';
import type { EditorSettings } from '../types';
import { THEMES } from '../themes';

interface SettingsProps {
  settings: EditorSettings;
  onSave: (settings: Partial<EditorSettings>) => void;
  onClose: () => void;
}

const FONT_FAMILIES = [
  "'JetBrains Mono', 'Cascadia Code', Menlo, Consolas, monospace",
  "Menlo, Monaco, 'Courier New', monospace",
  "'Cascadia Code', Consolas, 'Courier New', monospace",
  "'Fira Code', 'Fira Mono', monospace",
  "'Source Code Pro', Consolas, monospace",
  "Consolas, 'Courier New', monospace"
];

const FONT_FAMILY_LABELS: Record<string, string> = {
  "'JetBrains Mono', 'Cascadia Code', Menlo, Consolas, monospace": 'JetBrains Mono',
  "Menlo, Monaco, 'Courier New', monospace": 'Menlo',
  "'Cascadia Code', Consolas, 'Courier New', monospace": 'Cascadia Code',
  "'Fira Code', 'Fira Mono', monospace": 'Fira Code',
  "'Source Code Pro', Consolas, monospace": 'Source Code Pro',
  "Consolas, 'Courier New', monospace": 'Consolas'
};

export const Settings: React.FC<SettingsProps> = ({ settings, onSave, onClose }) => {
  const [local, setLocal] = useState<EditorSettings>({ ...settings });

  const update = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    setLocal(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(local);
    onClose();
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="icon-btn" onClick={onClose} style={{ fontSize: 18 }}>×</button>
        </div>

        <div className="settings-body">
          {/* Appearance */}
          <div className="settings-section">
            <h3>Appearance</h3>

            <div className="setting-row">
              <div>
                <div className="setting-label">Theme</div>
                <div className="setting-description">Color theme for the editor</div>
              </div>
              <div className="setting-control">
                <select
                  className="setting-select"
                  value={local.theme}
                  onChange={e => update('theme', e.target.value)}
                >
                  {Object.entries(THEMES).map(([id, t]) => (
                    <option key={id} value={id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-label">Font Family</div>
                <div className="setting-description">Editor font</div>
              </div>
              <div className="setting-control">
                <select
                  className="setting-select"
                  value={local.fontFamily}
                  onChange={e => update('fontFamily', e.target.value)}
                >
                  {FONT_FAMILIES.map(f => (
                    <option key={f} value={f}>{FONT_FAMILY_LABELS[f] ?? f}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-label">Font Size</div>
                <div className="setting-description" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  Current: {local.fontSize}px
                </div>
              </div>
              <div className="setting-control" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="range"
                  className="setting-input"
                  min={10}
                  max={24}
                  value={local.fontSize}
                  onChange={e => update('fontSize', parseInt(e.target.value))}
                />
                <span style={{ color: 'var(--text-primary)', width: 28, textAlign: 'right', fontSize: 13 }}>
                  {local.fontSize}
                </span>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-label">Minimap</div>
                <div className="setting-description">Show code minimap on the right</div>
              </div>
              <div className="setting-control">
                <button
                  className={`toggle ${local.minimap ? 'on' : ''}`}
                  onClick={() => update('minimap', !local.minimap)}
                />
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="settings-section">
            <h3>Editor</h3>

            <div className="setting-row">
              <div>
                <div className="setting-label">Tab Size</div>
                <div className="setting-description">Number of spaces per tab</div>
              </div>
              <div className="setting-control">
                <select
                  className="setting-select"
                  value={local.tabSize}
                  onChange={e => update('tabSize', parseInt(e.target.value))}
                >
                  {[2, 4, 8].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-label">Word Wrap</div>
                <div className="setting-description">Wrap long lines</div>
              </div>
              <div className="setting-control">
                <select
                  className="setting-select"
                  value={local.wordWrap}
                  onChange={e => update('wordWrap', e.target.value as any)}
                >
                  <option value="on">On</option>
                  <option value="off">Off</option>
                  <option value="wordWrapColumn">At Column</option>
                  <option value="bounded">Bounded</option>
                </select>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-label">Auto Save</div>
                <div className="setting-description">Automatically save files after edits</div>
              </div>
              <div className="setting-control">
                <button
                  className={`toggle ${local.autoSave ? 'on' : ''}`}
                  onClick={() => update('autoSave', !local.autoSave)}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
              border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: 13
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 16px', background: 'var(--accent)', color: '#000',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600
            }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
