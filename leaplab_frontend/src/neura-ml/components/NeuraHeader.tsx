/**
 * NeuraHeader — Top navigation bar. (Pure Tailwind)
 */
import React from 'react';
import { Home, Save, Settings, HelpCircle, BookOpen, Trophy, MessageSquareWarning } from 'lucide-react';
import LeapLabAuthButton from '@/auth/LeapLabAuthButton';
import TopbarShareButton from '../../components/common/TopbarShareButton';
import type { NeuraHeaderProps } from '../types';

export default function NeuraHeader({
  onBack,
  onSave,
  projectName,
  onProjectNameChange,
  showProjectInput = false,
}: NeuraHeaderProps): React.JSX.Element {
  return (
    <header className="flex items-center justify-between h-14 bg-[#0a015a]/95 backdrop-blur-xl border-b border-white/10 px-4 shrink-0">
      {/* LEFT */}
      <div className="flex items-center gap-3 flex-1">
        {onBack && (
          <button title="Back to Home" onClick={onBack} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors ml-1">
            <Home size={18} strokeWidth={2.2} />
          </button>
        )}
        <div className="w-px h-6 bg-white/15 mx-1" />
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
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-xs font-semibold transition-all">
          <BookOpen size={14} strokeWidth={2.2} />
          Tutorials
        </button>
      </div>

      {/* MIDDLE */}
      <div className="flex items-center gap-3">
        {showProjectInput && (
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 border border-white/10">
            <span className="text-sm opacity-40">🧠</span>
            <input
              placeholder="My ML Project"
              type="text"
              value={projectName || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onProjectNameChange?.(e.target.value)
              }
              className="bg-transparent text-white text-sm font-medium placeholder-white/40 outline-none w-40"
            />
            {onSave && (
              <button title="Save Project" onClick={onSave} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <Save size={16} strokeWidth={2.8} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        <div className="flex items-center gap-3 pr-4 border-r border-white/10 h-6 shrink-0">
          <TopbarShareButton
            className="text-white/45 hover:text-white transition-colors cursor-pointer"
            size={18}
            onSave={onSave}
            projectName={projectName}
          />
          <button title="Feedback" className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/10 transition-colors">
            <MessageSquareWarning size={18} strokeWidth={2.2} />
          </button>
          <button title="Achievements" className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/10 transition-colors">
            <Trophy size={18} strokeWidth={2.2} />
          </button>
          <button title="Settings" className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/10 transition-colors">
            <Settings size={18} strokeWidth={2.2} />
          </button>
          <button title="Help" className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/10 transition-colors">
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
