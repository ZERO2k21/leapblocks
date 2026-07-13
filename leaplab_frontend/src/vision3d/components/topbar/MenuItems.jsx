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
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.12s ease',
      }}
      className={disabled ? 'opacity-40 text-[#374151]/40' : active ? 'text-[#7C3AED] font-semibold hover:bg-[#7C3AED]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className={iconColor || 'text-[#7C3AED]/80'}>{icon}</span>
        <span>{label}</span>
      </div>
      {shortcut && (
        <span style={{ fontSize: '10px', color: '#9CA3AF', background: '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>
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
