/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import FileTabs from "../editor/FileTabs";
import MonacoEditor from "../editor/MonacoEditor";
import StatusBar from "../editor/StatusBar";
import TerminalPanel from "../terminal/TerminalPanel";

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
    handleReplSubmit,
    handleReplKey,
    terminalEndRef,
    replInputRef,
    editorRef,
    monacoRef,
    setProjectFiles,
    onCursorChange,
    packages,
    pipFilter,
    setPipFilter,
    handleInstall,
    isWaitingForInput,
    inputPromptText,
    terminalInputValue,
    setTerminalInputValue,
    handleTerminalInputSubmit,
    handleTerminalInputKey,
    terminalInputRef,
    isElectron,
    shellInput,
    setShellInput,
    handleShellSubmit,
    handleShellKey,
    shellInputRef,
}) {
    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <FileTabs
                projectFiles={projectFiles}
                activeFile={activeFile}
                setActiveFile={setActiveFile}
            />

            <MonacoEditor
                projectFiles={projectFiles}
                activeFile={activeFile}
                setProjectFiles={setProjectFiles}
                editorRef={editorRef}
                monacoRef={monacoRef}
                editorCursor={editorCursor}
                isRunning={isRunning}
                onRun={onRun}
                onCursorChange={onCursorChange}
            />

            <StatusBar
                editorCursor={editorCursor}
                isRunning={isRunning}
                activeFile={activeFile}
            />

            <TerminalPanel
                activePanel={activePanel}
                setActivePanel={setActivePanel}
                terminalOutput={terminalOutput}
                replInput={replInput}
                setReplInput={setReplInput}
                handleReplSubmit={handleReplSubmit}
                handleReplKey={handleReplKey}
                terminalEndRef={terminalEndRef}
                replInputRef={replInputRef}
                isRunning={isRunning}
                onRun={onRun}
                onStop={onStop}
                onClear={onClear}
                packages={packages}
                pipFilter={pipFilter}
                setPipFilter={setPipFilter}
                handleInstall={handleInstall}
                isWaitingForInput={isWaitingForInput}
                inputPromptText={inputPromptText}
                terminalInputValue={terminalInputValue}
                setTerminalInputValue={setTerminalInputValue}
                handleTerminalInputSubmit={handleTerminalInputSubmit}
                handleTerminalInputKey={handleTerminalInputKey}
                terminalInputRef={terminalInputRef}
                isElectron={isElectron}
                shellInput={shellInput}
                setShellInput={setShellInput}
                handleShellSubmit={handleShellSubmit}
                handleShellKey={handleShellKey}
                shellInputRef={shellInputRef}
            />
        </div>
    );
}
