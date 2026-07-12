import React from 'react'

interface StatsBarProps {
    totalClasses: number
    totalImages: number
    imagesPerClass: number
    recommended: number
}

export default function StatsBar({ totalClasses, totalImages, imagesPerClass, recommended }: StatsBarProps) {
    return (
        <div className="w-full max-w-[720px] animate-[fade-in_0.3s_ease-out]">
            <div className="flex items-center justify-between gap-4 py-3 px-6 bg-surface-container-low rounded-2xl border border-outline-variant">
                {/* Stats */}
                <div className="flex items-center gap-6">
                    {/* Classes */}
                    <div className="flex items-center gap-2">
                        <div className="bg-surface-container-high p-1 rounded-md">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                        </div>
                        <span className="text-xs text-on-surface-variant">Classes: <span className="font-bold text-on-surface">{totalClasses}</span></span>
                    </div>

                    {/* Images */}
                    <div className="flex items-center gap-2">
                        <div className="bg-surface-container-high p-1 rounded-md">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                        </div>
                        <span className="text-xs text-on-surface-variant">Images: <span className="font-bold text-on-surface">{totalImages}</span></span>
                    </div>

                    {/* Avg/Class */}
                    <div className="flex items-center gap-2">
                        <div className="bg-surface-container-high p-1 rounded-md">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="20" x2="18" y2="10" />
                                <line x1="12" y1="20" x2="12" y2="4" />
                                <line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                        </div>
                        <span className="text-xs text-on-surface-variant">Avg/Class: <span className="font-bold text-on-surface">{imagesPerClass}</span></span>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-4 w-px bg-outline-variant" />

                {/* Recommended */}
                <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span className="text-xs text-secondary font-semibold">Recommended: {recommended}/class</span>
                </div>

                {/* Divider */}
                <div className="h-4 w-px bg-outline-variant" />

                {/* Session Label */}
                <span className="text-xs font-bold text-on-surface tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.05em' }}>
                    LEAPLAB NEURA SESSION STATS
                </span>
            </div>
        </div>
    )
}
