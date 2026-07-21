import React, { useState } from 'react'
import { Menu as MenuIcon, X } from 'lucide-react'
import type { ClassifierMode } from '../../hooks/useNeuraProject'
import ProjectNameInput from '../../../components/common/ProjectNameInput'
import ModeSwitcher from '../../../components/common/ModeSwitcher'
import { useWindowWidth } from '../../../hooks/useWindowWidth'
import MobileDrawer from '../../../components/common/MobileDrawer'

interface TopBarProps {
    title: string
    mode: ClassifierMode
    onModeChange: (mode: ClassifierMode) => void
    onBack: () => void
    totalSamples: number
    canTrain: boolean
    onTitleChange?: (val: string) => void
    onSave?: () => void
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

export default function TopBar({ title, mode, onModeChange, onBack, totalSamples, canTrain, onTitleChange, onSave }: TopBarProps) {
    const windowWidth = useWindowWidth();
    const showDesktopMode = windowWidth >= 768;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="flex items-center justify-between px-4 py-2.5 bg-white/70 backdrop-blur-md border-b border-[#dae2fd] shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
                <button
                    onClick={onBack}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/80 border border-[#dae2fd] shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 text-[#4a4455] shrink-0"
                >
                    <span className="text-lg">⬅️</span>
                </button>
                <div className="min-w-0">
                    {onTitleChange && onSave ? (
                        <div className="flex items-center gap-2">
                            <ProjectNameInput
                                value={title}
                                onChange={onTitleChange}
                                onSave={onSave}
                            />
                            <span className="text-lg shrink-0">{MODE_EMOJI[mode]}</span>
                        </div>
                    ) : (
                        <h1 className="text-base font-black text-[#131b2e] flex items-center gap-2">
                            {title} <span className="text-lg">{MODE_EMOJI[mode]}</span>
                        </h1>
                    )}
                    <p className="text-[11px] font-semibold text-[#630ed4] whitespace-nowrap">{totalSamples} samples collected! 🎯</p>
                </div>
            </div>

            {showDesktopMode ? (
                <ModeSwitcher
                    modes={[
                        { id: 'collect', label: 'Collect', icon: <span>📸</span> },
                        { id: 'train', label: 'Train', icon: <span>🏋️</span> },
                        { id: 'test', label: 'Test', icon: <span>🧪</span> },
                    ]}
                    activeMode={mode}
                    onChange={(id) => onModeChange(id as ClassifierMode)}
                />
            ) : (
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/80 border border-[#dae2fd] shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 text-[#4a4455] shrink-0"
                >
                    <MenuIcon size={18} strokeWidth={2.2} />
                </button>
            )}

            <MobileDrawer
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                theme="dark"
                width="260px"
            >
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>Mode</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[
                        { id: 'collect' as ClassifierMode, label: 'Collect', emoji: '📸' },
                        { id: 'train' as ClassifierMode, label: 'Train', emoji: '🏋️' },
                        { id: 'test' as ClassifierMode, label: 'Test', emoji: '🧪' },
                    ].map(({ id, label, emoji }) => (
                        <button key={id} onClick={() => { onModeChange(id); setMobileMenuOpen(false); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                padding: '10px 12px', border: 'none', borderRadius: 8,
                                background: mode === id ? 'rgba(99,14,212,0.2)' : 'transparent',
                                color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                textAlign: 'left', transition: 'all 0.15s ease',
                            }}
                        >
                            <span>{emoji}</span>
                            <span>{label}</span>
                            {mode === id && <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.6 }}>Active</span>}
                        </button>
                    ))}
                </div>
            </MobileDrawer>
        </div>
    )
}
