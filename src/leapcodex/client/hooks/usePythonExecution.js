/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { SkulptEngine } from "../../leapignite/server/engine/SkulptEngine";
import { getFallbackActiveFile } from "../utils/fileUtils";

export function usePythonExecution({ projectFiles, setProjectFiles, addLog }) {
    const [isRunning, setIsRunning] = useState(false);
    const [isWaitingForInput, setIsWaitingForInput] = useState(false);
    const [inputPromptText, setInputPromptText] = useState("");
    const [terminalInputValue, setTerminalInputValue] = useState("");
    const inputResolverRef = useRef(null);
    const terminalInputRef = useRef(null);
    const skulptRef = useRef(null);
    const runStopRequestedRef = useRef(false);

    const initSkulpt = useCallback((actions) => {
        if (!skulptRef.current) {
            skulptRef.current = new SkulptEngine({
                onOut: (text) => addLog(text.replace(/\n$/, ""), "log"),
                onErr: (text) => addLog(text, "error"),
                onInputRequested: (promptText, resolve) => {
                    inputResolverRef.current = resolve;
                    setInputPromptText(promptText || "");
                    setIsWaitingForInput(true);
                    setTerminalInputValue("");
                    setTimeout(() => terminalInputRef.current?.focus(), 80);
                },
                actions,
            });
        }
        return skulptRef.current;
    }, [addLog]);

    const handleRun = useCallback(async (activeFile, onResetStage) => {
        if (isRunning) return;
        const runFile = Object.prototype.hasOwnProperty.call(projectFiles, activeFile)
            ? activeFile
            : getFallbackActiveFile(projectFiles, activeFile);
        const code = projectFiles[runFile] || "";
        if (runFile !== activeFile) {
            // Caller should handle setActiveFile
        }
        runStopRequestedRef.current = false;
        setIsRunning(true);

        const startTime = performance.now();
        addLog(`▶ Running ${runFile}...`, "info");
        addLog(`────────────────────────────────────────`, "info");

        if (onResetStage) onResetStage();

        try {
            if (!code || code.trim() === '') {
                addLog("⚠ No code to execute. Write some Python code first!", "warning");
                setIsRunning(false);
                return;
            }

            if (window.electronAPI?.isElectron) {
                if (window.electronAPI.pythonCheck) {
                    const pythonCheck = await window.electronAPI.pythonCheck();
                    if (!pythonCheck.available) {
                        addLog(`✗ Python is not available: ${pythonCheck.error}`, "error");
                        addLog(`💡 Tip: Install Python from python.org and ensure it's in your system PATH.`, "info");
                        setIsRunning(false);
                        return;
                    }
                }

                setIsWaitingForInput(true);
                setInputPromptText("");
                setTerminalInputValue("");
                setTimeout(() => terminalInputRef.current?.focus(), 80);
                await window.electronAPI.pythonRun(code, projectFiles);
            } else {
                if (!skulptRef.current) {
                    throw new Error("Python engine (Skulpt) not initialized. Try refreshing the page.");
                }
                skulptRef.current.loadProjectFiles(projectFiles);
                await skulptRef.current.runPython(code);
                if (runStopRequestedRef.current) {
                    return;
                }

                const modifiedFiles = skulptRef.current.getModifiedFiles();
                if (Object.keys(modifiedFiles).length > 0) {
                    setProjectFiles(prev => ({ ...prev, ...modifiedFiles }));
                    const fileNames = Object.keys(modifiedFiles).join(', ');
                    addLog(`📁 Files updated: ${fileNames}`, "info");
                }

                const endTime = performance.now();
                const duration = ((endTime - startTime) / 1000).toFixed(3);
                addLog(`────────────────────────────────────────`, "info");
                addLog(`✓ Program finished successfully in ${duration}s`, "success");
            }

        } catch (e) {
            if (runStopRequestedRef.current) {
                return;
            }
            const errorMsg = typeof e === 'string' ? e : e?.message || e?.toString?.() || JSON.stringify(e) || "Unknown error";
            addLog(`────────────────────────────────────────`, "error");
            addLog(`✗ Execution Error:`, "error");
            addLog(formatErrorMessage(errorMsg), "error");

            const suggestion = getErrorSuggestion(errorMsg);
            if (suggestion) {
                addLog(`💡 Tip: ${suggestion}`, "info");
            }

            if (window.electronAPI?.isElectron) {
                setIsRunning(false);
                try { window.electronAPI.pythonStop(); } catch (_) { /* noop */ }
            }
        } finally {
            if (!window.electronAPI?.isElectron) {
                setIsRunning(false);
                setIsWaitingForInput(false);
                setInputPromptText("");
                setTerminalInputValue("");
                inputResolverRef.current = null;
            }
            runStopRequestedRef.current = false;
        }
    }, [isRunning, projectFiles, setProjectFiles, addLog]);

    const handleStop = useCallback(() => {
        const wasRunning = isRunning || Boolean(inputResolverRef.current);
        if (!wasRunning) return;
        runStopRequestedRef.current = true;
        if (window.electronAPI?.isElectron) {
            window.electronAPI.pythonStop();
        } else {
            skulptRef.current?.stop?.();
        }
        if (inputResolverRef.current) {
            inputResolverRef.current("");
            inputResolverRef.current = null;
        }
        setIsWaitingForInput(false);
        setInputPromptText("");
        setTerminalInputValue("");
        setIsRunning(false);
        addLog("⏹ Execution stopped by user.", "warning");
    }, [isRunning, addLog]);

    const handleTerminalInputSubmit = useCallback(() => {
        const val = terminalInputValue;
        if (inputResolverRef.current) {
            addLog(val, "input");
            inputResolverRef.current(val);
            inputResolverRef.current = null;
            setIsWaitingForInput(false);
            setInputPromptText("");
            setTerminalInputValue("");
        } else if (window.electronAPI?.isElectron) {
            addLog(val, "input");
            window.electronAPI.pythonSendInput(val);
            setTerminalInputValue("");
        }
    }, [terminalInputValue, addLog]);

    const handleTerminalInputKey = useCallback((e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleTerminalInputSubmit();
        }
    }, [handleTerminalInputSubmit]);

    return {
        isRunning,
        setIsRunning,
        isWaitingForInput,
        setIsWaitingForInput,
        inputPromptText,
        setInputPromptText,
        terminalInputValue,
        setTerminalInputValue,
        inputResolverRef,
        terminalInputRef,
        skulptRef,
        runStopRequestedRef,
        initSkulpt,
        handleRun,
        handleStop,
        handleTerminalInputSubmit,
        handleTerminalInputKey,
    };
}

// ── Error Helpers ─────────────────────────────────────────────────────────

function formatErrorMessage(msg) {
    let formatted = msg
        .replace(/ParseError/g, 'Syntax Error')
        .replace(/NameError/g, 'Name Error')
        .replace(/TypeError/g, 'Type Error')
        .replace(/ValueError/g, 'Value Error')
        .replace(/AttributeError/g, 'Attribute Error')
        .replace(/ImportError/g, 'Import Error')
        .replace(/IndentationError/g, 'Indentation Error');
    formatted = formatted.replace(/line (\d+)/gi, 'Line $1');
    return formatted;
}

function getErrorSuggestion(errorMsg) {
    const msg = errorMsg.toLowerCase();

    if (msg.includes('nameerror') || msg.includes('not defined')) {
        return "Check if the variable or function name is spelled correctly and defined before use.";
    }
    if (msg.includes('syntaxerror') || msg.includes('parseerror')) {
        return "Check for missing colons (:), parentheses, or quotes in your code.";
    }
    if (msg.includes('typeerror')) {
        return "Check if you're using the correct data types in your operation.";
    }
    if (msg.includes('indentationerror')) {
        return "Make sure your code indentation is consistent (use 4 spaces).";
    }
    if (msg.includes('attributeerror')) {
        return "Check if the object has the method or attribute you're trying to use.";
    }
    if (msg.includes('importerror') || msg.includes('module not found')) {
        if (msg.includes('numpy') || msg.includes('pandas') || msg.includes('matplotlib') || msg.includes('tensorflow') || msg.includes('torch') || msg.includes('opencv') || msg.includes('mediapipe') || msg.includes('sklearn') || msg.includes('pillow') || msg.includes('pygame')) {
            return "This package is not available in web Skulpt mode because it depends on native Python extensions. Use desktop Python mode or replace it with a supported built-in module.";
        }
        return "The module might not be available in Skulpt. Try using built-in modules like math, random, or time.";
    }
    if (msg.includes('timeout') || msg.includes('too long')) {
        return "Your code might have an infinite loop. Check your while/for loops.";
    }

    return null;
}

export default usePythonExecution;
