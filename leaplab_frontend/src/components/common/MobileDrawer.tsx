import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
  theme?: 'dark' | 'electra' | 'vision';
}

export default function MobileDrawer({ isOpen, onClose, children, width = '290px', theme = 'dark' }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isOpen, onClose]);

  const bgColor = theme === 'electra' ? 'bg-zinc-900' : 'bg-slate-900';
  const borderColor = theme === 'electra' ? 'border-zinc-800' : 'border-blue-200/20';
  const textColor = theme === 'electra' ? 'text-zinc-100' : 'text-white';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[9999] transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full z-[9999] shadow-2xl flex flex-col gap-6 p-6 box-border transition-all duration-300 ease-in-out border-l ${bgColor} ${borderColor} ${textColor} ${
          isOpen
            ? 'translate-x-0 visible opacity-100'
            : 'translate-x-full invisible opacity-0'
        }`}
        style={{ width }}
      >
        <div className="flex items-center justify-between shrink-0">
          <span className="text-base font-bold tracking-wide">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg border transition-colors bg-sky-400/10 border-sky-400/20 text-white hover:bg-white/10"
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col gap-4">
          {children}
        </div>
      </div>
    </>
  );
}
