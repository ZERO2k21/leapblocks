import React, { useState, useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import { IgniteTopbar } from '../leapforge/components/Layout/IgniteTopbar';
import Palette from './components/Palette';
import PhoneCanvas from './components/PhoneCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import BlocksView from './components/BlocksView';
import BuildModal from './components/BuildModal';

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
    <div className="flex flex-col h-screen w-full overflow-hidden bg-white text-gray-900 font-sans">
      <IgniteTopbar 
        title={appState.appName}
        onTitleChange={(val) => appState.setAppName(val)}
        onBack={onBack}
        onSave={() => {}} // Save logic if needed
        brandName="APP INVENTOR"
        centerContent={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '20px' }}>
             <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '20px' }}>
              {['designer', 'blocks'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                    transition: '0.2s',
                    background: activeTab === tab ? (tab === 'designer' ? '#10B981' : '#3B82F6') : 'transparent',
                    color: '#fff',
                    textTransform: 'capitalize'
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
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #FFD500, #FFB800)',
                color: '#1a1a2e',
                fontSize: '12px',
                fontWeight: 800,
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

      <div className="flex-1 flex overflow-hidden w-full">
        {activeTab === 'designer' ? (
          <>
            <Palette />
            <PhoneCanvas appState={appState} />
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
