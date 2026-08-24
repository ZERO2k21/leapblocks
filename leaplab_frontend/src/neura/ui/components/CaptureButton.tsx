import React, { useState } from 'react'
import { CameraIcon, MicIcon, PenIcon, PlusIcon, CheckIcon, HandPoseIcon } from '../../assets/icons/NeuraIcons'

interface CaptureButtonProps {
    onClick: () => void
    disabled?: boolean
    label?: string
    icon?: 'camera' | 'mic' | 'pen' | 'plus' | 'check' | 'pose'
    color?: string
    pulse?: boolean
    size?: 'sm' | 'md' | 'lg'
    onMouseDown?: () => void
    onMouseUp?: () => void
    onTouchStart?: () => void
    onTouchEnd?: () => void
}

const ICON_COMPONENTS: Record<string, React.FC<{ size?: number; className?: string; color?: string }>> = {
    camera: CameraIcon,
    mic: MicIcon,
    pen: PenIcon,
    plus: PlusIcon,
    check: CheckIcon,
    pose: HandPoseIcon
}

const SIZE_MAP: Record<string, string> = {
    sm: 'w-14 h-14',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
}

const ICON_SIZE_MAP: Record<string, number> = {
    sm: 20,
    md: 24,
    lg: 32
}

export default function CaptureButton({
    onClick,
    disabled = false,
    label = 'Capture',
    icon = 'camera',
    color = '#630ed4',
    pulse = false,
    size = 'lg',
    onMouseDown,
    onMouseUp,
    onTouchStart,
    onTouchEnd
}: CaptureButtonProps) {
    const [showRing, setShowRing] = useState(false)

    const handleClick = () => {
        if (disabled) return
        setShowRing(true)
        setTimeout(() => setShowRing(false), 600)
        onClick()
    }

    return (
        <button
            onClick={handleClick}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            disabled={disabled}
            className={`relative group flex flex-col items-center gap-2 transition-all duration-300 ${
                disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-90 cursor-pointer'
            }`}
        >
            <div className="relative">
                {/* Pulse rings */}
                {pulse && !disabled && (
                    <>
                        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: color, animationDuration: '1.5s' }} />
                        <div className="absolute -inset-2 rounded-full animate-pulse opacity-10" style={{ backgroundColor: color, animationDuration: '2s' }} />
                    </>
                )}

                {/* Ring effect on capture */}
                {showRing && (
                    <div className="absolute inset-0 rounded-full border-4 border-[#630ed4]/30 animate-scale-in" />
                )}

                {/* Main button */}
                <div
                    className={`${SIZE_MAP[size]} rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-xl group-hover:shadow-2xl group-hover:scale-105 relative overflow-hidden`}
                    style={{ backgroundColor: color }}
                >
                    <span className="relative z-10">{React.createElement(ICON_COMPONENTS[icon] || CameraIcon, { size: ICON_SIZE_MAP[size], color: 'white' })}</span>
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-full" />
                </div>
            </div>

            <span className={`text-xs font-bold transition-all duration-200 ${
                disabled ? 'text-[#ccc3d8]' : 'text-[#4a4455] group-hover:text-[#630ed4]'
            }`}>
                {label}
            </span>
        </button>
    )
}
