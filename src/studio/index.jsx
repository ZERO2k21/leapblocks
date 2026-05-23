/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited. deploy
 */
import React, { useState, useEffect } from 'react';

// ── FIX: Neutralize AMD define() before any Blockly imports ─────────────────
// Monaco Editor's CDN loader sets window.define globally. Blockly's UMD
// wrapper detects it and crashes. Clean it up at module load time.
if (typeof window !== 'undefined' && typeof window.define === 'function' && window.define.amd) {
  window.define = undefined;
}
import { useAppState } from './hooks/useAppState';
import { IgniteTopbar } from '../Electra/Client/Src/components/Layout/Topbar';
import Palette from './components/Palette_Enhanced';
import PhoneCanvas from './components/PhoneCanvas_Enhanced';
import PropertiesPanel from './components/PropertiesPanel';
import BlocksView from './components/BlocksView';
import BuildModal from './components/BuildModal';
import ComponentTree from './components/ComponentTree';
import MediaManager from './components/MediaManager';
import './styles/leap-studio.css';
import { Zap, Layout, Puzzle } from 'lucide-react';

function countVisibleComponents(screens = []) {
  let count = 0;
  const walk = (components = []) => {
    components.forEach((component) => {
      count += 1;
      if (component.children?.length) walk(component.children);
    });
  };
  screens.forEach((screen) => walk(screen.components || []));
  return count;
}

function buildBlocklyContextFromPayload(payload) {
  const screens = payload?.screens || [];
  const activeScreenId = payload?.activeScreen || screens[0]?.id;
  const currentScreen = screens.find((s) => s.id === activeScreenId) || screens[0];
  const flattenVisible = (list = []) => list.flatMap((item) => [item, ...(item.children ? flattenVisible(item.children) : [])]);
  const components = [
    ...flattenVisible(currentScreen?.components || []),
    ...(currentScreen?.nonVisibleComponents || [])
  ];
  return { currentScreen, components };
}

export default function AppInventor({ onBack }) {
  const appState = useAppState();
  const [activeTab, setActiveTab] = useState('designer');
  const [projectPath, setProjectPath] = useState(null);

  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [buildState, setBuildState] = useState('idle');
  const [buildLogs, setBuildLogs] = useState([]);
  const [apkPath, setApkPath] = useState(null);

  const handleNewProject = () => {
    if (confirm("Create a new project? Unsaved changes will be lost.")) {
      appState.newProject();
      setProjectPath(null);
      if (typeof window !== 'undefined') {
        window.__LEAP_BLOCK_XML__ = '';
      }
    }
  };

  const handleOpenProject = async () => {
    if (!window.electronAPI || !window.electronAPI.openProject) {
      alert("Opening projects is only supported in desktop mode.");
      return;
    }
    try {
      const result = await window.electronAPI.openProject();
      if (result && result.success && result.data) {
        appState.loadProject(result.data);
        setProjectPath(result.projectPath);

        const pathParts = result.projectPath.split(/[\\/]/);
        const folderName = pathParts[pathParts.length - 1];
        if (folderName) {
          appState.setAppName(folderName);
        }
      } else if (result && result.error) {
        alert(`Failed to open project: ${result.error}`);
      }
    } catch (err) {
      console.error("Failed to open project:", err);
      alert(`Failed to open project: ${err.message}`);
    }
  };

  const handleSaveProject = async () => {
    if (!window.electronAPI || !window.electronAPI.saveProject) {
      alert("Saving is only supported in desktop mode.");
      return;
    }
    try {
      const payload = appState.getSerializedState();
      const liveBlockXml = typeof window !== 'undefined' ? window.__LEAP_BLOCK_XML__ : null;
      if (typeof liveBlockXml === 'string' && liveBlockXml.trim()) {
        payload.blockLogic = liveBlockXml;
      }

      const result = await window.electronAPI.saveProject(payload, projectPath || undefined);
      if (result.success && result.projectPath) {
        setProjectPath(result.projectPath);
        const pathParts = result.projectPath.split(/[\\/]/);
        const folderName = pathParts[pathParts.length - 1];
        if (folderName) {
          appState.setAppName(folderName);
        }
        alert("Project saved successfully!");
      } else if (result.error) {
        alert(`Failed to save project: ${result.error}`);
      }
    } catch (err) {
      console.error("Failed to save project:", err);
      alert(`Failed to save project: ${err.message}`);
    }
  };

  const handleSaveAsProject = async () => {
    if (!window.electronAPI || !window.electronAPI.saveProject) {
      alert("Saving is only supported in desktop mode.");
      return;
    }
    try {
      const payload = appState.getSerializedState();
      const liveBlockXml = typeof window !== 'undefined' ? window.__LEAP_BLOCK_XML__ : null;
      if (typeof liveBlockXml === 'string' && liveBlockXml.trim()) {
        payload.blockLogic = liveBlockXml;
      }

      const result = await window.electronAPI.saveProject(payload, undefined);
      if (result.success && result.projectPath) {
        setProjectPath(result.projectPath);
        const pathParts = result.projectPath.split(/[\\/]/);
        const folderName = pathParts[pathParts.length - 1];
        if (folderName) {
          appState.setAppName(folderName);
        }
        alert("Project saved successfully!");
      } else if (result.error) {
        alert(`Failed to save project: ${result.error}`);
      }
    } catch (err) {
      console.error("Failed to save project as:", err);
      alert(`Failed to save project: ${err.message}`);
    }
  };

  const handleUndo = () => {
    if (activeTab === 'blocks' && typeof window !== 'undefined' && window.Blockly) {
      const workspace = window.Blockly.getMainWorkspace();
      if (workspace) workspace.undo(false);
    }
  };

  const handleRedo = () => {
    if (activeTab === 'blocks' && typeof window !== 'undefined' && window.Blockly) {
      const workspace = window.Blockly.getMainWorkspace();
      if (workspace) workspace.undo(true);
    }
  };

  // Keyboard Shortcuts (Ctrl+S, Ctrl+N, Ctrl+O, Ctrl+Shift+S, Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S: Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveProject();
      }
      // Ctrl+Shift+S: Save As
      else if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        handleSaveAsProject();
      }
      // Ctrl+N: New Project
      else if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        handleNewProject();
      }
      // Ctrl+O: Open Project
      else if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        handleOpenProject();
      }
      // Ctrl+Z: Undo
      else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y: Redo
      else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projectPath, appState, activeTab]);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onBuildLog) {
      window.electronAPI.onBuildLog((msg) => {
        setBuildLogs((prev) => [...prev, msg]);
      });
      return () => {
        if (window.electronAPI.removeBuildLogListener) {
          window.electronAPI.removeBuildLogListener();
        }
      };
    }
  }, []);

  const handleBuildApk = async () => {
    // Web mode fallback if electronAPI is not present
    const isElectron = window.electronAPI && window.electronAPI.buildApk;

    setIsBuildModalOpen(true);
    setBuildState('building');
    setBuildLogs(['Initializing build process...']);
    setApkPath(null);

    try {
      const payload = appState.getSerializedState();
      const liveBlockXml = typeof window !== 'undefined' ? window.__LEAP_BLOCK_XML__ : null;
      if (typeof liveBlockXml === 'string' && liveBlockXml.trim()) {
        payload.blockLogic = liveBlockXml;
      }
      const visibleComponentCount = countVisibleComponents(payload.screens || []);
      setBuildLogs((prev) => [
        ...prev,
        `Project snapshot: ${(payload.screens || []).length || 1} screen(s), ${visibleComponentCount} visible component(s)`
      ]);

      if (payload.blockLogic && payload.blockLogic.trim().startsWith('<')) {
        try {
          setBuildLogs((prev) => [...prev, 'Transpiling block logic to JavaScript...']);
          const { initializeAllBlocks } = await import('./blocks/definitions/index');
          const Blockly = (await import('blockly')).default || (await import('blockly'));
          const { javascriptGenerator } = await import('blockly/javascript');
          await import('./blocks/generators/reactnative');
          initializeAllBlocks();

          const { currentScreen, components } = buildBlocklyContextFromPayload(payload);
          window.LeapLab_Components = components;
          window.LeapLab_ActiveScreen = currentScreen;

          const tempWorkspace = new Blockly.Workspace();
          try {
            const xml = Blockly.utils.xml.textToDom(payload.blockLogic);
            Blockly.Xml.domToWorkspace(xml, tempWorkspace);
            const generatedJs = javascriptGenerator.workspaceToCode(tempWorkspace);
            if (generatedJs && generatedJs.trim()) {
              payload.blockLogic = generatedJs;
              setBuildLogs((prev) => [...prev, 'Block logic transpiled to JavaScript']);
            } else {
              payload.blockLogic = '';
              setBuildLogs((prev) => [...prev, 'No block logic to transpile']);
            }
          } finally {
            tempWorkspace.dispose();
          }
        } catch (transpileErr) {
          console.warn('Block transpilation failed, building without block logic:', transpileErr);
          setBuildLogs((prev) => [...prev, `Block transpilation skipped: ${transpileErr.message}`]);
          payload.blockLogic = '';
        }
      }

      if (isElectron) {
        setBuildLogs((prev) => [...prev, 'Sending build request to main process...']);
        const result = await window.electronAPI.buildApk(payload);

        if (result.success) {
          setBuildState('success');
          setApkPath(result.outputPath);
          setBuildLogs((prev) => [...prev, 'Build complete! APK is ready.']);
        } else {
          setBuildState('error');
          setBuildLogs((prev) => [...prev, `Build failed: ${result.error}`]);
        }
      } else {
        setBuildLogs((prev) => [...prev, 'Sending build request to cloud compiler...']);
        const { CLOUD_COMPILER_URL } = await import('../config/platform');

        const response = await fetch(`${CLOUD_COMPILER_URL}/build-apk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Server error: ${response.status} - ${text}`);
        }

        const result = await response.json();
        if (result.success) {
          setBuildState('success');
          if (Array.isArray(result.logs) && result.logs.length) {
            setBuildLogs((prev) => [...prev, ...result.logs]);
          }
          // downloadUrl should be a full or relative URL
          setApkPath(result.downloadUrl.startsWith('http') ? result.downloadUrl : `${CLOUD_COMPILER_URL}${result.downloadUrl}`);
          setBuildLogs((prev) => [...prev, 'Build complete! APK is ready to download.']);
        } else {
          setBuildState('error');
          setBuildLogs((prev) => [...prev, `Build failed: ${result.error}`]);
        }
      }
    } catch (error) {
      setBuildState('error');
      setBuildLogs((prev) => [...prev, `Build failed: ${error.message}`]);
    }
  };

  const handleOpenFile = () => {
    if (window.electronAPI && window.electronAPI.showInFolder && apkPath && !apkPath.startsWith('http')) {
      window.electronAPI.showInFolder(apkPath);
    } else if (apkPath) {
      // In web mode, download the file
      window.open(apkPath, '_blank');
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-slate-50 text-slate-900 font-sans">
      <IgniteTopbar
        title={appState.appName}
        onTitleChange={(val) => appState.setAppName(val)}
        onBack={onBack}
        onSave={handleSaveProject}
        onSaveAs={handleSaveAsProject}
        onNew={handleNewProject}
        onOpen={handleOpenProject}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={activeTab === 'blocks'}
        canRedo={activeTab === 'blocks'}
        brandName="STUDIO"
        rightContent={
          <div className="flex items-center gap-6 shrink-0">
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              padding: '3px',
              backgroundColor: 'rgba(9, 9, 11, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              flexShrink: 0
            }}>
              {['Designer', 'Blocks'].map((tab) => {
                const isActive = activeTab === tab.toLowerCase();
                return (
                  <button
                    key={tab}
                    id={`tab-${tab.toLowerCase()}`}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 16px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      flexShrink: 0,
                      border: '1px solid transparent',
                      backgroundColor: isActive ? '#2563eb' : 'transparent',
                      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                      boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {tab === 'Designer' ? (
                      <Layout size={13} style={{ transition: 'color 0.2s', color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.45)' }} />
                    ) : (
                      <Puzzle size={13} style={{ transition: 'color 0.2s', color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.45)' }} />
                    )}
                    <span>{tab}</span>
                  </button>
                );
              })}
            </nav>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.15)', margin: '0 8px', flexShrink: 0 }} />
            <button
              id="btn-build-apk"
              onClick={handleBuildApk}
              style={{
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.35)';
              }}
            >
              <Zap size={13} style={{ fill: '#ffffff', color: '#ffffff' }} />
              BUILD PRODUCTION
            </button>
          </div>
        }
      />

      <div className={`flex-1 overflow-hidden ${activeTab === 'designer' ? 'grid grid-cols-[280px_minmax(400px,1fr)_300px_320px] gap-6 p-6 bg-slate-50' : 'flex p-0'}`}>
        {activeTab === 'designer' ? (
          <>
            <div className="min-h-0 overflow-hidden bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-md hover:-translate-y-px flex flex-col transition-all duration-300">
              <Palette />
            </div>

            <div className="min-h-0 flex flex-col bg-transparent">
              <PhoneCanvas appState={appState} />
            </div>

            <div className="min-h-0 overflow-hidden bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-md hover:-translate-y-px flex flex-col transition-all duration-300">
              <div className="flex-1 min-h-0 flex flex-col">
                <ComponentTree appState={appState} />
              </div>
              <div className="h-[380px] border-t border-slate-200 flex flex-col">
                <MediaManager appState={appState} />
              </div>
            </div>

            <div className="min-h-0 overflow-hidden bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-md hover:-translate-y-px flex flex-col transition-all duration-300">
              <PropertiesPanel appState={appState} />
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col">
            <BlocksView appState={appState} />
          </div>
        )}
      </div>

      <BuildModal
        isOpen={isBuildModalOpen}
        onClose={() => {
          if (buildState !== 'building') {
            setIsBuildModalOpen(false);
          }
        }}
        buildState={buildState}
        logs={buildLogs}
        appName={appState.appName}
        packageName={appState.packageName}
        onOpenFile={handleOpenFile}
        onRetry={handleBuildApk}
      />
    </div>
  );
}
