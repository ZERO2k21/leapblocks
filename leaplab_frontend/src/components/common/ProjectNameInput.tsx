import React from 'react';
import { Save } from 'lucide-react';

interface ProjectNameInputProps {
  value: string;
  onChange: (val: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function ProjectNameInput({
  value,
  onChange,
  onSave,
  isSaving,
  className = '',
  style,
}: ProjectNameInputProps) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '6px 12px',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 34,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <span style={{ fontSize: 14, opacity: 0.5, lineHeight: 1, userSelect: 'none' }}>
        📁
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="My Project"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          width: 100,
          outline: 'none',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'inherit',
        }}
      />
      <button
        onClick={isSaving ? undefined : onSave}
        title="Save Project"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: isSaving ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isSaving ? 0.5 : 0.8,
          transition: 'transform 0.15s',
          flexShrink: 0,
          color: '#fff',
        }}
        onMouseEnter={(e) => {
          if (!isSaving) e.currentTarget.style.transform = 'scale(1.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        disabled={isSaving}
      >
        <Save size={14} />
      </button>
    </div>
  );
}
