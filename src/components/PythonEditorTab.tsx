import React, { useEffect, useState } from 'react';
import Blockly from '@blockly-runtime';
import { pythonGenerator } from '../generators/python-generator';


interface PythonEditorTabProps {
    workspace: Blockly.WorkspaceSvg | null;
    onOpenFullIDE?: () => void;
}

export const PythonEditorTab: React.FC<PythonEditorTabProps> = ({ workspace, onOpenFullIDE }) => {
    const [code, setCode] = useState<string>('# Generated Python code will appear here\n');
    const [renderError, setRenderError] = useState<string | null>(null);

    useEffect(() => {
        if (!workspace) return;

        const updateCode = () => {
            try {
                if (pythonGenerator && typeof pythonGenerator.workspaceToCode === 'function') {
                    const generatedCode = pythonGenerator.workspaceToCode(workspace);
                    setCode(generatedCode || '# No blocks in workspace');
                    setRenderError(null);
                } else {
                    setCode('# Python generator is not available. Make sure python-generator.ts is loaded.');
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
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>PYTHON CODE</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {onOpenFullIDE && (
                        <button
                            onClick={onOpenFullIDE}
                            style={{
                                padding: '4px 10px',
                                fontSize: '11px',
                                background: 'linear-gradient(135deg, #3776ab, #ffd343)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            🐍 Open in Python IDE
                        </button>
                    )}
                    <button
                        onClick={() => navigator.clipboard.writeText(code)}
                        style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            backgroundColor: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        📋 Copy Python
                    </button>
                </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', padding: '10px' }}>
                {renderError ? (
                    <div style={{ color: '#ff5555', fontFamily: 'monospace', padding: '10px' }}>
                        <strong>Error:</strong> {renderError}
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
                            fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                            fontSize: '13px',
                            lineHeight: '1.6',
                            resize: 'none',
                            outline: 'none',
                            padding: '15px',
                            whiteSpace: 'pre',
                            overflow: 'auto'
                        }}
                    />
                )}
            </div>
        </div>
    );
};
