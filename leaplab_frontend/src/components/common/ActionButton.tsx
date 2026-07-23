import React from 'react';

const VARIANT_CLASSES: Record<string, string> = {
  primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-white/10 shadow-lg shadow-blue-600/35 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/45',
  success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-white/10 shadow-lg shadow-emerald-500/35 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/45',
  danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white border-white/10 shadow-lg shadow-red-500/35 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/45',
  warning: 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 border-white/10 shadow-lg shadow-amber-500/35 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/45',
  subtle: 'bg-white/10 text-white border-white/15 hover:bg-white/20 hover:-translate-y-0.5',
};

interface ActionButtonProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'subtle';
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ActionButton({
  label,
  icon,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  title,
  className = '',
  style,
}: ActionButtonProps) {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;

  return (
    <button
      type="button"
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      title={title || label}
      style={style}
      className={`relative overflow-hidden flex items-center gap-2 py-2 px-5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 shrink-0 border ${
        disabled || loading
          ? 'bg-white/15 text-white/60 border-white/5 cursor-default shadow-none'
          : `cursor-pointer ${variantClass}`
      } ${className}`}
    >
      {icon}
      <span>{loading ? 'Loading…' : label}</span>
    </button>
  );
}
