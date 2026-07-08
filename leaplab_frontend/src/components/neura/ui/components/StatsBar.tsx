import React from 'react'

interface StatsBarProps {
    totalClasses: number
    totalImages: number
    imagesPerClass: number
    recommended: number
}

export default function StatsBar({ totalClasses, totalImages, imagesPerClass, recommended }: StatsBarProps) {
    const stats = [
        {
            label: 'Classes',
            value: totalClasses,
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
            ),
            bgColor: 'bg-violet-50'
        },
        {
            label: 'Images',
            value: totalImages,
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
            ),
            bgColor: 'bg-blue-50'
        },
        {
            label: 'Avg/Class',
            value: imagesPerClass,
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
            ),
            bgColor: 'bg-emerald-50'
        },
        {
            label: 'Recommended',
            value: recommended,
            suffix: '/class',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                </svg>
            ),
            bgColor: 'bg-amber-50',
            valueColor: 'text-amber-500'
        }
    ]

    return (
        <div className="w-full max-w-[520px] animate-[fade-in_0.3s_ease-out]">
            <div
                className="bg-white rounded-2xl px-4 py-4 border border-gray-100"
                style={{
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)'
                }}
            >
                <div className="flex items-center justify-between">
                    {stats.map((stat, index) => (
                        <React.Fragment key={stat.label}>
                            {/* Stat Item */}
                            <div className="flex flex-col items-center flex-1">
                                <div className={`w-9 h-9 rounded-xl ${stat.bgColor} flex items-center justify-center mb-1.5`}>
                                    {stat.icon}
                                </div>
                                <span className={`text-lg font-black leading-none ${stat.valueColor || 'text-gray-800'}`}>
                                    {stat.value}{stat.suffix || ''}
                                </span>
                                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                                    {stat.label}
                                </span>
                            </div>

                            {/* Divider (not after last item) */}
                            {index < stats.length - 1 && (
                                <div className="w-px h-10 bg-gray-100" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    )
}
