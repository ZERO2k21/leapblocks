/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { useLogix } from "../context/LogixContext";
import MonacoEditor from "../../../python/editor/MonacoEditor";
import SerialMonitor from "../../../components/SerialMonitor";
import { FileText, FileCode2, FileUp, Trash2, Plus, Plug, Cpu, RefreshCw, Upload, Undo, Redo, Loader, CheckCircle, AlertCircle, ClipboardList, TerminalSquare } from "lucide-react";
import { C } from "../utils/theme";
import { getFileExtension, BOARD_HEADER_EXTENSIONS, BOARD_SOURCE_EXTENSIONS, isBoardUploadFile, formatPortLabel } from "../utils/boardConfig";
import { buildBoardTemplate, buildLibraryHeaderTemplate, buildLibraryCppTemplate, getUniqueLibraryBaseName, getLibraryBaseName, normalizeCppInclude, insertIncludeLineIntoSource } from "../utils/boardConfig";
import { getUniqueFileName } from "../utils/fileUtils";

export default function UploadWorkspace() {
    const ctx = useLogix();

    const handleCreateUploadPythonFile = () => {
        ctx.openTextPrompt("New MicroPython File", "Enter a file name for the new MicroPython file.", "module.py", (requestedName) => {
            let createdFileName = "";
            ctx.setUploadProjectFiles((prev) => {
                createdFileName = getUniqueFileName(requestedName, prev);
                return { ...prev, [createdFileName]: `# ${createdFileName}\n\n` };
            });
            if (createdFileName) {
                ctx.setUploadView("project");
                ctx.setUploadActiveFile(createdFileName);
                ctx.addUploadMessage(`Created ${createdFileName}`, "success");
            }
        });
    };

    const handleReplaceBoardFirmware = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".ino,.cpp,.c,.h,.hpp";
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = String(event.target?.result || "");
                ctx.setUploadProjectFiles((prev) => ({ ...prev, [ctx.activeBoardFile]: content }));
                ctx.setUploadView("board");
                ctx.setUploadActiveFile(ctx.activeBoardFile);
                ctx.addUploadMessage(`Imported board firmware into ${ctx.activeBoardFile}`, "success");
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const boardCppActions = [
        { label: "Upload a header file", description: "Import .h or .hpp files into the board workspace.", icon: FileText, onClick: () => { } },
        { label: "Upload a new cpp file", description: "Add .cpp, .cc, .c, or .ino source files.", icon: FileUp, onClick: () => { } },
        { label: "Import C++ library", description: "Insert a #include statement into the main board file.", icon: FileCode2, onClick: () => { } },
    ];

    const renderUploadOutput = () => {
        if (ctx.uploadPanelTab === "serial") {
            return <SerialMonitor baudRate={ctx.baudRate} setBaudRate={ctx.setBaudRate} lineEnding={ctx.lineEnding} setLineEnding={ctx.setLineEnding}
                messages={ctx.serialMessages} setMessages={ctx.setSerialMessages} onSendMessage={ctx.handleSendSerial} isConnected={ctx.isConnected} />;
        }
        const lines = ctx.uploadPanelTab === "log"
            ? ctx.uploadLogMessages.map((text) => ({ text, type: "info" }))
            : ctx.uploadTerminalOutput;

        return (
            <div style={{ flex: 1, overflowY: "auto", background: "#fff", padding: "12px 14px", fontFamily: "'Cascadia Code', Consolas, monospace", fontSize: 12, lineHeight: 1.55 }}>
                {lines.map((entry, index) => {
                    const type = entry.type || "info";
                    const color = type === "error" ? "#D14343" : type === "success" ? "#2E7D32" : type === "warning" ? "#A56A00" : "#4B5563";
                    return <div key={`${entry.text}-${index}`} style={{ color, marginBottom: 6 }}>{entry.text}</div>;
                })}
            </div>
        );
    };

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
            {/* Upload Toolbar */}
            <div style={{
                height: 48, background: "#fff", display: "flex", alignItems: "center",
                padding: "0 12px", justifyContent: "space-between", borderBottom: `1px solid ${C.BORDER}`, gap: 16,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", background: "#ECE7F8", border: `1px solid ${C.BORDER}` }}>
                        {["project", "board"].map(view => (
                            <button key={view} onClick={() => ctx.setUploadView(view)} style={{
                                display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "none",
                                background: ctx.uploadView === view ? C.PURPLE : "transparent",
                                color: ctx.uploadView === view ? "#fff" : C.TEXT, fontSize: 12, fontWeight: 700, cursor: "pointer",
                            }}>
                                {view === "project" ? <><FileText size={14} /> MicroPython</> : <><FileCode2 size={14} /> Board C++</>}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => ctx.setIsBoardModalOpen(true)} style={{
                        display: "flex", alignItems: "center", gap: 6, border: `1px solid ${C.BORDER}`,
                        background: "#fff", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, color: C.TEXT, cursor: "pointer",
                    }}>
                        <Cpu size={14} color={C.PURPLE} /> {ctx.selectedBoardName}
                    </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <select value={ctx.selectedPort} onChange={(e) => ctx.setSelectedPort(e.target.value)}
                        style={{ border: `1px solid ${C.BORDER}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, color: C.TEXT, minWidth: 180, outline: "none", background: "#fff" }}>
                        <option value="">{ctx.ports.length ? "Select Port" : "No Ports Found"}</option>
                        {ctx.ports.map((port) => <option key={port.path} value={port.path}>{formatPortLabel(port)}</option>)}
                    </select>
                    <button onClick={ctx.refreshPorts} title="Refresh Ports" style={{
                        width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.BORDER}`, background: "#fff",
                        color: C.TEXT, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}><RefreshCw size={15} /></button>
                    <button onClick={ctx.handleConnectToBoard} style={{
                        display: "flex", alignItems: "center", gap: 6, border: "none",
                        background: ctx.isConnected ? C.GREEN : "#EEF2FF", color: ctx.isConnected ? "#fff" : C.TEXT,
                        borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}>
                        <Plug size={14} /> {ctx.isConnected ? "Disconnect" : "Connect"}
                    </button>
                    <div style={{ width: 1, height: 22, background: C.BORDER }} />
                    <button onClick={() => ctx.editorRef.current?.trigger('keyboard', 'undo', null)} style={{ border: `1px solid ${C.BORDER}`, background: "#fff", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.TEXT }}>
                        <Undo size={15} />
                    </button>
                    <button onClick={() => ctx.editorRef.current?.trigger('keyboard', 'redo', null)} style={{ border: `1px solid ${C.BORDER}`, background: "#fff", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.TEXT }}>
                        <Redo size={15} />
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: ctx.uploadProgressMessage ? C.TEXT : C.MUTED }}>
                        {ctx.uploadProgressMessage ? (
                            ctx.isUploadingFirmware ? <Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={15} color={C.GREEN} />
                        ) : <AlertCircle size={15} color={C.MUTED} />}
                        <span>{ctx.uploadProgressMessage || "Board ready"}</span>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
                {/* Left sidebar - file list */}
                <aside style={{ width: 278, borderRight: `1px solid ${C.BORDER}`, background: "#F7F7FB", display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
                    <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.TEXT }}>Project Files</div>
                            <div style={{ fontSize: 10, color: C.MUTED, marginTop: 2 }}>
                                {ctx.uploadView === "board" ? "Main sketch, library headers, and C++ source files." : "Click a file, then type in the center editor."}
                            </div>
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: ctx.uploadView === "board" ? "8px 0 132px" : "8px 0" }}>
                        {ctx.visibleUploadFiles.map((file) => {
                            const isBoardSource = file === ctx.activeBoardFile;
                            const isSelected = ctx.uploadActiveFile === file;
                            const fileExtension = getFileExtension(file);
                            const fileCategoryLabel = isBoardSource ? ctx.selectedBoardName : BOARD_HEADER_EXTENSIONS.has(fileExtension) ? "Header library" : BOARD_SOURCE_EXTENSIONS.has(fileExtension) ? "C++ source" : "MicroPython project";
                            return (
                                <div key={file} onClick={() => ctx.setUploadActiveFile(file)} style={{
                                    padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center",
                                    justifyContent: "space-between", gap: 8,
                                    borderLeft: isSelected ? `3px solid ${C.PURPLE}` : "3px solid transparent",
                                    background: isSelected ? "#EFE8FF" : "transparent",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                        <div style={{ width: 24, height: 24, borderRadius: 6, background: isBoardSource ? "#E3F2FD" : "#E8F5E9", color: isBoardSource ? "#1D4ED8" : "#2E7D32", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            {isBoardSource ? <FileCode2 size={13} /> : <FileText size={13} />}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: C.TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file}</div>
                                            <div style={{ fontSize: 10, color: C.MUTED }}>{fileCategoryLabel}</div>
                                        </div>
                                    </div>
                                    {!ctx.protectedUploadFiles.has(file) && (
                                        <button onClick={(e) => { e.stopPropagation(); ctx.setUploadProjectFiles(prev => { const n = { ...prev }; delete n[file]; return n; }); ctx.setUploadActiveFile("main.py"); ctx.addUploadMessage(`Deleted ${file}`, "warning"); }}
                                            style={{ border: "none", background: "transparent", color: C.MUTED, cursor: "pointer", padding: 2 }} title="Delete file">
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* Center: Editor + Output */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                        <div style={{ height: 34, borderBottom: `1px solid ${C.BORDER}`, background: ctx.uploadView === "board" ? "#FFFFFF" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", fontSize: 12, color: C.TEXT, gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                {ctx.uploadActiveFile === ctx.activeBoardFile ? <FileCode2 size={14} /> : <FileText size={14} />}
                                <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ctx.uploadActiveFile}</span>
                            </div>
                            <div style={{ fontSize: 11, color: C.MUTED }}>
                                {ctx.uploadActiveFile === ctx.activeBoardFile ? `${ctx.selectedBoardName} firmware` : "MicroPython project file"}
                            </div>
                        </div>
                        <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
                            <MonacoEditor projectFiles={ctx.uploadProjectFiles} activeFile={ctx.uploadActiveFile}
                                setProjectFiles={ctx.setUploadProjectFiles} editorRef={ctx.editorRef} monacoRef={ctx.monacoRef}
                                editorCursor={ctx.editorCursor} isRunning={ctx.isUploadingFirmware}
                                onRun={ctx.handleUploadFirmware} onCursorChange={ctx.setEditorCursor}
                                editorOptions={ctx.uploadView === "board" ? { fontSize: 16, fontFamily: "Consolas, 'Courier New', monospace", lineHeight: 30, glyphMargin: false, minimap: { enabled: false } } : { minimap: { enabled: false } }} />
                        </div>
                    </div>

                    <div style={{ height: 244, borderTop: `1px solid ${C.BORDER}`, background: "#F8F9FB", display: "flex", flexDirection: "column", flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px 0", gap: 10 }}>
                            <div style={{ display: "flex", gap: 8 }}>
                                {[{ id: "terminal", label: "Terminal", icon: TerminalSquare }, { id: "log", label: "Log", icon: ClipboardList }, { id: "serial", label: "Serial Monitor", icon: Plug }].map((tab) => {
                                    const Icon = tab.icon;
                                    const active = ctx.uploadPanelTab === tab.id;
                                    return (
                                        <button key={tab.id} onClick={() => ctx.setUploadPanelTab(tab.id)} style={{
                                            display: "flex", alignItems: "center", gap: 6,
                                            border: active ? `1px solid ${C.PURPLE}` : `1px solid ${C.BORDER}`,
                                            background: active ? "#F3EEFF" : "#fff", color: active ? C.PURPLE : C.TEXT,
                                            borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                                        }}><Icon size={14} />{tab.label}</button>
                                    );
                                })}
                            </div>
                            <button onClick={ctx.handleUploadFirmware} disabled={ctx.isUploadingFirmware} style={{
                                display: "flex", alignItems: "center", gap: 8, border: "none",
                                background: ctx.isUploadingFirmware ? "#C4B5FD" : C.PURPLE, color: "#fff",
                                borderRadius: 8, padding: "9px 14px", fontSize: 12, fontWeight: 700,
                                cursor: ctx.isUploadingFirmware ? "not-allowed" : "pointer",
                            }}>
                                {ctx.isUploadingFirmware ? <Loader size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={15} />}
                                {ctx.isUploadingFirmware ? "Uploading..." : "Upload Code"}
                            </button>
                        </div>
                        <div style={{ flex: 1, minHeight: 0, padding: "10px 12px 12px" }}>
                            <div style={{ height: "100%", border: `1px solid ${C.BORDER}`, borderRadius: 10, overflow: "hidden", background: "#fff" }}>
                                {renderUploadOutput()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
