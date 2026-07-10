import React from 'react';
import { FilePlus, FolderOpen, Download, FileText } from 'lucide-react';

interface FileDropdownMenuProps {
  isOpen: boolean;
  isElectra: boolean;
  brandName: string;
  onNew?: () => void;
  onOpen?: () => void;
  onDownload?: () => void;
  onSaveAs?: () => void;
  onBack: () => void;
  onClose: () => void;
}

export const FileDropdownMenu: React.FC<FileDropdownMenuProps> = ({
  isOpen,
  isElectra,
  brandName,
  onNew,
  onOpen,
  onDownload,
  onSaveAs,
  onBack,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        borderRadius: '8px',
        minWidth: '240px',
        padding: '4px 0',
        zIndex: 1000,
        overflow: 'hidden'
      }}
      className={`animate-[slideDown_0.15s_ease-out] border backdrop-blur-xl ${
        isElectra
          ? 'bg-[#18181b]/95 border-[#27272a] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
          : 'bg-white/95 border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
      }`}
    >
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '7px 14px',
          border: 'none',
          background: 'transparent',
          fontSize: '12px',
          fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
          fontWeight: 500,
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'all 0.12s ease'
        }}
        className={isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'}
        onClick={() => {
          onNew?.();
          onClose();
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FilePlus size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
          <span>New Project</span>
        </div>
        <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+N</span>
      </button>

      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '7px 14px',
          border: 'none',
          background: 'transparent',
          fontSize: '12px',
          fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
          fontWeight: 500,
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'all 0.12s ease'
        }}
        className={isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'}
        onClick={() => {
          onOpen?.();
          onClose();
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FolderOpen size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
          <span>Open Project</span>
        </div>
        <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+O</span>
      </button>

      <div className={`h-px my-1 mx-3.5 ${isElectra ? 'bg-white/8' : 'bg-black/8'}`} />

      {onDownload && (
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '7px 14px',
            border: 'none',
            background: 'transparent',
            fontSize: '12px',
            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
            fontWeight: 500,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.12s ease'
          }}
          className={isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'}
          onClick={() => {
            onDownload();
            onClose();
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Download size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
            <span>Download .leap</span>
          </div>
        </button>
      )}

      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '7px 14px',
          border: 'none',
          background: 'transparent',
          fontSize: '12px',
          fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
          fontWeight: 500,
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'all 0.12s ease'
        }}
        className={isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'}
        onClick={() => {
          onSaveAs?.();
          onClose();
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
          <span>Save As...</span>
        </div>
        <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+Shift+S</span>
      </button>

      <div className={`h-px my-1 mx-3.5 ${isElectra ? 'bg-white/8' : 'bg-black/8'}`} />

      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '7px 14px',
          border: 'none',
          background: 'transparent',
          fontSize: '12px',
          fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
          fontWeight: 500,
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'all 0.12s ease'
        }}
        className={isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'}
        onClick={() => {
          const currentModule = brandName === 'CREOVA' ? 'creova' : 'electra';
          sessionStorage.setItem('landingActiveTab', 'my-projects');
          sessionStorage.setItem('myProjectsSelectedMode', currentModule);
          onClose();
          onBack();
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FolderOpen size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
          <span>My Projects</span>
        </div>
      </button>
    </div>
  );
};
