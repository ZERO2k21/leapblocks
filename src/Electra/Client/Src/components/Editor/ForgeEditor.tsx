import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useForgeStore } from '../../../utlis/store/useForgeStore';

interface ForgeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

export const ForgeEditor: React.FC<ForgeEditorProps> = ({ code, onChange }) => {
  const MonacoEditor = Editor as any;
  const {uiTheme } = useForgeStore();
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Define custom high-contrast themes for Electra editor
    monaco.editor.defineTheme('electra-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'delimiter', foreground: '#f8fafc' }, // High-contrast white for semicolons, commas, brackets
        { token: 'punctuation', foreground: '#f8fafc' },
      ],
      colors: {
        'editor.background': '#14161c',
      }
    });

    monaco.editor.defineTheme('electra-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'delimiter', foreground: '#0f172a' }, // Solid dark for light theme
        { token: 'punctuation', foreground: '#0f172a' },
      ],
      colors: {
        'editor.background': '#ffffff',
      }
    });

    // Set the theme immediately
    monaco.editor.setTheme(uiTheme === 'light' ? 'electra-light' : 'electra-dark');

    // Force space to always route through Monaco's "type" action
    editor.onKeyDown((e: any) => {
      if (
        e.keyCode === monaco.KeyCode.Space &&
        !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
      ) {
        e.preventDefault();
        e.stopPropagation();
        editor.trigger('keyboard', 'type', { text: ' ' });
      }
    });
  };

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
        theme={uiTheme === 'light' ? 'electra-light' : 'electra-dark'}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14, // 14px default Arduino IDE font size for perfect legibility
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontFamily: "Consolas, 'Courier New', monospace", // Standard Arduino IDE Windows font stack
          fontLigatures: false, // Standard clean character spacing
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
