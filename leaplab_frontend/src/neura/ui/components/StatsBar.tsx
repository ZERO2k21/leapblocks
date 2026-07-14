import React from 'react'

interface StatsBarProps {
    totalClasses: number
    totalImages: number
    imagesPerClass: number
    recommended: number
}

export default function StatsBar({ totalClasses, totalImages, imagesPerClass, recommended }: StatsBarProps) {
    return (
        <div className="w-full max-w-[720px] animate-fade-in">
            <div className="flex items-center justify-between gap-3 py-2.5 px-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#dae2fd] shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="text-lg">📁</span>
                        <span className="text-xs text-[#4a4455]"><span className="font-bold text-[#131b2e]">{totalClasses}</span> classes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-lg">🖼️</span>
                        <span className="text-xs text-[#4a4455]"><span className="font-bold text-[#131b2e]">{totalImages}</span> pics</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-lg">📊</span>
                        <span className="text-xs text-[#4a4455]">Avg: <span className="font-bold text-[#131b2e]">{imagesPerClass}</span>/class</span>
                    </div>
                </div>

                <div className="h-4 w-px bg-[#ccc3d8]/50" />

                <div className="flex items-center gap-1.5">
                    <span className="text-sm">🎯</span>
                    <span className="text-xs font-bold text-[#006c44]">Goal: {recommended}/class</span>
                </div>

                <div className="h-4 w-px bg-[#ccc3d8]/50" />

                <span className="text-[9px] font-bold text-[#630ed4] uppercase tracking-widest">🧠 NEURA</span>
            </div>
        </div>
    )
}
