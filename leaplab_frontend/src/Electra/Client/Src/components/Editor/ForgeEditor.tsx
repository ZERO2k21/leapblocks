import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useForgeStore } from '../../../utlis/store/useForgeStore';

interface ForgeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

export const ForgeEditor: React.FC<ForgeEditorProps> = ({ code, onChange }) => {
  const MonacoEditor = Editor as any;
  const uiTheme = useForgeStore(s => s.uiTheme);
  const isDark = uiTheme !== 'light';
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
      {/* Filename tab bar */}
      <div
        className="flex items-center shrink-0"
        style={{
          height: '30px',
          padding: '0 12px',
          gap: '2px',
          background: isDark ? 'rgba(10, 12, 16, 0.3)' : 'rgba(241, 245, 249, 0.6)',
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.05)'}`,
        }}
      >
        <div
          className="flex items-center relative"
          style={{
            gap: '6px',
            padding: '0 12px',
            height: '100%',
            fontSize: '11px',
            fontWeight: 500,
            fontFamily: "'JetBrains Mono', monospace",
            color: isDark ? 'rgba(226, 232, 240, 0.8)' : '#334155',
            cursor: 'default',
            userSelect: 'none',
          }}
        >
          {/* Active indicator line */}
          <div
            className="absolute top-0 left-2 right-2"
            style={{
              height: '2px',
              borderRadius: '0 0 2px 2px',
              background: 'var(--lp-accent-primary)',
              opacity: 0.6,
            }}
          />
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
