/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from "react";
import { Play, Square, Trash2, Package, CornerDownLeft } from "lucide-react";
import PipPanel from "../panels/PipPanel";

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
    const [terminalHeight, setTerminalHeight] = useState(
        typeof window !== 'undefined' && window.innerWidth < 768 ? 160 : 220
    );

    useEffect(() => {
        const handleResize = () => {
            setTerminalHeight(window.innerWidth < 768 ? 160 : 220);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const tabs = [
        { id: "terminal", label: "Terminal", icon: <span style={{ fontSize: 12 }}>▶</span> },
        { id: "repl", label: "REPL", icon: <span style={{ fontSize: 11 }}>{">>>"}</span> },
        { id: "shell", label: "Shell", icon: <span style={{ fontSize: 12, fontFamily: "monospace" }}>$_</span> },
    ];

    return (
        <div style={{ height: terminalHeight, display: "flex", flexDirection: "column", borderTop: `1px solid ${C.BORDER}`, background: "#fff", flexShrink: 0 }}>
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
                <div
                    onClick={() => {
                        if (isWaitingForInput) {
                            terminalInputRef.current?.focus();
                        }
                    }}
                    style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#1E1E1E", cursor: isWaitingForInput ? "text" : "default" }}
                >
                    <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", fontFamily: "'Fira Code', Consolas, monospace", fontSize: 13, lineHeight: 1.6 }}>
                        {terminalOutput.length === 0 ? (
                            <div style={{ color: "#6A9955", fontStyle: "italic" }}>
                                <div>// LeapBlocks Python Terminal</div>
                                <div>// Click Run or Run All to execute</div>
                                <div>// Open the REPL tab for interactive commands</div>
                            </div>
                        ) : terminalOutput.map((log, i) => (
                            <div
                                key={i}
                                style={{
                                    color: log.type === "error" ? "#F44747"
                                        : log.type === "success" ? "#6A9955"
                                            : log.type === "info" ? (log.text.includes("🤖") || log.text.includes("➡️") || log.text.includes("🏃") || log.text.includes("🎭")) ? "#9CDCFE" : "#569CD6"
                                                : log.type === "warning" ? "#FFD700"
                                                    : log.type === "repl-in" ? "#C586C0"
                                                        : "#D4D4D4",
                                    marginBottom: 2,
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    borderLeft: (log.text.includes("🤖") || log.text.includes("➡️") || log.text.includes("🏃") || log.text.includes("🎭")) ? "2px solid #9CDCFE" : "none",
                                    paddingLeft: (log.text.includes("🤖") || log.text.includes("➡️") || log.text.includes("🏃") || log.text.includes("🎭")) ? "8px" : (log.type === "repl-in" ? 0 : 4),
                                }}
                            >
                                {log.type === "repl-in" ? <span style={{ userSelect: "none", color: "#6A9955" }}>{">>> "}</span> : null}
                                {log.type === "error" && !log.text.startsWith("✗") ? <span style={{ color: "#F44747" }}>✗ </span> : null}
                                {log.text}
                            </div>
                        ))}
                        {isWaitingForInput && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontFamily: "'Fira Code', Consolas, monospace", fontSize: 13 }}>
                                {inputPromptText ? (
                                    <span style={{ color: "#CE9178" }}>{inputPromptText}</span>
                                ) : (
                                    <span style={{ color: "#7C3AED", fontWeight: "bold" }}>❯ </span>
                                )}
                                <input
                                    ref={terminalInputRef}
                                    value={terminalInputValue}
                                    onChange={(e) => setTerminalInputValue(e.target.value)}
                                    onKeyDown={handleTerminalInputKey}
                                    style={{
                                        flex: 1,
                                        border: "none",
                                        outline: "none",
                                        fontFamily: "'Fira Code', Consolas, monospace",
                                        fontSize: 13,
                                        background: "transparent",
                                        color: "#D4D4D4",
                                        caretColor: "#D4D4D4",
                                    }}
                                    autoFocus
                                />
                            </div>
                        )}
                        {isRunning && !isWaitingForInput && (
                            <div style={{ color: "#569CD6", marginTop: 4 }}>
                                <span style={{ animation: "blink 1s infinite" }}>▋</span> Running...
                            </div>
                        )}
                        <div ref={terminalEndRef} />
                    </div>
                </div>
            )}

            {activePanel === "repl" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ padding: "6px 14px", fontSize: 11, color: isWaitingForInput ? "#CE9178" : C.MUTED, borderBottom: `1px solid ${C.BORDER}` }}>
                        {isWaitingForInput
                            ? "⌨ Program needs input — type your response and press Enter"
                            : "Interactive Python REPL - type commands and press Enter"}
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", fontFamily: "'Fira Code', Consolas, monospace", fontSize: 13, lineHeight: 1.6 }}>
                        {isWaitingForInput ? (
                            <div style={{ color: "#CE9178", marginBottom: 8 }}>
                                <span style={{ fontWeight: 600 }}>⏸ Program paused for input</span>
                                <div style={{ marginTop: 4, fontStyle: "italic" }}>"{inputPromptText}"</div>
                                <div style={{ marginTop: 8, color: C.MUTED }}>Type your response below and press Enter to continue.</div>
                            </div>
                        ) : (
                            <>
                                <div style={{ color: C.MUTED }}>Python 3 — LeapBlocks Interactive Shell</div>
                                <div style={{ color: C.MUTED, marginBottom: 8 }}>Type Python code and press Enter. Use up/down arrows for history.</div>
                            </>
                        )}
                    </div>
                    <div style={{ display: "flex", borderTop: `1px solid ${C.BORDER}`, padding: "6px 10px", alignItems: "center", gap: 8, background: "#FAFAFA" }}>
                        <span style={{ color: isWaitingForInput ? "#CE9178" : C.PURPLE, fontFamily: "monospace", fontWeight: 700, fontSize: 14 }}>
                            {isWaitingForInput ? "⌨" : ">>>"}
                        </span>
                        <input
                            ref={replInputRef}
                            value={replInput}
                            onChange={(e) => setReplInput(e.target.value)}
                            onKeyDown={handleReplKey}
                            placeholder={isWaitingForInput ? "Provide response to program input..." : "Enter Python expression or statement..."}
                            style={{ flex: 1, border: "none", outline: "none", fontFamily: "'Fira Code', monospace", fontSize: 13, background: "transparent", color: C.TEXT }}
                        />
                        <button
                            onClick={handleReplSubmit}
                            style={{ padding: "4px 12px", background: C.PURPLE, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                        >
                            {isWaitingForInput ? "Send" : "Run"}
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

            {activePanel === "shell" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {!isElectron ? (
                        <div style={{
                            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            padding: 24, background: "#1E1E1E",
                        }}>
                            <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.5 }}>⚠</div>
                            <div style={{ color: "#FFD700", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                                Shell is only available in desktop mode
                            </div>
                            <div style={{ color: "#888", fontSize: 12, textAlign: "center", lineHeight: 1.5 }}>
                                Install the LeapLab desktop app (.exe) for full terminal support.<br />
                                You can then run commands like <span style={{ color: "#9CDCFE", fontFamily: "monospace" }}>pip install numpy</span> directly.
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ padding: "6px 14px", fontSize: 11, color: C.MUTED, borderBottom: `1px solid ${C.BORDER}`, background: "#FAFAFA" }}>
                                System shell — type commands like <span style={{ fontFamily: "monospace", color: C.PURPLE }}>pip install numpy</span> and press Enter
                            </div>
                            <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", fontFamily: "'Fira Code', Consolas, monospace", fontSize: 13, lineHeight: 1.6, background: "#1E1E1E" }}>
                                {terminalOutput.length === 0 ? (
                                    <>
                                        <div style={{ color: "#6A9955", fontStyle: "italic", marginBottom: 8 }}>
                                            $ pip install &lt;package&gt;  — install Python packages
                                        </div>
                                        <div style={{ color: "#6A9955", fontStyle: "italic", marginBottom: 8 }}>
                                            $ python -c "import &lt;module&gt;"  — verify installation
                                        </div>
                                        <div style={{ color: "#6A9955", fontStyle: "italic", marginBottom: 12 }}>
                                            $ python -m pip list  — list installed packages
                                        </div>
                                        <div style={{ color: "#569CD6", marginBottom: 4, fontSize: 11 }}>────────────────────────────────────────</div>
                                    </>
                                ) : terminalOutput.map((log, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            color: log.type === "error" ? "#F44747"
                                                : log.type === "success" ? "#6A9955"
                                                    : log.type === "warning" ? "#FFD700"
                                                        : log.type === "repl-in" ? "#C586C0"
                                                            : "#D4D4D4",
                                            marginBottom: 2,
                                            whiteSpace: "pre-wrap",
                                            wordBreak: "break-word",
                                            paddingLeft: log.type === "repl-in" ? 0 : 4,
                                        }}
                                    >
                                        {log.type === "repl-in" ? <span style={{ userSelect: "none", color: "#6A9955" }}>$ </span> : null}
                                        {log.type === "error" && !log.text.startsWith("✗") ? <span style={{ color: "#F44747" }}>✗ </span> : null}
                                        {log.text}
                                    </div>
                                ))}
                                <div ref={terminalEndRef} />
                            </div>
                            <div style={{ display: "flex", borderTop: `1px solid ${C.BORDER}`, padding: "6px 10px", alignItems: "center", gap: 8, background: "#1E1E1E" }}>
                                <span style={{ color: "#6A9955", fontFamily: "monospace", fontWeight: 700, fontSize: 14 }}>$</span>
                                <input
                                    ref={shellInputRef}
                                    value={shellInput}
                                    onChange={(e) => setShellInput(e.target.value)}
                                    onKeyDown={handleShellKey}
                                    placeholder="Type a command and press Enter..."
                                    style={{
                                        flex: 1, border: "none", outline: "none",
                                        fontFamily: "'Fira Code', monospace", fontSize: 13,
                                        background: "transparent", color: "#D4D4D4",
                                        caretColor: "#D4D4D4",
                                    }}
                                    autoFocus={activePanel === "shell"}
                                />
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
