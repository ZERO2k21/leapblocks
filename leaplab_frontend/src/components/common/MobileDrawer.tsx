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

  const bgColor = theme === 'electra' ? 'bg-[#18181b]' : theme === 'vision' ? 'bg-[#0b1b42]' : 'bg-[#0b1b42]';
  const borderColor = theme === 'electra' ? 'border-[#27272a]' : 'border-[#bfdbfe]/20';
  const textColor = theme === 'electra' ? 'text-[#f4f4f5]' : 'text-white';

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[999] transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full z-[1000] shadow-2xl flex flex-col gap-6 transition-all duration-300 ease-in-out border-l ${bgColor} ${borderColor} ${textColor} ${
          isOpen
            ? 'translate-x-0 visible opacity-100'
            : 'translate-x-full invisible opacity-0'
        }`}
        style={{ width, padding: '24px', boxSizing: 'border-box' }}
      >
        <div className="flex items-center justify-between shrink-0">
          <span className="text-base font-bold tracking-wide">Menu</span>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg border transition-colors bg-[#94c5ff]/10 border-[#94c5ff]/20 text-white hover:bg-white/10"
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
