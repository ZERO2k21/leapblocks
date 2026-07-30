/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { Trophy, Check, RefreshCw } from 'lucide-react';

export default function SuccessModal({ message, onRestart, onNext }) {
    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[99999] backdrop-blur-sm">
            <div className="bg-white p-10 rounded-3xl text-center shadow-2xl animate-[popIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)] max-w-md mx-4">
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-amber-400 flex items-center justify-center">
                    <Trophy size={48} className="text-white" />
                </div>

                <h2 className="m-0 mb-2.5 text-3xl font-bold text-gray-700">Success!</h2>
                <p className="m-0 mb-8 text-lg text-gray-500">{message}</p>

                <div className="flex gap-4 justify-center">
                    <button type="button" onClick={onRestart} className="px-6 py-3 rounded-xl border-0 bg-gray-100 text-gray-600 font-bold text-base cursor-pointer flex items-center gap-2 hover:bg-gray-200 transition-colors">
                        <RefreshCw size={20} /> Replay
                    </button>

                    <button type="button" onClick={onNext} className="px-6 py-3 rounded-xl border-0 bg-blue-500 text-white font-bold text-base cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors">
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
