import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  ChevronDown,
  BookOpen,
  Save,
  Download,
  MessageSquareWarning,
  Share2,
  Trophy,
  Settings,
  CircleHelp,
  FileText,
  FolderOpen,
  FilePlus,
  Undo,
  Redo,
  Scissors,
  Copy,
  Clipboard,
  Check,
  Menu,
  X,
  Loader2
} from 'lucide-react';
import LeapLabAuthButton from '../../auth/LeapLabAuthButton';
import TopbarShareButton from '../../components/common/TopbarShareButton';

// Extracted local submenus
import { FileDropdownMenu } from './FileDropdownMenu';
import { EditDropdownMenu } from './EditDropdownMenu';

interface IgniteTopbarProps {
  onBack: () => void;
  onSave: () => void;
  onSaveAs?: () => void;
  onDownload?: () => void;
  onNew?: () => void;
  onOpen?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  title: string;
  onTitleChange: (val: string) => void;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  brandName?: string;
  variant?: 'default' | 'electra';
  canUndo?: boolean;
  canRedo?: boolean;
  isSaving?: boolean;
}

export const IgniteTopbar: React.FC<IgniteTopbarProps> = ({
  onBack,
  onSave,
  onSaveAs,
  onDownload,
  onNew,
  onOpen,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  title,
  onTitleChange,
  centerContent,
  rightContent,
  brandName = 'ELECTRA',
  variant = 'default',
  canUndo = false,
  canRedo = false,
  isSaving = false
}) => {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const editMenuRef = useRef<HTMLDivElement>(null);

  const isElectra = variant === 'electra';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setFileMenuOpen(false);
      }
      if (editMenuRef.current && !editMenuRef.current.contains(event.target as Node)) {
        setEditMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, []);

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        /* Mobile Drawer Specific UI/UX Overrides */
        .mobile-drawer-footer .creova-right-gap {
          flex-direction: column !important;
          width: 100% !important;
          gap: 14px !important;
          align-items: stretch !important;
        }
        .mobile-drawer-footer .creova-right-gap nav {
          width: 100% !important;
          display: flex !important;
          box-sizing: border-box !important;
        }
        .mobile-drawer-footer .creova-right-gap nav button {
          flex: 1 !important;
          justify-content: center !important;
          padding: 8px 12px !important;
          height: 38px !important;
        }
        .mobile-drawer-footer .creova-right-gap .creova-tab-label {
          display: inline-block !important;
        }
        .mobile-drawer-footer .creova-right-gap .creova-build-text {
          display: inline-block !important;
        }
        .mobile-drawer-footer .creova-right-gap .creova-divider {
          display: none !important;
        }
        .mobile-drawer-footer .creova-right-gap button.creova-build-btn {
          width: 100% !important;
          justify-content: center !important;
          padding: 10px 20px !important;
          height: 40px !important;
        }
      `}</style>

      <div
        style={{ paddingLeft: '2px' }}
        className={`flex items-center justify-between h-12 pr-[18px] z-[100] select-none min-w-0 border-b gap-4 ${isElectra
            ? 'bg-gradient-to-br from-[#09090b] to-[#18181b] border-[#27272a] shadow-[0_2px_12px_rgba(0,0,0,0.4)]'
            : 'bg-gradient-to-br from-[#0b1b42] via-[#0f2f7a] to-[#0a204f] border-[rgba(96,165,250,0.28)] shadow-[0_4px_20px_rgba(8,20,58,0.45),inset_0_-1px_0_rgba(96,165,250,0.12)]'
          }`}
      >
        {/* Left section */}
        <div className="flex items-center gap-3.5 flex-auto min-w-0 h-full">
          <button
            title="Back to Home"
            onClick={() => {
              sessionStorage.setItem('landingActiveTab', 'modules');
              sessionStorage.removeItem('myProjectsSelectedMode');
              onBack();
            }}
            style={{ marginLeft: '16px' }}
            className={`flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors duration-200 shrink-0 border ${isElectra
                ? 'bg-[#27272a]/50 border-[#27272a] text-[#f4f4f5] hover:bg-[#22d3ee]/10 hover:border-[#22d3ee] hover:text-[#22d3ee]'
                : 'bg-[#94c5ff]/18 border-[#94c5ff]/24 text-white hover:bg-[#bfdbfe]/24'
              }`}
          >
            <Home size={16} strokeWidth={2.2} />
          </button>

          <div className={`h-5 w-px shrink-0 ${isElectra ? 'bg-[#27272a]/60' : 'bg-[#bfdbfe]/28'}`} />

          <div className={`flex items-center mr-2.5 shrink-0 ${isElectra ? '' : 'filter drop-shadow-[0_0_14px_rgba(56,189,248,0.3)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]'
            }`}>
            <img
              alt="LeapLab"
              src="assets/leaplab_logo_transparent.png"
              className="h-12 object-contain"
            />
            <div className="hidden min-[1600px]:flex flex-col justify-center ml-2.5 leading-none gap-0.5">
              <span className={`text-[7px] font-black uppercase tracking-[0.18em] font-sans ${isElectra ? 'text-[#a1a1aa]' : 'text-[#93c5fd]'}`}>
                LEAPLAB
              </span>
              <span className={`text-sm font-black tracking-[0.08em] font-sans ${isElectra ? 'text-[#22d3ee]' : 'text-white'}`}>
                {brandName}
              </span>
            </div>
          </div>
 
          {/* Desktop dropdown menus */}
          <div className="hidden min-[1600px]:flex items-center gap-3 h-full">
            {/* File Menu */}
            <div ref={fileMenuRef} className="relative">
              <button
                onClick={() => {
                  setFileMenuOpen(!fileMenuOpen);
                  setEditMenuOpen(false);
                }}
                className={`flex items-center text-[15px] font-medium font-sans cursor-pointer rounded-[6px] transition-all duration-200 tracking-wide ${isElectra ? 'text-[#f4f4f5]' : 'text-white'
                  } ${fileMenuOpen ? (isElectra ? 'bg-[#22d3ee]/18' : 'bg-white/18') : 'bg-transparent'} ${isElectra ? 'hover:bg-[#22d3ee]/10' : 'hover:bg-white/10'}`}
                style={{
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                File
                <ChevronDown size={12} strokeWidth={2.5} className={`opacity-50 transition-transform duration-200 ${fileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
 
              <FileDropdownMenu
                isOpen={fileMenuOpen}
                isElectra={isElectra}
                brandName={brandName}
                onNew={onNew}
                onOpen={onOpen}
                onDownload={onDownload}
                onSaveAs={onSaveAs}
                onBack={onBack}
                onClose={() => setFileMenuOpen(false)}
              />
            </div>
 
            {/* Edit Menu */}
            <div ref={editMenuRef} className="relative">
              <button
                onClick={() => {
                  setEditMenuOpen(!editMenuOpen);
                  setFileMenuOpen(false);
                }}
                className={`flex items-center text-[15px] font-medium font-sans cursor-pointer rounded-[6px] transition-all duration-200 tracking-wide ${isElectra ? 'text-[#f4f4f5]' : 'text-white'
                  } ${editMenuOpen ? (isElectra ? 'bg-[#22d3ee]/18' : 'bg-white/18') : 'bg-transparent'} ${isElectra ? 'hover:bg-[#22d3ee]/10' : 'hover:bg-white/10'}`}
                style={{
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                Edit
                <ChevronDown size={12} strokeWidth={2.5} className={`opacity-50 transition-transform duration-200 ${editMenuOpen ? 'rotate-180' : ''}`} />
              </button>
 
              <EditDropdownMenu
                isOpen={editMenuOpen}
                isElectra={isElectra}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={onUndo}
                onRedo={onRedo}
                onCut={onCut}
                onCopy={onCopy}
                onPaste={onPaste}
                onClose={() => setEditMenuOpen(false)}
              />
            </div>
 
 
 
            <button
              className={`flex items-center text-[15px] font-medium font-sans cursor-pointer rounded-[6px] transition-all duration-200 tracking-wide bg-transparent border-0 ${isElectra ? 'text-[#f4f4f5]' : 'text-white'
                } ${isElectra ? 'hover:bg-[#22d3ee]/10' : 'hover:bg-white/10'}`}
              style={{
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <BookOpen size={14} strokeWidth={2.2} className={isElectra ? 'opacity-70' : 'opacity-90'} />
              Tutorials
              <ChevronDown size={12} strokeWidth={2.5} className="opacity-50" />
            </button>
          </div>
        </div>
 
        {/* Center section */}
        <div className="flex items-center justify-center gap-4 px-4 flex-none min-w-0">
          <div className="hidden md:flex items-center gap-4">{centerContent}</div>
 
          <div
            style={{ paddingLeft: '24px' }}
            className={`flex items-center h-8 rounded-full pr-[3px] border gap-3 transition-all duration-200 ${isElectra ? 'bg-[#27272a]/50 border-[#27272a]' : 'bg-[#08143a]/55 border-[#93c5fd]/20'
              }`}>
            <span className={`text-[12px] opacity-45 font-bold tracking-[0.01em] hidden min-[1600px]:inline ${isElectra ? 'text-[#a1a1aa]' : 'text-white'}`}>
              Folder
            </span>
            <input
              placeholder="My Project"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className={`bg-transparent border-0 text-xs font-bold font-sans w-20 md:w-[120px] text-center outline-none tracking-wide min-w-0 ${isElectra ? 'text-[#f4f4f5]' : 'text-white'
                }`}
            />
            <button
              title="Save Project"
              onClick={onSave}
              disabled={isSaving}
              className={`border-0 rounded-full w-[26px] h-[26px] flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0 scale-100 hover:scale-[1.08] hover:brightness-[1.08] ${isElectra
                ? 'bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] text-black shadow-[0_4px_10px_-1px_rgba(34,211,238,0.4)]'
                : 'bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] text-white shadow-[0_4px_10px_-1px_rgba(8,47,123,0.45)]'
                } ${isSaving ? 'opacity-80 cursor-wait' : ''}`}
            >
              {isSaving ? (
                <Loader2 size={12} strokeWidth={2.5} className="animate-spin" />
              ) : (
                <Save size={12} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
 
        {/* Right section */}
        <div className="flex items-center justify-end gap-3 flex-auto min-w-0">
          {/* Quick actions - Desktop only */}
          <div className={`hidden min-[1600px]:flex items-center gap-3 pr-4 border-r h-8 shrink-0 ${isElectra ? 'border-[rgba(39,39,42,0.8)]' : 'border-[rgba(191,219,254,0.22)]'
            }`}>
            <TopbarShareButton className={`bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 flex items-center ${isElectra ? 'text-[#a1a1aa] hover:text-[#22d3ee]' : 'text-[rgba(191,219,254,0.85)] hover:text-white'}`} size={16} onSave={onSave} projectName={title} />
            <button title="Feedback" className={`bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 flex items-center ${isElectra ? 'text-[#a1a1aa] hover:text-[#22d3ee]' : 'text-[rgba(191,219,254,0.85)] hover:text-white'}`}><MessageSquareWarning size={16} strokeWidth={2.2} /></button>
            <button title="Achievements" className={`bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 flex items-center ${isElectra ? 'text-[#a1a1aa] hover:text-[#22d3ee]' : 'text-[rgba(191,219,254,0.85)] hover:text-white'}`}><Trophy size={16} strokeWidth={2.2} /></button>
            <button title="Settings" className={`bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 flex items-center ${isElectra ? 'text-[#a1a1aa] hover:text-[#22d3ee]' : 'text-[rgba(191,219,254,0.85)] hover:text-white'}`}><Settings size={16} strokeWidth={2.2} /></button>
            <button
              title="Help"
              style={{ marginRight: '10px' }}
              className={`bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 flex items-center ${isElectra ? 'text-[#a1a1aa] hover:text-[#22d3ee]' : 'text-[rgba(191,219,254,0.85)] hover:text-white'}`}
            >
              <CircleHelp size={20} strokeWidth={2.2} />
            </button>
          </div>
 
          {rightContent && (
            <div className="flex items-center shrink-0">
              {rightContent}
            </div>
          )}
          <div className="hidden sm:flex sm:items-center sm:gap-4 shrink-0 ml-4">
            <LeapLabAuthButton variant="dark" size="sm" style={{ height: '36px', borderRadius: '16px', boxSizing: 'border-box' }} />
          </div>
 
          {/* Creoleap brand logo (large desktop only) */}
          <div className={`hidden min-[1500px]:flex ml-2 items-center shrink-0 h-12 overflow-hidden ${isElectra ? '' : 'filter drop-shadow-[0_0_20px_rgba(167,139,250,0.7)] drop-shadow-[0_0_8px_rgba(255,255,255,0.25)] drop-shadow-[0_3px_10px_rgba(0,0,0,0.5)]'
            }`}>
            <img
              alt="Leap into the AI Future"
              src="assets/logo-creoleap.png"
              className={`w-[145px] h-auto object-contain block shrink-0 ${isElectra ? 'brightness-[1.14] contrast-[1.05]' : 'brightness-[1.14] contrast-[1.05]'
                }`}
            />
          </div>
 
          {/* Hamburger menu trigger (visible below lg screen size) */}
          <button
            title="Open Menu"
            onClick={() => setMobileMenuOpen(true)}
            className={`min-[1600px]:hidden flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer transition-colors duration-200 shrink-0 border ${isElectra
              ? 'bg-[#27272a]/50 border-[#27272a] text-[#f4f4f5] hover:bg-[#22d3ee]/10 hover:border-[#22d3ee] hover:text-[#22d3ee]'
              : 'bg-[#94c5ff]/18 border-[#94c5ff]/24 text-white hover:bg-[#bfdbfe]/24'
              }`}
          >
            <Menu size={20} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Backdrop overlay for mobile menu drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[999] transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Slide-out mobile menu drawer */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 h-full z-[1000] shadow-2xl flex flex-col gap-6 transition-all duration-300 ease-in-out border-l ${isElectra
            ? 'bg-[#18181b] border-[#27272a] text-[#f4f4f5]'
            : 'bg-[#0b1b42] border-[#bfdbfe]/20 text-white'
          } ${mobileMenuOpen ? 'translate-x-0 visible opacity-100' : 'translate-x-full invisible opacity-0'}`}
        style={{
          width: '290px',
          padding: '24px',
          boxSizing: 'border-box'
        }}
      >
        {/* Drawer Header */}
        <div className={`flex items-center justify-between border-b pb-4 ${isElectra ? 'border-zinc-800' : 'border-white/10'
          }`}>
          <div className="flex items-center gap-2.5">
            <img src="/assets/leaplabicon.ico" alt="LeapLab" className="w-6 h-6 rounded object-contain" />
            <span className="font-sans font-bold text-[18px] tracking-wide">Menu</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${isElectra
                ? 'bg-[#27272a]/50 border-[#27272a] text-[#f4f4f5] hover:bg-[#22d3ee]/10 hover:border-[#22d3ee] hover:text-[#22d3ee]'
                : 'bg-[#94c5ff]/10 border-[#94c5ff]/20 text-white hover:bg-white/10'
              }`}
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* Drawer Body (Scrollable container) */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6">
          {/* File Operations */}
          <div className="flex flex-col gap-0.5">
            <span className={`text-[13px] font-bold uppercase tracking-[0.1em] px-3 mb-1.5 ${isElectra ? 'text-[#a1a1aa] opacity-60' : 'text-[#93c5fd]/80'}`}>
              File
            </span>
            <button
              onClick={() => { onNew?.(); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee]' : 'hover:bg-white/8 text-white/90 hover:text-white'
                }`}
            >
              <FilePlus size={18} strokeWidth={2} className="opacity-80 shrink-0" />
              <span>New Project</span>
            </button>
            <button
              onClick={() => { onOpen?.(); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee]' : 'hover:bg-white/8 text-white/90 hover:text-white'
                }`}
            >
              <FolderOpen size={18} strokeWidth={2} className="opacity-80 shrink-0" />
              <span>Open Project</span>
            </button>
            <button
              onClick={() => { onSaveAs?.(); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee]' : 'hover:bg-white/8 text-white/90 hover:text-white'
                }`}
            >
              <FileText size={18} strokeWidth={2} className="opacity-80 shrink-0" />
              <span>Save As...</span>
            </button>
            <button
              onClick={() => {
                const currentModule = brandName === 'CREOVA' ? 'creova' : 'electra';
                sessionStorage.setItem('landingActiveTab', 'my-projects');
                sessionStorage.setItem('myProjectsSelectedMode', currentModule);
                setMobileMenuOpen(false);
                onBack();
              }}
              className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee]' : 'hover:bg-white/8 text-white/90 hover:text-white'
                }`}
            >
              <FolderOpen size={18} strokeWidth={2} className="opacity-80 shrink-0" />
              <span>My Projects</span>
            </button>
          </div>

          {/* Edit Operations */}
          <div className="flex flex-col gap-0.5">
            <span className={`text-[13px] font-bold uppercase tracking-[0.1em] px-3 mb-1.5 ${isElectra ? 'text-[#a1a1aa] opacity-60' : 'text-[#93c5fd]/80'}`}>
              Edit
            </span>
            <button
              disabled={!canUndo}
              onClick={() => { if (canUndo) { onUndo?.(); setMobileMenuOpen(false); } }}
              className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 ${!canUndo
                  ? 'opacity-35 cursor-not-allowed text-inherit'
                  : isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee] cursor-pointer' : 'hover:bg-white/8 text-white/90 hover:text-white cursor-pointer'
                }`}
            >
              <Undo size={18} strokeWidth={2} className="opacity-80 shrink-0" />
              <span>Undo</span>
            </button>
            <button
              disabled={!canRedo}
              onClick={() => { if (canRedo) { onRedo?.(); setMobileMenuOpen(false); } }}
              className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 ${!canRedo
                  ? 'opacity-35 cursor-not-allowed text-inherit'
                  : isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee] cursor-pointer' : 'hover:bg-white/8 text-white/90 hover:text-white cursor-pointer'
                }`}
            >
              <Redo size={18} strokeWidth={2} className="opacity-80 shrink-0" />
              <span>Redo</span>
            </button>
            <button
              onClick={() => { onCut?.(); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee]' : 'hover:bg-white/8 text-white/90 hover:text-white'
                }`}
            >
              <Scissors size={18} strokeWidth={2} className="opacity-80 shrink-0" />
              <span>Cut</span>
            </button>
            <button
              onClick={() => { onCopy?.(); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee]' : 'hover:bg-white/8 text-white/90 hover:text-white'
                }`}
            >
              <Copy size={18} strokeWidth={2} className="opacity-80 shrink-0" />
              <span>Copy</span>
            </button>
            <button
              onClick={() => { onPaste?.(); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee]' : 'hover:bg-white/8 text-white/90 hover:text-white'
                }`}
            >
              <Clipboard size={18} strokeWidth={2} className="opacity-80 shrink-0" />
              <span>Paste</span>
            </button>
          </div>



          {/* Additional controls */}
          <div className={`flex flex-col gap-0.5 border-t pt-4 ${isElectra ? 'border-zinc-805' : 'border-white/10'
            }`}>
            <button className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee]' : 'hover:bg-white/8 text-white/90 hover:text-white'
              }`}>
              <BookOpen size={18} strokeWidth={2} className="opacity-80 shrink-0" />
              <span>Tutorials</span>
            </button>
            <TopbarShareButton size={18} onSave={onSave} projectName={title}>
              {({ onClick, loading }: { onClick: () => void; loading: boolean }) => (
                <button className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee]' : 'hover:bg-white/8 text-white/90 hover:text-white'
                  }`} onClick={onClick} disabled={loading}>
                  <Share2 size={18} strokeWidth={2} className="opacity-80 shrink-0" />
                  <span>Share project</span>
                </button>
              )}
            </TopbarShareButton>
            <button className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee]' : 'hover:bg-white/8 text-white/90 hover:text-white'
              }`}>
              <MessageSquareWarning size={18} strokeWidth={2} className="opacity-80 shrink-0" />
              <span>Feedback</span>
            </button>
            <button className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee]' : 'hover:bg-white/8 text-white/90 hover:text-white'
              }`}>
              <Trophy size={18} strokeWidth={2} className="opacity-80 shrink-0" />
              <span>Achievements</span>
            </button>
            <button className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee]' : 'hover:bg-white/8 text-white/90 hover:text-white'
              }`}>
              <Settings size={18} strokeWidth={2} className="opacity-80 shrink-0" />
              <span>Settings</span>
            </button>
            <button className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] hover:text-[#22d3ee]' : 'hover:bg-white/8 text-white/90 hover:text-white'
              }`}>
              <CircleHelp size={18} strokeWidth={2} className="opacity-80 shrink-0" />
              <span>Help</span>
            </button>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className={`border-t pt-5 flex flex-col gap-4.5 mobile-drawer-footer ${isElectra ? 'border-zinc-800' : 'border-white/10'
          }`}>
          {rightContent}
          <LeapLabAuthButton variant="dark" size="sm" style={{ height: '40px', borderRadius: '8px', boxSizing: 'border-box', width: '100%', fontSize: '16px', fontWeight: 600 }} />
        </div>
      </div>
    </>
  );
};

export default IgniteTopbar;
