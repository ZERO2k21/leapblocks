import React from 'react'

interface CaptureButtonProps {
    onClick: () => void
    disabled?: boolean
    label?: string
    icon?: 'camera' | 'mic' | 'pen' | 'plus' | 'check' | 'pose'
    color?: string
    pulse?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export default function CaptureButton({
    onClick,
    disabled = false,
    label = 'Capture',
    icon = 'camera',
    color = '#7C3AED',
    pulse = false,
    size = 'lg'
}: CaptureButtonProps) {
    const sizeClasses = {
        sm: 'w-16 h-16',
        md: 'w-20 h-20',
        lg: 'w-24 h-24'
    }

    const iconSizes = {
        sm: 20,
        md: 24,
        lg: 32
    }

    const iconElement = () => {
        const s = iconSizes[size]
        switch (icon) {
            case 'camera':
                return (
                    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                )
            case 'mic':
                return (
                    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                        <path d="M19 10v2a7 7 0 01-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                )
            case 'pen':
                return (
                    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                )
            case 'plus':
                return (
                    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                {/* Pulse ring */}
                {pulse && !disabled && (
                    <>
                        <div
                            className="absolute inset-0 rounded-full animate-ping opacity-20"
                            style={{ backgroundColor: color }}
                        />
                        <div
                            className="absolute -inset-2 rounded-full animate-pulse opacity-10"
                            style={{ backgroundColor: color }}
                        />
                    </>
                )}

                {/* Main button */}
                <div
                    className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:brightness-110`}
                    style={{
                        backgroundColor: color,
                        boxShadow: `0 10px 30px ${color}40, 0 0 0 4px ${color}15`
                    }}
                >
                    {iconElement()}
                </div>

                {/* Success ring on capture */}
                {!disabled && (
                    <div
                        className="absolute inset-0 rounded-full border-2 border-white/30 scale-100 group-active:scale-125 transition-transform duration-200"
                    />
                )}
            </div>

            <span className={`text-sm font-bold transition-colors duration-200 ${
                disabled ? 'text-gray-400' : 'text-gray-600 group-hover:text-gray-800'
            }`}>
                {label}
            </span>
        </button>
    )
}
