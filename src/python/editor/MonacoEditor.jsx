import React, { useEffect } from "react";
import Editor, { loader } from "@monaco-editor/react";

loader.config({
    paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" },
    'vs/nls': { availableLanguages: {} },
});

// Tell Monaco to not use web workers (avoids CSP blob: errors in Electron/strict CSP environments)
if (typeof window !== 'undefined') {
    window.MonacoEnvironment = {
        getWorker: function (_workerId, _label) {
            return null; // Fall back to main thread (no workers)
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

export default function MonacoEditor({ 
    projectFiles, 
    activeFile, 
    setProjectFiles, 
    editorRef, 
    monacoRef, 
    editorCursor, 
    isRunning, 
    onRun 
}) {
    return (
        <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
            <Editor
                height="100%"
                language="python"
                theme="vs"
                value={projectFiles[activeFile] || ""}
                onChange={(val) => setProjectFiles(prev => ({ ...prev, [activeFile]: val || "" }))}
                onMount={(editor, monaco) => {
                    editorRef.current = editor;
                    monacoRef.current = monaco;
                    editor.onDidChangeCursorPosition(e => {
                        // This would need to be passed down as a prop
                        // For now, we'll just log it
                        console.log(`Cursor position: ${e.position.lineNumber}, ${e.position.column}`);
                    });
                    // Add Ctrl+Enter to run
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                        onRun();
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
                options={{
                    fontSize: 14,
                    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                    fontLigatures: true,
                    minimap: { enabled: true },
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
                }}
            />
        </div>
    );
}
