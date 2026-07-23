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
      className={`bg-white/[0.08] border border-white/10 py-1.5 px-3 rounded-lg flex items-center gap-2 h-[34px] box-border ${className}`}
      style={style}
    >
      <span className="text-sm opacity-50 leading-none select-none">
        📁
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="My Project"
        className="bg-transparent border-none text-white w-[100px] outline-none text-[13px] font-semibold font-[inherit]"
      />
      <button
        onClick={isSaving ? undefined : onSave}
        title="Save Project"
        className="bg-none border-none p-0 flex items-center justify-center transition-transform duration-150 shrink-0 text-white hover:scale-[1.15]"
        style={{
          cursor: isSaving ? 'default' : 'pointer',
          opacity: isSaving ? 0.5 : 0.8,
        }}
        disabled={isSaving}
      >
        <Save size={14} />
      </button>
    </div>
  );
}
