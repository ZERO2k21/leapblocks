/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from 'react';
import Blockly from '@blockly-runtime';

interface MakeListDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateList: (list: {
        name: string;
        scope: 'all_sprites' | 'this_sprite';
    }) => void;
    workspace: Blockly.WorkspaceSvg | null;
}

export const MakeListDialog: React.FC<MakeListDialogProps> = ({
    isOpen,
    onClose,
    onCreateList,
    workspace
}) => {
    const [listName, setListName] = useState('');
    const [listScope, setListScope] = useState<'all_sprites' | 'this_sprite'>('all_sprites');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setListName('');
            setListScope('all_sprites');
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        const trimmedName = listName.trim();
        
        if (!trimmedName) {
            setError('List name cannot be empty');
            return;
        }

        if (workspace) {
            const existingVars = workspace.getVariableMap().getAllVariables();
            const exists = existingVars.some((v: any) => 
                v.name.toLowerCase() === trimmedName.toLowerCase() && v.type === 'list'
            );
            if (exists) {
                setError('A list with this name already exists');
                return;
            }
        }

        if (workspace) {
            try {
                const newList = workspace.getVariableMap().createVariable(trimmedName, 'list');
                if (newList) {
                    onCreateList({
                        name: trimmedName,
                        scope: listScope
                    });
                    onClose();
                }
            } catch (err) {
                setError('Failed to create list. Please try again.');
                console.error('[MakeListDialog] Error creating list:', err);
            }
        }
    };

    const handleCancel = () => {
        setListName('');
        setError(null);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && listName.trim()) {
            handleSubmit();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
            <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] w-[420px] max-w-[90vw] font-sans overflow-hidden">
                <div className="bg-[#CF63CF] p-4 px-5 flex justify-between items-center rounded-t-xl">
                    <span className="text-white text-lg font-semibold">New List</span>
                    <button className="bg-transparent border-none text-white text-2xl cursor-pointer w-7.5 h-7.5 flex items-center justify-center rounded-full transition-colors hover:bg-white/20" onClick={handleCancel}>×</button>
                </div>

                <div className="p-6 px-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-neutral-800">New list name:</label>
                        <input
                            type="text"
                            value={listName}
                            onChange={(e) => {
                                setListName(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter list name"
                            className={`p-3 px-3.5 rounded-lg border-2 text-sm outline-none transition-colors font-sans ${error ? 'border-red-400' : 'border-slate-200 focus:border-[#CF63CF]'}`}
                            autoFocus
                        />
                        {error && <span className="text-red-400 text-xs mt-1">{error}</span>}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-neutral-800">Scope:</label>
                        <div className="flex gap-2.5 flex-wrap">
                            <button
                                className={`flex-1 min-w-[120px] p-2.5 px-3.5 border-2 rounded-lg cursor-pointer text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                                    listScope === 'all_sprites'
                                        ? 'border-[#CF63CF] bg-[#FCE8FC] text-[#CF63CF]'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                                onClick={() => setListScope('all_sprites')}
                            >
                                <span className="text-sm">🌐</span>
                                For all sprites
                            </button>
                            <button
                                className={`flex-1 min-w-[120px] p-2.5 px-3.5 border-2 rounded-lg cursor-pointer text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                                    listScope === 'this_sprite'
                                        ? 'border-[#CF63CF] bg-[#FCE8FC] text-[#CF63CF]'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                                onClick={() => setListScope('this_sprite')}
                            >
                                <span className="text-sm">👤</span>
                                For this sprite only
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                        <label className="text-sm font-medium text-neutral-800">Preview:</label>
                        <div className="bg-[#CF63CF] text-white p-2.5 px-3.5 rounded-lg font-mono text-sm flex items-center gap-2 shadow-[0_2px_8px_rgba(207,99,207,0.3)]">
                            <span className="font-semibold">add</span>
                            <span className="bg-white/35 p-0.75 px-2 rounded text-xs min-w-[24px] text-center">thing</span>
                            <span className="font-semibold">to</span>
                            <span className="bg-white/25 p-0.75 px-2 rounded text-xs">{listName || 'my list'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-4 px-5 border-t border-slate-100">
                    <button className="p-2.5 px-5 border border-slate-200 rounded-lg bg-white cursor-pointer text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        className="p-2.5 px-6 border-none rounded-lg bg-[#CF63CF] text-white text-sm font-semibold transition-colors hover:bg-[#bd4fbd] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleSubmit}
                        disabled={!listName.trim()}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MakeListDialog;
