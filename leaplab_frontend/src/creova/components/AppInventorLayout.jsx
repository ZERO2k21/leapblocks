import React from 'react';
import { IgniteTopbar } from '../../Electra/Client/Src/components/Layout/Topbar';
import Palette from '../components/Palette_Enhanced';
import PhoneCanvas from '../components/PhoneCanvas_Enhanced';
import PropertiesPanel from '../components/PropertiesPanel';
import BlocksView from '../components/BlocksView';
import BuildModal from '../components/BuildModal';
import ComponentTree from '../components/ComponentTree';
import MediaManager from '../components/MediaManager';
import { Zap, Layout, Puzzle } from 'lucide-react';

const rightContent = (activeTab, setActiveTab, handleBuildApk) => (
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
);

export default function AppInventorLayout({
  appState,
  activeTab,
  setActiveTab,
  fileInputRef,
  handleWebImport,
  handleNewProject,
  handleOpenProject,
  handleSaveProject,
  handleSaveAsProject,
  handleDownloadProject,
  handleBuildApk,
  handleOpenFile,
  handleUndo,
  handleRedo,
  isBuildModalOpen,
  setIsBuildModalOpen,
  buildState,
  buildLogs,
  apkPath,
  onBack,
  brandName = 'CREOVA',
}) {
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
        brandName={brandName}
        rightContent={rightContent(activeTab, setActiveTab, handleBuildApk)}
      />

      <div className={`flex-1 overflow-hidden ${activeTab === 'designer' ? 'flex flex-col gap-4 overflow-y-auto p-4 bg-slate-50 desktop:grid desktop:grid-cols-[220px_minmax(320px,_1fr)_260px] desktop:grid-rows-[minmax(0,_1.2fr)_minmax(0,_1fr)] desktop:gap-3 desktop:overflow-hidden wide:grid-cols-[230px_minmax(320px,_1fr)_250px_270px] wide:grid-rows-[none] wide:gap-3 ultra:grid-cols-[280px_minmax(400px,_1fr)_300px_320px] ultra:gap-4' : 'flex p-0'}`}>
        {activeTab === 'designer' ? (
          <>
            <div className="min-h-[400px] overflow-hidden bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-md hover:-translate-y-px flex flex-col transition-all duration-300 desktop:col-[1] desktop:row-[1/span_2] desktop:min-h-0 wide:col-[1] wide:row-[1]">
              <Palette />
            </div>

            <div className="min-h-[500px] flex flex-col bg-transparent desktop:col-[2] desktop:row-[1/span_2] desktop:min-h-0 wide:col-[2] wide:row-[1]">
              <PhoneCanvas appState={appState} />
            </div>

            <div className="min-h-[450px] overflow-hidden bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-md hover:-translate-y-px flex flex-col transition-all duration-300 desktop:col-[3] desktop:row-[1] desktop:min-h-0 wide:col-[3] wide:row-[1]">
              <div className="flex-1 min-h-0 flex flex-col">
                <ComponentTree appState={appState} />
              </div>
              <div className="h-[260px] border-t border-slate-200 flex flex-col wide:h-[300px] ultra:h-[380px]">
                <MediaManager appState={appState} />
              </div>
            </div>

            <div className="min-h-[450px] overflow-hidden bg-white border border-slate-200 rounded-[20px] shadow-sm hover:shadow-md hover:-translate-y-px flex flex-col transition-all duration-300 desktop:col-[3] desktop:row-[2] desktop:min-h-0 wide:col-[4] wide:row-[1]">
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
