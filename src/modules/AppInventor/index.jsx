import React, { useState, useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import TopBar from './components/TopBar';
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
      <TopBar
        appState={appState}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBuildApk={handleBuildApk}
        onBack={onBack}
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
