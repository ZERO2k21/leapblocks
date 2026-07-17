import React from 'react'
import type { ClassifierMode } from '../../hooks/useNeuraProject'

interface TopBarProps {
    title: string
    mode: ClassifierMode
    onModeChange: (mode: ClassifierMode) => void
    onBack: () => void
    totalSamples: number
    canTrain: boolean
}

const MODE_EMOJI: Record<string, string> = {
    collect: '📸',
    train: '🏋️',
    test: '🧪'
}

const MODE_COLORS: Record<string, { active: string; bg: string; ring: string }> = {
    collect: { active: 'from-[#630ed4] to-[#7c3aed]', bg: 'bg-[#eaedff]', ring: 'ring-[#630ed4]/30' },
    train: { active: 'from-[#006c44] to-[#10b981]', bg: 'bg-[#d1fae5]', ring: 'ring-[#006c44]/30' },
    test: { active: 'from-[#c32c00] to-[#ef4444]', bg: 'bg-[#fee2e2]', ring: 'ring-[#c32c00]/30' }
}

export default function TopBar({ title, mode, onModeChange, onBack, totalSamples, canTrain }: TopBarProps) {
    return (
        <div className="flex items-center justify-between px-4 py-2.5 bg-white/70 backdrop-blur-md border-b border-[#dae2fd] shadow-sm">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/80 border border-[#dae2fd] shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 text-[#4a4455]"
                >
                    <span className="text-lg">⬅️</span>
                </button>
                <div>
                    <h1 className="text-base font-black text-[#131b2e] flex items-center gap-2">
                        {title} <span className="text-lg">{MODE_EMOJI[mode]}</span>
                    </h1>
                    <p className="text-[11px] font-semibold text-[#630ed4]">{totalSamples} samples collected! 🎯</p>
                </div>
            </div>
        </div>
    )
}
