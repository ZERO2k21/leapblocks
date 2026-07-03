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
import LeapLabAuthButton from '../../../../../auth/LeapLabAuthButton';
import TopbarShareButton from '../../../../../components/common/TopbarShareButton';

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
  onSwitchBoard?: (board: string) => void;
  currentBoard?: string;
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
  onSwitchBoard,
  currentBoard,
  isSaving = false
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
            <div className="hidden xl:flex flex-col justify-center ml-2.5 leading-none">
              <span className={`text-[7px] font-black uppercase tracking-[0.18em] font-sans ${isElectra ? 'text-[#a1a1aa]' : 'text-[#93c5fd]'}`}>
                LEAPLAB
              </span>
              <span className={`text-sm font-black tracking-[0.08em] font-sans ${isElectra ? 'text-[#22d3ee]' : 'text-white'}`}>
                {brandName}
              </span>
            </div>
          </div>

          {/* Desktop dropdown menus */}
          <div className="hidden xl:flex items-center gap-3 h-full">
            {/* File Menu */}
            <div ref={fileMenuRef} className="relative">
              <button
                onClick={() => {
                  setFileMenuOpen(!fileMenuOpen);
                  setEditMenuOpen(false);
                  setBoardMenuOpen(false);
                }}
                className={`flex items-center gap-1.25 px-[10px] py-[6px] text-[15px] font-medium font-sans cursor-pointer rounded-[6px] transition-all duration-200 tracking-wide ${isElectra ? 'text-[#f4f4f5]' : 'text-white'
                  } ${fileMenuOpen ? (isElectra ? 'bg-[#22d3ee]/18' : 'bg-white/18') : 'bg-transparent'} ${isElectra ? 'hover:bg-[#22d3ee]/10' : 'hover:bg-white/10'}`}
              >
                File
                <ChevronDown size={12} strokeWidth={2.5} className={`opacity-50 transition-transform duration-200 ${fileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {fileMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    borderRadius: '8px',
                    minWidth: '240px',
                    padding: '4px 0',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}
                  className={`animate-[slideDown_0.15s_ease-out] border backdrop-blur-xl ${isElectra
                      ? 'bg-[#18181b]/95 border-[#27272a] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
                      : 'bg-white/95 border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
                    }`}
                >
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '7px 14px',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '12px',
                      fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                    className={isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'}
                    onClick={() => {
                      onNew?.();
                      setFileMenuOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FilePlus size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
                      <span>New Project</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+N</span>
                  </button>

                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '7px 14px',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '12px',
                      fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                    className={isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'}
                    onClick={() => {
                      onOpen?.();
                      setFileMenuOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FolderOpen size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
                      <span>Open Project</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+O</span>
                  </button>

                  <div className={`h-px my-1 mx-3.5 ${isElectra ? 'bg-white/8' : 'bg-black/8'}`} />

                  {onDownload && (
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '7px 14px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '12px',
                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        fontWeight: 500,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                      className={isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'}
                      onClick={() => {
                        onDownload();
                        setFileMenuOpen(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Download size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
                        <span>Download .leap</span>
                      </div>
                    </button>
                  )}

                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '7px 14px',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '12px',
                      fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                    className={isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'}
                    onClick={() => {
                      onSaveAs?.();
                      setFileMenuOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
                      <span>Save As...</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+Shift+S</span>
                  </button>

                  <div className={`h-px my-1 mx-3.5 ${isElectra ? 'bg-white/8' : 'bg-black/8'}`} />

                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '7px 14px',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '12px',
                      fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                    className={isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'}
                    onClick={() => {
                      const currentModule = brandName === 'CREOVA' ? 'creova' : 'electra';
                      sessionStorage.setItem('landingActiveTab', 'my-projects');
                      sessionStorage.setItem('myProjectsSelectedMode', currentModule);
                      setFileMenuOpen(false);
                      onBack();
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FolderOpen size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
                      <span>My Projects</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div ref={editMenuRef} className="relative">
              <button
                onClick={() => {
                  setEditMenuOpen(!editMenuOpen);
                  setFileMenuOpen(false);
                  setBoardMenuOpen(false);
                }}
                className={`flex items-center gap-1.25 px-[10px] py-[6px] text-[15px] font-medium font-sans cursor-pointer rounded-[6px] transition-all duration-200 tracking-wide ${isElectra ? 'text-[#f4f4f5]' : 'text-white'
                  } ${editMenuOpen ? (isElectra ? 'bg-[#22d3ee]/18' : 'bg-white/18') : 'bg-transparent'} ${isElectra ? 'hover:bg-[#22d3ee]/10' : 'hover:bg-white/10'}`}
              >
                Edit
                <ChevronDown size={12} strokeWidth={2.5} className={`opacity-50 transition-transform duration-200 ${editMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {editMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    borderRadius: '8px',
                    minWidth: '240px',
                    padding: '4px 0',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}
                  className={`animate-[slideDown_0.15s_ease-out] border backdrop-blur-xl ${isElectra
                      ? 'bg-[#18181b]/95 border-[#27272a] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
                      : 'bg-white/95 border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
                    }`}
                >
                  <button
                    disabled={!canUndo}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '7px 14px',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '12px',
                      fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: !canUndo ? 'not-allowed' : 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                    className={!canUndo
                      ? `opacity-40 ${isElectra ? 'text-[#f4f4f5]/40' : 'text-[#374151]/40'}`
                      : isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'
                    }
                    onClick={() => {
                      if (canUndo) {
                        onUndo?.();
                        setEditMenuOpen(false);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Undo size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
                      <span>Undo</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+Z</span>
                  </button>

                  <button
                    disabled={!canRedo}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '7px 14px',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '12px',
                      fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: !canRedo ? 'not-allowed' : 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                    className={!canRedo
                      ? `opacity-40 ${isElectra ? 'text-[#f4f4f5]/40' : 'text-[#374151]/40'}`
                      : isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'
                    }
                    onClick={() => {
                      if (canRedo) {
                        onRedo?.();
                        setEditMenuOpen(false);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Redo size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
                      <span>Redo</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+Y</span>
                  </button>

                  <div className={`h-px my-1 mx-3.5 ${isElectra ? 'bg-white/8' : 'bg-black/8'}`} />

                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '7px 14px',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '12px',
                      fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                    className={isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'}
                    onClick={() => {
                      onCut?.();
                      setEditMenuOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Scissors size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
                      <span>Cut</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+X</span>
                  </button>

                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '7px 14px',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '12px',
                      fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                    className={isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'}
                    onClick={() => {
                      onCopy?.();
                      setEditMenuOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Copy size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
                      <span>Copy</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+C</span>
                  </button>

                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '7px 14px',
                      border: 'none',
                      background: 'transparent',
                      fontSize: '12px',
                      fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                    className={isElectra ? 'text-[#f4f4f5] hover:bg-[#22d3ee]/8' : 'text-[#374151] hover:bg-[#7C3AED]/8'}
                    onClick={() => {
                      onPaste?.();
                      setEditMenuOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Clipboard size={14} strokeWidth={2} className={isElectra ? 'text-[#22d3ee]/80' : 'text-[#7C3AED]/80'} />
                      <span>Paste</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#9CA3AF', background: isElectra ? '#27272a' : '#F3F4F6', padding: '2px 4px', borderRadius: '4px' }}>Ctrl+V</span>
                  </button>
                </div>
              )}
            </div>

            {/* Board Switcher */}
            {onSwitchBoard && currentBoard && (
              <div ref={boardMenuRef} className="relative">
                <button
                  onClick={() => {
                    setBoardMenuOpen(!boardMenuOpen);
                    setFileMenuOpen(false);
                    setEditMenuOpen(false);
                  }}
                  className={`flex items-center gap-1.25 px-[10px] py-[6px] text-[15px] font-medium font-sans cursor-pointer rounded-[6px] transition-all duration-200 tracking-wide ${isElectra ? 'text-[#f4f4f5]' : 'text-white'
                    } ${boardMenuOpen ? (isElectra ? 'bg-[#22d3ee]/18' : 'bg-white/18') : 'bg-transparent'} ${isElectra ? 'hover:bg-[#22d3ee]/10' : 'hover:bg-white/10'}`}
                >
                  <span>{currentBoard === 'esp32-c3' ? 'ESP32-C3' : 'ARDUINO UNO'}</span>
                  <ChevronDown size={12} strokeWidth={2.5} className={`opacity-50 transition-transform duration-200 ${boardMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {boardMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      borderRadius: '8px',
                      minWidth: '240px',
                      padding: '4px 0',
                      zIndex: 1000,
                      overflow: 'hidden'
                    }}
                    className={`animate-[slideDown_0.15s_ease-out] border backdrop-blur-xl ${isElectra
                        ? 'bg-[#18181b]/95 border-[#27272a] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
                        : 'bg-white/95 border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
                      }`}
                  >
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '7px 14px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '12px',
                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        fontWeight: 500,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                      className={currentBoard === 'arduino-uno'
                        ? (isElectra ? 'text-[#22d3ee] font-bold' : 'text-[#2563eb] font-bold')
                        : (isElectra ? 'text-[#f4f4f5]' : 'text-[#374151]')
                      }
                      onClick={() => {
                        if (currentBoard !== 'arduino-uno') {
                          onSwitchBoard('arduino-uno');
                        }
                        setBoardMenuOpen(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`w-2 h-2 rounded-full ${currentBoard === 'arduino-uno' ? 'bg-[#22d3ee]' : 'bg-zinc-600'}`} />
                        <span>Arduino Uno</span>
                      </div>
                      {currentBoard === 'arduino-uno' && (
                        <Check size={14} strokeWidth={2.5} className={isElectra ? 'text-[#22d3ee]' : 'text-[#7C3AED]'} />
                      )}
                    </button>

                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '7px 14px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '12px',
                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        fontWeight: 500,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                      className={currentBoard === 'esp32-c3'
                        ? (isElectra ? 'text-[#22d3ee] font-bold' : 'text-[#2563eb] font-bold')
                        : (isElectra ? 'text-[#f4f4f5]' : 'text-[#374151]')
                      }
                      onClick={() => {
                        if (currentBoard !== 'esp32-c3') {
                          onSwitchBoard('esp32-c3');
                        }
                        setBoardMenuOpen(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`w-2 h-2 rounded-full ${currentBoard === 'esp32-c3' ? 'bg-[#22d3ee]' : 'bg-zinc-600'}`} />
                        <span>ESP32-C3</span>
                      </div>
                      {currentBoard === 'esp32-c3' && (
                        <Check size={14} strokeWidth={2.5} className={isElectra ? 'text-[#22d3ee]' : 'text-[#7C3AED]'} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button className={`flex items-center gap-1.25 px-[10px] py-[6px] text-[15px] font-medium font-sans cursor-pointer rounded-[6px] transition-all duration-200 tracking-wide bg-transparent border-0 ${isElectra ? 'text-[#f4f4f5]' : 'text-white'
              } ${isElectra ? 'hover:bg-[#22d3ee]/10' : 'hover:bg-white/10'}`}>
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
            <span className={`text-[12px] opacity-45 font-bold tracking-[0.01em] hidden xl:inline ${isElectra ? 'text-[#a1a1aa]' : 'text-white'}`}>
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
          <div className={`hidden xl:flex items-center gap-3 pr-4 border-r h-8 shrink-0 ${isElectra ? 'border-[rgba(39,39,42,0.8)]' : 'border-[rgba(191,219,254,0.22)]'
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
              src="/assets/logo - creoleap.png"
              className={`w-[145px] h-auto object-contain block shrink-0 ${isElectra ? 'brightness-[1.14] contrast-[1.05]' : 'brightness-[1.14] contrast-[1.05]'
                }`}
            />
          </div>

          {/* Hamburger menu trigger (visible below lg screen size) */}
          <button
            title="Open Menu"
            onClick={() => setMobileMenuOpen(true)}
            className={`xl:hidden flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer transition-colors duration-200 shrink-0 border ${isElectra
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
        className={`fixed top-0 right-0 h-full w-[290px] z-[1000] p-6 shadow-2xl flex flex-col gap-6 transition-all duration-300 ease-in-out border-l ${isElectra
            ? 'bg-[#18181b] border-[#27272a] text-[#f4f4f5]'
            : 'bg-[#0b1b42] border-[#bfdbfe]/20 text-white'
          } ${mobileMenuOpen ? 'translate-x-0 visible opacity-100' : 'translate-x-full invisible opacity-0'}`}
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

          {/* Board Selector */}
          {onSwitchBoard && currentBoard && (
            <div className="flex flex-col gap-0.5">
              <span className={`text-[13px] font-bold uppercase tracking-[0.1em] px-3 mb-1.5 ${isElectra ? 'text-[#a1a1aa] opacity-60' : 'text-[#93c5fd]/80'}`}>
                Switch Board
              </span>
              <button
                onClick={() => { if (currentBoard !== 'arduino-uno') onSwitchBoard('arduino-uno'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors border-0 cursor-pointer ${currentBoard === 'arduino-uno'
                    ? isElectra ? 'text-[#22d3ee] bg-[#22d3ee]/8' : 'text-[#93c5fd] bg-white/8'
                    : isElectra ? 'text-zinc-400 hover:text-white hover:bg-white/4' : 'text-slate-300 hover:text-white hover:bg-white/8'
                  }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${currentBoard === 'arduino-uno' ? 'bg-[#22d3ee]' : 'bg-zinc-600'}`} />
                <span>Arduino Uno</span>
              </button>
              <button
                onClick={() => { if (currentBoard !== 'esp32-c3') onSwitchBoard('esp32-c3'); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors border-0 cursor-pointer ${currentBoard === 'esp32-c3'
                    ? isElectra ? 'text-[#22d3ee] bg-[#22d3ee]/8' : 'text-[#93c5fd] bg-white/8'
                    : isElectra ? 'text-zinc-400 hover:text-white hover:bg-white/4' : 'text-slate-300 hover:text-white hover:bg-white/8'
                  }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${currentBoard === 'esp32-c3' ? 'bg-[#22d3ee]' : 'bg-zinc-600'}`} />
                <span>ESP32-C3</span>
              </button>
            </div>
          )}

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
