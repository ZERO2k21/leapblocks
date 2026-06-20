/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited. deploy
 */
import React, { useState, useEffect, useRef } from 'react';

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
import './styles/leap-creova.css';
import { Zap, Layout, Puzzle } from 'lucide-react';
import { fileService } from '../Electra/Client/Src/services/FileService';
import { useCloudProjectStore } from '../store/cloudProjectStore';
import { showToast } from '../leapignite/client/components/Toast';

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

export default function AppInventor({ onBack, onRedirectToElectra, redirectProjectData, clearRedirectProjectData }) {
  const appState = useAppState();
  const [activeTab, setActiveTab] = useState('designer');
  const [projectPath, setProjectPath] = useState(null);
  const fileInputRef = useRef(null);

  // Process redirect project data
  useEffect(() => {
    if (redirectProjectData && clearRedirectProjectData) {
      console.log('[AppInventor] Processing redirect project data:', redirectProjectData);
      appState.loadProject(redirectProjectData.data);
      if (redirectProjectData.projectPath) {
        setProjectPath(redirectProjectData.projectPath);
        const pathParts = redirectProjectData.projectPath.split(/[\\/]/);
        const folderName = pathParts[pathParts.length - 1];
        if (folderName) appState.setAppName(folderName.replace(/\.(leap|lbp)$/i, ''));
      } else if (redirectProjectData.projectName) {
        appState.setAppName(redirectProjectData.projectName);
        setProjectPath(null);
      }
      clearRedirectProjectData();
    }
  }, [redirectProjectData, appState, clearRedirectProjectData]);

  // Auto-load project from cloud storage (My Projects)
  useEffect(() => {
    const { pendingProject, clearPendingProject } = useCloudProjectStore.getState();
    if (!pendingProject || pendingProject.mode !== 'creova') return;

    let cancelled = false;
    (async () => {
      try {
        if (cancelled) return;
        console.log('[AppInventor] Loading project from cloud...');
        appState.loadProject(pendingProject.data);
        if (pendingProject.projectName) {
          appState.setAppName(pendingProject.projectName);
        }
        setProjectPath(null);
        clearPendingProject();
      } catch (err) {
        console.error('[AppInventor] Failed to load project from cloud:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [appState]);

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
      fileInputRef.current?.click();
      return;
    }
    try {
      const result = await window.electronAPI.openProject();
      if (result && result.data) {
        // Check if it's actually an Electra project
        if (result.data.nodes || result.data.edges || result.data.circuit) {
          console.log('[Creova/AppInventor] Detected Electra project file, redirecting...');
          if (onRedirectToElectra) {
            onRedirectToElectra(result.data, null, result.projectPath);
            return;
          }
        }

        appState.loadProject(result.data);
        setProjectPath(result.projectPath);

        const pathParts = result.projectPath.split(/[\\/]/);
        const folderName = pathParts[pathParts.length - 1];
        if (folderName) {
          appState.setAppName(folderName.replace(/\.(leap|lbp)$/i, ''));
        }
      } else if (result && result.error) {
        alert(`Failed to open project: ${result.error}`);
      }
    } catch (err) {
      console.error("Failed to open project:", err);
      alert(`Failed to open project: ${err.message}`);
    }
  };

  const handleWebImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const projectData = JSON.parse(content);

        // Check if it's actually an Electra project
        if (projectData.nodes || projectData.edges || projectData.circuit) {
          console.log('[Creova/AppInventor] Detected Electra project file, redirecting...');
          if (onRedirectToElectra) {
            const nameWithoutExt = file.name.replace(/\.(leap|lbp|json)$/i, '');
            onRedirectToElectra(projectData, nameWithoutExt, null);
            return;
          }
        }

        appState.loadProject(projectData);

        const nameWithoutExt = file.name.replace(/\.(leap|lbp|json)$/i, '');
        appState.setAppName(nameWithoutExt);
        setProjectPath(null);
        alert('Project imported successfully!');
      } catch (err) {
        console.error('Failed to parse project file:', err);
        alert('Failed to parse project file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveProject = async () => {
    try {
      const payload = appState.getSerializedState();
      const liveBlockXml = typeof window !== 'undefined' ? window.__LEAP_BLOCK_XML__ : null;
      if (typeof liveBlockXml === 'string' && liveBlockXml.trim()) {
        payload.blockLogic = liveBlockXml;
      }

      await fileService.saveProject(appState.appName || 'project', 'creova', payload);
      showToast("Project saved successfully!", "success");
    } catch (err) {
      console.error("Failed to save project:", err);
      alert(`Failed to save project: ${err.message}`);
    }
  };

  const handleDownloadProject = () => {
    const payload = appState.getSerializedState();
    const liveBlockXml = typeof window !== 'undefined' ? window.__LEAP_BLOCK_XML__ : null;
    if (typeof liveBlockXml === 'string' && liveBlockXml.trim()) {
      payload.blockLogic = liveBlockXml;
    }
    fileService.saveProjectLocally(appState.appName || 'project', 'creova', payload);
  };

  const handleSaveAsProject = async () => {
    await handleSaveProject();
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

            // Clean up orphaned blocks before code generation
            if (currentScreen) {
              const flattenVisible = (list = []) => list.flatMap(item => [item, ...(item.children ? flattenVisible(item.children) : [])]);
              const allComps = [
                ...flattenVisible(currentScreen.components || []),
                ...(currentScreen.nonVisibleComponents || [])
              ];
              const validNames = new Set([
                currentScreen.id,
                ...allComps.map(c => c.id)
              ]);
              const allBlocks = tempWorkspace.getAllBlocks(false);
              allBlocks.forEach(block => {
                if (block.getField('INSTANCE')) {
                  const instanceName = block.getFieldValue('INSTANCE');
                  if (!instanceName || !validNames.has(instanceName)) {
                    block.dispose(false);
                  }
                }
              });
            }

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
          // Emit a diagnostic comment so the generated app warns at runtime
          payload.blockLogic = `console.warn('[LeapApp] Block transpilation failed:', ${JSON.stringify(transpileErr.message)});`;
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
        const { CLOUD_COMPILER_URL } = await import('../config/platform');
        const serverLabel = CLOUD_COMPILER_URL.includes('localhost') ? 'local' : 'cloud';
        setBuildLogs((prev) => [...prev, `Sending build request to ${serverLabel} compiler (${CLOUD_COMPILER_URL})...`]);

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
        if (result.logs && result.logs.length) {
          setBuildLogs((prev) => [...prev, ...result.logs]);
        }
        if (result.cloudBuildUnsupported) {
          setBuildState('error');
          setBuildLogs((prev) => [...prev, `⚠ ${result.error}`]);
        } else if (result.success) {
          setBuildState('success');
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
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".leap,.lbp,.json"
        onChange={handleWebImport}
      />
      <IgniteTopbar
        title={appState.appName}
        onTitleChange={(val) => appState.setAppName(val)}
        onBack={onBack}
        onSave={handleSaveProject}
        onSaveAs={handleSaveAsProject}
        onDownload={handleDownloadProject}
        onNew={handleNewProject}
        onOpen={handleOpenProject}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={activeTab === 'blocks'}
        canRedo={activeTab === 'blocks'}
        brandName="CREOVA"
        rightContent={
          <div className="flex items-center gap-6 shrink-0 creova-right-gap">
            <style>{`@media (max-width: 1499px){.creova-tab-label{display:none!important}.creova-build-text{display:none!important}.creova-tab-btn{padding:6px 8px!important}.creova-build-btn{padding:8px 10px!important}}@media (max-width: 480px){.creova-right-gap{gap:8px!important}.creova-divider{display:none!important}}`}</style>
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
                    className="creova-tab-btn"
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
                    <span className="creova-tab-label">{tab}</span>
                  </button>
                );
              })}
            </nav>
            <div className="creova-divider" style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255, 255, 255, 0.15)', margin: '0 8px', flexShrink: 0 }} />
            <button
              id="btn-build-apk"
              className="creova-build-btn"
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
              <span className="creova-build-text">BUILD PRODUCTION</span>
            </button>
          </div>
        }
      />

      <div className={`flex-1 overflow-hidden ${activeTab === 'designer' ? 'creova-designer-grid p-4 bg-slate-50' : 'flex p-0'}`}>
        {activeTab === 'designer' ? (
          <>
            <div className="creova-grid-palette min-h-0 overflow-hidden bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-md hover:-translate-y-px flex flex-col transition-all duration-300">
              <Palette />
            </div>

            <div className="creova-grid-canvas min-h-0 flex flex-col bg-transparent">
              <PhoneCanvas appState={appState} />
            </div>

            <div className="creova-grid-tree min-h-0 overflow-hidden bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-md hover:-translate-y-px flex flex-col transition-all duration-300">
              <div className="flex-1 min-h-0 flex flex-col">
                <ComponentTree appState={appState} />
              </div>
              <div className="creova-media-manager-container border-t border-slate-200 flex flex-col">
                <MediaManager appState={appState} />
              </div>
            </div>

            <div className="creova-grid-properties min-h-0 overflow-hidden bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-md hover:-translate-y-px flex flex-col transition-all duration-300">
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
