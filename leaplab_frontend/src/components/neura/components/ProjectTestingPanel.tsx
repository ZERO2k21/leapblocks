import React from 'react'
import { Activity } from 'lucide-react'

type ProjectTestingPanelProps = {
    icon?: React.ReactNode
    accentColor?: string
    trained: boolean
    emptyIllustration?: React.ReactNode
    emptyText?: string
    children: React.ReactNode
}

export default function ProjectTestingPanel({
    icon,
    accentColor = '#8b5cf6',
    trained,
    emptyIllustration,
    emptyText = 'Train your model to start testing',
    children,
}: ProjectTestingPanelProps) {
    return (
        <div className="w-[330px] rounded-2xl overflow-hidden shrink-0 flex flex-col" style={{ background: 'var(--ml-surface)', border: '1px solid var(--ml-border)' }}>
            {/* Header */}
            <div
                className="px-4 py-3.5 flex items-center gap-2"
                style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)` }}
            >
                {icon || <Activity size={16} className="text-white" />}
                <span className="text-white font-bold text-sm font-sans">Testing</span>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                {!trained ? (
                    <div className="flex flex-col items-center text-center justify-center flex-1">
                        {emptyIllustration || (
                            <svg width="80" height="64" viewBox="0 0 80 64" fill="none" className="opacity-40 mb-3">
                                <rect x="18" y="16" width="44" height="32" rx="4" stroke={accentColor} strokeWidth="1.5" fill="none" />
                                <circle cx="40" cy="32" r="10" stroke={accentColor} strokeWidth="1.5" fill="none" />
                                <circle cx="40" cy="32" r="5" fill={accentColor} opacity="0.2" />
                                <text x="62" y="28" fontSize="16" fill={accentColor} opacity="0.5" fontWeight="bold">?</text>
                            </svg>
                        )}
                        <p className="font-sans text-xs leading-relaxed m-0" style={{ color: 'var(--ml-text-muted)' }}>
                            {emptyText}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 flex-1">
                        {children}
                    </div>
                )}
            </div>
        </div>
    )
}
