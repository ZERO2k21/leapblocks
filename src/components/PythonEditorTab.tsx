import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Blockly from 'blockly';
import { pythonGenerator } from 'blockly/python';

interface PythonEditorTabProps {
    workspace: Blockly.WorkspaceSvg | null;
}

export const PythonEditorTab: React.FC<PythonEditorTabProps> = ({ workspace }) => {
    const [code, setCode] = useState<string>('# Generated Python code will appear here\n');

    useEffect(() => {
        if (!workspace) return;

        const updateCode = () => {
            try {
                // @ts-ignore
                const generatedCode = pythonGenerator.workspaceToCode(workspace);
                setCode(generatedCode || '# No blocks in workspace');
            } catch (err) {
                console.error('Code generation failed:', err);
                setCode('# Error generating code:\n' + err);
            }
        };

        // Initial generation
        updateCode();

        // Listen for workspace changes
        workspace.addChangeListener(updateCode);

        return () => {
            workspace.removeChangeListener(updateCode);
        };
    }, [workspace]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563' }}>Python Preview</span>
                <button
                    onClick={() => navigator.clipboard.writeText(code)}
                    style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        backgroundColor: '#FFF',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Copy Code
                </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <Editor
                    height="100%"
                    defaultLanguage="python"
                    value={code}
                    theme="vs-dark"
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                    }}
                />
            </div>
        </div>
    );
};
