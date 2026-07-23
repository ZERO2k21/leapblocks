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
      className={`absolute top-full mt-1.5 left-0 rounded-xl min-w-[220px] py-1.5 z-50 overflow-hidden backdrop-blur-xl shadow-2xl border transition-all animate-[electraEditSlideIn_0.18s_ease-out] ${
        isElectra
          ? 'bg-[#18181b]/95 border-[#27272a] shadow-black/50'
          : 'bg-white/90 border-white/60'
      }`}
    >
      <style>{`
        @keyframes electraEditSlideIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <button
        type="button"
        disabled={!canUndo}
        className={`flex items-center justify-between w-full px-3.5 py-2 border-0 text-sm font-medium text-left transition-all tracking-normal ${
          !canUndo
            ? 'cursor-not-allowed text-gray-300 bg-transparent'
            : isElectra
              ? 'cursor-pointer text-zinc-100 hover:bg-cyan-500/10 hover:text-cyan-400'
              : 'cursor-pointer text-gray-700 hover:bg-purple-100/60 hover:text-purple-700'
        }`}
        onClick={() => {
          if (canUndo) {
            onUndo?.();
            onClose();
          }
        }}
      >
        <div className="flex items-center gap-2.5">
          <Undo size={16} strokeWidth={2} className={isElectra ? 'text-cyan-400 opacity-85' : 'text-purple-600 opacity-85'} />
          <span>Undo</span>
        </div>
        <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-medium ${isElectra ? 'bg-zinc-800 text-zinc-400' : 'bg-black/5 text-gray-400'}`}>Ctrl+Z</span>
      </button>

      <button
        type="button"
        disabled={!canRedo}
        className={`flex items-center justify-between w-full px-3.5 py-2 border-0 text-sm font-medium text-left transition-all tracking-normal ${
          !canRedo
            ? 'cursor-not-allowed text-gray-300 bg-transparent'
            : isElectra
              ? 'cursor-pointer text-zinc-100 hover:bg-cyan-500/10 hover:text-cyan-400'
              : 'cursor-pointer text-gray-700 hover:bg-purple-100/60 hover:text-purple-700'
        }`}
        onClick={() => {
          if (canRedo) {
            onRedo?.();
            onClose();
          }
        }}
      >
        <div className="flex items-center gap-2.5">
          <Redo size={16} strokeWidth={2} className={isElectra ? 'text-cyan-400 opacity-85' : 'text-purple-600 opacity-85'} />
          <span>Redo</span>
        </div>
        <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-medium ${isElectra ? 'bg-zinc-800 text-zinc-400' : 'bg-black/5 text-gray-400'}`}>Ctrl+Y</span>
      </button>

      <div className={`h-px my-1.5 mx-3 ${isElectra ? 'bg-white/10' : 'bg-gradient-to-r from-transparent via-black/10 to-transparent'}`} />

      <button
        type="button"
        className={`flex items-center justify-between w-full px-3.5 py-2 border-0 bg-transparent text-sm font-medium text-left cursor-pointer transition-all tracking-normal ${
          isElectra ? 'text-zinc-100 hover:bg-cyan-500/10 hover:text-cyan-400' : 'text-gray-700 hover:bg-purple-100/60 hover:text-purple-700'
        }`}
        onClick={() => {
          onCut?.();
          onClose();
        }}
      >
        <div className="flex items-center gap-2.5">
          <Scissors size={16} strokeWidth={2} className={isElectra ? 'text-cyan-400 opacity-85' : 'text-purple-600 opacity-85'} />
          <span>Cut</span>
        </div>
        <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-medium ${isElectra ? 'bg-zinc-800 text-zinc-400' : 'bg-black/5 text-gray-400'}`}>Ctrl+X</span>
      </button>

      <button
        type="button"
        className={`flex items-center justify-between w-full px-3.5 py-2 border-0 bg-transparent text-sm font-medium text-left cursor-pointer transition-all tracking-normal ${
          isElectra ? 'text-zinc-100 hover:bg-cyan-500/10 hover:text-cyan-400' : 'text-gray-700 hover:bg-purple-100/60 hover:text-purple-700'
        }`}
        onClick={() => {
          onCopy?.();
          onClose();
        }}
      >
        <div className="flex items-center gap-2.5">
          <Copy size={16} strokeWidth={2} className={isElectra ? 'text-cyan-400 opacity-85' : 'text-purple-600 opacity-85'} />
          <span>Copy</span>
        </div>
        <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-medium ${isElectra ? 'bg-zinc-800 text-zinc-400' : 'bg-black/5 text-gray-400'}`}>Ctrl+C</span>
      </button>

      <button
        type="button"
        className={`flex items-center justify-between w-full px-3.5 py-2 border-0 bg-transparent text-sm font-medium text-left cursor-pointer transition-all tracking-normal ${
          isElectra ? 'text-zinc-100 hover:bg-cyan-500/10 hover:text-cyan-400' : 'text-gray-700 hover:bg-purple-100/60 hover:text-purple-700'
        }`}
        onClick={() => {
          onPaste?.();
          onClose();
        }}
      >
        <div className="flex items-center gap-2.5">
          <Clipboard size={16} strokeWidth={2} className={isElectra ? 'text-cyan-400 opacity-85' : 'text-purple-600 opacity-85'} />
          <span>Paste</span>
        </div>
        <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-medium ${isElectra ? 'bg-zinc-800 text-zinc-400' : 'bg-black/5 text-gray-400'}`}>Ctrl+V</span>
      </button>
    </div>
  );
};
