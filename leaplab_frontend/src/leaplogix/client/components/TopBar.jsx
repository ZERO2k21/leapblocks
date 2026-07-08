/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef, useEffect } from "react";
import { Home, Play, Square, Undo, Redo, Save, Download, Settings, Upload, Plus, File, FileCode2, FileText, Share, ChevronDown, FolderOpen } from "lucide-react";
import Logo, { CreoleapLogo } from "../../../components/Logo";
import { useLogix } from "../context/LogixContext";
import LeapLabAuthButton from "../../../auth/LeapLabAuthButton";
import TopbarShareButton from "../../../components/common/TopbarShareButton";

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
                    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
                    borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
                    border: '1px solid rgba(255,255,255,0.6)', minWidth: 160,
                    overflow: 'hidden', zIndex: 1000, padding: '4px 0',
                }}>
                    {items.map((item, idx) => (
                        item.divider ? (
                            <div key={idx} style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '4px 12px' }} />
                        ) : (
                            <button key={idx} onClick={() => { item.onClick?.(); onClose(); }} disabled={item.disabled}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                    padding: '7px 14px', border: 'none', background: 'transparent',
                                    fontSize: 12, fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                                    fontWeight: 500, textAlign: 'left', cursor: item.disabled ? 'not-allowed' : 'pointer',
                                    color: item.disabled ? '#bbb' : '#374151', transition: 'all 0.12s ease',
                                }}>
                                {item.icon && <item.icon size={14} color="#7C3AED" strokeWidth={2} style={{ opacity: 0.8 }} />}
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {item.shortcut && (
                                    <span style={{ fontSize: 10, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 4px', borderRadius: 4 }}>{item.shortcut}</span>
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

    const [showMenuItems, setShowMenuItems] = useState(window.innerWidth >= 1100);

    useEffect(() => {
        const handleResize = () => {
            setShowCreoleap(window.innerWidth >= 1400);
            setShowMenuItems(window.innerWidth >= 1100);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <header style={{
            position: "sticky", top: 0, height: 60, background: "linear-gradient(135deg, #0a015a 0%, #080a25 100%)",
            display: "flex", alignItems: "center", padding: "0 16px",
            justifyContent: "space-between", color: "#fff", zIndex: 1000, flexShrink: 0, overflow: "hidden", flexWrap: "nowrap",
            boxShadow: '0 4px 20px rgba(8,10,37,0.45), inset 0 -1px 0 rgba(255,255,255,0.06)',
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
                    <Home size={19} strokeWidth={2.2} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0, cursor: 'pointer' }} onClick={() => {
                    sessionStorage.setItem('landingActiveTab', 'modules');
                    sessionStorage.removeItem('myProjectsSelectedMode');
                    ctx.onBack();
                }}>
                    <Logo height={48} />
                    <div style={{
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 8,
                    }}>
                        <span style={{
                            color: '#FFD500', fontSize: 8, fontWeight: 900,
                            textTransform: 'uppercase', letterSpacing: '0.18em', lineHeight: 1.1,
                        }}>LEAPLAB</span>
                        <span style={{
                            color: '#fff', fontSize: 15, fontWeight: 900,
                            letterSpacing: '0.08em', lineHeight: 1.2,
                        }}>Logix</span>
                    </div>
                </div>
                <div style={{ height: 28, width: 1, background: 'rgba(255,255,255,0.15)', marginRight: 4 }} />

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
            </div>

            <div style={{ height: 28, width: 1, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />

            <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
                <div style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    padding: "6px 12px",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    height: 34,
                    boxSizing: "border-box"
                }}>
                    <span style={{ fontSize: 14, opacity: 0.5 }}>📁</span>
                    <input value={ctx.projectName} onChange={(e) => ctx.setProjectName(e.target.value)}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#fff",
                            width: 100,
                            outline: "none",
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: "inherit"
                        }} />
                    <Save size={14} style={{ opacity: 0.8, cursor: "pointer", transition: "transform 0.15s ease" }}
                        onClick={ctx.handleSaveProject}
                        title="Save Project"
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} />
                </div>

                <div style={{
                    display: "flex",
                    background: "rgba(0, 0, 0, 0.28)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 20,
                    padding: 3,
                    alignItems: "center",
                    height: 34,
                    boxSizing: "border-box"
                }}>
                    <div style={{ padding: "0 8px 0 10px", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Mode</div>
                    {["ide", "stage", "upload"].map(mode => (
                        <button key={mode} onClick={() => ctx.setWorkflowMode(mode)} style={{
                            padding: "6px 12px",
                            border: "none",
                            borderRadius: 16,
                            background: ctx.workflowMode === mode ? "linear-gradient(135deg, #7C3AED, #4F46E5)" : "transparent",
                            color: ctx.workflowMode === mode ? "#fff" : "rgba(255,255,255,0.7)",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            textTransform: "capitalize",
                        }}
                            onMouseEnter={e => { if (ctx.workflowMode !== mode) e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={e => { if (ctx.workflowMode !== mode) e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                        >{mode === "ide" ? "IDE" : mode.charAt(0).toUpperCase() + mode.slice(1)}</button>
                    ))}
                </div>

                {ctx.isRunning ? (
                    <button onClick={ctx.handleStop} title="Stop (Escape)" style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                        background: "linear-gradient(135deg, #EF4444, #DC2626)", color: "#fff", border: "none", borderRadius: 20,
                        cursor: "pointer", fontSize: 12, fontWeight: 800, height: 34,
                        boxShadow: "0 2px 10px rgba(239, 68, 68, 0.35)",
                        transition: "all 0.2s ease"
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(239, 68, 68, 0.45)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(239, 68, 68, 0.35)"; }}
                    >
                        <Square size={12} fill="#fff" stroke="none" /> Stop
                    </button>
                ) : (
                    <button onClick={ctx.handleRun} title="Run Code (Ctrl+Enter or F5)" style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                        background: "linear-gradient(135deg, #10B981, #059669)", color: "#fff", border: "none", borderRadius: 20,
                        cursor: "pointer", fontSize: 12, fontWeight: 800, height: 34,
                        boxShadow: "0 2px 10px rgba(16, 185, 129, 0.35)",
                        transition: "all 0.2s ease"
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.45)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(16, 185, 129, 0.35)"; }}
                    >
                        <Play size={12} fill="#fff" stroke="none" /> Run
                    </button>
                )}

                <button onClick={() => { if (ctx.workflowMode !== "upload") ctx.setWorkflowMode("upload"); else ctx.handleUploadFirmware(); }}
                    style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#fff", height: 34,
                        transition: "all 0.2s ease"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; e.currentTarget.style.transform = "scale(1.03)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "scale(1)"; }}
                >
                    <Upload size={13} strokeWidth={2.5} /> {ctx.workflowMode === "upload" ? "Upload Code" : "Open Upload"}
                </button>

                <TopbarShareButton
                    style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '6px 10px', borderRadius: 4, display: 'flex', alignItems: 'center', transition: '0.2s' }}
                    size={18}
                    onSave={ctx.handleSaveProject}
                    projectName={ctx.projectName}
                />

                <LeapLabAuthButton variant="dark" size="sm" style={{ height: '34px', borderRadius: '20px', boxSizing: 'border-box' }} />

                {showCreoleap && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        paddingLeft: 4,
                        height: '44px',
                        overflow: 'hidden',
                    }}>
                        <img
                            src="/assets/logo - creoleap.png"
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
            </div>
        </header>
    );
}
