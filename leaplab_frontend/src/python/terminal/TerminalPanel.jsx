/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from "react";
import { Play, Square, Trash2, Package, CornerDownLeft } from "lucide-react";
import PipPanel from "../panels/PipPanel";

const getLogTextColor = (type, text) => {
    if (type === "error") return "text-red-400";
    if (type === "success") return "text-emerald-400";
    if (type === "info") return (text.includes("🤖") || text.includes("➡️") || text.includes("🏃") || text.includes("🎭")) ? "text-sky-300" : "text-sky-400";
    if (type === "warning") return "text-amber-300";
    if (type === "repl-in") return "text-purple-300";
    return "text-slate-300";
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
        { id: "terminal", label: "Terminal", icon: <span className="text-xs">▶</span> },
        { id: "repl", label: "REPL", icon: <span className="text-xs font-mono">{">>>"}</span> },
        { id: "shell", label: "Shell", icon: <span className="text-xs font-mono">$_</span> },
    ];

    return (
        <div className="flex flex-col border-t border-slate-200 bg-white shrink-0" style={{ height: terminalHeight }}>
            <div className="flex bg-slate-100 border-b border-slate-200 h-8 items-center">
                {tabs.map(({ id, label, icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => {
                            setActivePanel(id);
                            if (id === "repl") {
                                setTimeout(() => replInputRef.current?.focus(), 80);
                            }
                        }}
                        className={`px-3.5 h-full flex items-center gap-1.5 cursor-pointer text-xs font-semibold border-b-2 transition-colors ${
                            activePanel === id
                                ? "text-purple-600 border-purple-600 bg-white"
                                : "text-slate-500 border-transparent bg-transparent"
                        }`}
                    >
                        {icon} {label}
                    </button>
                ))}
            </div>

            {activePanel === "terminal" && (
                <div
                    onClick={() => {
                        if (isWaitingForInput) {
                            terminalInputRef.current?.focus();
                        }
                    }}
                    className={`flex-1 flex flex-col overflow-hidden bg-zinc-900 ${isWaitingForInput ? "cursor-text" : "cursor-default"}`}
                >
                    <div className="flex-1 overflow-y-auto py-2 px-3.5 font-mono text-xs leading-relaxed">
                        {terminalOutput.length === 0 ? (
                            <div className="text-emerald-500 italic">
                                <div>// LeapBlocks Python Terminal</div>
                                <div>// Click Run or Run All to execute</div>
                                <div>// Open the REPL tab for interactive commands</div>
                            </div>
                        ) : terminalOutput.map((log, i) => {
                            const isSpecialInfo = log.text.includes("🤖") || log.text.includes("➡️") || log.text.includes("🏃") || log.text.includes("🎭");
                            return (
                                <div
                                    key={i}
                                    className={`mb-0.5 whitespace-pre-wrap break-words ${getLogTextColor(log.type, log.text)} ${
                                        isSpecialInfo
                                            ? "border-l-2 border-sky-300 pl-2"
                                            : log.type === "repl-in"
                                                ? "pl-0"
                                                : "pl-1"
                                    }`}
                                >
                                    {log.type === "repl-in" ? <span className="select-none text-emerald-500">{">>> "}</span> : null}
                                    {log.type === "error" && !log.text.startsWith("✗") ? <span className="text-red-400">✗ </span> : null}
                                    {log.text}
                                </div>
                            );
                        })}
                        {isWaitingForInput && (
                            <div className="flex items-center gap-1.5 mt-1 font-mono text-xs">
                                {inputPromptText ? (
                                    <span className="text-amber-400">{inputPromptText}</span>
                                ) : (
                                    <span className="text-purple-500 font-bold">❯ </span>
                                )}
                                <input
                                    ref={terminalInputRef}
                                    value={terminalInputValue}
                                    onChange={(e) => setTerminalInputValue(e.target.value)}
                                    onKeyDown={handleTerminalInputKey}
                                    className="flex-1 border-0 outline-none font-mono text-xs bg-transparent text-slate-300 caret-slate-300"
                                    autoFocus
                                />
                            </div>
                        )}
                        {isRunning && !isWaitingForInput && (
                            <div className="text-sky-400 mt-1">
                                <span className="animate-pulse">▋</span> Running...
                            </div>
                        )}
                        <div ref={terminalEndRef} />
                    </div>
                </div>
            )}

            {activePanel === "repl" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className={`py-1.5 px-3.5 text-xs border-b border-slate-200 ${isWaitingForInput ? "text-amber-500 font-medium" : "text-slate-500"}`}>
                        {isWaitingForInput
                            ? "⌨ Program needs input — type your response and press Enter"
                            : "Interactive Python REPL - type commands and press Enter"}
                    </div>
                    <div className="flex-1 overflow-y-auto py-2 px-3.5 font-mono text-xs leading-relaxed">
                        {isWaitingForInput ? (
                            <div className="text-amber-500 mb-2">
                                <span className="font-semibold">⏸ Program paused for input</span>
                                <div className="mt-1 italic">"{inputPromptText}"</div>
                                <div className="mt-2 text-slate-500">Type your response below and press Enter to continue.</div>
                            </div>
                        ) : (
                            <>
                                <div className="text-slate-500">Python 3 — LeapBlocks Interactive Shell</div>
                                <div className="text-slate-500 mb-2">Type Python code and press Enter. Use up/down arrows for history.</div>
                            </>
                        )}
                    </div>
                    <div className="flex border-t border-slate-200 py-1.5 px-2.5 items-center gap-2 bg-slate-50">
                        <span className={`font-mono font-bold text-sm ${isWaitingForInput ? "text-amber-500" : "text-purple-600"}`}>
                            {isWaitingForInput ? "⌨" : ">>>"}
                        </span>
                        <input
                            ref={replInputRef}
                            value={replInput}
                            onChange={(e) => setReplInput(e.target.value)}
                            onKeyDown={handleReplKey}
                            placeholder={isWaitingForInput ? "Provide response to program input..." : "Enter Python expression or statement..."}
                            className="flex-1 border-0 outline-none font-mono text-xs bg-transparent text-slate-800"
                        />
                        <button
                            type="button"
                            onClick={handleReplSubmit}
                            className="py-1 px-3 bg-purple-600 hover:bg-purple-700 text-white border-0 rounded-md cursor-pointer text-xs font-bold transition-colors"
                        >
                            {isWaitingForInput ? "Send" : "Run"}
                        </button>
                    </div>
                </div>
            )}

            {activePanel === "pip" && (
                <div className="flex-1 min-h-0">
                    <PipPanel
                        packages={packages}
                        pipFilter={pipFilter}
                        setPipFilter={setPipFilter}
                        handleInstall={handleInstall}
                    />
                </div>
            )}

            {activePanel === "shell" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {!isElectron ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-900">
                            <div className="text-2xl mb-3 opacity-50">⚠</div>
                            <div className="text-amber-300 text-sm font-semibold mb-2">
                                Shell is only available in desktop mode
                            </div>
                            <div className="text-slate-400 text-xs text-center leading-relaxed">
                                Install the LeapLab desktop app (.exe) for full terminal support.<br />
                                You can then run commands like <span className="text-sky-300 font-mono">pip install numpy</span> directly.
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="py-1.5 px-3.5 text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                                System shell — type commands like <span className="font-mono text-purple-600 font-semibold">pip install numpy</span> and press Enter
                            </div>
                            <div className="flex-1 overflow-y-auto py-2 px-3.5 font-mono text-xs leading-relaxed bg-zinc-900">
                                {terminalOutput.length === 0 ? (
                                    <>
                                        <div className="text-emerald-500 italic mb-2">
                                            $ pip install &lt;package&gt;  — install Python packages
                                        </div>
                                        <div className="text-emerald-500 italic mb-2">
                                            $ python -c "import &lt;module&gt;"  — verify installation
                                        </div>
                                        <div className="text-emerald-500 italic mb-3">
                                            $ python -m pip list  — list installed packages
                                        </div>
                                        <div className="text-sky-400 mb-1 text-xs">────────────────────────────────────────</div>
                                    </>
                                ) : terminalOutput.map((log, i) => (
                                    <div
                                        key={i}
                                        className={`mb-0.5 whitespace-pre-wrap break-words ${getLogTextColor(log.type, log.text)} ${
                                            log.type === "repl-in" ? "pl-0" : "pl-1"
                                        }`}
                                    >
                                        {log.type === "repl-in" ? <span className="select-none text-emerald-500">$ </span> : null}
                                        {log.type === "error" && !log.text.startsWith("✗") ? <span className="text-red-400">✗ </span> : null}
                                        {log.text}
                                    </div>
                                ))}
                                <div ref={terminalEndRef} />
                            </div>
                            <div className="flex border-t border-slate-700 py-1.5 px-2.5 items-center gap-2 bg-zinc-900">
                                <span className="text-emerald-500 font-mono font-bold text-sm">$</span>
                                <input
                                    ref={shellInputRef}
                                    value={shellInput}
                                    onChange={(e) => setShellInput(e.target.value)}
                                    onKeyDown={handleShellKey}
                                    placeholder="Type a command and press Enter..."
                                    className="flex-1 border-0 outline-none font-mono text-xs bg-transparent text-slate-300 caret-slate-300"
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
