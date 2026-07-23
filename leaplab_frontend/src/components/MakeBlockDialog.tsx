/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useEffect } from 'react';
import Blockly from '@blockly-runtime';

/**
 * Argument types supported by leap 3.0
 */
export type ArgumentType = 'input' | 'boolean' | 'label';

export interface BlockArgument {
    id: string;
    type: ArgumentType;
    value: string;
}

interface MakeBlockDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateBlock: (block: {
        name: string;
        arguments: BlockArgument[];
        warp: boolean;
    }) => void;
    workspace: Blockly.WorkspaceSvg | null;
}

export const MakeBlockDialog: React.FC<MakeBlockDialogProps> = ({
    isOpen,
    onClose,
    onCreateBlock,
    workspace
}) => {
    const [blockName, setBlockName] = useState('my block');
    const [args, setArgs] = useState<BlockArgument[]>([]);
    const [warp, setWarp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setBlockName('my block');
            setArgs([]);
            setWarp(false);
            setError(null);
        }
    }, [isOpen]);

    const addArgument = (type: ArgumentType) => {
        const newArg: BlockArgument = {
            id: `arg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            value: type === 'label' ? 'text' : (type === 'boolean' ? 'bool' : 'number or text')
        };
        setArgs([...args, newArg]);
    };

    const updateArgument = (id: string, value: string) => {
        setArgs(args.map(arg => arg.id === id ? { ...arg, value } : arg));
    };

    const removeArgument = (id: string) => {
        setArgs(args.filter(arg => arg.id !== id));
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmedName = blockName.trim();

        if (!trimmedName) {
            setError('Block name cannot be empty');
            return;
        }

        onCreateBlock({
            name: trimmedName,
            arguments: args,
            warp
        });
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[10000] backdrop-blur-xs" onClick={(e) => e.target === e.currentTarget && handleCancel()}>
            <div className="bg-white rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.3)] w-[560px] max-w-[90vw] font-sans overflow-hidden max-h-[90vh] flex flex-col">
                <div className="bg-[#FF6680] p-4 px-6 flex justify-between items-center">
                    <span className="text-white text-[1.1rem] font-bold">Make a Block</span>
                    <button className="bg-transparent border-none text-white text-3xl cursor-pointer font-light leading-none" onClick={handleCancel}>×</button>
                </div>

                <div className="p-6 flex flex-col gap-6 overflow-y-auto">
                    {/* Block Preview Area - leap Style */}
                    <div className="flex justify-center bg-[#F8F9FA] p-8 rounded-xl border-2 border-[#EDF2F7]">
                        <div className="bg-[#FF6680] text-white py-3 px-6 rounded-lg flex items-center gap-3 shadow-[0_4px_0_#CC5166] text-[1.1rem] font-bold flex-wrap">
                            <span className="whitespace-nowrap">{blockName || 'my block'}</span>
                            {args.map((arg) => (
                                <span
                                    key={arg.id}
                                    className={`text-[0.9rem] min-w-[32px] text-center ${
                                        arg.type === 'boolean'
                                            ? 'bg-[#4C97FF] text-white rounded-full border border-black/10 px-3 py-1 font-normal'
                                            : arg.type === 'label'
                                            ? 'bg-transparent text-[#575E75] rounded-none border-none p-0 font-bold'
                                            : 'bg-white text-[#575E75] rounded-lg border border-black/10 px-3 py-1 font-normal'
                                    }`}
                                >
                                    {arg.value}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Argument Generation Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                        <button type="button" className="flex flex-col items-center p-3 bg-white border border-[#E2E8F0] rounded-xl cursor-pointer transition-all gap-2 shadow-xs hover:border-[#CBD5E0] hover:bg-gray-50" onClick={() => addArgument('input')}>
                            <div className="w-10 h-6 bg-white border border-[#CBD5E0] rounded flex items-center justify-center text-[0.8rem] text-[#4A5568]">123</div>
                            <span className="text-[0.75rem] text-[#4A5568] leading-tight font-medium">Add an input<br />number or text</span>
                        </button>
                        <button type="button" className="flex flex-col items-center p-3 bg-white border border-[#E2E8F0] rounded-xl cursor-pointer transition-all gap-2 shadow-xs hover:border-[#CBD5E0] hover:bg-gray-50" onClick={() => addArgument('boolean')}>
                            <div className="w-[30px] h-[18px] bg-white border border-[#CBD5E0] rounded-full flex items-center justify-center text-[0.8rem] text-[#4A5568]"></div>
                            <span className="text-[0.75rem] text-[#4A5568] leading-tight font-medium">Add an input<br />boolean</span>
                        </button>
                        <button type="button" className="flex flex-col items-center p-3 bg-white border border-[#E2E8F0] rounded-xl cursor-pointer transition-all gap-2 shadow-xs hover:border-[#CBD5E0] hover:bg-gray-50" onClick={() => addArgument('label')}>
                            <div className="w-10 h-6 bg-white border-none flex items-center justify-center text-[0.8rem] text-[#4A5568] font-bold">label</div>
                            <span className="text-[0.75rem] text-[#4A5568] leading-tight font-medium">Add a label</span>
                        </button>
                    </div>

                    {/* Inputs and Labels Configurator */}
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[0.85rem] font-semibold text-[#4A5568]">Block name:</label>
                            <input
                                type="text"
                                value={blockName}
                                onChange={(e) => {
                                    setBlockName(e.target.value);
                                    setError(null);
                                }}
                                className={`p-3 rounded-lg border text-[0.95rem] outline-none w-full ${
                                    error ? 'border-[#FF6680]' : 'border-[#E2E8F0] focus:border-[#FF6680]'
                                }`}
                                autoFocus
                            />
                            {error && <span className="text-[#FF6680] text-[0.75rem] font-medium">{error}</span>}
                        </div>

                        {args.map((arg, index) => (
                            <div key={arg.id} className="flex items-center gap-3 p-2.5 bg-[#F7FAFC] rounded-lg border border-[#EDF2F7]">
                                <span className="text-[0.8rem] text-[#718096] min-w-[60px] font-medium">{arg.type === 'label' ? 'Label:' : 'Input:'}</span>
                                <input
                                    type="text"
                                    value={arg.value}
                                    onChange={(e) => updateArgument(arg.id, e.target.value)}
                                    className="flex-1 p-2 px-3 rounded-md border border-[#E2E8F0] text-[0.9rem] outline-none focus:border-[#FF6680]"
                                />
                                <button
                                    type="button"
                                    className="bg-transparent border-none text-[#A0AEC0] cursor-pointer text-2xl font-extralight px-1 hover:text-red-500"
                                    onClick={() => removeArgument(arg.id)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Warp Mode Toggle */}
                    <div className="flex items-center py-1">
                        <label className="flex items-center gap-3 text-[0.95rem] text-[#4A5568] cursor-pointer font-medium">
                            <input
                                type="checkbox"
                                checked={warp}
                                onChange={(e) => setWarp(e.target.checked)}
                                className="w-5 h-5 cursor-pointer accent-[#FF6680]"
                            />
                            <span>Run without screen refresh</span>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-[#EDF2F7]">
                    <button type="button" className="p-2.5 px-6 border border-[#E2E8F0] rounded-lg bg-white text-[#4A5568] font-semibold cursor-pointer text-[0.95rem] hover:bg-gray-50" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={`p-2.5 px-8 border-none rounded-lg bg-[#FF6680] text-white font-bold text-[0.95rem] shadow-[0_4px_12px_rgba(255,102,128,0.2)] ${
                            blockName.trim() ? 'cursor-pointer opacity-100 hover:bg-[#e5536c]' : 'cursor-not-allowed opacity-50'
                        }`}
                        onClick={() => handleSubmit()}
                        disabled={!blockName.trim()}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MakeBlockDialog;
