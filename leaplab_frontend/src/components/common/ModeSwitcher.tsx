import React from 'react';

export interface ModeOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface ModeSwitcherProps {
  modes: ModeOption[];
  activeMode: string;
  onChange: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function ModeSwitcher({
  modes,
  activeMode,
  onChange,
  className = '',
  style,
}: ModeSwitcherProps) {
  return (
    <nav
      className={`flex items-center p-[3px] bg-[rgba(9,9,11,0.6)] border border-white/20 rounded-lg shrink-0 ${className}`}
      style={style}
    >
      {modes.map((mode) => {
        const isActive = mode.id === activeMode;
        return (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            className="flex items-center gap-2 py-1.5 px-4 rounded-md text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 cursor-pointer shrink-0 border border-transparent"
            style={{
              backgroundColor: isActive ? 'rgb(37, 99, 235)' : 'transparent',
              color: isActive ? 'rgb(255, 255, 255)' : 'rgba(255, 255, 255, 0.65)',
              boxShadow: isActive ? 'rgba(37, 99, 235, 0.3) 0px 4px 12px' : 'none',
            }}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
