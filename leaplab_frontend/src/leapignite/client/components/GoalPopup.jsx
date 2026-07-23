import React from 'react';

const GoalPopup = ({ isOpen, goalText, onClose }) => {
    if (!isOpen || !goalText) return null;

    return (
        <div className="fixed inset-0 w-screen h-screen bg-indigo-950/60 backdrop-blur-md flex items-center justify-center z-50 animate-[goalFadeIn_0.25s_ease-out]">
            <style>{`
                @keyframes goalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes goalPopIn {
                    from { transform: scale(0.85) translateY(20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes goalIconPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }
            `}</style>

            <div className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden animate-[goalPopIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)] shadow-2xl mx-4">
                <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 p-5 px-6 flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center text-2xl shadow-lg shadow-purple-600/40 animate-[goalIconPulse_2s_ease-in-out_infinite] shrink-0">🎯</div>
                    <div className="text-xl font-extrabold text-white tracking-wide font-sans">Goal</div>
                </div>

                <div className="p-6">
                    <div className="text-sm font-medium text-gray-700 font-sans leading-relaxed bg-purple-50/60 rounded-xl p-4 border-l-4 border-purple-600">{goalText}</div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full mt-5 bg-gradient-to-r from-purple-600 to-purple-500 text-white border-0 rounded-xl py-3 px-6 text-sm font-bold font-sans cursor-pointer transition-all duration-200 shadow-lg shadow-purple-600/30 hover:-translate-y-0.5 hover:shadow-purple-600/40"
                    >
                        OK, got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoalPopup;
