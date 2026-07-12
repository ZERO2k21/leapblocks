import React from 'react';
import { Undo, Redo, Scissors, Copy, Clipboard } from 'lucide-react';

interface EditDropdownMenuProps {
  isOpen: boolean;
  isElectra: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onClose: () => void;
}

export const EditDropdownMenu: React.FC<EditDropdownMenuProps> = ({
  isOpen,
  isElectra,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
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
        disabled={!canUndo}
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
          cursor: !canUndo ? 'not-allowed' : 'pointer',
          transition: 'all 0.12s ease'
        }}
        className={!canUndo
          ? `opacity-40 ${isElectra ? 'text-[#f4f4f5]/40' : 'text-[#374151]/40'}`
          : isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'
        }
        onClick={() => {
          if (canUndo) {
            onUndo?.();
            onClose();
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Undo size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
          <span>Undo</span>
        </div>
        <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+Z</span>
      </button>

      <button
        disabled={!canRedo}
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
          cursor: !canRedo ? 'not-allowed' : 'pointer',
          transition: 'all 0.12s ease'
        }}
        className={!canRedo
          ? `opacity-40 ${isElectra ? 'text-[#f4f4f5]/40' : 'text-[#374151]/40'}`
          : isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'
        }
        onClick={() => {
          if (canRedo) {
            onRedo?.();
            onClose();
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Redo size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
          <span>Redo</span>
        </div>
        <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+Y</span>
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
          onCut?.();
          onClose();
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Scissors size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
          <span>Cut</span>
        </div>
        <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+X</span>
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
          onCopy?.();
          onClose();
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Copy size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
          <span>Copy</span>
        </div>
        <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+C</span>
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
          onPaste?.();
          onClose();
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clipboard size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
          <span>Paste</span>
        </div>
        <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+V</span>
      </button>
    </div>
  );
};
