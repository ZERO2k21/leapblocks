/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface NeuraUnsavedWarningModalProps {
    isOpen: boolean;
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}

export default function NeuraUnsavedWarningModal({ isOpen, onSave, onDiscard, onCancel }: NeuraUnsavedWarningModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-[400px] shadow-2xl overflow-hidden animate-fade-in-scale border border-gray-100">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-[#0a015a] to-[#15027a] px-6 py-4 flex items-center justify-between overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)'
                    }} />
                    <h2 className="relative text-white text-lg font-bold">Unsaved Changes</h2>
                    <button onClick={onCancel} className="relative text-white/60 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-white/10">
                        <X size={18} strokeWidth={2.2} />
                    </button>
                </div>

                <div className="px-6 py-8 text-center">
                    {/* Warning icon with pulsing glow */}
                    <div className="relative inline-flex items-center justify-center mb-4">
                        <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl scale-150 animate-pulse-slow" />
                        <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-50 to-amber-100 rounded-full border border-amber-200/50">
                            <AlertTriangle size={30} className="text-amber-500" strokeWidth={2} />
                        </div>
                    </div>
                    <p className="text-gray-800 text-[15px] font-bold">Save changes to your current project?</p>
                    <p className="text-gray-400 text-sm mt-1.5">Your progress will be lost if you don't save.</p>
                </div>

                <div className="px-6 pb-6 flex justify-center gap-3">
                    <button
                        onClick={onSave}
                        className="neura-button-primary px-6 py-2.5 text-sm"
                    >
                        Save
                    </button>
                    <button
                        onClick={onDiscard}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-all duration-200 active:scale-[0.97]"
                    >
                        Don't Save
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700 transition-all duration-200 active:scale-[0.97]"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
