/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * leapCodex/client/components/pythonEditorTab.tsx
 * React component that displays Blockly-generated Python code in real-time.
 */
import React, { useEffect, useState } from 'react';
import Blockly from '../../../leapembed/server/blockly/runtime';
import { pythonGenerator } from '../../server/generators/pythonGenerator';

interface PythonEditorTabProps {
    workspace: Blockly.WorkspaceSvg | null;
    onOpenFullIDE?: () => void;
}

export const PythonEditorTab: React.FC<PythonEditorTabProps> = ({
    workspace,
    onOpenFullIDE,
}) => {
    const [code, setCode] = useState<string>('# Generated Python code will appear here\n');
    const [renderError, setRenderError] = useState<string | null>(null);

    useEffect(() => {
        if (!workspace) return;

        const updateCode = () => {
            try {
                if (pythonGenerator && typeof pythonGenerator.workspaceToCode === 'function') {
                    const generated = pythonGenerator.workspaceToCode(workspace);
                    setCode(generated || '# No blocks in workspace');
                    setRenderError(null);
                } else {
                    setCode('# Python generator is not available.');
                }
            } catch (err: any) {
                console.error('[LeapCodex] Code generation failed:', err);
                setRenderError(err.message || String(err));
            }
        };

        updateCode();
        const listener = workspace.addChangeListener(updateCode);
        return () => { if (workspace) workspace.removeChangeListener(listener); };
    }, [workspace]);

    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            backgroundColor: '#1e1e1e',
        }}>
            {/* Header bar */}
            <div style={{
                padding: '8px 16px',
                backgroundColor: '#252526',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#cccccc',
                flexShrink: 0,
            }}>
                <span style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: 1 }}>
                    PYTHON CODE
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                    {onOpenFullIDE && (
                        <button
                            onClick={onOpenFullIDE}
                            style={{
                                padding: '4px 10px', fontSize: 11,
                                background: 'linear-gradient(135deg, #3776ab, #ffd343)',
                                color: 'white', border: 'none', borderRadius: 4,
                                cursor: 'pointer', fontWeight: 'bold',
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}
                        >
                            🐍 Open in Python IDE
                        </button>
                    )}
                    <button
                        onClick={() => navigator.clipboard.writeText(code)}
                        style={{
                            padding: '4px 10px', fontSize: 11,
                            backgroundColor: '#22c55e', color: 'white',
                            border: 'none', borderRadius: 4,
                            cursor: 'pointer', fontWeight: 'bold',
                        }}
                    >
                        📋 Copy Python
                    </button>
                </div>
            </div>

            {/* Code area */}
            <div style={{ flex: 1, overflow: 'hidden', padding: 10 }}>
                {renderError ? (
                    <div style={{ color: '#ff5555', fontFamily: 'monospace', padding: 10 }}>
                        <strong>Error:</strong> {renderError}
                    </div>
                ) : (
                    <textarea
                        readOnly
                        value={code}
                        style={{
                            width: '100%', height: '100%',
                            backgroundColor: '#1e1e1e', color: '#d4d4d4',
                            border: 'none',
                            fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                            fontSize: 13, lineHeight: '1.6',
                            resize: 'none', outline: 'none',
                            padding: 15, whiteSpace: 'pre', overflow: 'auto',
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default PythonEditorTab;
