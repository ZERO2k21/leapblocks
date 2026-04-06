// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge Studio — Main Entry Component
// Integrates into LeapBlocks as a module
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useState, lazy, Suspense } from 'react';
import { Home } from 'lucide-react';
import Logo, { CreoleapLogo } from '../../components/Logo';
import './AppForgeStudio.css';

// Lazy load heavy panels
const Designer = lazy(() => import('./components/Designer/Designer'));
const BlockEditor = lazy(() => import('./components/BlockEditor/BlockEditor'));
const BuildPanel = lazy(() => import('./components/Builder/BuildPanel'));

interface AppForgeProps {
  onBack: () => void;
}

type AFTab = 'designer' | 'blocks' | 'build';

// Project state shared across all tabs
export interface AFProject {
  appName: string;
  packageName: string;
  screens: AFScreen[];
  activeScreenIndex: number;
  blocks: any;   // Blockly JSON
  assets: any[];
}

export interface AFScreen {
  name: string;
  components: AFComponent[];
}

export interface AFComponent {
  id: string;
  type: string;
  name: string;
  parentId: string | null;
  properties: Record<string, any>;
  children?: AFComponent[];
}

const DEFAULT_PROJECT: AFProject = {
  appName: 'My App',
  packageName: 'com.appforge.myapp',
  screens: [{ name: 'Screen1', components: [] }],
  activeScreenIndex: 0,
  blocks: null,
  assets: [],
};

const TABS: { id: AFTab; label: string; icon: string }[] = [
  { id: 'designer', label: 'Designer', icon: '🎨' },
  { id: 'blocks', label: 'Blocks', icon: '🧩' },
  { id: 'build', label: 'Build', icon: '📦' },
];

export default function AppForgeStudio({ onBack }: AppForgeProps) {
  const [activeTab, setActiveTab] = useState<AFTab>('designer');
  const [project, setProject] = useState<AFProject>({ ...DEFAULT_PROJECT });
  const [isEditingName, setIsEditingName] = useState(false);

  const updateProject = (updates: Partial<AFProject>) => {
    setProject(prev => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    try {
      const w = window as any;
      if (w.electronAPI?.saveProject) {
        await w.electronAPI.saveProject(project);
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleOpen = async () => {
    try {
      const w = window as any;
      if (w.electronAPI?.openProject) {
        const data = await w.electronAPI.openProject();
        if (data) setProject(data);
      }
    } catch (err) {
      console.error('Open failed:', err);
    }
  };

  return (
    <div className="af-root">
      {/* ── Top Bar ──────────────────────────── */}
      <header className="af-topbar">
        <div className="af-topbar-left">
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              marginRight: 10,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Back to Home"
          >
            <Home size={19} strokeWidth={2.2} />
          </button>
          <div className="af-brand">
            <Logo height={48} />
            <div className="af-brand-texts">
              <span className="af-brand-small">LeapLab</span>
              <span className="af-brand-text">AppForge</span>
            </div>
          </div>
          <div className="af-divider" />
          {isEditingName ? (
            <form onSubmit={(e) => { e.preventDefault(); setIsEditingName(false); }} className="af-name-form">
              <input
                className="af-name-input"
                value={project.appName}
                onChange={(e) => updateProject({ appName: e.target.value })}
                onBlur={() => setIsEditingName(false)}
                autoFocus
                spellCheck={false}
              />
            </form>
          ) : (
            <button className="af-name-btn" onClick={() => setIsEditingName(true)}>
              {project.appName}
              <span className="af-edit-hint">✏️</span>
            </button>
          )}
        </div>

        <nav className="af-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`af-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="af-tab-icon">{tab.icon}</span>
              <span className="af-tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="af-topbar-right">
          <div className="af-right-brand">
            <CreoleapLogo height={150} />
          </div>
          <button className="af-action-btn" onClick={handleSave} title="Save Project">💾</button>
          <button className="af-action-btn" onClick={handleOpen} title="Open Project">📂</button>
        </div>
      </header>

      {/* ── Main Content ─────────────────────── */}
      <main className="af-content">
        <Suspense fallback={<div className="af-loading">Loading...</div>}>
          {activeTab === 'designer' && (
            <Designer project={project} updateProject={updateProject} />
          )}
          {activeTab === 'blocks' && (
            <BlockEditor project={project} updateProject={updateProject} />
          )}
          {activeTab === 'build' && (
            <BuildPanel project={project} />
          )}
        </Suspense>
      </main>

      {/* ── Status Bar ────────────────────────── */}
      <footer className="af-statusbar">
        <span className="af-status-left">
          <span className="af-status-dot" />
          Screen: <strong>{project.screens[project.activeScreenIndex]?.name || 'Screen1'}</strong>
          &nbsp;·&nbsp;
          {project.screens[project.activeScreenIndex]?.components.length || 0} components
        </span>
        <span className="af-status-center">
          {activeTab.toUpperCase()} MODE
        </span>
        <span className="af-status-right">
          AppForge v0.1.0
        </span>
      </footer>
    </div>
  );
}
