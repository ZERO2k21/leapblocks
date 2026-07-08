/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useState, useRef, useCallback, useEffect } from "react";

export function useTerminal() {
    const [terminalOutput, setTerminalOutput] = useState([
        { text: "╔══════════════════════════════════════════════════════════════╗", type: "info", ts: new Date() },
        { text: "║  Leaplab Logix.v1.0                                          ║", type: "info", ts: new Date() },
        { text: "║  ─────────────────────────────────────────────────────────── ║", type: "info", ts: new Date() },
        { text: "║  ▶ Press Ctrl+Enter or F5 to run code                       ║", type: "info", ts: new Date() },
        { text: "║  ▶ Press Escape to stop execution                           ║", type: "info", ts: new Date() },
        { text: "║  ▶ Press Ctrl+` to toggle REPL mode                         ║", type: "info", ts: new Date() },
        { text: "║  ▶ Press Ctrl+S to save project                             ║", type: "info", ts: new Date() },
        { text: "╚══════════════════════════════════════════════════════════════╝", type: "info", ts: new Date() },
        { text: "", type: "info", ts: new Date() },
        {
            text: !window.electronAPI?.isElectron
                ? "🌐 Web Mode — Python runs in-browser via Skulpt. No install needed!"
                : "🖥 Desktop Mode — Native Python connected. Ready!",
            type: "success", ts: new Date()
        },
    ]);
    const terminalEndRef = useRef(null);

    const [shellInput, setShellInput] = useState("");
    const [shellHistory, setShellHistory] = useState([]);
    const [shellHistoryIndex, setShellHistoryIndex] = useState(-1);
    const shellInputRef = useRef(null);

    const addLog = useCallback((text, type = "log") => {
        setTerminalOutput(prev => [...prev, { text, type, ts: new Date() }]);
    }, []);

    const clearTerminal = useCallback(() => {
        setTerminalOutput([]);
    }, []);

    const handleShellSubmit = useCallback(() => {
        const cmd = shellInput.trim();
        if (!cmd) return;

        addLog(`$ ${cmd}`, "repl-in");
        setShellHistory(prev => [...prev, cmd]);
        setShellHistoryIndex(-1);

        if (window.electronAPI?.isElectron) {
            window.electronAPI.pythonShellRun(cmd);
        }

        setShellInput("");
    }, [shellInput, addLog]);

    const handleShellKey = useCallback((e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleShellSubmit();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setShellHistory(prev => {
                if (prev.length === 0) return prev;
                const newIndex = shellHistoryIndex < prev.length - 1 ? shellHistoryIndex + 1 : shellHistoryIndex;
                setShellHistoryIndex(newIndex);
                setShellInput(prev[prev.length - 1 - newIndex] || "");
                return prev;
            });
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setShellHistory(prev => {
                if (prev.length === 0) return prev;
                const newIndex = shellHistoryIndex > 0 ? shellHistoryIndex - 1 : -1;
                setShellHistoryIndex(newIndex);
                setShellInput(newIndex >= 0 ? prev[prev.length - 1 - newIndex] : "");
                return prev;
            });
        }
    }, [handleShellSubmit, shellHistoryIndex]);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [terminalOutput]);

    return {
        terminalOutput,
        setTerminalOutput,
        terminalEndRef,
        addLog,
        clearTerminal,
        shellInput,
        setShellInput,
        shellHistory,
        shellHistoryIndex,
        shellInputRef,
        handleShellSubmit,
        handleShellKey,
    };
}

export default useTerminal;
