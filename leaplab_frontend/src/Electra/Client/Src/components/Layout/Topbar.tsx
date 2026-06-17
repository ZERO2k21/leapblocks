/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  ChevronDown,
  BookOpen,
  Save,
  MessageSquareWarning,
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
  X
} from 'lucide-react';
import LeapLabAuthButton from '../../../../../auth/LeapLabAuthButton';

interface IgniteTopbarProps {
  onBack: () => void;
  onSave: () => void;
  onSaveAs?: () => void;
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
  onSwitchBoard?: (board: string) => void;
  currentBoard?: string;
}

export const IgniteTopbar: React.FC<IgniteTopbarProps> = ({
  onBack,
  onSave,
  onSaveAs,
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
  onSwitchBoard,
  currentBoard
}) => {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const editMenuRef = useRef<HTMLDivElement>(null);
  const boardMenuRef = useRef<HTMLDivElement>(null);

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
      if (boardMenuRef.current && !boardMenuRef.current.contains(event.target as Node)) {
        setBoardMenuOpen(false);
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
      `}</style>

      <div className={`flex items-center justify-between h-12 px-[18px] z-[100] select-none min-w-0 border-b ${
        isElectra
          ? 'bg-gradient-to-br from-[#09090b] to-[#18181b] border-[#27272a] shadow-[0_2px_12px_rgba(0,0,0,0.4)]'
          : 'bg-gradient-to-br from-[#0b1b42] via-[#0f2f7a] to-[#0a204f] border-[rgba(96,165,250,0.28)] shadow-[0_4px_20px_rgba(8,20,58,0.45),inset_0_-1px_0_rgba(96,165,250,0.12)]'
      }`}>
        {/* Left section */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0 h-full">
          <button
            title="Back to Home"
            onClick={onBack}
            className={`flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors duration-200 shrink-0 border ${
              isElectra
                ? 'bg-[#27272a]/50 border-[#27272a] text-[#f4f4f5] hover:bg-[#22d3ee]/10 hover:border-[#22d3ee] hover:text-[#22d3ee]'
                : 'bg-[#94c5ff]/18 border-[#94c5ff]/24 text-white hover:bg-[#bfdbfe]/24'
            }`}
          >
            <Home size={16} strokeWidth={2.2} />
          </button>

          <div className={`h-5 w-px shrink-0 ${isElectra ? 'bg-[#27272a]/60' : 'bg-[#bfdbfe]/28'}`} />

          <div className={`flex items-center mr-2.5 shrink-0 ${
            isElectra ? '' : 'filter drop-shadow-[0_0_14px_rgba(56,189,248,0.3)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]'
          }`}>
            <img
              alt="LeapLab"
              src="assets/leaplab_logo_transparent.png"
              className="h-9 object-contain"
            />
            <div className="hidden sm:flex flex-col justify-center ml-2.5 leading-none">
              <span className={`text-[7px] font-black uppercase tracking-[0.18em] font-sans ${isElectra ? 'text-[#a1a1aa]' : 'text-[#93c5fd]'}`}>
                LEAPLAB
              </span>
              <span className={`text-sm font-black tracking-[0.08em] font-sans ${isElectra ? 'text-[#22d3ee]' : 'text-white'}`}>
                {brandName}
              </span>
            </div>
          </div>

          {/* Desktop dropdown menus */}
          <div className="hidden lg:flex items-center gap-0.5 h-full">
            {/* File Menu */}
            <div ref={fileMenuRef} className="relative h-full flex items-center">
              <button
                onClick={() => {
                  setFileMenuOpen(!fileMenuOpen);
                  setEditMenuOpen(false);
                  setBoardMenuOpen(false);
                }}
                className={`flex items-center gap-1.25 px-2.5 py-1 text-xs font-semibold font-sans cursor-pointer rounded-full transition-colors duration-200 tracking-wide ${
                  isElectra ? 'text-[#f4f4f5]' : 'text-white'
                } ${fileMenuOpen ? (isElectra ? 'bg-[#22d3ee]/8' : 'bg-white/15') : 'bg-transparent'} hover:bg-white/8`}
              >
                File
                <ChevronDown size={12} strokeWidth={2.5} className="opacity-50" />
              </button>

              {fileMenuOpen && (
                <div className={`absolute top-full left-0 mt-0 rounded-xl min-w-[220px] p-1.5 z-[1000] animate-[slideDown_0.15s_ease-out] border ${
                  isElectra
                    ? 'bg-[#18181b] border-[#27272a] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(39,39,42,1)]'
                    : 'bg-white border-[rgba(148,163,184,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]'
                }`}>
                  <button
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all bg-transparent border-0 w-full text-left text-[13px] font-medium rounded-lg font-sans ${
                      isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#1e293b] hover:bg-[#3b82f6]/8'
                    }`}
                    onClick={() => {
                      onNew?.();
                      setFileMenuOpen(false);
                    }}
                  >
                    <FilePlus size={16} strokeWidth={2} />
                    <span>New Project</span>
                    <span className="ml-auto text-[11px] opacity-50">Ctrl+N</span>
                  </button>

                  <button
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all bg-transparent border-0 w-full text-left text-[13px] font-medium rounded-lg font-sans ${
                      isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#1e293b] hover:bg-[#3b82f6]/8'
                    }`}
                    onClick={() => {
                      onOpen?.();
                      setFileMenuOpen(false);
                    }}
                  >
                    <FolderOpen size={16} strokeWidth={2} />
                    <span>Open Project</span>
                    <span className="ml-auto text-[11px] opacity-50">Ctrl+O</span>
                  </button>

                  <div className={`h-px my-1.5 ${isElectra ? 'bg-[#27272a]/60' : 'bg-[rgba(148,163,184,0.2)]'}`} />

                  <button
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all bg-transparent border-0 w-full text-left text-[13px] font-medium rounded-lg font-sans ${
                      isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#1e293b] hover:bg-[#3b82f6]/8'
                    }`}
                    onClick={() => {
                      onSave();
                      setFileMenuOpen(false);
                    }}
                  >
                    <Save size={16} strokeWidth={2} />
                    <span>Save</span>
                    <span className="ml-auto text-[11px] opacity-50">Ctrl+S</span>
                  </button>

                  <button
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all bg-transparent border-0 w-full text-left text-[13px] font-medium rounded-lg font-sans ${
                      isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#1e293b] hover:bg-[#3b82f6]/8'
                    }`}
                    onClick={() => {
                      onSaveAs?.();
                      setFileMenuOpen(false);
                    }}
                  >
                    <FileText size={16} strokeWidth={2} />
                    <span>Save As...</span>
                    <span className="ml-auto text-[11px] opacity-50">Ctrl+Shift+S</span>
                  </button>
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div ref={editMenuRef} className="relative h-full flex items-center">
              <button
                onClick={() => {
                  setEditMenuOpen(!editMenuOpen);
                  setFileMenuOpen(false);
                  setBoardMenuOpen(false);
                }}
                className={`flex items-center gap-1.25 px-2.5 py-1 text-xs font-semibold font-sans cursor-pointer rounded-full transition-colors duration-200 tracking-wide ${
                  isElectra ? 'text-[#f4f4f5]' : 'text-white'
                } ${editMenuOpen ? (isElectra ? 'bg-[#22d3ee]/8' : 'bg-white/15') : 'bg-transparent'} hover:bg-white/8`}
              >
                Edit
                <ChevronDown size={12} strokeWidth={2.5} className="opacity-50" />
              </button>

              {editMenuOpen && (
                <div className={`absolute top-full left-0 mt-0 rounded-xl min-w-[220px] p-1.5 z-[1000] animate-[slideDown_0.15s_ease-out] border ${
                  isElectra
                    ? 'bg-[#18181b] border-[#27272a] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(39,39,42,1)]'
                    : 'bg-white border-[rgba(148,163,184,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]'
                }`}>
                  <button
                    disabled={!canUndo}
                    className={`flex items-center gap-3 px-4 py-2.5 border-0 w-full text-left text-[13px] font-medium rounded-lg font-sans ${
                      !canUndo
                        ? `opacity-40 cursor-not-allowed ${isElectra ? 'text-[#f4f4f5]/40' : 'text-[#1e293b]/40'}`
                        : isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8 cursor-pointer' : 'text-[#1e293b] hover:bg-[#3b82f6]/8 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (canUndo) {
                        onUndo?.();
                        setEditMenuOpen(false);
                      }
                    }}
                  >
                    <Undo size={16} strokeWidth={2} />
                    <span>Undo</span>
                    <span className="ml-auto text-[11px] opacity-50">Ctrl+Z</span>
                  </button>

                  <button
                    disabled={!canRedo}
                    className={`flex items-center gap-3 px-4 py-2.5 border-0 w-full text-left text-[13px] font-medium rounded-lg font-sans ${
                      !canRedo
                        ? `opacity-40 cursor-not-allowed ${isElectra ? 'text-[#f4f4f5]/40' : 'text-[#1e293b]/40'}`
                        : isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8 cursor-pointer' : 'text-[#1e293b] hover:bg-[#3b82f6]/8 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (canRedo) {
                        onRedo?.();
                        setEditMenuOpen(false);
                      }
                    }}
                  >
                    <Redo size={16} strokeWidth={2} />
                    <span>Redo</span>
                    <span className="ml-auto text-[11px] opacity-50">Ctrl+Y</span>
                  </button>

                  <div className={`h-px my-1.5 ${isElectra ? 'bg-[#27272a]/60' : 'bg-[rgba(148,163,184,0.2)]'}`} />

                  <button
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all bg-transparent border-0 w-full text-left text-[13px] font-medium rounded-lg font-sans ${
                      isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#1e293b] hover:bg-[#3b82f6]/8'
                    }`}
                    onClick={() => {
                      onCut?.();
                      setEditMenuOpen(false);
                    }}
                  >
                    <Scissors size={16} strokeWidth={2} />
                    <span>Cut</span>
                    <span className="ml-auto text-[11px] opacity-50">Ctrl+X</span>
                  </button>

                  <button
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all bg-transparent border-0 w-full text-left text-[13px] font-medium rounded-lg font-sans ${
                      isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#1e293b] hover:bg-[#3b82f6]/8'
                    }`}
                    onClick={() => {
                      onCopy?.();
                      setEditMenuOpen(false);
                    }}
                  >
                    <Copy size={16} strokeWidth={2} />
                    <span>Copy</span>
                    <span className="ml-auto text-[11px] opacity-50">Ctrl+C</span>
                  </button>

                  <button
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all bg-transparent border-0 w-full text-left text-[13px] font-medium rounded-lg font-sans ${
                      isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#1e293b] hover:bg-[#3b82f6]/8'
                    }`}
                    onClick={() => {
                      onPaste?.();
                      setEditMenuOpen(false);
                    }}
                  >
                    <Clipboard size={16} strokeWidth={2} />
                    <span>Paste</span>
                    <span className="ml-auto text-[11px] opacity-50">Ctrl+V</span>
                  </button>
                </div>
              )}
            </div>

            {/* Board Switcher */}
            {onSwitchBoard && currentBoard && (
              <div ref={boardMenuRef} className="relative h-full flex items-center">
                <button
                  onClick={() => {
                    setBoardMenuOpen(!boardMenuOpen);
                    setFileMenuOpen(false);
                    setEditMenuOpen(false);
                  }}
                  className={`flex items-center gap-1.25 px-2.5 py-1 text-xs font-semibold font-sans cursor-pointer rounded-full transition-colors duration-200 tracking-wide ${
                    isElectra ? 'text-[#f4f4f5]' : 'text-white'
                  } ${boardMenuOpen ? (isElectra ? 'bg-[#22d3ee]/8' : 'bg-white/15') : 'bg-transparent'} hover:bg-white/8`}
                >
                  <span>{currentBoard === 'esp32-c3' ? 'ESP32-C3' : 'ARDUINO UNO'}</span>
                  <ChevronDown size={12} strokeWidth={2.5} className="opacity-50" />
                </button>

                {boardMenuOpen && (
                  <div className={`absolute top-full left-0 mt-0 rounded-xl min-w-[220px] p-1.5 z-[1000] animate-[slideDown_0.15s_ease-out] border ${
                    isElectra
                      ? 'bg-[#18181b] border-[#27272a] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(39,39,42,1)]'
                      : 'bg-white border-[rgba(148,163,184,0.2)] shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]'
                  }`}>
                    <button
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all bg-transparent border-0 w-full text-left text-[13px] font-medium rounded-lg font-sans ${
                        currentBoard === 'arduino-uno'
                          ? isElectra ? 'text-[#22d3ee] font-bold' : 'text-[#2563eb] font-bold'
                          : isElectra ? 'text-[#f4f4f5]' : 'text-[#1e293b]'
                      } ${isElectra ? 'hover:bg-[#22d3ee]/8' : 'hover:bg-[#3b82f6]/8'}`}
                      onClick={() => {
                        if (currentBoard !== 'arduino-uno') {
                          onSwitchBoard('arduino-uno');
                        }
                        setBoardMenuOpen(false);
                      }}
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        currentBoard === 'arduino-uno' ? 'bg-[#22d3ee]' : 'bg-zinc-600'
                      }`} />
                      <span>Arduino Uno</span>
                      {currentBoard === 'arduino-uno' && (
                        <Check size={14} strokeWidth={2.5} className="ml-auto opacity-80" />
                      )}
                    </button>

                    <button
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all bg-transparent border-0 w-full text-left text-[13px] font-medium rounded-lg font-sans ${
                        currentBoard === 'esp32-c3'
                          ? isElectra ? 'text-[#22d3ee] font-bold' : 'text-[#2563eb] font-bold'
                          : isElectra ? 'text-[#f4f4f5]' : 'text-[#1e293b]'
                      } ${isElectra ? 'hover:bg-[#22d3ee]/8' : 'hover:bg-[#3b82f6]/8'}`}
                      onClick={() => {
                        if (currentBoard !== 'esp32-c3') {
                          onSwitchBoard('esp32-c3');
                        }
                        setBoardMenuOpen(false);
                      }}
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        currentBoard === 'esp32-c3' ? 'bg-[#22d3ee]' : 'bg-zinc-600'
                      }`} />
                      <span>ESP32-C3</span>
                      {currentBoard === 'esp32-c3' && (
                        <Check size={14} strokeWidth={2.5} className="ml-auto opacity-80" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button className={`flex items-center gap-1.25 px-2.5 py-1 text-xs font-semibold font-sans cursor-pointer rounded-full transition-colors duration-200 tracking-wide bg-transparent border-0 ${
              isElectra ? 'text-[#f4f4f5]' : 'text-white'
            } hover:bg-white/8`}>
              <BookOpen size={14} strokeWidth={2.2} className={isElectra ? 'opacity-70' : 'opacity-90'} />
              Tutorials
              <ChevronDown size={12} strokeWidth={2.5} className="opacity-50" />
            </button>
          </div>
        </div>

        {/* Center section */}
        <div className="flex items-center justify-center gap-4 px-4 flex-0-auto min-w-0 overflow-visible">
          <div className="hidden md:flex items-center gap-4">{centerContent}</div>

          <div className={`flex items-center h-8 rounded-full pl-3 pr-[3px] border gap-1.5 transition-all duration-200 ${
            isElectra ? 'bg-[#27272a]/50 border-[#27272a]' : 'bg-[#08143a]/55 border-[#93c5fd]/20'
          }`}>
            <span className={`text-[12px] opacity-45 font-bold tracking-[0.01em] hidden md:inline ${isElectra ? 'text-[#a1a1aa]' : 'text-white'}`}>
              Folder
            </span>
            <input
              placeholder="My Project"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className={`bg-transparent border-0 text-xs font-bold font-sans w-20 md:w-[120px] text-center outline-none tracking-wide min-w-0 ${
                isElectra ? 'text-[#f4f4f5]' : 'text-white'
              }`}
            />
            <button
              title="Save Project"
              onClick={onSave}
              className={`border-0 rounded-full w-[26px] h-[26px] flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0 scale-100 hover:scale-[1.08] hover:brightness-[1.08] ${
                isElectra
                  ? 'bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] text-black shadow-[0_4px_10px_-1px_rgba(34,211,238,0.4)]'
                  : 'bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] text-white shadow-[0_4px_10px_-1px_rgba(8,47,123,0.45)]'
              }`}
            >
              <Save size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
          {/* Quick actions - Desktop only */}
          <div className={`hidden lg:flex items-center gap-2 pr-2 border-r h-5 shrink-0 ${
            isElectra ? 'border-[rgba(39,39,42,0.8)]' : 'border-[rgba(191,219,254,0.22)]'
          }`}>
            <button title="Feedback" className={`bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 flex items-center ${isElectra ? 'text-[#a1a1aa] hover:text-[#22d3ee]' : 'text-[rgba(191,219,254,0.85)] hover:text-white'}`}><MessageSquareWarning size={16} strokeWidth={2.2} /></button>
            <button title="Achievements" className={`bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 flex items-center ${isElectra ? 'text-[#a1a1aa] hover:text-[#22d3ee]' : 'text-[rgba(191,219,254,0.85)] hover:text-white'}`}><Trophy size={16} strokeWidth={2.2} /></button>
            <button title="Settings" className={`bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 flex items-center ${isElectra ? 'text-[#a1a1aa] hover:text-[#22d3ee]' : 'text-[rgba(191,219,254,0.85)] hover:text-white'}`}><Settings size={16} strokeWidth={2.2} /></button>
            <button title="Help" className={`bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 flex items-center ${isElectra ? 'text-[#a1a1aa] hover:text-[#22d3ee]' : 'text-[rgba(191,219,254,0.85)] hover:text-white'}`}><CircleHelp size={16} strokeWidth={2.2} /></button>
          </div>

          <div className="hidden sm:flex sm:items-center sm:gap-4 shrink-0">
            {rightContent}
            <LeapLabAuthButton variant="dark" size="sm" style={{ height: '32px', borderRadius: '16px', boxSizing: 'border-box' }} />
          </div>

          {/* Creoleap brand logo (large desktop only) */}
          <div className={`hidden min-[1400px]:flex ml-2 items-center shrink-0 h-11 overflow-hidden ${
            isElectra ? '' : 'filter drop-shadow-[0_0_20px_rgba(167,139,250,0.7)] drop-shadow-[0_0_8px_rgba(255,255,255,0.25)] drop-shadow-[0_3px_10px_rgba(0,0,0,0.5)]'
          }`}>
            <img
              alt="Leap into the AI Future"
              src="assets/Copy of CREOLEAP LOGO LEAP INTO THE AI FUTURE Final.svg"
              className={`w-[95px] h-auto object-contain block shrink-0 ${
                isElectra ? 'brightness-[1.14] contrast-[1.05]' : 'brightness-[1.14] contrast-[1.05]'
              }`}
            />
          </div>

          {/* Hamburger menu trigger (visible below lg screen size) */}
          <button
            title="Open Menu"
            onClick={() => setMobileMenuOpen(true)}
            className={`lg:hidden flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors duration-200 shrink-0 border ${
              isElectra
                ? 'bg-[#27272a]/50 border-[#27272a] text-[#f4f4f5] hover:bg-[#22d3ee]/10 hover:border-[#22d3ee] hover:text-[#22d3ee]'
                : 'bg-[#94c5ff]/18 border-[#94c5ff]/24 text-white hover:bg-[#bfdbfe]/24'
            }`}
          >
            <Menu size={18} strokeWidth={2.2} />
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
        className={`fixed top-0 right-0 h-full w-[290px] z-[1000] p-6 shadow-2xl flex flex-col gap-6 transition-all duration-300 ease-in-out border-l ${
          isElectra
            ? 'bg-[#18181b] border-[#27272a] text-[#f4f4f5]'
            : 'bg-[#0b1b42] border-[#bfdbfe]/20 text-white'
        } ${mobileMenuOpen ? 'translate-x-0 visible opacity-100' : 'translate-x-full invisible opacity-0'}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b pb-4 border-zinc-800">
          <div className="flex items-center gap-2">
            <img src="/assets/leaplabicon.ico" alt="LeapLab" className="w-6 h-6 rounded" />
            <span className="font-sans font-black text-sm tracking-wide">Menu</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className={`w-7 h-7 flex items-center justify-center rounded-full border transition-colors ${
              isElectra
                ? 'bg-[#27272a]/50 border-[#27272a] text-[#f4f4f5] hover:bg-[#22d3ee]/10 hover:border-[#22d3ee] hover:text-[#22d3ee]'
                : 'bg-[#94c5ff]/10 border-[#94c5ff]/20 text-white hover:bg-white/10'
            }`}
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* Drawer Body (Scrollable container) */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5">
          {/* File Operations */}
          <div className="flex flex-col gap-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isElectra ? 'text-[#a1a1aa]' : 'text-[#93c5fd]/70'}`}>
              File
            </span>
            <button
              onClick={() => { onNew?.(); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${
                isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5]' : 'hover:bg-white/8 text-white'
              }`}
            >
              <FilePlus size={15} />
              <span>New Project</span>
            </button>
            <button
              onClick={() => { onOpen?.(); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${
                isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5]' : 'hover:bg-white/8 text-white'
              }`}
            >
              <FolderOpen size={15} />
              <span>Open Project</span>
            </button>
            <button
              onClick={() => { onSave(); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${
                isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5]' : 'hover:bg-white/8 text-white'
              }`}
            >
              <Save size={15} />
              <span>Save</span>
            </button>
            <button
              onClick={() => { onSaveAs?.(); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${
                isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5]' : 'hover:bg-white/8 text-white'
              }`}
            >
              <FileText size={15} />
              <span>Save As...</span>
            </button>
          </div>

          {/* Edit Operations */}
          <div className="flex flex-col gap-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isElectra ? 'text-[#a1a1aa]' : 'text-[#93c5fd]/70'}`}>
              Edit
            </span>
            <button
              disabled={!canUndo}
              onClick={() => { if (canUndo) { onUndo?.(); setMobileMenuOpen(false); } }}
              className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors bg-transparent border-0 ${
                !canUndo
                  ? 'opacity-40 cursor-not-allowed text-inherit'
                  : isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] cursor-pointer' : 'hover:bg-white/8 text-white cursor-pointer'
              }`}
            >
              <Undo size={15} />
              <span>Undo</span>
            </button>
            <button
              disabled={!canRedo}
              onClick={() => { if (canRedo) { onRedo?.(); setMobileMenuOpen(false); } }}
              className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors bg-transparent border-0 ${
                !canRedo
                  ? 'opacity-40 cursor-not-allowed text-inherit'
                  : isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5] cursor-pointer' : 'hover:bg-white/8 text-white cursor-pointer'
              }`}
            >
              <Redo size={15} />
              <span>Redo</span>
            </button>
            <button
              onClick={() => { onCut?.(); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${
                isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5]' : 'hover:bg-white/8 text-white'
              }`}
            >
              <Scissors size={15} />
              <span>Cut</span>
            </button>
            <button
              onClick={() => { onCopy?.(); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${
                isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5]' : 'hover:bg-white/8 text-white'
              }`}
            >
              <Copy size={15} />
              <span>Copy</span>
            </button>
            <button
              onClick={() => { onPaste?.(); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${
                isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5]' : 'hover:bg-white/8 text-white'
              }`}
            >
              <Clipboard size={15} />
              <span>Paste</span>
            </button>
          </div>

          {/* Board Selector */}
          {onSwitchBoard && currentBoard && (
            <div className="flex flex-col gap-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isElectra ? 'text-[#a1a1aa]' : 'text-[#93c5fd]/70'}`}>
                Switch Board
              </span>
              <button
                onClick={() => { if (currentBoard !== 'arduino-uno') onSwitchBoard('arduino-uno'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors border-0 cursor-pointer ${
                  currentBoard === 'arduino-uno'
                    ? isElectra ? 'text-[#22d3ee] bg-[#22d3ee]/8' : 'text-[#93c5fd] bg-white/8'
                    : 'text-zinc-400 hover:text-white hover:bg-white/4'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${currentBoard === 'arduino-uno' ? 'bg-[#22d3ee]' : 'bg-zinc-600'}`} />
                <span>Arduino Uno</span>
              </button>
              <button
                onClick={() => { if (currentBoard !== 'esp32-c3') onSwitchBoard('esp32-c3'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors border-0 cursor-pointer ${
                  currentBoard === 'esp32-c3'
                    ? isElectra ? 'text-[#22d3ee] bg-[#22d3ee]/8' : 'text-[#93c5fd] bg-white/8'
                    : 'text-zinc-400 hover:text-white hover:bg-white/4'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${currentBoard === 'esp32-c3' ? 'bg-[#22d3ee]' : 'bg-zinc-600'}`} />
                <span>ESP32-C3</span>
              </button>
            </div>
          )}

          {/* Additional controls */}
          <div className="flex flex-col gap-1.5 border-t border-zinc-800 pt-4">
            <button className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${
              isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5]' : 'hover:bg-white/8 text-white'
            }`}>
              <BookOpen size={15} />
              <span>Tutorials</span>
            </button>
            <button className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${
              isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5]' : 'hover:bg-white/8 text-white'
            }`}>
              <MessageSquareWarning size={15} />
              <span>Feedback</span>
            </button>
            <button className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${
              isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5]' : 'hover:bg-white/8 text-white'
            }`}>
              <Trophy size={15} />
              <span>Achievements</span>
            </button>
            <button className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${
              isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5]' : 'hover:bg-white/8 text-white'
            }`}>
              <Settings size={15} />
              <span>Settings</span>
            </button>
            <button className={`flex items-center gap-3 w-full py-2 px-3 text-xs font-semibold rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer ${
              isElectra ? 'hover:bg-[#22d3ee]/8 text-[#f4f4f5]' : 'hover:bg-white/8 text-white'
            }`}>
              <CircleHelp size={15} />
              <span>Help</span>
            </button>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-zinc-800 pt-4 flex flex-col gap-2">
          {rightContent}
          <LeapLabAuthButton variant="dark" size="sm" style={{ height: '32px', borderRadius: '16px', boxSizing: 'border-box', width: '100%' }} />
        </div>
      </div>
    </>
  );
};

export default IgniteTopbar;
