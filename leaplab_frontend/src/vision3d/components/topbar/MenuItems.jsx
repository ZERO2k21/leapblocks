/**
 * Vision3D - Topbar Menu Sub-components
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 */

import React from 'react';

export function MenuItem({ icon, iconColor, label, shortcut, disabled, active, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-between w-full px-[14px] py-[7px] border-0 bg-transparent text-[12px] font-sans font-medium text-left transition-all duration-150 ${disabled ? 'opacity-40 text-[#374151]/40 cursor-not-allowed' : active ? 'text-[#7C3AED] font-semibold hover:bg-[#7C3AED]/8 cursor-pointer' : 'text-[#374151] hover:bg-[#7C3AED]/8 cursor-pointer'}`}
    >
      <div className="flex items-center gap-[10px]">
        <span className={iconColor || 'text-[#7C3AED]/80'}>{icon}</span>
        <span>{label}</span>
      </div>
      {shortcut && (
        <span className="text-[10px] text-[#9CA3AF] bg-[#F3F4F6] px-[4px] py-[2px] rounded-[4px]">
          {shortcut}
        </span>
      )}
    </button>
  );
}

export function MenuDivider() {
  return <div className="h-px bg-black/8 my-1 mx-3.5" />;
}

export function MobileMenuItem({ icon, label, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 ${disabled ? 'opacity-35 cursor-not-allowed text-inherit' : 'hover:bg-white/8 text-white/90 hover:text-white cursor-pointer'}`}
    >
      <span className="opacity-80 shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
