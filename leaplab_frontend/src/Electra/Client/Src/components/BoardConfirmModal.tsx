import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface BoardConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingBoard: string | null;
  executeBoardSwitch: (targetBoard: string) => void;
}

export const BoardConfirmModal: React.FC<BoardConfirmModalProps> = ({
  isOpen,
  onClose,
  pendingBoard,
  executeBoardSwitch,
}) => {
  if (!isOpen || !pendingBoard) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[2000] bg-slate-900/50 backdrop-blur-md animate-[fadeIn_0.2s_ease-out] p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[420px] bg-white border border-slate-200 rounded-[28px] overflow-hidden flex flex-col backdrop-blur-2xl shadow-2xl shadow-slate-900/20 animate-[modalScale_0.2s_cubic-bezier(0.34,1.56,0.64,1)] box-border" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 px-6 border-b border-slate-100 bg-slate-50/80 box-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="m-0 text-base font-black text-slate-900 tracking-tight">Switch Board?</h3>
              <p className="m-0 text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-0.5">Destructive Action</p>
            </div>
          </div>
          <button 
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-0 bg-transparent transition-all box-border" 
            onClick={onClose}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col box-border">
          <p className="text-slate-600 font-medium text-[13.5px] leading-relaxed m-0 mb-6">
            Switching to <strong className="text-slate-900 font-extrabold">{pendingBoard === 'esp32-c3' ? 'ESP32-C3' : 'Arduino Uno'}</strong> will clear the current circuit and code. Make sure to save your work before proceeding.
          </p>
          
          {/* Action buttons */}
          <div className="flex gap-3 justify-end items-center">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all text-[12.5px] font-bold cursor-pointer box-border shadow-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                executeBoardSwitch(pendingBoard);
                onClose();
              }}
              className="py-2.5 px-5 rounded-xl border-0 cursor-pointer text-white text-[12.5px] font-black active:scale-95 transition-all bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/25 box-border"
            >
              Switch Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
