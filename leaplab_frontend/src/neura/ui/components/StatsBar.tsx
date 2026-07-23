import React from 'react'

interface StatsBarProps {
    totalClasses: number
    totalImages: number
    imagesPerClass: number
    recommended: number
    compact?: boolean
}

export default function StatsBar({ totalClasses, totalImages, imagesPerClass, recommended, compact }: StatsBarProps) {
    if (compact) {
        return (
            <div className="w-full bg-white rounded-xl p-4 px-5 border border-gray-200 flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-sm">📁</div>
                    <div>
                        <span className="text-[11px] text-gray-500 block">classes</span>
                        <span className="text-base font-bold text-[#630ed4]">{totalClasses}</span>
                    </div>
                </div>
                <div className="w-px h-7 bg-gray-200" />
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">🖼️</div>
                    <div>
                        <span className="text-[11px] text-gray-500 block">pics</span>
                        <span className="text-base font-bold text-emerald-600">{totalImages}</span>
                    </div>
                </div>
                <div className="w-px h-7 bg-gray-200" />
                <div className="flex items-center gap-1.5 p-1.5 px-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg">
                    <span className="text-sm">🎯</span>
                    <span className="text-sm font-bold text-emerald-600">{recommended}/cls</span>
                </div>
                <div className="w-px h-7 bg-gray-200" />
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#630ed4] shadow-[0_0_6px_rgba(99,14,212,0.5)]" />
                    <span className="text-[11px] font-extrabold text-[#630ed4] tracking-wider">NEURA</span>
                </div>
            </div>
        )
    }

    const stats = [
        { emoji: '📁', label: 'classes', value: totalClasses, colorClass: 'text-[#630ed4]', bgClass: 'bg-purple-50' },
        { emoji: '🖼️', label: 'pics', value: totalImages, colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50' },
        { emoji: '📊', label: 'Avg', value: `${imagesPerClass}/class`, colorClass: 'text-amber-600', bgClass: 'bg-amber-50' },
    ]

    return (
        <div className="w-full max-w-[720px] animate-fade-in">
            <div className="flex items-center justify-between bg-white rounded-2xl p-3 px-5 border border-gray-200 shadow-xs">
                {/* Stats */}
                <div className="flex items-center gap-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg ${stat.bgClass} flex items-center justify-center text-sm`}>
                                {stat.emoji}
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">{stat.label}: </span>
                                <span className={`text-xs font-bold ${stat.colorClass}`}>{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-200" />

                {/* Goal */}
                <div className="flex items-center gap-1.5 p-1.5 px-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg">
                    <span className="text-sm">🎯</span>
                    <span className="text-xs font-bold text-emerald-600">
                        Goal: {recommended}/class
                    </span>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-200" />

                {/* Brand */}
                <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#630ed4] shadow-[0_0_6px_rgba(99,14,212,0.5)]" />
                    <span className="text-[10px] font-extrabold text-[#630ed4] tracking-wider">
                        NEURA
                    </span>
                </div>
            </div>
        </div>
    )
}
