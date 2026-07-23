/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { Save } from 'lucide-react';

export default function UnsavedWarningModal({ isOpen, onYes, onNo, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999999]">
            <div className="bg-[#F0E6F0] rounded-xl w-[400px] shadow-[0_10px_30px_rgba(0,0,0,0.3)] overflow-hidden animate-[popIn_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                {/* Header Section */}
                <div className="bg-[#B0003A] px-5 py-4 flex justify-between items-center text-white">
                    <h2 className="m-0 text-lg font-medium text-center flex-1">
                        Don't Forget to Save Your Project!
                    </h2>
                    <button onClick={onCancel} className="bg-black/20 border-0 rounded-full text-white size-7 flex items-center justify-center cursor-pointer font-bold">
                        ✕
                    </button>
                </div>

                {/* Body Section */}
                <div className="px-5 py-[30px] text-center">
                    <div className="relative inline-block mb-5">
                        <Save size={100} color="#5B2975" fill="#5B2975" />

                        {/* Yellow Warning Circle Overlay */}
                        <div className="absolute bottom-0 -right-[10px] bg-[#FFD700] size-9 rounded-full flex items-center justify-center shadow-[0_0_0_10px_rgba(255,215,0,0.3)] text-white font-bold text-xl">
                            !
                        </div>
                    </div>

                    <p className="m-0 mb-5 text-lg text-[#333]">
                        Save changes to your current project?
                    </p>
                </div>

                {/* Footer Section */}
                <div className="bg-white p-5 flex justify-center gap-3">
                    <button onClick={onYes} className="px-8 py-3 rounded-xl border-0 bg-[#5B2975] text-white font-bold text-base cursor-pointer">
                        Yes
                    </button>

                    <button onClick={onNo} className="px-8 py-3 rounded-xl border-0 bg-[#E6DBe8] text-[#5B2975] font-bold text-base cursor-pointer">
                        No
                    </button>

                    <button onClick={onCancel} className="px-6 py-3 rounded-xl border-0 bg-[#E6DBe8] text-[#5B2975] font-bold text-base cursor-pointer">
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
