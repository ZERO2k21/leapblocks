/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useEffect } from "react";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

// ─── Lazy Monaco loader config to avoid TDZ errors in production builds ───
let _loaderConfigured = false;
function ensureLoaderConfig() {
    if (_loaderConfigured) return;
    _loaderConfigured = true;
    loader.config({ monaco });
}

// Configure Monaco to load Vite-bundled workers
if (typeof window !== 'undefined') {
    window.MonacoEnvironment = {
        getWorker: function (_workerId, label) {
            if (label === 'json') return new jsonWorker();
            if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
            if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
            if (label === 'typescript' || label === 'javascript') return new tsWorker();
            return new editorWorker();
        }
    };
}



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
        <div className="flex-1 h-full overflow-hidden min-h-0 flex">
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
