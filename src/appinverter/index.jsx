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
import './styles/leap-appinventor.css';
import { Zap } from 'lucide-react';

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

  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [buildState, setBuildState] = useState('idle');
  const [buildLogs, setBuildLogs] = useState([]);
  const [apkPath, setApkPath] = useState(null);

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
        onSave={() => { }}
        brandName="APP INVENTOR"
        rightContent={
          <div className="flex items-center gap-6">
            <nav className="flex items-center p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              {['Designer', 'Blocks'].map((tab) => (
                <button
                  key={tab}
                  id={`tab-${tab.toLowerCase()}`}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer ${activeTab === tab.toLowerCase()
                    ? 'bg-white text-orange-600 shadow-md border border-orange-100/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
            <div className="w-px h-8 bg-slate-200 mx-2" />
            <button
              id="btn-build-apk"
              onClick={handleBuildApk}
              className="relative overflow-hidden flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-[13px] font-black uppercase tracking-[0.12em] shadow-[0_12px_24px_-8px_rgba(255,122,0,0.5),0_4px_12px_-4px_rgba(255,122,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_20px_40px_-12px_rgba(255,122,0,0.6),0_8px_16px_-6px_rgba(255,122,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:-translate-y-0.5 hover:scale-[1.02] active:-translate-y-px active:scale-100 transition-all duration-300 cursor-pointer before:absolute before:top-0 before:-left-full before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent hover:before:left-full before:transition-all before:duration-700 group"
            >
              <Zap className="h-4 w-4 text-white group-hover:animate-pulse" />
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
