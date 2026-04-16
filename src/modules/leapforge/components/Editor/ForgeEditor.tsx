/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface ForgeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

export const ForgeEditor: React.FC<ForgeEditorProps> = ({ code, onChange }) => {
  const MonacoEditor = Editor as any;

  return (
    <div className="forge-editor-container" style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      <div className="editor-tab-bar" style={{ 
        height: '35px', 
        background: '#1a1a1b', 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 10px',
        borderBottom: '1px solid #2d2d2d'
      }}>
        <div style={{ 
          color: '#e0e0e0', 
          fontSize: '12px', 
          fontWeight: 600, 
          padding: '8px 12px',
          background: '#2d2d2b',
          borderRadius: '4px 4px 0 0',
          cursor: 'pointer'
        }}>
          sketch.ino
        </div>
      </div>
      
      <MonacoEditor
        height="calc(100% - 35px)"
        defaultLanguage="cpp"
        value={code}
        onChange={onChange}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          cursorBlinking: "smooth",
          padding: { top: 10 },
          lineNumbers: "on",
          roundedSelection: true,
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default ForgeEditor;
