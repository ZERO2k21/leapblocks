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
    <div className="fixed inset-0 flex items-center justify-center z-[2000] bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div 
        className="animate-[modalScale_0.2s_cubic-bezier(0.34,1.56,0.64,1)] border border-zinc-800/80 overflow-hidden" 
        onClick={e => e.stopPropagation()}
        style={{ 
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'rgba(9, 9, 11, 0.95)',
          borderRadius: '28px',
          boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(245, 158, 11, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(20px)',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div 
          style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '20px',
            paddingBottom: '20px',
            paddingLeft: '24px',
            paddingRight: '24px',
            borderBottom: '1px solid #18181b',
            backgroundColor: 'rgba(24, 24, 27, 0.2)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                flexShrink: 0
              }}
            >
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="m-0 text-[16px] font-black text-white tracking-tight" style={{ fontFamily: "Segoe UI, Inter, sans-serif" }}>Switch Board?</h3>
              <p className="m-0 text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5" style={{ fontFamily: "Segoe UI, Inter, sans-serif" }}>Destructive Action</p>
            </div>
          </div>
          <button 
            className="cursor-pointer text-zinc-500 hover:text-white hover:bg-zinc-900 border-none bg-transparent transition-all" 
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}
            onClick={onClose}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div 
          style={{ 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
          }}
        >
          <p 
            className="text-zinc-400 font-medium"
            style={{
              margin: '0 0 24px 0',
              lineHeight: '1.6',
              fontSize: '13.5px',
              fontFamily: "Segoe UI, Inter, sans-serif"
            }}
          >
            Switching to <strong className="text-white">{pendingBoard === 'esp32-c3' ? 'ESP32-C3' : 'Arduino Uno'}</strong> will clear the current circuit and code. Make sure to save your work before proceeding.
          </p>
          
          {/* Action buttons */}
          <div 
            style={{ 
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}
          >
            <button
              onClick={onClose}
              className="border border-zinc-800 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all font-bold cursor-pointer"
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                fontSize: '12.5px',
                fontFamily: "Segoe UI, Inter, sans-serif",
                boxSizing: 'border-box'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                executeBoardSwitch(pendingBoard);
                onClose();
              }}
              className="border-none cursor-pointer text-zinc-950 active:scale-95 transition-all bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                fontSize: '12.5px',
                fontWeight: 900,
                fontFamily: "Segoe UI, Inter, sans-serif",
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)',
                boxSizing: 'border-box'
              }}
            >
              Switch Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
