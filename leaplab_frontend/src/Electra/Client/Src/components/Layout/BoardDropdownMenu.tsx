import React from 'react';
import { Check } from 'lucide-react';

interface BoardDropdownMenuProps {
  isOpen: boolean;
  isElectra: boolean;
  currentBoard: string;
  onSwitchBoard: (board: string) => void;
  onClose: () => void;
}

export const BoardDropdownMenu: React.FC<BoardDropdownMenuProps> = ({
  isOpen,
  isElectra,
  currentBoard,
  onSwitchBoard,
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
        className={currentBoard === 'arduino-uno'
          ? (isElectra ? 'text-[#22d3ee] font-bold' : 'text-[#2563eb] font-bold')
          : (isElectra ? 'text-[#f4f4f5]' : 'text-[#374151]')
        }
        onClick={() => {
          if (currentBoard !== 'arduino-uno') {
            onSwitchBoard('arduino-uno');
          }
          onClose();
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={`w-2 h-2 rounded-full ${currentBoard === 'arduino-uno' ? 'bg-[#22d3ee]' : 'bg-zinc-600'}`} />
          <span>Arduino Uno</span>
        </div>
        {currentBoard === 'arduino-uno' && (
          <Check size={14} strokeWidth={2.5} className={isElectra ? 'text-[#22d3ee]' : 'text-[#7C3AED]'} />
        )}
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
        className={currentBoard === 'esp32-c3'
          ? (isElectra ? 'text-[#22d3ee] font-bold' : 'text-[#2563eb] font-bold')
          : (isElectra ? 'text-[#f4f4f5]' : 'text-[#374151]')
        }
        onClick={() => {
          if (currentBoard !== 'esp32-c3') {
            onSwitchBoard('esp32-c3');
          }
          onClose();
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={`w-2 h-2 rounded-full ${currentBoard === 'esp32-c3' ? 'bg-[#22d3ee]' : 'bg-zinc-600'}`} />
          <span>ESP32-C3</span>
        </div>
        {currentBoard === 'esp32-c3' && (
          <Check size={14} strokeWidth={2.5} className={isElectra ? 'text-[#22d3ee]' : 'text-[#7C3AED]'} />
        )}
      </button>
    </div>
  );
};
