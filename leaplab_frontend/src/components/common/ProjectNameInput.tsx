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
      className={`bg-white/10 border border-white/10 py-1.5 px-3 rounded-lg flex items-center gap-2 h-9 box-border ${className}`}
      style={style}
    >
      <span className="text-sm opacity-50 leading-none select-none">
        📁
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="My Project"
        className="bg-transparent border-0 text-white w-28 outline-none text-xs font-semibold font-sans placeholder-white/40"
      />
      <button
        type="button"
        onClick={isSaving ? undefined : onSave}
        title="Save Project"
        className={`bg-transparent border-0 p-0 flex items-center justify-center transition-transform duration-150 shrink-0 text-white hover:scale-110 ${
          isSaving ? 'cursor-default opacity-50' : 'cursor-pointer opacity-80 hover:opacity-100'
        }`}
        disabled={isSaving}
      >
        <Save size={14} />
      </button>
    </div>
  );
}
