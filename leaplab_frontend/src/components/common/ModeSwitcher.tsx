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
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: 3,
        backgroundColor: 'rgba(9, 9, 11, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: 8,
        flexShrink: 0,
        ...style,
      }}
    >
      {modes.map((mode) => {
        const isActive = mode.id === activeMode;
        return (
          <button
            key={mode.id}
            onClick={() => onChange(mode.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              transition: '0.2s',
              cursor: 'pointer',
              flexShrink: 0,
              border: '1px solid transparent',
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
