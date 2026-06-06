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

    const addLog = useCallback((text, type = "log") => {
        setTerminalOutput(prev => [...prev, { text, type, ts: new Date() }]);
    }, []);

    const clearTerminal = useCallback(() => {
        setTerminalOutput([]);
    }, []);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [terminalOutput]);

    return {
        terminalOutput,
        setTerminalOutput,
        terminalEndRef,
        addLog,
        clearTerminal,
    };
}

export default useTerminal;
