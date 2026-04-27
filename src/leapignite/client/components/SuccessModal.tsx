/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { Trophy, Check, RefreshCw } from 'lucide-react';

interface SuccessModalProps {
    message: string;
    onRestart: () => void;
    onNext: () => void;
}

export default function SuccessModal({ message, onRestart, onNext }: SuccessModalProps) {
    return (
        <div className="absolute inset-0 bg-black/60 flex justify-center items-center z-[1000] backdrop-blur-[4px]">
            <div className="bg-white p-10 rounded-3xl text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)] animate-[popIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#FFD500] flex items-center justify-center">
                    <Trophy size={48} color="white" />
                </div>

                <h2 className="m-0 mb-2.5 text-[28px] text-[#444]">Success!</h2>
                <p className="m-0 mb-[30px] text-lg text-[#666]">{message}</p>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={onRestart}
                        className="px-6 py-3 rounded-xl border-none bg-[#F0F0F0] text-[#555] font-bold text-base cursor-pointer flex items-center gap-2 hover:bg-[#E5E5E5] transition-colors"
                    >
                        <RefreshCw size={20} /> Replay
                    </button>

                    <button
                        onClick={onNext}
                        className="px-6 py-3 rounded-xl border-none bg-[#4C97FF] text-white font-bold text-base cursor-pointer flex items-center gap-2 shadow-[0_4px_12px_rgba(76,151,255,0.3)] hover:bg-[#3A85ED] transition-colors"
                    >
                        <Check size={20} /> Next Lesson
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes popIn {
                    0% { transform: scale(0.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
