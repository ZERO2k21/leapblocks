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
      className={`flex items-center p-1 bg-zinc-900/60 border border-white/20 rounded-lg shrink-0 ${className}`}
      style={style}
    >
      {modes.map((mode) => {
        const isActive = mode.id === activeMode;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={`flex items-center gap-2 py-1.5 px-4 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 border border-transparent ${
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-transparent text-white/65 hover:text-white hover:bg-white/5'
            }`}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
