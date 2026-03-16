import React from "react";
import FileTabs from "../editor/FileTabs";
import MonacoEditor from "../editor/MonacoEditor";
import StatusBar from "../editor/StatusBar";
import TerminalPanel from "../terminal/TerminalPanel";

// ─── Theme (Leapblocks Colors) ─────────────────────────────────────────────────
const C = {
    PURPLE: "#8B5CF6",
    DARK_PURPLE: "#7C3AED",
    LIGHT_PURPLE: "#EDE9FE",
    PURPLE_BG: "#F5F3FF",
    BORDER: "#E5E7EB",
    BG: "#F9FAFB",
    BG2: "#F3F4F6",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
    GREEN: "#10B981",
    RED: "#EF4444",
    BLUE: "#3B82F6",
    ORANGE: "#F59E0B",
    ACCENT: "#8B5CF6",
    HEADER_BG: "#8B5CF6",
};

export default function EditorPanel({ 
    projectFiles, 
    activeFile, 
    setActiveFile, 
    editorCursor, 
    isRunning, 
    onRun, 
    onStop, 
    onClear,
    activePanel,
    setActivePanel,
    terminalOutput,
    replInput,
    setReplInput,
    replHistory,
    replHistIdx,
    setReplHistory,
    setReplHistIdx,
    handleReplSubmit,
    handleReplKey,
    terminalEndRef,
    replInputRef,
    editorRef,
    monacoRef,
    setProjectFiles
}) {
    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* File Tabs */}
            <FileTabs 
                projectFiles={projectFiles}
                activeFile={activeFile}
                setActiveFile={setActiveFile}
            />

            {/* Monaco Editor */}
            <MonacoEditor 
                projectFiles={projectFiles}
                activeFile={activeFile}
                setProjectFiles={setProjectFiles}
                editorRef={editorRef}
                monacoRef={monacoRef}
                editorCursor={editorCursor}
                isRunning={isRunning}
                onRun={onRun}
            />

            {/* Status Bar */}
            <StatusBar 
                editorCursor={editorCursor}
                isRunning={isRunning}
                activeFile={activeFile}
            />

            {/* Terminal Panel */}
            <TerminalPanel 
                activePanel={activePanel}
                setActivePanel={setActivePanel}
                terminalOutput={terminalOutput}
                replInput={replInput}
                setReplInput={setReplInput}
                replHistory={replHistory}
                replHistIdx={replHistIdx}
                setReplHistory={setReplHistory}
                setReplHistIdx={setReplHistIdx}
                handleReplSubmit={handleReplSubmit}
                handleReplKey={handleReplKey}
                terminalEndRef={terminalEndRef}
                replInputRef={replInputRef}
                isRunning={isRunning}
                onRun={onRun}
                onStop={onStop}
                onClear={onClear}
            />
        </div>
    );
}
