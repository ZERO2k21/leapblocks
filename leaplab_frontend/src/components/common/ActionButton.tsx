import React from 'react';

const VARIANTS: Record<string, {
  from: string;
  to: string;
  shadow: string;
  color: string;
  border: string;
}> = {
  primary: {
    from: 'rgb(59, 130, 246)',
    to: 'rgb(37, 99, 235)',
    shadow: 'rgba(37, 99, 235, 0.35)',
    color: '#fff',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  success: {
    from: '#10B981',
    to: '#059669',
    shadow: 'rgba(16, 185, 129, 0.35)',
    color: '#fff',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  danger: {
    from: '#EF4444',
    to: '#DC2626',
    shadow: 'rgba(239, 68, 68, 0.35)',
    color: '#fff',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  warning: {
    from: '#F59E0B',
    to: '#D97706',
    shadow: 'rgba(245, 158, 11, 0.35)',
    color: '#1a1000',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  subtle: {
    from: 'rgba(255,255,255,0.1)',
    to: 'rgba(255,255,255,0.15)',
    shadow: 'transparent',
    color: '#fff',
    border: 'rgba(255, 255, 255, 0.15)',
  },
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
  const v = VARIANTS[variant] || VARIANTS.primary;

  return (
    <button
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      title={title || label}
      className={`relative overflow-hidden flex items-center gap-2 py-2 px-5 rounded-lg text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 shrink-0 translate-y-0 ${className}`}
      style={{
        background: disabled
          ? 'rgba(255,255,255,0.15)'
          : `linear-gradient(135deg, ${v.from} 0%, ${v.to} 100%)`,
        color: disabled ? 'rgba(255,255,255,0.6)' : v.color,
        boxShadow: disabled ? 'none' : `${v.shadow} 0px 4px 14px`,
        cursor: disabled || loading ? 'default' : 'pointer',
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.05)' : v.border}`,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = `${v.shadow} 0px 6px 20px`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.boxShadow = disabled ? 'none' : `${v.shadow} 0px 4px 14px`;
      }}
    >
      {icon}
      <span>{loading ? 'Loading…' : label}</span>
    </button>
  );
}
