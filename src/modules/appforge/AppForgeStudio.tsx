/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AppForge Studio — Main Entry Component
// Integrates into LeapBlocks as a module
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React, { useState, lazy, Suspense } from 'react';
import { Home } from 'lucide-react';
import Logo, { CreoleapLogo } from '../../leapembed/client/components/Logo';
import './AppForgeStudio.css';
import { IgniteTopbar } from '../leapforge/components/Layout/IgniteTopbar';

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
      <IgniteTopbar
        title={project.appName}
        onTitleChange={(val) => updateProject({ appName: val })}
        onBack={onBack}
        onSave={handleSave}
        brandName="APPFORGE"
        centerContent={
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '20px' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: '0.2s',
                  background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'rgba(255, 255, 255, 0.5)'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        }
      />

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
