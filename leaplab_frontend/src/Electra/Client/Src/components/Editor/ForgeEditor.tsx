import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useForgeStore } from '../../../utils/store/useForgeStore';

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
    <div className="forge-editor-container h-full w-full overflow-hidden flex flex-col">
      {/* Filename tab bar */}
      <div
        className={`flex items-center shrink-0 h-[30px] px-[16px] md:px-[20px] gap-[2px] ${
          isDark ? 'bg-[rgba(10,12,16,0.3)]' : 'bg-white'
        }`}
        style={{
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(226, 232, 240, 1)'}`,
        }}
      >
        <div
          className={`flex items-center relative gap-[6px] px-[12px] h-full text-[11px] font-medium cursor-default select-none ${
            isDark ? 'text-[rgba(226,232,240,0.8)]' : 'text-[#334155]'
          }`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {/* Active indicator line */}
          <div
            className="absolute top-0 left-2 right-2 h-[2px] rounded-[0_0_2px_2px] opacity-60"
            style={{ background: 'var(--lp-accent-primary)' }}
          />
          sketch.ino
        </div>
      </div>

      <div className={`flex-1 min-h-0 p-[8px_16px] ${isDark ? 'bg-[#14161c]' : 'bg-[#ffffff]'}`}>
        <MonacoEditor
          height="100%"
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
    </div>
  );
};

export default ForgeEditor;
