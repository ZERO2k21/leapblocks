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
        <div className="w-full h-full flex flex-col bg-zinc-900">
            <div className="py-2 px-4 bg-zinc-800 border-b border-zinc-700 flex justify-between items-center text-zinc-300">
                <span className="text-xs font-bold tracking-wider">PYTHON CODE</span>
                <div className="flex gap-2">
                    {onOpenFullIDE && (
                        <button
                            type="button"
                            onClick={onOpenFullIDE}
                            className="py-1 px-2.5 text-xs bg-gradient-to-r from-sky-600 to-amber-400 text-white border-0 rounded-md cursor-pointer font-bold flex items-center gap-1 hover:brightness-110 transition-all"
                        >
                            🐍 Open in Python IDE
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => { try { navigator.clipboard?.writeText(code).catch(() => {}); } catch (_) {} }}
                        className="py-1 px-2.5 text-xs bg-emerald-500 text-white border-0 rounded-md cursor-pointer font-bold hover:bg-emerald-600 transition-colors"
                    >
                        📋 Copy Python
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden p-2.5">
                {renderError ? (
                    <div className="text-red-400 font-mono p-2.5">
                        <strong>Error:</strong> {renderError}
                    </div>
                ) : (
                    <textarea
                        readOnly
                        value={code}
                        className="w-full h-full bg-zinc-900 text-zinc-300 border-0 font-mono text-xs leading-relaxed resize-none outline-none p-4 whitespace-pre overflow-auto"
                    />
                )}
            </div>
        </div>
    );
};
