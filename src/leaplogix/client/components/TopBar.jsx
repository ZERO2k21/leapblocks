/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef, useEffect } from "react";
import { Home, Play, Square, Undo, Redo, Save, Settings, Upload, Plus, File, FileCode2, FileText, Share, ChevronDown, FolderOpen } from "lucide-react";
import Logo, { CreoleapLogo } from "../../../components/Logo";
import { useLogix } from "../context/LogixContext";

function DropdownMenu({ label, icon: Icon, items, isOpen, onToggle, onClose }) {
    const menuRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

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
            <button onClick={onToggle} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px',
                border: 'none', color: '#fff', fontSize: 15, fontWeight: 500,
                fontFamily: "'Segoe UI', Inter, system-ui, sans-serif", cursor: 'pointer',
                borderRadius: 4, transition: 'all 0.2s ease',
                background: isOpen ? 'rgba(255,255,255,0.18)' : 'transparent',
            }}>
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

    return (
        <header style={{
            position: "sticky", top: 0, height: 60, background: "#0a015a",
            display: "flex", alignItems: "center", padding: "0 8px",
            justifyContent: "space-between", color: "#fff", zIndex: 1000, flexShrink: 0, overflow: "visible",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={ctx.onBack} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 40, height: 40, background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                    color: '#fff', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0,
                }} title="Back to Home">
                    <Home size={19} strokeWidth={2.2} />
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={ctx.onBack}>
                    <Logo height={50} />
                    <span style={{ color: "#ffffffff", fontSize: 17, fontWeight: 1000, letterSpacing: "0.08em" }}>Logix</span>
                </div>
                <div style={{ width: 1, height: 20, background: "rgba(255, 255, 255, 0.71)" }} />

                <DropdownMenu label="File" isOpen={openMenuId === 'file'} onToggle={() => setOpenMenuId(openMenuId === 'file' ? null : 'file')} onClose={() => setOpenMenuId(null)}
                    items={[
                        { label: 'New Project', icon: File, onClick: ctx.handleNewProject, shortcut: 'Ctrl+N' },
                        { label: 'Open from your computer', icon: FolderOpen, onClick: ctx.handleOpenProject, shortcut: 'Ctrl+O' },
                        { label: 'Open Python File', icon: FileCode2, onClick: ctx.handleOpenPythonFile },
                        { divider: true },
                        { label: 'Save to your computer', icon: Save, onClick: ctx.handleSaveProject, shortcut: 'Ctrl+S' },
                        { divider: true },
                        { label: 'Share', icon: Share, onClick: ctx.handleShareProject }
                    ]} />

                <DropdownMenu label="Edit" isOpen={openMenuId === 'edit'} onToggle={() => setOpenMenuId(openMenuId === 'edit' ? null : 'edit')} onClose={() => setOpenMenuId(null)}
                    items={[
                        { label: 'Undo', icon: Undo, shortcut: 'Ctrl+Z', onClick: () => ctx.editorRef.current?.trigger('keyboard', 'undo', null) },
                        { label: 'Redo', icon: Redo, shortcut: 'Ctrl+Y', onClick: () => ctx.editorRef.current?.trigger('keyboard', 'redo', null) },
                    ]} />

                {["Tutorials", "Board", "Connect"].map((menuLabel) => (
                    <span key={menuLabel} style={{ fontSize: 15, cursor: "pointer", opacity: 0.9, padding: "4px 8px", borderRadius: 4 }}
                        onClick={() => {
                            if (menuLabel === "Board") ctx.setIsBoardModalOpen(true);
                            if (menuLabel === "Connect" && ctx.workflowMode === "upload") ctx.handleConnectToBoard();
                        }}>
                        {menuLabel}
                    </span>
                ))}
            </div>

            <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
                <div style={{ background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <input value={ctx.projectName} onChange={(e) => ctx.setProjectName(e.target.value)}
                        style={{ background: "transparent", border: "none", color: "#fff", width: 90, outline: "none", fontSize: 14, fontWeight: 500 }} />
                    <Save size={15} style={{ opacity: 0.8, cursor: "pointer" }} onClick={ctx.handleSaveProject} title="Save Project" />
                </div>

                <div style={{ display: "flex", background: "rgba(0,0,0,0.2)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ padding: "5px 10px", background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 15, fontWeight: 600 }}>Mode</div>
                    {["ide", "stage", "upload"].map(mode => (
                        <button key={mode} onClick={() => ctx.setWorkflowMode(mode)} style={{
                            padding: "5px 10px", border: "none",
                            background: ctx.workflowMode === mode ? "#7C3AED" : "transparent",
                            color: ctx.workflowMode === mode ? "#fff" : "rgba(255,255,255,0.8)",
                            fontSize: 15, fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                        }}>{mode === "ide" ? "IDE" : mode.charAt(0).toUpperCase() + mode.slice(1)}</button>
                    ))}
                </div>

                <button onClick={() => { if (ctx.workflowMode !== "upload") ctx.setWorkflowMode("upload"); else ctx.handleUploadFirmware(); }}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 500 }}>
                    <Upload size={15} /> {ctx.workflowMode === "upload" ? "Upload Code" : "Open Upload"}
                </button>
            </div>

            <div style={{ marginLeft: 12, display: 'flex', alignItems: 'center', flexShrink: 0, pointerEvents: 'none' }}>
                <CreoleapLogo height={200} style={{ pointerEvents: 'none' }} />
            </div>
        </header>
    );
}
