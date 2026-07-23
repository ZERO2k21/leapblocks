/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from 'react';
import Blockly from '@blockly-runtime';

interface MakeTableDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateTable: (table: {
        name: string;
        rows: number;
        cols: number;
        scope: 'all_sprites' | 'this_sprite';
    }) => void;
    workspace: Blockly.WorkspaceSvg | null;
}

export const MakeTableDialog: React.FC<MakeTableDialogProps> = ({
    isOpen,
    onClose,
    onCreateTable,
    workspace
}) => {
    const [tableName, setTableName] = useState('');
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(3);
    const [tableScope, setTableScope] = useState<'all_sprites' | 'this_sprite'>('all_sprites');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setTableName('');
            setRows(3);
            setCols(3);
            setTableScope('all_sprites');
            setError(null);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        const trimmedName = tableName.trim();
        
        if (!trimmedName) {
            setError('Table name cannot be empty');
            return;
        }

        if (rows < 1 || rows > 20) {
            setError('Rows must be between 1 and 20');
            return;
        }

        if (cols < 1 || cols > 10) {
            setError('Columns must be between 1 and 10');
            return;
        }

        if (workspace) {
            const existingVars = workspace.getVariableMap().getAllVariables();
            const exists = existingVars.some((v: any) => 
                v.name.toLowerCase() === trimmedName.toLowerCase() && v.type === 'table'
            );
            if (exists) {
                setError('A table with this name already exists');
                return;
            }
        }

        if (workspace) {
            try {
                const newTable = workspace.getVariableMap().createVariable(trimmedName, 'table');
                if (newTable) {
                    onCreateTable({
                        name: trimmedName,
                        rows,
                        cols,
                        scope: tableScope
                    });
                    onClose();
                }
            } catch (err) {
                setError('Failed to create table. Please try again.');
                console.error('[MakeTableDialog] Error creating table:', err);
            }
        }
    };

    const handleCancel = () => {
        setTableName('');
        setError(null);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tableName.trim()) {
            handleSubmit();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
            <div className="bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] w-[420px] max-w-[90vw] font-sans overflow-hidden">
                <div className="bg-[#A52A2A] px-5 py-4 flex justify-between items-center rounded-t-xl">
                    <span className="text-white text-lg font-semibold">New Table</span>
                    <button className="bg-transparent border-none text-white text-2xl cursor-pointer w-7.5 h-7.5 flex items-center justify-center rounded-full transition-colors hover:bg-white/20" onClick={handleCancel}>×</button>
                </div>

                <div className="p-6 px-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-800">New table name:</label>
                        <input
                            type="text"
                            value={tableName}
                            onChange={(e) => {
                                setTableName(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter table name"
                            className={`p-3 px-3.5 rounded-lg border-2 text-base outline-none transition-colors font-sans ${
                                error ? 'border-red-400' : 'border-gray-200 focus:border-[#A52A2A]'
                            }`}
                            autoFocus
                        />
                        {error && <span className="text-red-400 text-xs mt-1">{error}</span>}
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-800">Rows:</label>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={rows}
                                onChange={(e) => setRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                                className="p-3 px-3.5 rounded-lg border-2 border-gray-200 text-base outline-none font-sans text-center focus:border-[#A52A2A]"
                            />
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-800">Columns:</label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={cols}
                                onChange={(e) => setCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                className="p-3 px-3.5 rounded-lg border-2 border-gray-200 text-base outline-none font-sans text-center focus:border-[#A52A2A]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-800">Scope:</label>
                        <div className="flex gap-2.5 flex-wrap">
                            <button
                                className={`flex-1 min-w-[120px] py-2.5 px-3.5 border-2 rounded-lg bg-white cursor-pointer text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                                    tableScope === 'all_sprites' ? 'border-[#A52A2A] bg-[#F5E6E6] text-[#A52A2A]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                                onClick={() => setTableScope('all_sprites')}
                            >
                                <span className="text-sm">🌐</span>
                                For all sprites
                            </button>
                            <button
                                className={`flex-1 min-w-[120px] py-2.5 px-3.5 border-2 rounded-lg bg-white cursor-pointer text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                                    tableScope === 'this_sprite' ? 'border-[#A52A2A] bg-[#F5E6E6] text-[#A52A2A]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                                onClick={() => setTableScope('this_sprite')}
                            >
                                <span className="text-sm">👤</span>
                                For this sprite only
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                        <label className="text-sm font-medium text-gray-800">Preview:</label>
                        <div className="bg-[#A52A2A] text-white p-2.5 px-3.5 rounded-lg font-mono text-xs flex items-center gap-1.5 flex-wrap shadow-md shadow-red-900/30">
                            <span className="font-semibold">set row</span>
                            <span className="bg-white/35 px-2 py-0.5 rounded text-xs min-w-[20px] text-center">1</span>
                            <span className="font-semibold">column</span>
                            <span className="bg-white/35 px-2 py-0.5 rounded text-xs min-w-[20px] text-center">1</span>
                            <span className="font-semibold">of</span>
                            <span className="bg-white/25 px-2 py-0.5 rounded text-xs">{tableName || 'my table'}</span>
                            <span className="font-semibold">to</span>
                            <span className="bg-white/35 px-2 py-0.5 rounded text-xs min-w-[20px] text-center">0</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-4 px-5 border-t border-gray-100">
                    <button className="px-5 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        className={`px-6 py-2.5 border-none rounded-lg bg-[#A52A2A] text-white text-sm font-semibold transition-all ${
                            tableName.trim() ? 'cursor-pointer opacity-100 hover:bg-[#8b2323]' : 'cursor-not-allowed opacity-50'
                        }`}
                        onClick={handleSubmit}
                        disabled={!tableName.trim()}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MakeTableDialog;
