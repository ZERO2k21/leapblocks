/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { useLogix } from "../context/LogixContext";
import SidePanel from "../../../python/panels/SidePanel";
import MonacoEditor from "../../../python/editor/MonacoEditor";
import StatusBar from "../../../python/editor/StatusBar";
import TerminalPanel from "../../../python/terminal/TerminalPanel";
import { FileCode2, Plus } from "lucide-react";
import { C } from "../utils/theme";
import { BACKDROP_LIBRARY } from "../data/backdrops";

export default function IdeWorkspace() {
    const ctx = useLogix();

    return (
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0, background: "#1e1e2e" }}>
            {/* Left Sidebar */}
            <SidePanel
                sidePanel={ctx.sidePanel} setSidePanel={ctx.setSidePanel}
                projectFiles={ctx.projectFiles} activeFile={ctx.activeFile} setActiveFile={ctx.setActiveFile}
                handleAddPythonFiles={() => { }} handleAddImageFiles={() => { }} handleAddTextFiles={() => { }} handleAddCsvFiles={() => { }}
                handleDeleteFile={ctx.handleDeleteFile}
                onAddNewFile={ctx.handleCreateNewFile} onAddNewTextFile={ctx.handleCreateNewTextFile} onRenameFile={ctx.handleRenameFile}
                spriteFilter={ctx.spriteFilter} setSpriteFilter={ctx.setSpriteFilter}
                addSpriteFromLibrary={ctx.addSpriteFromLibrary}
                SPRITE_LIBRARY={ctx.getSpriteLibrary()} BACKDROP_LIBRARY={BACKDROP_LIBRARY}
                backdrop={ctx.backdrop} handleSetBackdrop={(bd) => { ctx.setBackdropImg(bd.img || null); ctx.addLog('Backdrop: ' + bd.name, 'success'); }}
                EXTENSIONS={ctx.EXTENSIONS} installedExtensions={ctx.installedExtensions}
                installExtension={(ext) => {
                    if (ctx.installedExtensions.find(e => e.id === ext.id)) { ctx.addLog(ext.name + ' already installed', 'info'); return; }
                    ctx.setInstalledExtensions(prev => [...prev, ext]);
                    ctx.setProjectFiles(prev => ({ ...prev, [ctx.activeFile]: (prev[ctx.activeFile] || '') + "\n" + ext.code + "\n" }));
                    ctx.addLog('Extension added: ' + ext.name, 'success');
                }}
                packages={ctx.packages} pipFilter={ctx.pipFilter} setPipFilter={ctx.setPipFilter} handleInstall={ctx.handleInstall}
            />

            {/* Center: Code Editor */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid #313244" }}>
                {Object.keys(ctx.projectFiles).length === 0 ? (
                    <div style={{
                        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        color: "#6c7086", gap: 16, fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
                    }}>
                        <FileCode2 size={48} strokeWidth={1.2} style={{ opacity: 0.4 }} />
                        <div style={{ fontSize: 16, fontWeight: 500, color: "#8b8fa3" }}>No files yet</div>
                        <div style={{ fontSize: 13, color: "#585b70" }}>Create a new file from the sidebar to get started</div>
                        <button onClick={ctx.handleCreateNewFile} style={{
                            marginTop: 8, padding: "8px 20px", background: "#7C3AED", color: "#fff",
                            border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 6,
                        }}>
                            <Plus size={14} /> New File
                        </button>
                    </div>
                ) : (
                    <>
                        <MonacoEditor
                            projectFiles={ctx.projectFiles} activeFile={ctx.activeFile}
                            setProjectFiles={ctx.setProjectFiles} editorRef={ctx.editorRef}
                            monacoRef={ctx.monacoRef} editorCursor={ctx.editorCursor}
                            isRunning={ctx.isRunning} onRun={ctx.handleRun}
                            onCursorChange={ctx.setEditorCursor}
                            editorOptions={{ theme: "vs-dark" }}
                        />
                        <StatusBar editorCursor={ctx.editorCursor} isRunning={ctx.isRunning} activeFile={ctx.activeFile} />
                    </>
                )}
            </div>

            {/* Right: Terminal / REPL */}
            <div style={{ width: 380, display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
                <style>{`.ide-terminal-full > div:first-child { height: 100% !important; flex: 1 !important; }`}</style>
                <div className="ide-terminal-full" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <TerminalPanel
                        activePanel={ctx.activePanel} setActivePanel={ctx.setActivePanel}
                        terminalOutput={ctx.terminalOutput}
                        replInput={ctx.replInput || ""} setReplInput={ctx.setReplInput || (() => { })}
                        handleReplSubmit={ctx.handleReplSubmit || (() => { })} handleReplKey={ctx.handleReplKey || (() => { })}
                        terminalEndRef={ctx.terminalEndRef} replInputRef={ctx.replInputRef || { current: null }}
                        isRunning={ctx.isRunning} onRun={ctx.handleRun} onStop={ctx.handleStop} onClear={ctx.handleClear}
                        packages={ctx.packages} pipFilter={ctx.pipFilter} setPipFilter={ctx.setPipFilter} handleInstall={ctx.handleInstall}
                        isWaitingForInput={ctx.isWaitingForInput} inputPromptText={ctx.inputPromptText}
                        terminalInputValue={ctx.terminalInputValue} setTerminalInputValue={ctx.setTerminalInputValue}
                        handleTerminalInputSubmit={ctx.handleTerminalInputSubmit} handleTerminalInputKey={ctx.handleTerminalInputKey}
                        terminalInputRef={ctx.terminalInputRef}
                    />
                </div>
            </div>
        </div>
    );
}
