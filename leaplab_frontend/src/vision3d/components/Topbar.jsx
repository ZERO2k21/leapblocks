/**
 * Vision3D - Topbar Component
 * Matches the Electra/Ignite topbar exactly — same colors, logos, gradients, and branding.
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
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
  Undo2,
  Redo2,
  Scissors,
  Copy,
  Clipboard,
  Menu,
  X,
  Loader2,
  Trash2,
  Grid3x3,
  Ruler,
} from 'lucide-react';
import LeapLabAuthButton from '../../auth/LeapLabAuthButton';
import TopbarShareButton from '../../components/common/TopbarShareButton';
import { use3DStore } from '../store/use3DStore';
import { exportShapes, downloadBlob } from '../engine/ExportEngine';
import { log } from '../utils/logger';
import { MenuItem, MenuDivider, MobileMenuItem } from './topbar/MenuItems';

export const Topbar = ({
  onBack,
  title,
  onTitleChange,
  onSave,
  onOpenProject,
  onDownload,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  isSaving = false,
}) => {
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileMenuRef = useRef(null);
  const editMenuRef = useRef(null);
  const viewMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const {
    shapes,
    selectedIds,
    gridSnap,
    setGridSnap,
    showGrid,
    setShowGrid,
    showAxes,
    setShowAxes,
    clearScene,
    removeShapes,
    duplicateShapes,
    groupShapes,
    undo,
    redo,
    historyIndex,
    history,
  } = use3DStore();

  const canUndoLocal = historyIndex > 0;
  const canRedoLocal = historyIndex < history.length - 1;
  const effectiveCanUndo = canUndo || canUndoLocal;
  const effectiveCanRedo = canRedo || canRedoLocal;
  const effectiveUndo = onUndo || undo;
  const effectiveRedo = onRedo || redo;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target)) setFileMenuOpen(false);
      if (editMenuRef.current && !editMenuRef.current.contains(event.target)) setEditMenuOpen(false);
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target)) setViewMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, []);

  const handleExport = async (format) => {
    log('Topbar: export format=' + format);
    try {
      const visibleShapes = shapes.filter((s) => s.visible && s.type !== 'group');
      const blob = await exportShapes(visibleShapes, { format, includeGrid: false, includeHidden: false });
      downloadBlob(blob, `vision3d-export.${format}`);
      setFileMenuOpen(false);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const closeAllMenus = () => {
    setFileMenuOpen(false);
    setEditMenuOpen(false);
    setViewMenuOpen(false);
  };

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{ paddingLeft: '2px', width: '100%', minWidth: '100vw', boxSizing: 'border-box' }}
        className="flex items-center justify-between h-12 pr-[18px] z-[200] select-none border-b gap-4 bg-gradient-to-br from-[#0b1b42] via-[#0f2f7a] to-[#0a204f] border-[rgba(96,165,250,0.28)] shadow-[0_4px_20px_rgba(8,20,58,0.45),inset_0_-1px_0_rgba(96,165,250,0.12)]"
      >
        <div className="flex items-center gap-3.5 flex-auto min-w-0 h-full">
          <button
            title="Back to Home"
            onClick={() => {
              sessionStorage.setItem('landingActiveTab', 'modules');
              sessionStorage.removeItem('myProjectsSelectedMode');
              onBack();
            }}
            style={{ marginLeft: '16px' }}
            className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors duration-200 shrink-0 border bg-[#94c5ff]/18 border-[#94c5ff]/24 text-white hover:bg-[#bfdbfe]/24"
          >
            <Home size={16} strokeWidth={2.2} />
          </button>

          <div className="h-5 w-px shrink-0 bg-[#bfdbfe]/28" />

          <div className="flex items-center mr-2.5 shrink-0 filter drop-shadow-[0_0_14px_rgba(56,189,248,0.3)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
            <img alt="LeapLab" src="assets/leaplab_logo_transparent.png" className="h-12 object-contain" />
            <div className="hidden min-[1440px]:flex flex-col justify-center ml-2.5 leading-none">
              <span className="text-[7px] font-black uppercase tracking-[0.18em] font-sans text-[#93c5fd]">LEAPLAB</span>
              <span className="text-sm font-black tracking-[0.08em] font-sans text-white">VISION 3D</span>
            </div>
          </div>
 
          <div className="hidden min-[1440px]:flex items-center gap-3 h-full">
            {/* File Menu */}
            <div ref={fileMenuRef} className="relative">
              <button
                onClick={() => { setFileMenuOpen(!fileMenuOpen); setEditMenuOpen(false); setViewMenuOpen(false); }}
                className={`flex items-center gap-1.25 px-[10px] py-[6px] text-[15px] font-medium font-sans cursor-pointer rounded-[6px] transition-all duration-200 tracking-wide text-white bg-transparent border-0 ${fileMenuOpen ? 'bg-white/18' : 'hover:bg-white/10'}`}
              >
                File
                <ChevronDown size={12} strokeWidth={2.5} className={`opacity-50 transition-transform duration-200 ${fileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
 
              {fileMenuOpen && (
                <div
                  style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, borderRadius: '8px', minWidth: '240px', padding: '4px 0', zIndex: 1000, overflow: 'hidden' }}
                  className="animate-[slideDown_0.15s_ease-out] border border-white/60 bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
                >
                  <MenuItem icon={<FilePlus size={14} />} iconColor="text-[#7C3AED]/80" label="New Project" shortcut="Ctrl+N" onClick={() => { clearScene(); closeAllMenus(); }} />
                  <MenuItem icon={<FolderOpen size={14} />} iconColor="text-[#7C3AED]/80" label="Open Project" shortcut="Ctrl+O" onClick={() => { onOpenProject?.(); closeAllMenus(); }} />
                  <MenuItem icon={<FolderOpen size={14} />} iconColor="text-[#7C3AED]/80" label="My Projects" onClick={() => { sessionStorage.setItem('landingActiveTab', 'my-projects'); sessionStorage.setItem('myProjectsSelectedMode', 'vision3d'); onBack?.(); closeAllMenus(); }} />
                  <MenuDivider />
                  <MenuItem icon={<Download size={14} />} iconColor="text-[#7C3AED]/80" label="Export as STL" onClick={() => handleExport('stl')} />
                  <MenuItem icon={<Download size={14} />} iconColor="text-[#7C3AED]/80" label="Export as OBJ" onClick={() => handleExport('obj')} />
                  <MenuItem icon={<Download size={14} />} iconColor="text-[#7C3AED]/80" label="Export as GLTF" onClick={() => handleExport('gltf')} />
                  <MenuDivider />
                  <MenuItem icon={<Download size={14} />} iconColor="text-[#7C3AED]/80" label="Download .leap" onClick={() => { onDownload?.(); closeAllMenus(); }} />
                  <MenuItem icon={<FileText size={14} />} iconColor="text-[#7C3AED]/80" label="Save As..." shortcut="Ctrl+Shift+S" onClick={() => { onSave?.(); closeAllMenus(); }} />
                  <MenuDivider />
                  <MenuItem icon={<Trash2 size={14} />} iconColor="text-[#7C3AED]/80" label="Clear Scene" onClick={() => { clearScene(); closeAllMenus(); }} />
                </div>
              )}
            </div>
 
            {/* Edit Menu */}
            <div ref={editMenuRef} className="relative">
              <button
                onClick={() => { setEditMenuOpen(!editMenuOpen); setFileMenuOpen(false); setViewMenuOpen(false); }}
                className={`flex items-center gap-1.25 px-[10px] py-[6px] text-[15px] font-medium font-sans cursor-pointer rounded-[6px] transition-all duration-200 tracking-wide text-white bg-transparent border-0 ${editMenuOpen ? 'bg-white/18' : 'hover:bg-white/10'}`}
              >
                Edit
                <ChevronDown size={12} strokeWidth={2.5} className={`opacity-50 transition-transform duration-200 ${editMenuOpen ? 'rotate-180' : ''}`} />
              </button>
 
              {editMenuOpen && (
                <div
                  style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, borderRadius: '8px', minWidth: '240px', padding: '4px 0', zIndex: 1000, overflow: 'hidden' }}
                  className="animate-[slideDown_0.15s_ease-out] border border-white/60 bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
                >
                  <MenuItem icon={<Undo2 size={14} />} iconColor="text-[#7C3AED]/80" label="Undo" shortcut="Ctrl+Z" disabled={!effectiveCanUndo} onClick={() => { if (effectiveCanUndo) { effectiveUndo(); closeAllMenus(); } }} />
                  <MenuItem icon={<Redo2 size={14} />} iconColor="text-[#7C3AED]/80" label="Redo" shortcut="Ctrl+Y" disabled={!effectiveCanRedo} onClick={() => { if (effectiveCanRedo) { effectiveRedo(); closeAllMenus(); } }} />
                  <MenuDivider />
                  <MenuItem icon={<Scissors size={14} />} iconColor="text-[#7C3AED]/80" label="Cut" shortcut="Ctrl+X" onClick={closeAllMenus} />
                  <MenuItem icon={<Copy size={14} />} iconColor="text-[#7C3AED]/80" label="Copy" shortcut="Ctrl+C" onClick={() => { navigator.clipboard.writeText(JSON.stringify(shapes.filter(s => selectedIds.includes(s.id)))); closeAllMenus(); }} />
                  <MenuItem icon={<Clipboard size={14} />} iconColor="text-[#7C3AED]/80" label="Paste" shortcut="Ctrl+V" onClick={closeAllMenus} />
                  <MenuDivider />
                  <MenuItem icon={<Copy size={14} />} iconColor="text-[#7C3AED]/80" label="Duplicate" shortcut="Ctrl+D" disabled={selectedIds.length === 0} onClick={() => { if (selectedIds.length > 0) { duplicateShapes(selectedIds); closeAllMenus(); } }} />
                  <MenuItem icon={<Trash2 size={14} />} iconColor="text-[#7C3AED]/80" label="Delete" shortcut="Del" disabled={selectedIds.length === 0} onClick={() => { if (selectedIds.length > 0) { removeShapes(selectedIds); closeAllMenus(); } }} />
                </div>
              )}
            </div>
 
            {/* View Menu */}
            <div ref={viewMenuRef} className="relative">
              <button
                onClick={() => { setViewMenuOpen(!viewMenuOpen); setFileMenuOpen(false); setEditMenuOpen(false); }}
                className={`flex items-center gap-1.25 px-[10px] py-[6px] text-[15px] font-medium font-sans cursor-pointer rounded-[6px] transition-all duration-200 tracking-wide text-white bg-transparent border-0 ${viewMenuOpen ? 'bg-white/18' : 'hover:bg-white/10'}`}
              >
                View
                <ChevronDown size={12} strokeWidth={2.5} className={`opacity-50 transition-transform duration-200 ${viewMenuOpen ? 'rotate-180' : ''}`} />
              </button>
 
              {viewMenuOpen && (
                <div
                  style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, borderRadius: '8px', minWidth: '200px', padding: '4px 0', zIndex: 1000, overflow: 'hidden' }}
                  className="animate-[slideDown_0.15s_ease-out] border border-white/60 bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
                >
                  <MenuItem icon={<Grid3x3 size={14} />} iconColor="text-[#7C3AED]/80" label={showGrid ? 'Hide Grid' : 'Show Grid'} active={showGrid} onClick={() => { setShowGrid(!showGrid); closeAllMenus(); }} />
                  <MenuItem icon={<Ruler size={14} />} iconColor="text-[#7C3AED]/80" label={showAxes ? 'Hide Axes' : 'Show Axes'} active={showAxes} onClick={() => { setShowAxes(!showAxes); closeAllMenus(); }} />
                </div>
              )}
            </div>
 
            <button className="flex items-center gap-1.25 px-[10px] py-[6px] text-[15px] font-medium font-sans cursor-pointer rounded-[6px] transition-all duration-200 tracking-wide bg-transparent border-0 text-white hover:bg-white/10">
              <BookOpen size={14} strokeWidth={2.2} className="opacity-90" />
              Tutorials
              <ChevronDown size={12} strokeWidth={2.5} className="opacity-50" />
            </button>
          </div>
        </div>
 
        {/* Center section */}
        <div className="flex items-center justify-center gap-4 px-4 flex-none min-w-0">
          <div
            style={{ paddingLeft: '24px' }}
            className="flex items-center h-8 rounded-full pr-[3px] border gap-3 transition-all duration-200 bg-[#08143a]/55 border-[#93c5fd]/20"
          >
            <span className="text-[12px] opacity-45 font-bold tracking-[0.01em] hidden min-[1440px]:inline text-white">Folder</span>
            <input
              placeholder="My Project"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold font-sans w-20 md:w-[120px] text-center outline-none tracking-wide min-w-0 text-white"
            />
            <button
              title="Save Project"
              onClick={onSave}
              disabled={isSaving}
              className={`border-0 rounded-full w-[26px] h-[26px] flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0 scale-100 hover:scale-[1.08] hover:brightness-[1.08] bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] text-white shadow-[0_4px_10px_-1px_rgba(8,47,123,0.45)] ${isSaving ? 'opacity-80 cursor-wait' : ''}`}
            >
              {isSaving ? <Loader2 size={12} strokeWidth={2.5} className="animate-spin" /> : <Save size={12} strokeWidth={2.5} />}
            </button>
          </div>
        </div>
 
        {/* Right section */}
        <div className="flex items-center justify-end gap-3 flex-auto min-w-0">
          <div className="hidden min-[1440px]:flex items-center gap-3 pr-4 border-r border-[rgba(191,219,254,0.22)] h-8 shrink-0">
            <TopbarShareButton className="bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 flex items-center text-[rgba(191,219,254,0.85)] hover:text-white" size={16} onSave={onSave} projectName={title} />
            <button title="Feedback" className="bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 flex items-center text-[rgba(191,219,254,0.85)] hover:text-white">
              <MessageSquareWarning size={16} strokeWidth={2.2} />
            </button>
            <button title="Achievements" className="bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 flex items-center text-[rgba(191,219,254,0.85)] hover:text-white">
              <Trophy size={16} strokeWidth={2.2} />
            </button>
            <button title="Settings" className="bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 flex items-center text-[rgba(191,219,254,0.85)] hover:text-white">
              <Settings size={16} strokeWidth={2.2} />
            </button>
            <button title="Help" style={{ marginRight: '10px' }} className="bg-transparent border-none cursor-pointer p-0 transition-colors duration-200 flex items-center text-[rgba(191,219,254,0.85)] hover:text-white">
              <CircleHelp size={20} strokeWidth={2.2} />
            </button>
          </div>
 
          <div className="hidden sm:flex sm:items-center sm:gap-4 shrink-0 ml-4">
            <LeapLabAuthButton variant="dark" size="sm" style={{ height: '36px', borderRadius: '16px', boxSizing: 'border-box' }} />
          </div>
 
          <div className="hidden min-[1500px]:flex ml-2 items-center shrink-0 h-12 overflow-hidden filter drop-shadow-[0_0_20px_rgba(167,139,250,0.7)] drop-shadow-[0_0_8px_rgba(255,255,255,0.25)] drop-shadow-[0_3px_10px_rgba(0,0,0,0.5)]">
            <img alt="Leap into the AI Future" src="assets/logo-creoleap.png" className="w-[145px] h-auto object-contain block shrink-0 brightness-[1.14] contrast-[1.05]" />
          </div>
 
          <button
            title="Open Menu"
            onClick={() => setMobileMenuOpen(true)}
            className="min-[1440px]:hidden flex items-center justify-center w-10 h-10 rounded-lg cursor-pointer transition-colors duration-200 shrink-0 border bg-[#94c5ff]/18 border-[#94c5ff]/24 text-white hover:bg-[#bfdbfe]/24"
          >
            <Menu size={20} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-[999] transition-opacity duration-300" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Mobile slide-out drawer */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 h-full z-[1000] shadow-2xl flex flex-col gap-6 transition-all duration-300 ease-in-out border-l bg-[#0b1b42] border-[#bfdbfe]/20 text-white ${mobileMenuOpen ? 'translate-x-0 visible opacity-100' : 'translate-x-full invisible opacity-0'}`}
        style={{
          width: '290px',
          padding: '24px',
          boxSizing: 'border-box'
        }}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <img src="/assets/leaplabicon.ico" alt="LeapLab" className="w-6 h-6 rounded object-contain" />
            <span className="font-sans font-bold text-[18px] tracking-wide">Menu</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-10 h-10 flex items-center justify-center rounded-lg border transition-colors bg-[#94c5ff]/10 border-[#94c5ff]/20 text-white hover:bg-white/10"
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold uppercase tracking-[0.1em] px-3 mb-1.5 text-[#93c5fd]/80">File</span>
            <MobileMenuItem icon={<FilePlus size={18} />} label="New Project" onClick={() => { clearScene(); setMobileMenuOpen(false); }} />
            <MobileMenuItem icon={<FolderOpen size={18} />} label="Open Project" onClick={() => { onOpenProject?.(); setMobileMenuOpen(false); }} />
            <MobileMenuItem icon={<FolderOpen size={18} />} label="My Projects" onClick={() => { sessionStorage.setItem('landingActiveTab', 'my-projects'); sessionStorage.setItem('myProjectsSelectedMode', 'vision3d'); onBack?.(); setMobileMenuOpen(false); }} />
            <MobileMenuItem icon={<FileText size={18} />} label="Save As..." onClick={() => { onSave?.(); setMobileMenuOpen(false); }} />
            <MobileMenuItem icon={<Download size={18} />} label="Download .leap" onClick={() => { onDownload?.(); setMobileMenuOpen(false); }} />
            <MobileMenuItem icon={<Download size={18} />} label="Export as STL" onClick={() => { handleExport('stl'); setMobileMenuOpen(false); }} />
            <MobileMenuItem icon={<Download size={18} />} label="Export as OBJ" onClick={() => { handleExport('obj'); setMobileMenuOpen(false); }} />
            <MobileMenuItem icon={<Download size={18} />} label="Export as GLTF" onClick={() => { handleExport('gltf'); setMobileMenuOpen(false); }} />
            <MobileMenuItem icon={<Trash2 size={18} />} label="Clear Scene" onClick={() => { clearScene(); setMobileMenuOpen(false); }} />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold uppercase tracking-[0.1em] px-3 mb-1.5 text-[#93c5fd]/80">Edit</span>
            <MobileMenuItem icon={<Undo2 size={18} />} label="Undo" disabled={!effectiveCanUndo} onClick={() => { if (effectiveCanUndo) { effectiveUndo(); setMobileMenuOpen(false); } }} />
            <MobileMenuItem icon={<Redo2 size={18} />} label="Redo" disabled={!effectiveCanRedo} onClick={() => { if (effectiveCanRedo) { effectiveRedo(); setMobileMenuOpen(false); } }} />
            <MobileMenuItem icon={<Copy size={18} />} label="Duplicate" disabled={selectedIds.length === 0} onClick={() => { if (selectedIds.length > 0) { duplicateShapes(selectedIds); setMobileMenuOpen(false); } }} />
            <MobileMenuItem icon={<Trash2 size={18} />} label="Delete" disabled={selectedIds.length === 0} onClick={() => { if (selectedIds.length > 0) { removeShapes(selectedIds); setMobileMenuOpen(false); } }} />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-bold uppercase tracking-[0.1em] px-3 mb-1.5 text-[#93c5fd]/80">View</span>
            <MobileMenuItem icon={<Grid3x3 size={18} />} label={showGrid ? 'Hide Grid' : 'Show Grid'} onClick={() => { setShowGrid(!showGrid); setMobileMenuOpen(false); }} />
            <MobileMenuItem icon={<Ruler size={18} />} label={showAxes ? 'Hide Axes' : 'Show Axes'} onClick={() => { setShowAxes(!showAxes); setMobileMenuOpen(false); }} />
          </div>

          <div className="flex flex-col gap-0.5 border-t border-white/10 pt-4">
            <MobileMenuItem icon={<BookOpen size={18} />} label="Tutorials" onClick={() => setMobileMenuOpen(false)} />
            <TopbarShareButton size={18} onSave={onSave} projectName={title}>
              {({ onClick, loading }) => (
                <button className="flex items-center gap-3.5 w-full py-2.5 px-3 text-[16px] font-medium rounded-lg text-left transition-colors bg-transparent border-0 cursor-pointer hover:bg-white/8 text-white/90 hover:text-white" onClick={onClick} disabled={loading}>
                  <Share2 size={18} strokeWidth={2} className="opacity-80 shrink-0" />
                  <span>Share project</span>
                </button>
              )}
            </TopbarShareButton>
            <MobileMenuItem icon={<MessageSquareWarning size={18} />} label="Feedback" onClick={() => setMobileMenuOpen(false)} />
            <MobileMenuItem icon={<Trophy size={18} />} label="Achievements" onClick={() => setMobileMenuOpen(false)} />
            <MobileMenuItem icon={<Settings size={18} />} label="Settings" onClick={() => setMobileMenuOpen(false)} />
            <MobileMenuItem icon={<CircleHelp size={18} />} label="Help" onClick={() => setMobileMenuOpen(false)} />
          </div>
        </div>

        <div className="border-t border-white/10 pt-5 flex flex-col gap-4">
          <LeapLabAuthButton variant="dark" size="sm" style={{ height: '40px', borderRadius: '8px', boxSizing: 'border-box', width: '100%', fontSize: '16px', fontWeight: 600 }} />
        </div>
      </div>
    </>
  );
};


