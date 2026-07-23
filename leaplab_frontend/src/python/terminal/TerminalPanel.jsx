/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from "react";
import { Play, Square, Trash2, Package, CornerDownLeft } from "lucide-react";
import PipPanel from "../panels/PipPanel";

const getLogTextColor = (type, text) => {
    if (type === "error") return "text-[#F44747]";
    if (type === "success") return "text-[#6A9955]";
    if (type === "info") return (text.includes("🤖") || text.includes("➡️") || text.includes("🏃") || text.includes("🎭")) ? "text-[#9CDCFE]" : "text-[#569CD6]";
    if (type === "warning") return "text-[#FFD700]";
    if (type === "repl-in") return "text-[#C586C0]";
    return "text-[#D4D4D4]";
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
        { id: "repl", label: "REPL", icon: <span className="text-[11px]">{">>>"}</span> },
        { id: "shell", label: "Shell", icon: <span className="text-xs font-mono">$_</span> },
    ];

    return (
        <div className="flex flex-col border-t border-gray-200 bg-white shrink-0" style={{ height: terminalHeight }}>
            <div className="flex bg-[#F5F5F5] border-b border-gray-200 h-8 items-center">
                {tabs.map(({ id, label, icon }) => (
                    <div
                        key={id}
                        onClick={() => {
                            setActivePanel(id);
                            if (id === "repl") {
                                setTimeout(() => replInputRef.current?.focus(), 80);
                            }
                        }}
                        className={`px-3.5 h-full flex items-center gap-1.5 cursor-pointer text-xs font-semibold border-b-2 transition-colors ${
                            activePanel === id
                                ? "text-[#8B5CF6] border-[#8B5CF6] bg-white"
                                : "text-gray-500 border-transparent bg-transparent"
                        }`}
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
                    className={`flex-1 flex flex-col overflow-hidden bg-[#1E1E1E] ${isWaitingForInput ? "cursor-text" : "cursor-default"}`}
                >
                    <div className="flex-1 overflow-y-auto py-2 px-3.5 font-mono text-xs leading-relaxed">
                        {terminalOutput.length === 0 ? (
                            <div className="text-[#6A9955] italic">
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
                                            ? "border-l-2 border-[#9CDCFE] pl-2"
                                            : log.type === "repl-in"
                                                ? "pl-0"
                                                : "pl-1"
                                    }`}
                                >
                                    {log.type === "repl-in" ? <span className="select-none text-[#6A9955]">{">>> "}</span> : null}
                                    {log.type === "error" && !log.text.startsWith("✗") ? <span className="text-[#F44747]">✗ </span> : null}
                                    {log.text}
                                </div>
                            );
                        })}
                        {isWaitingForInput && (
                            <div className="flex items-center gap-1.5 mt-1 font-mono text-xs">
                                {inputPromptText ? (
                                    <span className="text-[#CE9178]">{inputPromptText}</span>
                                ) : (
                                    <span className="text-[#8B5CF6] font-bold">❯ </span>
                                )}
                                <input
                                    ref={terminalInputRef}
                                    value={terminalInputValue}
                                    onChange={(e) => setTerminalInputValue(e.target.value)}
                                    onKeyDown={handleTerminalInputKey}
                                    className="flex-1 border-none outline-none font-mono text-xs bg-transparent text-[#D4D4D4] caret-[#D4D4D4]"
                                    autoFocus
                                />
                            </div>
                        )}
                        {isRunning && !isWaitingForInput && (
                            <div className="text-[#569CD6] mt-1">
                                <span className="animate-pulse">▋</span> Running...
                            </div>
                        )}
                        <div ref={terminalEndRef} />
                    </div>
                </div>
            )}

            {activePanel === "repl" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className={`py-1.5 px-3.5 text-[11px] border-b border-gray-200 ${isWaitingForInput ? "text-[#CE9178]" : "text-gray-500"}`}>
                        {isWaitingForInput
                            ? "⌨ Program needs input — type your response and press Enter"
                            : "Interactive Python REPL - type commands and press Enter"}
                    </div>
                    <div className="flex-1 overflow-y-auto py-2 px-3.5 font-mono text-xs leading-relaxed">
                        {isWaitingForInput ? (
                            <div className="text-[#CE9178] mb-2">
                                <span className="font-semibold">⏸ Program paused for input</span>
                                <div className="mt-1 italic">"{inputPromptText}"</div>
                                <div className="mt-2 text-gray-500">Type your response below and press Enter to continue.</div>
                            </div>
                        ) : (
                            <>
                                <div className="text-gray-500">Python 3 — LeapBlocks Interactive Shell</div>
                                <div className="text-gray-500 mb-2">Type Python code and press Enter. Use up/down arrows for history.</div>
                            </>
                        )}
                    </div>
                    <div className="flex border-t border-gray-200 py-1.5 px-2.5 items-center gap-2 bg-[#FAFAFA]">
                        <span className={`font-mono font-bold text-sm ${isWaitingForInput ? "text-[#CE9178]" : "text-[#8B5CF6]"}`}>
                            {isWaitingForInput ? "⌨" : ">>>"}
                        </span>
                        <input
                            ref={replInputRef}
                            value={replInput}
                            onChange={(e) => setReplInput(e.target.value)}
                            onKeyDown={handleReplKey}
                            placeholder={isWaitingForInput ? "Provide response to program input..." : "Enter Python expression or statement..."}
                            className="flex-1 border-none outline-none font-mono text-xs bg-transparent text-gray-800"
                        />
                        <button
                            onClick={handleReplSubmit}
                            className="py-1 px-3 bg-[#8B5CF6] hover:bg-violet-600 text-white border-none rounded-md cursor-pointer text-xs font-bold transition-colors"
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
                        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#1E1E1E]">
                            <div className="text-2xl mb-3 opacity-50">⚠</div>
                            <div className="text-[#FFD700] text-sm font-semibold mb-2">
                                Shell is only available in desktop mode
                            </div>
                            <div className="text-gray-400 text-xs text-center leading-relaxed">
                                Install the LeapLab desktop app (.exe) for full terminal support.<br />
                                You can then run commands like <span className="text-[#9CDCFE] font-mono">pip install numpy</span> directly.
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="py-1.5 px-3.5 text-[11px] text-gray-500 border-b border-gray-200 bg-[#FAFAFA]">
                                System shell — type commands like <span className="font-mono text-[#8B5CF6]">pip install numpy</span> and press Enter
                            </div>
                            <div className="flex-1 overflow-y-auto py-2 px-3.5 font-mono text-xs leading-relaxed bg-[#1E1E1E]">
                                {terminalOutput.length === 0 ? (
                                    <>
                                        <div className="text-[#6A9955] italic mb-2">
                                            $ pip install &lt;package&gt;  — install Python packages
                                        </div>
                                        <div className="text-[#6A9955] italic mb-2">
                                            $ python -c "import &lt;module&gt;"  — verify installation
                                        </div>
                                        <div className="text-[#6A9955] italic mb-3">
                                            $ python -m pip list  — list installed packages
                                        </div>
                                        <div className="text-[#569CD6] mb-1 text-[11px]">────────────────────────────────────────</div>
                                    </>
                                ) : terminalOutput.map((log, i) => (
                                    <div
                                        key={i}
                                        className={`mb-0.5 whitespace-pre-wrap break-words ${getLogTextColor(log.type, log.text)} ${
                                            log.type === "repl-in" ? "pl-0" : "pl-1"
                                        }`}
                                    >
                                        {log.type === "repl-in" ? <span className="select-none text-[#6A9955]">$ </span> : null}
                                        {log.type === "error" && !log.text.startsWith("✗") ? <span className="text-[#F44747]">✗ </span> : null}
                                        {log.text}
                                    </div>
                                ))}
                                <div ref={terminalEndRef} />
                            </div>
                            <div className="flex border-t border-gray-200 py-1.5 px-2.5 items-center gap-2 bg-[#1E1E1E]">
                                <span className="text-[#6A9955] font-mono font-bold text-sm">$</span>
                                <input
                                    ref={shellInputRef}
                                    value={shellInput}
                                    onChange={(e) => setShellInput(e.target.value)}
                                    onKeyDown={handleShellKey}
                                    placeholder="Type a command and press Enter..."
                                    className="flex-1 border-none outline-none font-mono text-xs bg-transparent text-[#D4D4D4] caret-[#D4D4D4]"
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
