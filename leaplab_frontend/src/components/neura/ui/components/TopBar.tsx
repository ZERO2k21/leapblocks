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

export default function TopBar({ title, mode, onModeChange, onBack, totalSamples, canTrain }: TopBarProps) {
    return (
        <div className="flex items-center justify-between px-5 py-3 relative" style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
        }}>
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{
                        background: 'rgba(255,255,255,0.6)',
                        border: '1px solid rgba(255,255,255,0.8)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-800">{title}</h1>
                    <p className="text-xs font-medium" style={{
                        background: 'linear-gradient(90deg, #7C3AED, #3B82F6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>{totalSamples} samples collected</p>
                </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl p-1.5" style={{
                background: 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
            }}>
                <button
                    onClick={() => onModeChange('collect')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
                    style={mode === 'collect' ? {
                        background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                        color: 'white',
                        boxShadow: '0 4px 16px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                    } : {
                        color: '#6B7280'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v8M8 12h8" />
                    </svg>
                    Collect
                </button>
                <button
                    onClick={() => canTrain && onModeChange('train')}
                    disabled={!canTrain}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
                    style={mode === 'train' ? {
                        background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                        color: 'white',
                        boxShadow: '0 4px 16px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                    } : canTrain ? {
                        color: '#6B7280'
                    } : {
                        color: '#D1D5DB',
                        cursor: 'not-allowed'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                    Train
                </button>
                <button
                    onClick={() => onModeChange('test')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
                    style={mode === 'test' ? {
                        background: 'linear-gradient(135deg, #10B981, #14B8A6)',
                        color: 'white',
                        boxShadow: '0 4px 16px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                    } : {
                        color: '#6B7280'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                    </svg>
                    Test
                </button>
            </div>
        </div>
    )
}
