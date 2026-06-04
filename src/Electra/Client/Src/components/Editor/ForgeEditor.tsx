import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useForgeStore } from '../../../utlis/store/useForgeStore';

interface ForgeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

export const ForgeEditor: React.FC<ForgeEditorProps> = ({ code, onChange }) => {
  const MonacoEditor = Editor as any;
  const { board, uiTheme } = useForgeStore();
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Ensure space key always inserts a space character regardless of Monaco's internal state
    editor.onKeyDown((e: any) => {
      if (
        e.keyCode === monaco.KeyCode.Space &&
        !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
      ) {
        e.preventDefault();
        e.stopPropagation();
        const position = editor.getPosition();
        if (position) {
          const range = new monaco.Range(
            position.lineNumber, position.column,
            position.lineNumber, position.column
          );
          editor.executeEdits('space-input', [
            { range, text: ' ', forceMoveMarkers: true }
          ]);
          editor.pushUndoStop();
        }
      }
    });
  };

  // Restore focus to Monaco editor after any external re-render
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
    }
  });

  return (
    <div className="forge-editor-container" style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      <div className="editor-tab-bar">
        <div className="editor-tab active">
          sketch.ino
        </div>
      </div>

      <MonacoEditor
        height="calc(100% - 28px)"
        defaultLanguage="cpp"
        value={code}
        onChange={onChange}
        theme={uiTheme === 'light' ? 'vs' : 'vs-dark'}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontFamily: board === 'esp32-c3' 
            ? "var(--code-font, 'JetBrains Mono', monospace)" 
            : "var(--code-font, 'Space Mono', monospace)",
          fontLigatures: true,
          cursorStyle: 'line',
          cursorWidth: 2,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          padding: { top: 10 },
          lineNumbers: 'on',
          roundedSelection: true,
          automaticLayout: true,
          renderLineHighlight: 'all',
          smoothScrolling: true,
        }}
      />
    </div>
  );
};

export default ForgeEditor;
