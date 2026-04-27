/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { Save } from 'lucide-react';

interface UnsavedWarningModalProps {
    isOpen: boolean;
    onYes: () => void;
    onNo: () => void;
    onCancel: () => void;
}

export default function UnsavedWarningModal({ isOpen, onYes, onNo, onCancel }: UnsavedWarningModalProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-black/60 flex justify-center items-center z-[999999]">
            <div className="bg-[#F0E6F0] rounded-xl w-[400px] shadow-[0_10px_30px_rgba(0,0,0,0.3)] overflow-hidden animate-[popIn_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                {/* Header */}
                <div className="bg-[#B0003A] px-5 py-4 flex justify-between items-center text-white">
                    <h2 className="m-0 text-lg font-medium text-center flex-1">
                        Don't Forget to Save Your Project!
                    </h2>
                    <button
                        onClick={onCancel}
                        className="bg-black/20 border-none rounded-full text-white w-7 h-7 flex items-center justify-center cursor-pointer font-bold hover:bg-black/30 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="py-[30px] px-5 text-center">
                    <div className="relative inline-block mb-5">
                        <Save size={100} color="#5B2975" fill="#5B2975" />
                        {/* Yellow Warning Circle */}
                        <div className="absolute bottom-0 -right-2.5 bg-[#FFD700] w-9 h-9 rounded-full flex items-center justify-center shadow-[0_0_0_10px_rgba(255,215,0,0.3)] text-white font-bold text-xl">
                            !
                        </div>
                    </div>
                    <p className="m-0 mb-5 text-lg text-[#333]">
                        Save changes to your current project?
                    </p>
                </div>

                {/* Footer */}
                <div className="bg-white p-5 flex justify-center gap-3">
                    <button
                        onClick={onYes}
                        className="px-8 py-3 rounded-xl border-none bg-[#5B2975] text-white font-bold text-base cursor-pointer hover:bg-[#6B3485] transition-colors"
                    >
                        Yes
                    </button>
                    <button
                        onClick={onNo}
                        className="px-8 py-3 rounded-xl border-none bg-[#E6DBe8] text-[#5B2975] font-bold text-base cursor-pointer hover:bg-[#D6CBd8] transition-colors"
                    >
                        No
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 rounded-xl border-none bg-[#E6DBe8] text-[#5B2975] font-bold text-base cursor-pointer hover:bg-[#D6CBd8] transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes popIn {
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
