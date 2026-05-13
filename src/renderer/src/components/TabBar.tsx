import React, { useRef } from 'react';
import type { Tab } from '../types';
import { getFileIcon } from '../themes';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  isTabDirty: (id: string) => boolean;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs, activeTabId, onTabClick, onTabClose, isTabDirty
}) => {
  const barRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (barRef.current) {
      barRef.current.scrollLeft += e.deltaY;
    }
  };

  if (tabs.length === 0) return null;

  return (
    <div className="tab-bar" ref={barRef} onWheel={handleWheel}>
      {tabs.map(tab => {
        const dirty = isTabDirty(tab.id);
        const isActive = tab.id === activeTabId;
        const icon = getFileIcon(tab.fileName, false);

        return (
          <div
            key={tab.id}
            className={`tab ${isActive ? 'active' : ''}`}
            onClick={() => onTabClick(tab.id)}
            title={tab.filePath}
          >
            <span className="icon" style={{ fontSize: 12 }}>{icon}</span>
            <span className="tab-name">{tab.fileName}</span>
            {dirty && <span className="tab-dot" title="Unsaved changes" />}
            <button
              className="tab-close"
              onClick={e => { e.stopPropagation(); onTabClose(tab.id); }}
              title="Close"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};
