import React from "react";
import { Play, Square, Trash2, Package } from "lucide-react";
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
}) {
    const tabs = [
        { id: "terminal", label: "Terminal", icon: <span style={{ fontSize: 12 }}>▶</span> },
        { id: "repl", label: "REPL", icon: <span style={{ fontSize: 11 }}>{">>>"}</span> },
    ];

    return (
        <div style={{ height: 220, display: "flex", flexDirection: "column", borderTop: `1px solid ${C.BORDER}`, background: "#fff", flexShrink: 0 }}>
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
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", fontFamily: "'Fira Code', Consolas, monospace", fontSize: 13, lineHeight: 1.6, background: "#1E1E1E" }}>
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
                    {isRunning && (
                        <div style={{ color: "#569CD6", marginTop: 4 }}>
                            <span style={{ animation: "blink 1s infinite" }}>▋</span> Running...
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
