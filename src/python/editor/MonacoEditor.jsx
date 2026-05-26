/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useEffect } from "react";
import Editor, { loader } from "@monaco-editor/react";

// ─── Lazy Monaco loader config to avoid TDZ errors in production builds ───
let _loaderConfigured = false;
function ensureLoaderConfig() {
    if (_loaderConfigured) return;
    _loaderConfigured = true;
    loader.config({
        paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" },
        'vs/nls': { availableLanguages: {} },
    });
}

// Configure Monaco to load workers from CDN (avoids file:// blob CSP issues in Electron)
if (typeof window !== 'undefined') {
    const monacoCDN = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';
    window.MonacoEnvironment = {
        getWorkerUrl: function (_workerId, label) {
            if (label === 'json')          return `${monacoCDN}/language/json/json.worker.js`;
            if (label === 'css')           return `${monacoCDN}/language/css/css.worker.js`;
            if (label === 'html')          return `${monacoCDN}/language/html/html.worker.js`;
            if (label === 'typescript' || label === 'javascript')
                return `${monacoCDN}/language/typescript/typescript.worker.js`;
            return `${monacoCDN}/editor/editor.worker.js`;
        }
    };
}

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

const getLanguageForFile = (fileName = "") => {
    const lowerFileName = fileName.toLowerCase();

    if (lowerFileName.endsWith(".ino") || lowerFileName.endsWith(".cpp") || lowerFileName.endsWith(".cc") || lowerFileName.endsWith(".c")) {
        return "cpp";
    }

    if (lowerFileName.endsWith(".h") || lowerFileName.endsWith(".hpp")) {
        return "cpp";
    }

    if (lowerFileName.endsWith(".json")) {
        return "json";
    }

    if (lowerFileName.endsWith(".md")) {
        return "markdown";
    }

    if (lowerFileName.endsWith(".csv")) {
        return "plaintext";
    }

    if (lowerFileName.endsWith(".txt")) {
        return "plaintext";
    }

    return "python";
};

export default function MonacoEditor({
    projectFiles,
    activeFile,
    setProjectFiles,
    editorRef,
    monacoRef,
    editorCursor,
    isRunning,
    onRun,
    onCursorChange,
    editorOptions = {}
}) {
    ensureLoaderConfig();
    const editorLanguage = getLanguageForFile(activeFile);
    const mergedOptions = {
        fontSize: 14,
        fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
        fontLigatures: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        lineNumbers: "on",
        glyphMargin: true,
        folding: true,
        renderLineHighlight: "line",
        tabSize: 4,
        wordWrap: "off",
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        ...editorOptions,
        minimap: {
            enabled: true,
            ...(editorOptions.minimap || {}),
        },
    };

    return (
        <div style={{ flex: 1, height: "100%", overflow: "hidden", minHeight: 0, display: "flex" }}>
            <Editor
                height="100%"
                language={editorLanguage}
                theme={"vs"}
                value={projectFiles[activeFile] || ""}
                onChange={(val) => setProjectFiles(prev => ({ ...prev, [activeFile]: val || "" }))}
                onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    monacoRef.current = monaco;
                    editor.onDidChangeCursorPosition(e => {
                        onCursorChange?.({
                            line: e.position.lineNumber,
                            col: e.position.column,
                        });
                    });
                    // Add Ctrl+Enter to run
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                        onRun?.();
                    });
                    // Add Python completions
                    monaco.languages.registerCompletionItemProvider("python", {
                        provideCompletionItems: (model, position) => {
                            const suggestions = [
                                "Sprite", "print", "input", "range", "len", "str", "int", "float", "list", "dict", "set",
                                "move_right", "move_left", "move_up", "move_down", "say", "goto", "set_x", "set_y",
                                "hide", "show", "set_size", "point_in_direction",
                            ].map(kw => ({
                                label: kw,
                                kind: monaco.languages.CompletionItemKind.Keyword,
                                insertText: kw,
                                range: model.getWordAtPosition(position) ? {
                                    startLineNumber: position.lineNumber,
                                    endLineNumber: position.lineNumber,
                                    startColumn: model.getWordAtPosition(position).startColumn,
                                    endColumn: model.getWordAtPosition(position).endColumn,
                                } : { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: position.column, endColumn: position.column }
                            }));
                            return { suggestions };
                        }
                    });
                }}
                options={mergedOptions}
            />
        </div>
    );
}
