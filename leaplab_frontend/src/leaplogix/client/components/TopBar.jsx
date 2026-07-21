/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef, useEffect } from "react";
import { Home, Play, Square, Undo, Redo, Save, Download, Settings, Upload, Plus, File, FileCode2, FileText, Share, ChevronDown, FolderOpen, Menu as MenuIcon } from "lucide-react";
import Logo, { CreoleapLogo } from "../../../components/Logo";
import { useLogix } from "../context/LogixContext";
import LeapLabAuthButton from "../../../auth/LeapLabAuthButton";
import TopbarShareButton from "../../../components/common/TopbarShareButton";
import ProjectNameInput from "../../../components/common/ProjectNameInput";
import ModeSwitcher from "../../../components/common/ModeSwitcher";
import ActionButton from "../../../components/common/ActionButton";
import { useWindowWidth } from "../../../hooks/useWindowWidth";
import MobileDrawer from "../../../components/common/MobileDrawer";

function DropdownMenu({ label, icon: Icon, items, isOpen, onToggle, onClose }) {
    const menuRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) onCloseRef.current();
        };
        const timer = setTimeout(() => document.addEventListener('mousedown', handleClickOutside, true), 0);
        return () => { clearTimeout(timer); document.removeEventListener('mousedown', handleClickOutside, true); };
    }, [isOpen]);

    return (
        <div ref={menuRef} style={{ position: 'relative' }}>
            <button
                onClick={onToggle}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px',
                    border: 'none', color: '#fff', fontSize: 15, fontWeight: 500,
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif", cursor: 'pointer',
                    borderRadius: 6, transition: 'all 0.2s ease',
                    background: isOpen
                        ? 'rgba(255,255,255,0.18)'
                        : (isHovered ? 'rgba(255,255,255,0.1)' : 'transparent'),
                }}
            >
                {Icon && <Icon size={14} strokeWidth={2.2} style={{ opacity: 0.9 }} />}
                {label}
                <ChevronDown size={12} strokeWidth={2.5} style={{ opacity: 0.5, transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {isOpen && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                    background: '#1e1e2e', border: '1px solid rgba(124,58,237,0.3)',
                    borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                    minWidth: 220,
                    overflow: 'hidden', zIndex: 1000, padding: '6px 0',
                }}>
                    {items.map((item, idx) => (
                        item.divider ? (
                            <div key={idx} style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 12px' }} />
                        ) : (
                            <button key={idx} onClick={() => { item.onClick?.(); onClose(); }} disabled={item.disabled}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                    padding: '8px 14px', border: 'none', background: 'transparent',
                                    fontSize: 13, fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                                    fontWeight: 500, textAlign: 'left', cursor: item.disabled ? 'not-allowed' : 'pointer',
                                    color: item.disabled ? '#666' : '#e0e0e0', transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = item.disabled ? '#666' : '#e0e0e0'; }}
                            >
                                {item.icon && <item.icon size={15} color="#a78bfa" strokeWidth={2} />}
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {item.shortcut && (
                                    <span style={{ fontSize: 10, color: '#888', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{item.shortcut}</span>
                                )}
                            </button>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}

export default function TopBar() {
    const ctx = useLogix();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [showCreoleap, setShowCreoleap] = useState(window.innerWidth >= 1400);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

    const [showMenuItems, setShowMenuItems] = useState(window.innerWidth >= 1100);
    const windowWidth = useWindowWidth();
    const showDesktopMenus = windowWidth >= 1400;

    useEffect(() => {
        const handleResize = () => {
            setShowCreoleap(window.innerWidth >= 1400);
            setShowMenuItems(window.innerWidth >= 1100);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const handleClickOutside = (e) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, [mobileMenuOpen]);

    return (
        <>
        <header style={{
            position: "sticky", top: 0, height: 68, background: "linear-gradient(135deg, #0a0a1f 0%, #0a015a 55%, #080a25 100%)",
            display: "flex", alignItems: "center", padding: "0 28px",
            justifyContent: "space-between", color: "#fff", zIndex: 1000, flexShrink: 0, flexWrap: "nowrap",
            boxShadow: '0 4px 20px rgba(8,10,37,0.5), inset 0 -1px 0 rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(100,180,255,0.08)',
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
                <button onClick={() => {
                    sessionStorage.setItem('landingActiveTab', 'modules');
                    sessionStorage.removeItem('myProjectsSelectedMode');
                    ctx.onBack();
                }} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 40, height: 40, background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                    color: '#fff', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0,
                }} title="Back to Home">
                    <Home size={20} strokeWidth={2.2} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0, cursor: 'pointer' }} onClick={() => {
                    sessionStorage.setItem('landingActiveTab', 'modules');
                    sessionStorage.removeItem('myProjectsSelectedMode');
                    ctx.onBack();
                }}>
                    <Logo height={48} />
                    <span style={{
                        color: '#fff', fontSize: 22, fontWeight: 900,
                        letterSpacing: '0.08em', lineHeight: 1.2,
                        borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 8,
                    }}>Logix</span>
                </div>

                {showDesktopMenus && (
                    <>
                        <div style={{ height: 32, width: 1, background: 'rgba(255,255,255,0.15)', marginRight: 4 }} />

                        <DropdownMenu label="File" isOpen={openMenuId === 'file'} onToggle={() => setOpenMenuId(openMenuId === 'file' ? null : 'file')} onClose={() => setOpenMenuId(null)}
                            items={[
                                { label: 'New Project', icon: File, onClick: ctx.handleNewProject, shortcut: 'Ctrl+N' },
                                { label: 'Open from your computer', icon: FolderOpen, onClick: ctx.handleOpenProject, shortcut: 'Ctrl+O' },
                                { label: 'Open Python File', icon: FileCode2, onClick: ctx.handleOpenPythonFile },
                                { divider: true },
                                { label: 'Save to your computer', icon: Save, onClick: ctx.handleSaveProject, shortcut: 'Ctrl+S' },
                                { label: 'Download .leap file', icon: Download, onClick: ctx.handleDownloadProject },
                                { divider: true },
                                { label: 'Share', icon: Share, onClick: ctx.handleShareProject },
                                { divider: true },
                                {
                                    label: 'My Projects',
                                    icon: FolderOpen,
                                    onClick: () => {
                                        sessionStorage.setItem('landingActiveTab', 'my-projects');
                                        sessionStorage.setItem('myProjectsSelectedMode', 'python');
                                        ctx.onBack();
                                    }
                                }
                            ]} />

                        <DropdownMenu label="Edit" isOpen={openMenuId === 'edit'} onToggle={() => setOpenMenuId(openMenuId === 'edit' ? null : 'edit')} onClose={() => setOpenMenuId(null)}
                            items={[
                                { label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z', onClick: () => ctx.editorRef.current?.trigger('keyboard', 'undo', null) },
                                { label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y', onClick: () => ctx.editorRef.current?.trigger('keyboard', 'redo', null) },
                            ]} />

                        {showMenuItems && ["Board", "Connect"].map((menuLabel) => (
                            <button key={menuLabel}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#fff",
                                    fontFamily: "inherit",
                                    fontSize: 15,
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    opacity: 0.9,
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                onClick={() => {
                                    if (menuLabel === "Board") ctx.setIsBoardModalOpen(true);
                                    if (menuLabel === "Connect" && ctx.workflowMode === "upload") ctx.handleConnectToBoard();
                                }}>
                                {menuLabel}
                            </button>
                        ))}
                    </>
                )}
            </div>

            <div style={{ height: 28, width: 1, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />

            <div style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, justifyContent: "flex-end" }}>
                <ProjectNameInput
                    value={ctx.projectName}
                    onChange={ctx.setProjectName}
                    onSave={ctx.handleSaveProject}
                />

                <ModeSwitcher
                    modes={[
                        { id: 'ide', label: 'IDE' },
                        { id: 'stage', label: 'Stage' },
                        { id: 'upload', label: 'Upload' },
                    ]}
                    activeMode={ctx.workflowMode}
                    onChange={ctx.setWorkflowMode}
                />

                {ctx.isRunning ? (
                    <ActionButton
                        variant="danger"
                        icon={<Square size={12} fill="#fff" stroke="none" />}
                        label="Stop"
                        onClick={ctx.handleStop}
                        title="Stop (Escape)"
                    />
                ) : (
                    <ActionButton
                        variant="success"
                        icon={<Play size={12} fill="#fff" stroke="none" />}
                        label="Run"
                        onClick={ctx.handleRun}
                        title="Run Code (Ctrl+Enter or F5)"
                    />
                )}

                <ActionButton
                    variant="subtle"
                    icon={<Upload size={13} strokeWidth={2.5} />}
                    label={ctx.workflowMode === "upload" ? "Upload Code" : "Open Upload"}
                    onClick={() => {
                        if (ctx.workflowMode !== "upload") ctx.setWorkflowMode("upload");
                        else ctx.handleUploadFirmware();
                    }}
                />

                <TopbarShareButton
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '6px 10px', borderRadius: 4, display: 'flex', alignItems: 'center', transition: '0.2s' }}
                    size={18}
                    onSave={ctx.handleSaveProject}
                    projectName={ctx.projectName}
                />

                <LeapLabAuthButton variant="dark" size="sm" style={{ height: '34px', borderRadius: '20px', boxSizing: 'border-box' }} />
            </div>

            {showCreoleap && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    height: '100%',
                }}>
                    <img
                        src="assets/logo-creoleap.png"
                        alt="CREOLEAP"
                        style={{
                            width: '145px',
                            height: 'auto',
                            objectFit: 'contain',
                            display: 'block',
                            flexShrink: 0,
                            filter: [
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

            {!showDesktopMenus && (
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 40, height: 40, borderRadius: 10,
                        background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff', cursor: 'pointer', marginLeft: 8, flexShrink: 0,
                    }}
                >
                    <MenuIcon size={20} strokeWidth={2.2} />
                </button>
            )}
        </header>
        <MobileDrawer
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            theme="dark"
        >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>File Operations</div>
            {[
                { label: 'New Project', icon: File, onClick: ctx.handleNewProject },
                { label: 'Open from your computer', icon: FolderOpen, onClick: ctx.handleOpenProject },
                { label: 'Open Python File', icon: FileCode2, onClick: ctx.handleOpenPythonFile },
                { label: 'Save to your computer', icon: Save, onClick: ctx.handleSaveProject },
                { label: 'Download .leap file', icon: Download, onClick: ctx.handleDownloadProject },
                { label: 'Share', icon: Share, onClick: ctx.handleShareProject },
                {
                    label: 'My Projects', icon: FolderOpen,
                    onClick: () => {
                        sessionStorage.setItem('landingActiveTab', 'my-projects');
                        sessionStorage.setItem('myProjectsSelectedMode', 'python');
                        ctx.onBack();
                    }
                },
            ].map((item, i) => (
                <button key={i} onClick={() => { item.onClick?.(); setMobileMenuOpen(false); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '8px 10px', border: 'none', borderRadius: 8,
                        background: 'transparent', color: '#e0e0e0', fontSize: 13,
                        fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e0e0e0'; }}
                >
                    {item.icon && <item.icon size={15} color="#a78bfa" strokeWidth={2} />}
                    {item.label}
                </button>
            ))}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>Edit Operations</div>
            {[
                { label: 'Undo', icon: Undo, onClick: () => ctx.editorRef.current?.trigger('keyboard', 'undo', null) },
                { label: 'Redo', icon: Redo, onClick: () => ctx.editorRef.current?.trigger('keyboard', 'redo', null) },
            ].map((item, i) => (
                <button key={i} onClick={() => { item.onClick?.(); setMobileMenuOpen(false); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '8px 10px', border: 'none', borderRadius: 8,
                        background: 'transparent', color: '#e0e0e0', fontSize: 13,
                        fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e0e0e0'; }}
                >
                    {item.icon && <item.icon size={15} color="#a78bfa" strokeWidth={2} />}
                    {item.label}
                </button>
            ))}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>Controls</div>
            {["Board", "Connect"].map((label) => (
                <button key={label} onClick={() => {
                    if (label === "Board") ctx.setIsBoardModalOpen(true);
                    if (label === "Connect" && ctx.workflowMode === "upload") ctx.handleConnectToBoard();
                    setMobileMenuOpen(false);
                }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '8px 10px', border: 'none', borderRadius: 8,
                        background: 'transparent', color: '#e0e0e0', fontSize: 13,
                        fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e0e0e0'; }}
                >
                    {label}
                </button>
            ))}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <LeapLabAuthButton variant="dark" size="sm" style={{ width: '100%', height: '34px', borderRadius: '20px', boxSizing: 'border-box' }} />
            </div>
        </MobileDrawer>
        </>
    );
}
