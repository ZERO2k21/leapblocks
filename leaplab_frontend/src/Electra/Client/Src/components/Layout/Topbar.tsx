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
  Check
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

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const isDesktop = windowWidth >= 1024;
  const isLargeDesktop = windowWidth >= 1400;
  const isMobile = windowWidth < 768;

  const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    color: isElectra ? '#f4f4f5' : '#1e293b',
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: '"Segoe UI", Inter, sans-serif',
    borderRadius: '8px'
  };

  const menuItemDisabledStyle: React.CSSProperties = {
    ...menuItemStyle,
    opacity: 0.4,
    cursor: 'not-allowed'
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '4px',
    background: isElectra ? '#18181b' : '#ffffff',
    borderRadius: '12px',
    boxShadow: isElectra
      ? '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(39, 39, 42, 1)'
      : '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
    border: isElectra ? '1px solid #27272a' : '1px solid rgba(148, 163, 184, 0.2)',
    minWidth: '220px',
    padding: '6px',
    zIndex: 1000,
    animation: 'slideDown 0.15s ease-out'
  };

  const topbarBg = isElectra
    ? 'linear-gradient(135deg, #09090b 0%, #18181b 100%)'
    : 'linear-gradient(135deg, #0b1b42 0%, #0f2f7a 55%, #0a204f 100%)';

  const topbarBorder = isElectra
    ? '1px solid #27272a'
    : '1px solid rgba(96, 165, 250, 0.28)';

  const topbarShadow = isElectra
    ? '0 2px 12px rgba(0,0,0,0.4)'
    : 'rgba(8, 20, 58, 0.45) 0px 4px 20px, rgba(96, 165, 250, 0.12) 0px -1px 0px inset';

  // Electra-specific colors
  const ec = {
    text: '#f4f4f5',
    muted: '#a1a1aa',
    accent: '#22d3ee',
    border: 'rgba(39, 39, 42, 0.8)',
    surface: 'rgba(24, 24, 27, 0.6)',
    divider: 'rgba(39, 39, 42, 0.6)',
    icon: 'rgba(161, 161, 170, 0.85)',
    hover: 'rgba(34, 211, 238, 0.08)',
  };

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

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '48px',
        padding: '0px 18px',
        background: topbarBg,
        boxShadow: topbarShadow,
        zIndex: 100,
        borderBottom: topbarBorder,
        userSelect: 'none',
        minWidth: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 0%', minWidth: '0px' }}>
          <button
            title="Back to Home"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: isElectra ? 'rgba(39, 39, 42, 0.5)' : 'rgba(148, 197, 255, 0.18)',
              border: isElectra ? '1px solid #27272a' : '1px solid rgba(148, 197, 255, 0.24)',
              borderRadius: '8px',
              color: isElectra ? ec.text : 'rgb(255, 255, 255)',
              cursor: 'pointer',
              transition: '0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => { if (isElectra) { e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)'; e.currentTarget.style.borderColor = ec.accent; e.currentTarget.style.color = ec.accent; } else { e.currentTarget.style.background = 'rgba(191, 219, 254, 0.24)'; } }}
            onMouseLeave={(e) => { if (isElectra) { e.currentTarget.style.background = 'rgba(39, 39, 42, 0.5)'; e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = ec.text; } else { e.currentTarget.style.background = 'rgba(148, 197, 255, 0.18)'; } }}
          >
            <Home size={16} strokeWidth={2.2} />
          </button>

          <div style={{ height: '20px', width: '1px', background: isElectra ? ec.divider : 'rgba(191, 219, 254, 0.28)', flexShrink: 0 }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginRight: '10px',
            flexShrink: 0,
            filter: isElectra ? 'none' : 'drop-shadow(rgba(56, 189, 248, 0.3) 0px 0px 14px) drop-shadow(rgba(0, 0, 0, 0.3) 0px 2px 6px)'
          }}>
            <img
              alt="LeapLab"
              src="assets/leaplab_logo_transparent.png"
              style={{ height: '36px', objectFit: 'contain' }}
            />
            {!isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: '8px', lineHeight: '1.1' }}>
                <span style={{ color: isElectra ? ec.muted : 'rgb(147, 197, 253)', fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', fontFamily: '"Segoe UI", Inter, sans-serif' }}>
                  LEAPLAB
                </span>
                <span style={{ color: isElectra ? ec.accent : 'rgb(255, 255, 255)', fontSize: '13px', fontWeight: 900, letterSpacing: '0.08em', fontFamily: '"Segoe UI", Inter, sans-serif' }}>
                  {brandName}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {/* File Menu */}
            <div ref={fileMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setFileMenuOpen(!fileMenuOpen);
                  setEditMenuOpen(false);
                  setBoardMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  border: 'none',
                  color: isElectra ? ec.text : 'rgb(255, 255, 255)',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: '"Segoe UI", Inter, sans-serif',
                  cursor: 'pointer',
                  borderRadius: '20px',
                  transition: '0.2s',
                  background: fileMenuOpen ? (isElectra ? 'rgba(34, 211, 238, 0.08)' : 'rgba(255, 255, 255, 0.15)') : 'transparent',
                  letterSpacing: '0.02em'
                }}
                onMouseEnter={(e) => !fileMenuOpen && (e.currentTarget.style.background = isElectra ? 'rgba(39, 39, 42, 0.6)' : 'rgba(255, 255, 255, 0.08)')}
                onMouseLeave={(e) => !fileMenuOpen && (e.currentTarget.style.background = 'transparent')}
              >
                File
                <ChevronDown size={12} strokeWidth={2.5} style={{ opacity: 0.5 }} />
              </button>

              {fileMenuOpen && (
                <div style={dropdownStyle}>
                  <button
                    style={menuItemStyle}
                    onClick={() => {
                      onNew?.();
                      setFileMenuOpen(false);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isElectra ? ec.hover : 'rgba(59, 130, 246, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <FilePlus size={16} strokeWidth={2} />
                    <span>New Project</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.5 }}>Ctrl+N</span>
                  </button>

                  <button
                    style={menuItemStyle}
                    onClick={() => {
                      onOpen?.();
                      setFileMenuOpen(false);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isElectra ? ec.hover : 'rgba(59, 130, 246, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <FolderOpen size={16} strokeWidth={2} />
                    <span>Open Project</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.5 }}>Ctrl+O</span>
                  </button>

                  <div style={{ height: '1px', background: isElectra ? ec.divider : 'rgba(148, 163, 184, 0.2)', margin: '6px 0' }} />

                  <button
                    style={menuItemStyle}
                    onClick={() => {
                      onSave();
                      setFileMenuOpen(false);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isElectra ? ec.hover : 'rgba(59, 130, 246, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Save size={16} strokeWidth={2} />
                    <span>Save</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.5 }}>Ctrl+S</span>
                  </button>

                  <button
                    style={menuItemStyle}
                    onClick={() => {
                      onSaveAs?.();
                      setFileMenuOpen(false);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isElectra ? ec.hover : 'rgba(59, 130, 246, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <FileText size={16} strokeWidth={2} />
                    <span>Save As...</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.5 }}>Ctrl+Shift+S</span>
                  </button>
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div ref={editMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setEditMenuOpen(!editMenuOpen);
                  setFileMenuOpen(false);
                  setBoardMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  border: 'none',
                  color: isElectra ? ec.text : 'rgb(255, 255, 255)',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: '"Segoe UI", Inter, sans-serif',
                  cursor: 'pointer',
                  borderRadius: '20px',
                  transition: '0.2s',
                  background: editMenuOpen ? (isElectra ? 'rgba(34, 211, 238, 0.08)' : 'rgba(255, 255, 255, 0.15)') : 'transparent',
                  letterSpacing: '0.02em'
                }}
                onMouseEnter={(e) => !editMenuOpen && (e.currentTarget.style.background = isElectra ? 'rgba(39, 39, 42, 0.6)' : 'rgba(255, 255, 255, 0.08)')}
                onMouseLeave={(e) => !editMenuOpen && (e.currentTarget.style.background = 'transparent')}
              >
                Edit
                <ChevronDown size={12} strokeWidth={2.5} style={{ opacity: 0.5 }} />
              </button>

              {editMenuOpen && (
                <div style={dropdownStyle}>
                  <button
                    style={canUndo ? menuItemStyle : menuItemDisabledStyle}
                    disabled={!canUndo}
                    onClick={() => {
                      if (canUndo) {
                        onUndo?.();
                        setEditMenuOpen(false);
                      }
                    }}
                    onMouseEnter={(e) => canUndo && (e.currentTarget.style.background = isElectra ? ec.hover : 'rgba(59, 130, 246, 0.08)')}
                    onMouseLeave={(e) => canUndo && (e.currentTarget.style.background = 'transparent')}
                  >
                    <Undo size={16} strokeWidth={2} />
                    <span>Undo</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.5 }}>Ctrl+Z</span>
                  </button>

                  <button
                    style={canRedo ? menuItemStyle : menuItemDisabledStyle}
                    disabled={!canRedo}
                    onClick={() => {
                      if (canRedo) {
                        onRedo?.();
                        setEditMenuOpen(false);
                      }
                    }}
                    onMouseEnter={(e) => canRedo && (e.currentTarget.style.background = isElectra ? ec.hover : 'rgba(59, 130, 246, 0.08)')}
                    onMouseLeave={(e) => canRedo && (e.currentTarget.style.background = 'transparent')}
                  >
                    <Redo size={16} strokeWidth={2} />
                    <span>Redo</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.5 }}>Ctrl+Y</span>
                  </button>

                  <div style={{ height: '1px', background: isElectra ? ec.divider : 'rgba(148, 163, 184, 0.2)', margin: '6px 0' }} />

                  <button
                    style={menuItemStyle}
                    onClick={() => {
                      onCut?.();
                      setEditMenuOpen(false);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isElectra ? ec.hover : 'rgba(59, 130, 246, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Scissors size={16} strokeWidth={2} />
                    <span>Cut</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.5 }}>Ctrl+X</span>
                  </button>

                  <button
                    style={menuItemStyle}
                    onClick={() => {
                      onCopy?.();
                      setEditMenuOpen(false);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isElectra ? ec.hover : 'rgba(59, 130, 246, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Copy size={16} strokeWidth={2} />
                    <span>Copy</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.5 }}>Ctrl+C</span>
                  </button>

                  <button
                    style={menuItemStyle}
                    onClick={() => {
                      onPaste?.();
                      setEditMenuOpen(false);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isElectra ? ec.hover : 'rgba(59, 130, 246, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Clipboard size={16} strokeWidth={2} />
                    <span>Paste</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.5 }}>Ctrl+V</span>
                  </button>
                </div>
              )}
            </div>

            {!isMobile && onSwitchBoard && currentBoard && (
              <div ref={boardMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    setBoardMenuOpen(!boardMenuOpen);
                    setFileMenuOpen(false);
                    setEditMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    border: 'none',
                    color: isElectra ? ec.text : 'rgb(255, 255, 255)',
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: '"Segoe UI", Inter, sans-serif',
                    cursor: 'pointer',
                    borderRadius: '20px',
                    transition: '0.2s',
                    background: boardMenuOpen ? (isElectra ? 'rgba(34, 211, 238, 0.08)' : 'rgba(255, 255, 255, 0.15)') : 'transparent',
                    letterSpacing: '0.02em'
                  }}
                  onMouseEnter={(e) => !boardMenuOpen && (e.currentTarget.style.background = isElectra ? 'rgba(39, 39, 42, 0.6)' : 'rgba(255, 255, 255, 0.08)')}
                  onMouseLeave={(e) => !boardMenuOpen && (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ color: isElectra ? ec.text : 'rgb(255, 255, 255)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.02em' }}>
                    {currentBoard === 'esp32-c3' ? 'ESP32-C3' : 'ARDUINO UNO'}
                  </span>
                  <ChevronDown size={12} strokeWidth={2.5} style={{ opacity: 0.5 }} />
                </button>

                {boardMenuOpen && (
                  <div style={dropdownStyle}>
                    <button
                      style={{
                        ...menuItemStyle,
                        color: currentBoard === 'arduino-uno' ? (isElectra ? ec.accent : '#2563eb') : menuItemStyle.color,
                        fontWeight: currentBoard === 'arduino-uno' ? 700 : 500
                      }}
                      onClick={() => {
                        if (currentBoard !== 'arduino-uno') {
                          onSwitchBoard('arduino-uno');
                        }
                        setBoardMenuOpen(false);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isElectra ? ec.hover : 'rgba(59, 130, 246, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: currentBoard === 'arduino-uno' ? '#22d3ee' : isElectra ? 'rgba(161, 161, 170, 0.3)' : 'rgba(148, 163, 184, 0.3)',
                        flexShrink: 0
                      }} />
                      <span>Arduino Uno</span>
                      {currentBoard === 'arduino-uno' && (
                        <Check size={14} strokeWidth={2.5} style={{ marginLeft: 'auto', opacity: 0.8 }} />
                      )}
                    </button>

                    <button
                      style={{
                        ...menuItemStyle,
                        color: currentBoard === 'esp32-c3' ? (isElectra ? ec.accent : '#2563eb') : menuItemStyle.color,
                        fontWeight: currentBoard === 'esp32-c3' ? 700 : 500
                      }}
                      onClick={() => {
                        if (currentBoard !== 'esp32-c3') {
                          onSwitchBoard('esp32-c3');
                        }
                        setBoardMenuOpen(false);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isElectra ? ec.hover : 'rgba(59, 130, 246, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: currentBoard === 'esp32-c3' ? '#22d3ee' : isElectra ? 'rgba(161, 161, 170, 0.3)' : 'rgba(148, 163, 184, 0.3)',
                        flexShrink: 0
                      }} />
                      <span>ESP32-C3</span>
                      {currentBoard === 'esp32-c3' && (
                        <Check size={14} strokeWidth={2.5} style={{ marginLeft: 'auto', opacity: 0.8 }} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {isDesktop && (
              <div style={{ position: 'relative' }}>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  border: 'none',
                  color: isElectra ? ec.text : 'rgb(255, 255, 255)',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: '"Segoe UI", Inter, sans-serif',
                  cursor: 'pointer',
                  borderRadius: '20px',
                  transition: '0.2s',
                  background: 'transparent',
                  letterSpacing: '0.02em'
                }}>
                  <BookOpen size={14} strokeWidth={2.2} style={{ opacity: isElectra ? 0.7 : 0.9 }} />
                  Tutorials
                  <ChevronDown size={12} strokeWidth={2.5} style={{ opacity: 0.5 }} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '0px 16px', flex: '0 1 auto', minWidth: '0px', overflow: 'visible' }}>
          {!isMobile && centerContent}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            height: '32px',
            background: isElectra ? 'rgba(39, 39, 42, 0.5)' : 'rgba(8, 20, 58, 0.55)',
            borderRadius: '20px',
            paddingLeft: '12px',
            paddingRight: '3px',
            border: isElectra ? '1px solid #27272a' : '1px solid rgba(147, 197, 253, 0.2)',
            gap: '6px',
            transition: '0.2s'
          }}>
            {!isMobile && <span style={{ fontSize: '12px', opacity: isElectra ? 0.3 : 0.45, color: isElectra ? ec.muted : undefined }}>Folder</span>}
            <input
              placeholder="My Project"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: isElectra ? ec.text : 'rgb(255, 255, 255)',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: '"Segoe UI", Inter, sans-serif',
                width: isMobile ? '80px' : '120px',
                textAlign: 'center',
                outline: 'none',
                letterSpacing: '0.01em',
                minWidth: 0
              }}
            />
            <button
              title="Save Project"
              onClick={onSave}
              style={{
                background: isElectra ? 'linear-gradient(135deg, #22d3ee, #06b6d4)' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                border: 'none',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isElectra ? '#000' : 'rgb(255, 255, 255)',
                boxShadow: isElectra ? 'rgba(34, 211, 238, 0.4) 0px 4px 10px -1px' : 'rgba(8, 47, 123, 0.45) 0px 4px 10px -1px',
                transition: 'transform 0.2s',
                flexShrink: 0,
                transform: 'scale(1)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.filter = isElectra ? 'brightness(1.1)' : 'brightness(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'none'; }}
            >
              <Save size={12} strokeWidth={2.5} />
            </button>
          </div>



        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', flex: '1 1 0%', minWidth: '0px' }}>
          {isDesktop && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingRight: '8px',
              borderRight: isElectra ? '1px solid rgba(39, 39, 42, 0.8)' : '1px solid rgba(191, 219, 254, 0.22)',
              height: '20px',
              flexShrink: 0
            }}>
              <button title="Feedback" style={{ background: 'transparent', border: 'none', color: isElectra ? ec.icon : 'rgba(191, 219, 254, 0.85)', cursor: 'pointer', padding: '0px', transition: '0.2s', display: 'flex', alignItems: 'center' }}><MessageSquareWarning size={16} strokeWidth={2.2} /></button>
              <button title="Achievements" style={{ background: 'transparent', border: 'none', color: isElectra ? ec.icon : 'rgba(191, 219, 254, 0.85)', cursor: 'pointer', padding: '0px', transition: '0.2s', display: 'flex', alignItems: 'center' }}><Trophy size={16} strokeWidth={2.2} /></button>
              <button title="Settings" style={{ background: 'transparent', border: 'none', color: isElectra ? ec.icon : 'rgba(191, 219, 254, 0.85)', cursor: 'pointer', padding: '0px', transition: '0.2s', display: 'flex', alignItems: 'center' }}><Settings size={16} strokeWidth={2.2} /></button>
              <button title="Help" style={{ background: 'transparent', border: 'none', color: isElectra ? ec.icon : 'rgba(191, 219, 254, 0.85)', cursor: 'pointer', padding: '0px', transition: '0.2s', display: 'flex', alignItems: 'center' }}><CircleHelp size={16} strokeWidth={2.2} /></button>
            </div>
          )}

          {rightContent}

          <LeapLabAuthButton variant="dark" size="sm" style={{ height: '32px', borderRadius: '16px', boxSizing: 'border-box' }} />

          {isLargeDesktop && (
            <div style={{
              marginLeft: '8px',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              height: '44px',
              overflow: 'hidden',
              filter: isElectra ? 'none' : 'drop-shadow(rgba(191, 219, 254, 0.22) 0px 0px 14px) drop-shadow(rgba(0, 0, 0, 0.4) 0px 2px 8px)'
            }}>
              <img
                alt="Leap into the AI Future"
                src="assets/Copy of CREOLEAP LOGO LEAP INTO THE AI FUTURE Final.svg"
                style={{
                  width: '95px',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  flexShrink: 0,
                  filter: isElectra
                    ? 'brightness(1.14) contrast(1.05)'
                    : [
                      'drop-shadow(0 0 20px rgba(167,139,250,0.7))',
                      'drop-shadow(0 0 8px rgba(255,255,255,0.25))',
                      'drop-shadow(0 3px 10px rgba(0,0,0,0.5))',
                      'brightness(1.14)',
                      'contrast(1.05)',
                    ].join(' '),
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default IgniteTopbar;
