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
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-lg font-bold text-gray-800">{title}</h1>
                    <p className="text-xs text-gray-400">{totalSamples} samples collected</p>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-1">
                <button
                    onClick={() => onModeChange('collect')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        mode === 'collect'
                            ? 'bg-violet-500 text-white shadow-md shadow-violet-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-white'
                    }`}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v8M8 12h8" />
                    </svg>
                    Collect
                </button>
                <button
                    onClick={() => canTrain && onModeChange('train')}
                    disabled={!canTrain}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        mode === 'train'
                            ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                            : canTrain
                                ? 'text-gray-500 hover:text-gray-700 hover:bg-white'
                                : 'text-gray-300 cursor-not-allowed'
                    }`}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                    Train
                </button>
                <button
                    onClick={() => onModeChange('test')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        mode === 'test'
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-white'
                    }`}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                    </svg>
                    Test
                </button>
            </div>
        </div>
    )
}
