import React from 'react';

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
    <div className="fixed inset-0 flex items-center justify-center z-[2000] bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div className="flex flex-col max-w-[420px] max-h-[80vh] animate-[modalScale_0.2s_cubic-bezier(0.34,1.56,0.64,1)] bg-[var(--lp-dark-surface)] border border-[var(--lp-accent-primary)] rounded-[var(--lp-radius)] shadow-[0_0_40px_rgba(34,211,238,0.2),var(--lp-shadow-lg)]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-[var(--lp-border)]">
          <h3 className="m-0 text-[18px] uppercase tracking-[1px] text-[var(--lp-accent-primary)]">Switch Board?</h3>
          <button className="bg-transparent border-none text-[24px] cursor-pointer text-[var(--lp-zinc-400)]" onClick={onClose}>×</button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-[14px] leading-[1.6] mb-6 text-[#a1a1aa]">
            Switching to <strong>{pendingBoard === 'esp32-c3' ? 'ESP32-C3' : 'Arduino Uno'}</strong> will clear the current circuit and code. Make sure to save your work before proceeding.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg border cursor-pointer text-[13px] font-semibold bg-transparent border-[#27272a] text-[#a1a1aa] font-['Segoe_UI',Inter,sans-serif]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                executeBoardSwitch(pendingBoard);
                onClose();
              }}
              className="px-5 py-2 rounded-lg border-none cursor-pointer text-[13px] font-bold bg-[linear-gradient(135deg,#22d3ee,#06b6d4)] text-[#09090b] font-['Segoe_UI',Inter,sans-serif]"
            >
              Switch Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
