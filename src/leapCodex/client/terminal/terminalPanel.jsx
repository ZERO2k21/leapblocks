/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from "react";
import { Play, Square, Trash2, Package } from "lucide-react";
import PipPanel from "../panels/pipPanel";

const C = {
    PURPLE: "#8B5CF6",
    BORDER: "#E5E7EB",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
};

export default function TerminalPanel({
    activePanel,
    setActivePanel,
    terminalOutput,
    replInput,
    setReplInput,
    handleReplSubmit,
    handleReplKey,
    terminalEndRef,
    replInputRef,
    isRunning,
    onRun,
    onStop,
    onClear,
    packages,
    pipFilter,
    setPipFilter,
    handleInstall,
    // When true the panel fills available vertical space (IDE mode).
    // When false (default) it uses a fixed height (Stage mode).
    fillHeight = false,
}) {
    const tabs = [
        { id: "terminal", label: "Terminal", icon: <span style={{ fontSize: 12 }}>▶</span> },
        { id: "repl", label: "REPL", icon: <span style={{ fontSize: 11 }}>{">>>"}</span> },
    ];

    const containerStyle = fillHeight
        ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", borderTop: `1px solid ${C.BORDER}`, background: "#fff" }
        : { height: 220, display: "flex", flexDirection: "column", borderTop: `1px solid ${C.BORDER}`, background: "#fff", flexShrink: 0 };

    return (
        <div style={containerStyle}>
            <div style={{ display: "flex", background: "#F5F5F5", borderBottom: `1px solid ${C.BORDER}`, height: 32, alignItems: "center" }}>
                {tabs.map(({ id, label, icon }) => (
                    <div
                        key={id}
                        onClick={() => {
                            setActivePanel(id);
                            if (id === "repl") {
                                setTimeout(() => replInputRef.current?.focus(), 80);
                            }
                        }}
                        style={{
                            padding: "0 14px",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            color: activePanel === id ? C.PURPLE : C.MUTED,
                            borderBottom: activePanel === id ? `2px solid ${C.PURPLE}` : "2px solid transparent",
                            background: activePanel === id ? "#fff" : "transparent",
                        }}
                    >
                        {icon} {label}
                    </div>
                ))}
            </div>

            {activePanel === "terminal" && (
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", fontFamily: "'Fira Code', Consolas, monospace", fontSize: 13, lineHeight: 1.6, background: "#fff" }}>
                    {terminalOutput.length === 0 ? (
                        <div style={{ color: "#22863A", fontStyle: "italic" }}>
                            <div>// LeapBlocks Python Terminal</div>
                            <div>// Click Run or Run All to execute</div>
                            <div>// Open the REPL tab for interactive commands</div>
                        </div>
                    ) : terminalOutput.map((log, i) => {
                        // Enhanced error display styling
                        const isErrorHeader = log.text.includes('═══════') || log.text.startsWith('❌');
                        const isCodeSnippet = log.text.startsWith('    ') && log.type === 'error';
                        const isPointer = log.text.trim().startsWith('^') && log.type === 'error';
                        const isSuggestion = log.text.includes('💡') || log.type === 'warning';

                        return (
                            <div
                                key={i}
                                style={{
                                    color: log.type === "error" ? (isErrorHeader ? "#D73A49" : isCodeSnippet ? "#E36209" : "#D73A49")
                                        : log.type === "success" ? "#22863A"
                                            : log.type === "info" ? (log.text.includes("[sprite]") || log.text.includes("->") || log.text.includes("[costume]") || log.text.includes("📄") || log.text.includes("📍") || log.text.includes("💡") || log.text.includes("📚")) ? "#0550AE" : "#005CC5"
                                                : log.type === "warning" ? "#E36209"
                                                    : log.type === "repl-in" ? "#6F42C1"
                                                        : "#24292E",
                                    marginBottom: 2,
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    borderLeft: (log.text.includes("[sprite]") || log.text.includes("->") || log.text.includes("[costume]")) ? "2px solid #9CDCFE"
                                        : isCodeSnippet ? "3px solid #F97583"
                                            : isSuggestion ? "3px solid #FFAB70"
                                                : "none",
                                    paddingLeft: (log.text.includes("[sprite]") || log.text.includes("->") || log.text.includes("[costume]")) ? "8px"
                                        : isCodeSnippet ? "12px"
                                            : isSuggestion ? "12px"
                                                : (log.type === "repl-in" ? 0 : 4),
                                    background: isErrorHeader ? "#FFF5F5"
                                        : isCodeSnippet ? "#FFF8F0"
                                            : isSuggestion ? "#FFFBF0"
                                                : "transparent",
                                    padding: isErrorHeader ? "4px 8px"
                                        : isCodeSnippet ? "4px 12px"
                                            : isSuggestion ? "4px 12px"
                                                : "2px 4px",
                                    borderRadius: isErrorHeader || isCodeSnippet || isSuggestion ? "4px" : "0",
                                    fontWeight: isErrorHeader ? 700 : (log.text.includes("📄") || log.text.includes("📍") || log.text.includes("💡") || log.text.includes("📚")) ? 600 : 400,
                                    fontSize: isErrorHeader ? 14 : 13,
                                }}
                            >
                                {log.type === "repl-in" ? <span style={{ userSelect: "none", color: "#22863A" }}>{">>> "}</span> : null}
                                {log.type === "error" && !log.text.startsWith("Execution Error") && !isErrorHeader && !isCodeSnippet && !log.text.includes("═══") ? <span style={{ color: "#F44747" }}>! </span> : null}
                                {log.text}
                            </div>
                        );
                    })}
                    {isRunning && (
                        <div style={{ color: "#005CC5", marginTop: 4 }}>
                            <span style={{ animation: "blink 1s infinite" }}>|</span> Running...
                        </div>
                    )}
                    <div ref={terminalEndRef} />
                </div>
            )}

            {activePanel === "repl" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ padding: "6px 14px", fontSize: 11, color: C.MUTED, borderBottom: `1px solid ${C.BORDER}` }}>
                        Interactive Python REPL - type commands and press Enter
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", fontFamily: "'Fira Code', Consolas, monospace", fontSize: 13, lineHeight: 1.6 }}>
                        <div style={{ color: C.MUTED }}>Python 3 — LeapBlocks Interactive Shell</div>
                        <div style={{ color: C.MUTED, marginBottom: 8 }}>Type Python code and press Enter. Use up/down arrows for history.</div>
                    </div>
                    <div style={{ display: "flex", borderTop: `1px solid ${C.BORDER}`, padding: "6px 10px", alignItems: "center", gap: 8, background: "#FAFAFA" }}>
                        <span style={{ color: C.PURPLE, fontFamily: "monospace", fontWeight: 700, fontSize: 14 }}>{">>>"}</span>
                        <input
                            ref={replInputRef}
                            value={replInput}
                            onChange={(e) => setReplInput(e.target.value)}
                            onKeyDown={handleReplKey}
                            placeholder="Enter Python expression or statement..."
                            style={{ flex: 1, border: "none", outline: "none", fontFamily: "'Fira Code', monospace", fontSize: 13, background: "transparent", color: C.TEXT }}
                        />
                        <button
                            onClick={handleReplSubmit}
                            style={{ padding: "4px 12px", background: C.PURPLE, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                        >
                            Run
                        </button>
                    </div>
                </div>
            )}

            {activePanel === "pip" && (
                <div style={{ flex: 1, minHeight: 0 }}>
                    <PipPanel
                        packages={packages}
                        pipFilter={pipFilter}
                        setPipFilter={setPipFilter}
                        handleInstall={handleInstall}
                    />
                </div>
            )}
        </div>
    );
}
