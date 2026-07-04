/**
 * NeuraHeader — Top navigation bar.
 * Converted from 200+ inline styles to Tailwind + neura-styles.css classes.
 */
import React from 'react';
import { Home, Save, Settings, HelpCircle, BookOpen, Trophy, MessageSquareWarning } from 'lucide-react';
import LeapLabAuthButton from '@/auth/LeapLabAuthButton';
import TopbarShareButton from '../../components/common/TopbarShareButton';

export default function NeuraHeader({ onBack, onSave, projectName, onProjectNameChange, showProjectInput = false }) {
    return (
        <header className="neura-header">
            {/* LEFT */}
            <div className="neura-header-section flex-1">
                {onBack && (
                    <button title="Back to Home" onClick={onBack} className="neura-header-btn ml-1">
                        <Home size={18} strokeWidth={2.2} />
                    </button>
                )}
                <div className="neura-header-divider" />
                <div className="flex items-center gap-2.5 mr-3 shrink-0">
                    <img
                        alt="LeapLab"
                        src="assets/leaplab_logo_transparent.png"
                        className="h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(80,200,255,0.3)]"
                    />
                    <div className="flex flex-col leading-none">
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-yellow-400">LeapLab</span>
                        <span className="text-sm font-black tracking-wide text-white">NEURA ML</span>
                    </div>
                </div>
                <button className="neura-ghost flex items-center gap-1.5 px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-xs font-semibold transition-all">
                    <BookOpen size={14} strokeWidth={2.2} />
                    Tutorials
                </button>
            </div>

            {/* MIDDLE */}
            <div className="neura-header-section">
                {showProjectInput && (
                    <div className="neura-project-input-wrap">
                        <span className="text-sm opacity-40">🧠</span>
                        <input
                            placeholder="My ML Project"
                            type="text"
                            value={projectName || ''}
                            onChange={(e) => onProjectNameChange?.(e.target.value)}
                            className="neura-project-input"
                        />
                        {onSave && (
                            <button title="Save Project" onClick={onSave} className="neura-save-btn">
                                <Save size={16} strokeWidth={2.8} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* RIGHT */}
            <div className="neura-header-section flex-1 justify-end">
                <div className="flex items-center gap-3 pr-4 border-r border-white/10 h-6 shrink-0">
                    <TopbarShareButton
                        className="text-white/45 hover:text-white transition-colors cursor-pointer"
                        size={18}
                        onSave={onSave}
                        projectName={projectName}
                    />
                    <button title="Feedback" className="neura-header-icon-btn">
                        <MessageSquareWarning size={18} strokeWidth={2.2} />
                    </button>
                    <button title="Achievements" className="neura-header-icon-btn">
                        <Trophy size={18} strokeWidth={2.2} />
                    </button>
                    <button title="Settings" className="neura-header-icon-btn">
                        <Settings size={18} strokeWidth={2.2} />
                    </button>
                    <button title="Help" className="neura-header-icon-btn">
                        <HelpCircle size={18} strokeWidth={2.2} />
                    </button>
                </div>
                <LeapLabAuthButton variant="dark" />
                <div className="ml-3 shrink-0 opacity-80 hover:opacity-100 transition-opacity">
                    <img
                        alt="Creoleap"
                        src="/assets/logo - creoleap.png"
                        className="h-10 w-auto object-contain brightness-110 contrast-110 drop-shadow-[0_2px_6px_rgba(255,255,255,0.15)]"
                    />
                </div>
            </div>
        </header>
    );
}
