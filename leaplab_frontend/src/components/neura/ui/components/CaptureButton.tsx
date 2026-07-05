import React from 'react'

interface CaptureButtonProps {
    onClick: () => void
    disabled?: boolean
    label?: string
    icon?: 'camera' | 'mic' | 'pen' | 'plus'
    color?: string
    pulse?: boolean
}

export default function CaptureButton({
    onClick,
    disabled = false,
    label = 'Capture',
    icon = 'camera',
    color = '#7C3AED',
    pulse = false
}: CaptureButtonProps) {
    const iconElement = () => {
        switch (icon) {
            case 'camera':
                return (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                )
            case 'mic':
                return (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                        <path d="M19 10v2a7 7 0 01-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                )
            case 'pen':
                return (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                )
            case 'plus':
                return (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v8M8 12h8" />
                    </svg>
                )
        }
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`relative group flex flex-col items-center gap-3 transition-all duration-300 ${
                disabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'
            }`}
        >
            <div className="relative">
                {pulse && !disabled && (
                    <div
                        className="absolute inset-0 rounded-full animate-ping opacity-30"
                        style={{ backgroundColor: color }}
                    />
                )}
                <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 group-hover:shadow-2xl"
                    style={{
                        backgroundColor: color,
                        boxShadow: `0 10px 30px ${color}40`
                    }}
                >
                    {iconElement()}
                </div>
            </div>
            <span className="text-sm font-bold text-gray-600 group-hover:text-gray-800 transition-colors">
                {label}
            </span>
        </button>
    )
}
