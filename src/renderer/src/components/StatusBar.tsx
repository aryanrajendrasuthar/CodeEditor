import React from 'react';
import type { Tab, EditorSettings } from '../types';
import { THEMES } from '../themes';

interface StatusBarProps {
  activeTab: Tab | null;
  settings: EditorSettings;
  gitBranch: string | null;
  onLanguageClick: () => void;
  onThemeClick: () => void;
  onSettingsClick: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeTab, settings, gitBranch,
  onLanguageClick, onThemeClick, onSettingsClick
}) => {
  const position = activeTab?.cursorPosition;
  const theme = THEMES[settings.theme];

  return (
    <div className="status-bar">
      {/* Left section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        {gitBranch && (
          <div className="status-item">
            <span>⎇</span>
            <span>{gitBranch}</span>
          </div>
        )}
        {activeTab && (
          <div className="status-item">
            <span className="dot green" />
            <span>{activeTab.isUntitled ? 'Untitled' : 'Saved'}</span>
          </div>
        )}
      </div>

      {/* Center */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {activeTab && position && (
          <div className="status-item">
            <span>Ln {position.line}, Col {position.column}</span>
          </div>
        )}
        {activeTab && (
          <>
            <div className="status-item">
              <span>Spaces: {settings.tabSize}</span>
            </div>
            <div className="status-item">
              <span>UTF-8</span>
            </div>
            <div className="status-item clickable" onClick={onLanguageClick} title="Change language mode">
              <span style={{ textTransform: 'capitalize' }}>{activeTab.language}</span>
            </div>
          </>
        )}
      </div>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="status-item clickable" onClick={onThemeClick} title="Change theme">
          <span>🎨 {theme?.label ?? settings.theme}</span>
        </div>
        <div className="status-item clickable" onClick={onSettingsClick} title="Settings">
          <span>⚙️</span>
        </div>
      </div>
    </div>
  );
};
