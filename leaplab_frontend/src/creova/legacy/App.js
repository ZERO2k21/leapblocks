// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge Studio — Root Component
// Three-tab layout: Designer | Blocks | Build
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useState, useCallback } from 'react';
import { VariablesProvider } from './context/VariablesContext';
import BlocksEditor from './components/BlockEditor/BlockEditor';

function DesignerPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <div className="text-[64px] mb-2 animate-float">🎨</div>
      <h2 className="text-[22px] font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Designer</h2>
      <p className="text-[14px] text-[#71717a] max-w-[300px]">Drag & drop components to build your app interface</p>
      <span className="px-3 py-1 rounded-full text-[11px] font-semibold text-[#06b6d4] bg-[rgba(6,182,212,0.1)] border border-[rgba(6,182,212,0.2)] tracking-[0.5px] uppercase">Phase 2</span>
    </div>
  );
}

function BlocksPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <div className="text-[64px] mb-2 animate-float">🧩</div>
      <h2 className="text-[22px] font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Blocks</h2>
      <p className="text-[14px] text-[#71717a] max-w-[300px]">Program your app logic with visual block coding</p>
      <span className="px-3 py-1 rounded-full text-[11px] font-semibold text-[#06b6d4] bg-[rgba(6,182,212,0.1)] border border-[rgba(6,182,212,0.2)] tracking-[0.5px] uppercase">Phase 3</span>
    </div>
  );
}

function BuildPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <div className="text-[64px] mb-2 animate-float">📦</div>
      <h2 className="text-[22px] font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Build</h2>
      <p className="text-[14px] text-[#71717a] max-w-[300px]">Compile and export your app as an Android APK</p>
      <span className="px-3 py-1 rounded-full text-[11px] font-semibold text-[#06b6d4] bg-[rgba(6,182,212,0.1)] border border-[rgba(6,182,212,0.2)] tracking-[0.5px] uppercase">Phase 5</span>
    </div>
  );
}

const TABS = [
  { id: 'designer', label: 'Designer', icon: '🎨', component: DesignerPlaceholder },
  { id: 'blocks',   label: 'Blocks',   icon: '🧩', component: BlocksEditor },
  { id: 'build',    label: 'Build',    icon: '📦', component: BuildPlaceholder },
];

const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.hostname === '[::1]';

const BUILD_SERVER_URL = (() => {
  if (isLocalhost) return 'localhost:3001';
  if (window.location.hostname === 'leapblocks.vercel.app') return 'leapblocks.onrender.com';
  if (window.location.hostname === 'leaplab.creoleap.com') return 'leapblocks.onrender.com';
  return 'leapblocks.onrender.com';
})();

export default function App() {
  const [activeTab, setActiveTab] = useState('designer');
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isEditing, setIsEditing] = useState(false);

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component || DesignerPlaceholder;

  const handleProjectNameSubmit = useCallback((e) => {
    e.preventDefault();
    setIsEditing(false);
  }, []);

  return (
    <VariablesProvider>
      <div className="flex flex-col h-screen w-screen bg-[#0f0f13]">
      <header className="flex items-center justify-between h-[48px] px-3 bg-[#16161d] border-b border-[#2a2a3a] z-[100] select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-2">
            <span className="text-[20px] drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]">⚡</span>
            <span className="text-[14px] font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent tracking-[-0.3px]">AppForge</span>
          </div>
          <div className="w-px h-5 bg-[#35354a]" />
          {isEditing ? (
            <form onSubmit={handleProjectNameSubmit} className="flex">
              <input
                className="w-[180px] px-2 py-1 rounded-md text-[12px] font-medium text-[#e4e4e7] bg-[#1e1e28] border border-[#3b82f6] outline-none"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setIsEditing(false)}
                autoFocus
                spellCheck={false}
              />
            </form>
          ) : (
            <button className="group flex items-center gap-2 px-2 py-1 rounded-md text-[12px] font-medium text-[#a1a1aa] hover:bg-[#2a2a38] hover:text-[#e4e4e7] transition-all duration-[120ms]" onClick={() => setIsEditing(true)}>
              {projectName}
              <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms]">✏️</span>
            </button>
          )}
        </div>

        <nav className="flex items-center gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all duration-[200ms] relative ${activeTab === tab.id ? 'text-[#e4e4e7] bg-[#32324a] after:content-[""] after:absolute after:bottom-[-1px] after:left-1/2 after:-translate-x-1/2 after:w-6 after:h-0.5 after:bg-gradient-to-r after:from-blue-500 after:to-cyan-500 after:rounded-full' : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#2a2a38]'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="text-[14px]">{tab.icon}</span>
              <span className="tracking-[-0.2px]">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded-md text-[14px] text-[#71717a] hover:bg-[#2a2a38] hover:text-[#e4e4e7] transition-all duration-[120ms]" title="Save Project">
            💾
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-md text-[14px] text-[#71717a] hover:bg-[#2a2a38] hover:text-[#e4e4e7] transition-all duration-[120ms]" title="Open Project">
            📂
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-md text-[14px] text-[#71717a] hover:bg-[#2a2a38] hover:text-[#e4e4e7] transition-all duration-[120ms]" title="Settings">
            ⚙️
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <ActiveComponent />
      </main>

      <footer className="flex items-center justify-between h-[28px] px-3 bg-[#16161d] border-t border-[#2a2a3a] text-[11px] text-[#71717a]">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.4)] animate-pulse-watcher" />
          Build Server: <strong className="text-[#a1a1aa] font-mono text-[11px]">{BUILD_SERVER_URL}</strong>
        </span>
        <span className="text-[#52525b] font-medium uppercase tracking-[1px] text-[10px]">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Mode
        </span>
        <span className="font-mono text-[10px]">
          AppForge Studio v0.1.0
        </span>
      </footer>
    </div>
      </VariablesProvider>
  );
}
