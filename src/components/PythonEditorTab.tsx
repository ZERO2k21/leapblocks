import React, { useEffect, useState } from 'react';
import * as Blockly from 'blockly';

// @ts-ignore
import { pythonGenerator } from 'blockly/python';

interface PythonEditorTabProps {
    workspace: Blockly.WorkspaceSvg | null;
}

export const PythonEditorTab: React.FC<PythonEditorTabProps> = ({ workspace }) => {
    const [code, setCode] = useState<string>('# Generated Python code will appear here\n');
    const [renderError, setRenderError] = useState<string | null>(null);

    useEffect(() => {
        if (!workspace) return;

        const updateCode = () => {
            try {
                // Use any for the generator to bypass type issues during unblocking
                const gen = pythonGenerator || (Blockly as any).Python;

                if (gen && typeof gen.workspaceToCode === 'function') {
                    const generatedCode = gen.workspaceToCode(workspace);
                    setCode(generatedCode || '# No blocks in workspace');
                    setRenderError(null);
                } else {
                    setCode('# Python generator is not available');
                }
            } catch (err: any) {
                console.error('[PythonEditorTab] Code generation failed:', err);
                setRenderError(err.message || String(err));
            }
        };

        // Initial generation
        updateCode();

        // Listen for workspace changes
        const listener = workspace.addChangeListener(updateCode);

        return () => {
            if (workspace) workspace.removeChangeListener(listener);
        };
    }, [workspace]);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e' }}>
            <div style={{
                padding: '8px 16px',
                backgroundColor: '#252526',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#cccccc'
            }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>PYTHON OUTPUT (DEBUG VIEW)</span>
                <button
                    onClick={() => navigator.clipboard.writeText(code)}
                    style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        backgroundColor: '#3c3c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer'
                    }}
                >
                    Copy
                </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', padding: '10px' }}>
                {renderError ? (
                    <div style={{ color: '#ff5555', fontFamily: 'monospace' }}>
                        Error: {renderError}
                    </div>
                ) : (
                    <textarea
                        readOnly
                        value={code}
                        style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#1e1e1e',
                            color: '#d4d4d4',
                            border: 'none',
                            fontFamily: 'Consolas, "Courier New", monospace',
                            fontSize: '14px',
                            resize: 'none',
                            outline: 'none',
                            padding: '10px'
                        }}
                    />
                )}
            </div>
        </div>
    );
};
