/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface NeuraUnsavedWarningModalProps {
    isOpen: boolean;
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}

export default function NeuraUnsavedWarningModal({ isOpen, onSave, onDiscard, onCancel }: NeuraUnsavedWarningModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-[400px] shadow-2xl overflow-hidden animate-in">
                <div className="bg-gradient-to-r from-[#0a015a] to-[#15027a] px-6 py-4 flex items-center justify-between">
                    <h2 className="text-white text-lg font-bold">Unsaved Changes</h2>
                    <button onClick={onCancel} className="text-white/70 hover:text-white transition-colors">✕</button>
                </div>
                <div className="px-6 py-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                        <AlertTriangle size={32} className="text-amber-500" strokeWidth={2} />
                    </div>
                    <p className="text-gray-700 text-[15px] font-medium">Save changes to your current project?</p>
                    <p className="text-gray-400 text-sm mt-1">Your progress will be lost if you don't save.</p>
                </div>
                <div className="px-6 pb-6 flex justify-center gap-3">
                    <button onClick={onSave} className="px-6 py-2.5 rounded-xl bg-[#0a015a] text-white font-semibold text-sm hover:bg-[#15027a] transition-colors">Save</button>
                    <button onClick={onDiscard} className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors">Don't Save</button>
                    <button onClick={onCancel} className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors">Cancel</button>
                </div>
            </div>
            <style>{`
                @keyframes animate-in { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                .animate-in { animation: animate-in 0.2s ease-out; }
            `}</style>
        </div>
    );
}
