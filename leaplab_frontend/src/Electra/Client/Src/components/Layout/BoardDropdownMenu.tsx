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
      className={`absolute top-full mt-1.5 left-0 rounded-xl min-w-[220px] py-1.5 z-50 overflow-hidden backdrop-blur-xl shadow-2xl border transition-all animate-[electraBoardSlideIn_0.18s_ease-out] ${
        isElectra
          ? 'bg-[#18181b]/95 border-[#27272a] shadow-black/50'
          : 'bg-white/90 border-white/60'
      }`}
    >
      <style>{`
        @keyframes electraBoardSlideIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <button
        type="button"
        className={`flex items-center justify-between w-full px-3.5 py-2 border-0 bg-transparent text-sm font-medium text-left cursor-pointer transition-all tracking-normal ${
          currentBoard === 'arduino-uno'
            ? isElectra ? 'text-cyan-400 font-bold bg-cyan-500/10' : 'text-purple-700 font-bold bg-purple-100/60'
            : isElectra ? 'text-zinc-100 hover:bg-cyan-500/10 hover:text-cyan-400' : 'text-gray-700 hover:bg-purple-100/60 hover:text-purple-700'
        }`}
        onClick={() => {
          if (currentBoard !== 'arduino-uno') {
            onSwitchBoard('arduino-uno');
          }
          onClose();
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${currentBoard === 'arduino-uno' ? 'bg-cyan-400' : 'bg-zinc-600'}`} />
          <span>Arduino Uno</span>
        </div>
        {currentBoard === 'arduino-uno' && (
          <Check size={16} strokeWidth={2.5} className={isElectra ? 'text-cyan-400' : 'text-purple-600'} />
        )}
      </button>

      <button
        type="button"
        className={`flex items-center justify-between w-full px-3.5 py-2 border-0 bg-transparent text-sm font-medium text-left cursor-pointer transition-all tracking-normal ${
          currentBoard === 'esp32-c3'
            ? isElectra ? 'text-cyan-400 font-bold bg-cyan-500/10' : 'text-purple-700 font-bold bg-purple-100/60'
            : isElectra ? 'text-zinc-100 hover:bg-cyan-500/10 hover:text-cyan-400' : 'text-gray-700 hover:bg-purple-100/60 hover:text-purple-700'
        }`}
        onClick={() => {
          if (currentBoard !== 'esp32-c3') {
            onSwitchBoard('esp32-c3');
          }
          onClose();
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${currentBoard === 'esp32-c3' ? 'bg-cyan-400' : 'bg-zinc-600'}`} />
          <span>ESP32-C3</span>
        </div>
        {currentBoard === 'esp32-c3' && (
          <Check size={16} strokeWidth={2.5} className={isElectra ? 'text-cyan-400' : 'text-purple-600'} />
        )}
      </button>
    </div>
  );
};
