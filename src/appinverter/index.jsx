/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited. deploy
 */
import React, { useState, useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import { IgniteTopbar } from '../Electra/Client/Src/components/Layout/Topbar';
import Palette from './components/Palette_Enhanced';
import PhoneCanvas from './components/PhoneCanvas_Enhanced';
import PropertiesPanel from './components/PropertiesPanel';
import BlocksView from './components/BlocksView';
import BuildModal from './components/BuildModal';
import ComponentTree from './components/ComponentTree';
import MediaManager from './components/MediaManager';

export default function AppInventor({ onBack }) {
  const appState = useAppState();
  const [activeTab, setActiveTab] = useState('designer'); // 'designer' | 'blocks'

  // Build Modal State
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [buildState, setBuildState] = useState('idle'); // 'idle' | 'building' | 'success' | 'error'
  const [buildLogs, setBuildLogs] = useState([]);
  const [apkPath, setApkPath] = useState(null);

  useEffect(() => {
    // Setup log listener if in Electron and the method exists
    if (window.electronAPI && window.electronAPI.onBuildLog) {
      window.electronAPI.onBuildLog((msg) => {
        setBuildLogs(prev => [...prev, msg]);
      });
      return () => {
        if (window.electronAPI.removeBuildLogListener) {
          window.electronAPI.removeBuildLogListener();
        }
      };
    }
  }, []);

  const handleBuildApk = async () => {
    if (!window.electronAPI || !window.electronAPI.buildApk) {
      alert("APK Building is not configured in this environment. Ensure you restart the Electron app with the new main process.");
      return;
    }

    setIsBuildModalOpen(true);
    setBuildState('building');
    setBuildLogs(['Initializing build process...']);
    setApkPath(null);

    try {
      const payload = appState.getSerializedState();
      const result = await window.electronAPI.buildApk(payload);

      if (result.success) {
        setBuildState('success');
        setApkPath(result.outputPath);
        setBuildLogs(prev => [...prev, '✓ Build complete! APK is ready.']);
      } else {
        setBuildState('error');
        setBuildLogs(prev => [...prev, `✗ Build failed: ${result.error}`]);
      }
    } catch (error) {
      setBuildState('error');
      setBuildLogs(prev => [...prev, `✗ Build failed: ${error.message}`]);
    }
  };

  const handleOpenFile = () => {
    if (window.electronAPI && window.electronAPI.showInFolder && apkPath) {
      window.electronAPI.showInFolder(apkPath);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#e9edf2] text-gray-900 font-sans">
      <IgniteTopbar
        title={appState.appName}
        onTitleChange={(val) => appState.setAppName(val)}
        onBack={onBack}
        onSave={() => { }} // Save logic if needed
        brandName="APP INVENTOR"
        centerContent={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '20px' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0', background: '#d4dbe5', border: '1px solid #9ca8b8', borderRadius: '4px', overflow: 'hidden' }}>
              {['designer', 'blocks'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '0',
                    border: 'none',
                    borderRight: tab === 'designer' ? '1px solid #9ca8b8' : 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                    transition: '0.2s',
                    background: activeTab === tab ? '#ffffff' : '#d4dbe5',
                    color: '#2c3e50',
                    textTransform: 'capitalize',
                    boxShadow: activeTab === tab ? 'inset 0 -2px 0 #4a90e2' : 'none'
                  }}
                >
                  {tab}
                </button>
              ))}
            </nav>
            <button
              onClick={handleBuildApk}
              style={{
                marginLeft: '8px',
                padding: '7px 14px',
                borderRadius: '4px',
                border: '1px solid #b88400',
                cursor: 'pointer',
                background: '#f2c94c',
                color: '#2c3e50',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📦</span> Build APK
            </button>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden w-full border-t border-[#c6cfda]">
        {activeTab === 'designer' ? (
          <>
            {/* Panel 1: Palette (Component Library) */}
            <Palette />

            {/* Panel 2: Viewer (Phone Screen Preview) */}
            <PhoneCanvas appState={appState} />

            {/* Panel 3: Components Tree + Media (NEW) */}
            <div className="w-[270px] border-l border-r border-[#c6cfda] bg-white flex flex-col overflow-hidden">
              {/* Component Tree Section */}
              <div className="flex-1 overflow-y-auto border-b border-gray-200">
                <div className="px-3 py-2 bg-[#dfe6ee] border-b border-[#c6cfda] font-semibold text-xs text-[#2c3e50] uppercase tracking-wide">
                  Components
                </div>
                <div className="p-2">
                  <ComponentTree appState={appState} />
                </div>
              </div>

              {/* Media Manager Section */}
              <div className="h-48 overflow-y-auto">
                <div className="px-3 py-2 bg-[#dfe6ee] border-b border-[#c6cfda] font-semibold text-xs text-[#2c3e50] uppercase tracking-wide">
                  Media
                </div>
                <div className="p-2">
                  <MediaManager appState={appState} />
                </div>
              </div>
            </div>

            {/* Panel 4: Properties (Property Editor) */}
            <PropertiesPanel appState={appState} />
          </>
        ) : (
          <BlocksView appState={appState} />
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
