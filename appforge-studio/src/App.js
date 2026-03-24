// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge Studio — Root Component
// Three-tab layout: Designer | Blocks | Build
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useState, useCallback } from 'react';
import { VariablesProvider } from './context/VariablesContext';
import BlocksEditor from './components/BlockEditor/BlockEditor';

// Placeholder components — replaced in later phases
function DesignerPlaceholder() {
  return (
    <div className="tab-placeholder">
      <div className="placeholder-icon">🎨</div>
      <h2>Designer</h2>
      <p>Drag & drop components to build your app interface</p>
      <span className="placeholder-badge">Phase 2</span>
    </div>
  );
}

function BlocksPlaceholder() {
  return (
    <div className="tab-placeholder">
      <div className="placeholder-icon">🧩</div>
      <h2>Blocks</h2>
      <p>Program your app logic with visual block coding</p>
      <span className="placeholder-badge">Phase 3</span>
    </div>
  );
}

function BuildPlaceholder() {
  return (
    <div className="tab-placeholder">
      <div className="placeholder-icon">📦</div>
      <h2>Build</h2>
      <p>Compile and export your app as an Android APK</p>
      <span className="placeholder-badge">Phase 5</span>
    </div>
  );
}

const TABS = [
  { id: 'designer', label: 'Designer', icon: '🎨', component: DesignerPlaceholder },
  { id: 'blocks',   label: 'Blocks',   icon: '🧩', component: BlocksEditor },
  { id: 'build',    label: 'Build',    icon: '📦', component: BuildPlaceholder },
];

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
      <div className="app-root">
      {/* ── Top Navigation Bar ─────────────────── */}
      <header className="app-navbar">
        <div className="navbar-left">
          <div className="navbar-brand">
            <span className="brand-icon">⚡</span>
            <span className="brand-text">AppForge</span>
          </div>
          <div className="navbar-divider" />
          {isEditing ? (
            <form onSubmit={handleProjectNameSubmit} className="project-name-form">
              <input
                className="project-name-input"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setIsEditing(false)}
                autoFocus
                spellCheck={false}
              />
            </form>
          ) : (
            <button className="project-name-btn" onClick={() => setIsEditing(true)}>
              {projectName}
              <span className="edit-hint">✏️</span>
            </button>
          )}
        </div>

        <nav className="navbar-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`navbar-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="navbar-right">
          <button className="navbar-action" title="Save Project">
            💾
          </button>
          <button className="navbar-action" title="Open Project">
            📂
          </button>
          <button className="navbar-action" title="Settings">
            ⚙️
          </button>
        </div>
      </header>

      {/* ── Main Content Area ──────────────────── */}
      <main className="app-content">
        <ActiveComponent />
      </main>

      {/* ── Status Bar ─────────────────────────── */}
      <footer className="app-statusbar">
        <span className="status-left">
          <span className="status-dot online" />
          Build Server: <strong>localhost:3001</strong>
        </span>
        <span className="status-center">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Mode
        </span>
        <span className="status-right">
          AppForge Studio v0.1.0
        </span>
      </footer>
    </div>
      </VariablesProvider>
  );
}
