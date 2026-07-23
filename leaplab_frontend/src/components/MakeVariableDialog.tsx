/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from 'react';
import Blockly from '@blockly-runtime';

interface MakeVariableDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateVariable: (variable: {
        name: string;
        type: 'Number' | 'String';
        scope: 'all_sprites' | 'this_sprite';
    }) => void;
    workspace: Blockly.WorkspaceSvg | null;
}

function MakeVariableDialog({
    isOpen,
    onClose,
    onCreateVariable,
    workspace
}: MakeVariableDialogProps) {
    const [variableName, setVariableName] = useState('');
    const [variableType, setVariableType] = useState<'Number' | 'String'>('Number');
    const [variableScope, setVariableScope] = useState<'all_sprites' | 'this_sprite'>('all_sprites');
    const [error, setError] = useState<string | null>(null);

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setVariableName('');
            setVariableType('Number');
            setVariableScope('all_sprites');
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        const trimmedName = variableName.trim();

        if (!trimmedName) {
            setError('Variable name cannot be empty');
            return;
        }

        // Check if variable already exists
        if (workspace) {
            const existingVars = workspace.getVariableMap().getAllVariables();
            const exists = existingVars.some((v: any) =>
                v.name.toLowerCase() === trimmedName.toLowerCase()
            );
            if (exists) {
                setError('A variable with this name already exists');
                return;
            }
        }

        // Create the variable in Blockly
        if (workspace) {
            try {
                const newVar = workspace.getVariableMap().createVariable(trimmedName, variableType);
                if (newVar) {
                    onCreateVariable({
                        name: trimmedName,
                        type: variableType,
                        scope: variableScope
                    });
                    onClose();
                }
            } catch (err) {
                setError('Failed to create variable. Please try again.');
                console.error('[MakeVariableDialog] Error creating variable:', err);
            }
        }
    };

    const handleCancel = () => {
        setVariableName('');
        setError(null);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && variableName.trim()) {
            handleSubmit();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
            <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] w-[420px] max-w-[90vw] font-sans overflow-hidden">
                {/* Header */}
                <div className="bg-[#FF8C1A] px-5 py-4 flex justify-between items-center rounded-t-xl">
                    <span className="text-white text-lg font-semibold">New Variable</span>
                    <button className="bg-transparent border-none text-white text-2xl cursor-pointer w-7.5 h-7.5 flex items-center justify-center rounded-full transition-colors hover:bg-white/20" onClick={handleCancel}>×</button>
                </div>

                {/* Content */}
                <div className="p-6 px-5 flex flex-col gap-5">
                    {/* Variable Name Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-800">New variable name:</label>
                        <input
                            type="text"
                            value={variableName}
                            onChange={(e) => {
                                setVariableName(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter variable name"
                            className={`p-3 px-3.5 rounded-lg border-2 text-base outline-none transition-colors font-sans ${
                                error ? 'border-red-400' : 'border-gray-200 focus:border-[#FF8C1A]'
                            }`}
                            autoFocus
                        />
                        {error && <span className="text-red-400 text-xs mt-1">{error}</span>}
                    </div>

                    {/* Data Type Toggle */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-800">Data Type:</label>
                        <div className="flex gap-2.5 flex-wrap">
                            <button
                                className={`flex-1 min-w-[120px] py-2.5 px-3.5 border-2 rounded-lg bg-white cursor-pointer text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                                    variableType === 'Number' ? 'border-[#FF8C1A] bg-[#FFF5E6] text-[#FF8C1A]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                                onClick={() => setVariableType('Number')}
                            >
                                <span className="text-sm">🔢</span>
                                Number
                            </button>
                            <button
                                className={`flex-1 min-w-[120px] py-2.5 px-3.5 border-2 rounded-lg bg-white cursor-pointer text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                                    variableType === 'String' ? 'border-[#FF8C1A] bg-[#FFF5E6] text-[#FF8C1A]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                                onClick={() => setVariableType('String')}
                            >
                                <span className="text-sm">📝</span>
                                String
                            </button>
                        </div>
                    </div>

                    {/* Scope Toggle */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-800">Scope:</label>
                        <div className="flex gap-2.5 flex-wrap">
                            <button
                                className={`flex-1 min-w-[120px] py-2.5 px-3.5 border-2 rounded-lg bg-white cursor-pointer text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                                    variableScope === 'all_sprites' ? 'border-[#FF8C1A] bg-[#FFF5E6] text-[#FF8C1A]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                                onClick={() => setVariableScope('all_sprites')}
                            >
                                <span className="text-sm">🌐</span>
                                For all sprites
                            </button>
                            <button
                                className={`flex-1 min-w-[120px] py-2.5 px-3.5 border-2 rounded-lg bg-white cursor-pointer text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                                    variableScope === 'this_sprite' ? 'border-[#FF8C1A] bg-[#FFF5E6] text-[#FF8C1A]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                                onClick={() => setVariableScope('this_sprite')}
                            >
                                <span className="text-sm">👤</span>
                                For this sprite only
                            </button>
                        </div>
                    </div>

                    {/* Block Preview */}
                    <div className="flex flex-col gap-2 mt-2">
                        <label className="text-sm font-medium text-gray-800">Preview:</label>
                        <div className="bg-[#FF8C1A] text-white p-2.5 px-3.5 rounded-lg font-mono text-sm flex items-center gap-2 shadow-md shadow-orange-500/30">
                            <span className="font-semibold">set</span>
                            <span className="bg-white/25 px-2 py-0.5 rounded text-xs">{variableName || 'my variable'}</span>
                            <span className="font-semibold">to</span>
                            <span className="bg-white/25 px-2 py-0.5 rounded text-xs min-w-[24px] text-center">
                                {variableType === 'Number' ? '0' : '""'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 px-5 border-t border-gray-100">
                    <button className="px-5 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        className={`px-6 py-2.5 border-none rounded-lg bg-[#FF8C1A] text-white text-sm font-semibold transition-all ${
                            variableName.trim() ? 'cursor-pointer opacity-100 hover:bg-[#e67e17]' : 'cursor-not-allowed opacity-50'
                        }`}
                        onClick={handleSubmit}
                        disabled={!variableName.trim()}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MakeVariableDialog;
