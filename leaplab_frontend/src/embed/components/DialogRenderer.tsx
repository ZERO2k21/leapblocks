/**
 * React renderer for global dialogs (alert, confirm, prompt).
 * Mount once in the app root — reads from dialogStore.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { setDialogListener, clearDialogListener } from '../../utils/dialogStore';
import { AlertTriangle, Info, HelpCircle, X } from 'lucide-react';

interface DialogState {
    id: number;
    type: 'alert' | 'confirm' | 'prompt';
    title: string;
    message: string;
    defaultValue: string;
    resolve: (result: any) => void;
}

const iconMap = {
    alert: <AlertTriangle size={36} className="text-[#E8930C]" />,
    confirm: <HelpCircle size={36} className="text-[#5B2975]" />,
    prompt: <Info size={36} className="text-[#4C97FF]" />,
};

export default function DialogRenderer() {
    const [dialog, setDialog] = useState<DialogState | null>(null);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        setDialogListener((req) => {
            setDialog(req);
            setInputValue(req.defaultValue || '');
        });
        return () => clearDialogListener();
    }, []);

    const close = useCallback((result: any) => {
        if (dialog) {
            dialog.resolve(result);
            setDialog(null);
        }
    }, [dialog]);

    if (!dialog) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999999]"
            onClick={(e) => { if (e.target === e.currentTarget) close(dialog.type === 'alert' ? undefined : dialog.type === 'confirm' ? false : null); }}>
            <div className="bg-white rounded-2xl w-[380px] max-w-[90vw] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden animate-[dialogPopIn_0.25s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0a015a] to-[#080a25] px-5 py-3.5 flex items-center justify-between">
                    <h3 className="text-white text-[15px] font-semibold m-0">{dialog.title}</h3>
                    <button onClick={() => close(dialog.type === 'confirm' ? false : null)}
                        className="bg-white/15 border-none rounded-lg text-white/80 w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-white/25 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-[#f0f0f0] flex items-center justify-center mb-4">
                        {iconMap[dialog.type]}
                    </div>
                    <p className="text-[#333] text-[15px] leading-relaxed m-0">{dialog.message}</p>

                    {dialog.type === 'prompt' && (
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') close(inputValue); }}
                            className="mt-4 w-full px-3 py-2.5 rounded-lg border border-[#d0d5dd] text-[14px] outline-none focus:border-[#5B2975] focus:ring-2 focus:ring-[#5B2975]/20 transition-all"
                            autoFocus
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 flex justify-center gap-3">
                    {dialog.type === 'confirm' && (
                        <>
                            <button onClick={() => close(true)}
                                className="px-7 py-2.5 rounded-xl border-none bg-[#5B2975] text-white font-semibold text-[14px] cursor-pointer hover:bg-[#4a2060] transition-colors">
                                OK
                            </button>
                            <button onClick={() => close(false)}
                                className="px-7 py-2.5 rounded-xl border border-[#d0d5dd] bg-white text-[#555] font-semibold text-[14px] cursor-pointer hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                        </>
                    )}
                    {dialog.type === 'alert' && (
                        <button onClick={() => close(undefined)}
                            className="px-7 py-2.5 rounded-xl border-none bg-[#5B2975] text-white font-semibold text-[14px] cursor-pointer hover:bg-[#4a2060] transition-colors">
                            OK
                        </button>
                    )}
                    {dialog.type === 'prompt' && (
                        <>
                            <button onClick={() => close(inputValue)}
                                className="px-7 py-2.5 rounded-xl border-none bg-[#5B2975] text-white font-semibold text-[14px] cursor-pointer hover:bg-[#4a2060] transition-colors">
                                OK
                            </button>
                            <button onClick={() => close(null)}
                                className="px-7 py-2.5 rounded-xl border border-[#d0d5dd] bg-white text-[#555] font-semibold text-[14px] cursor-pointer hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes dialogPopIn {
                    0% { transform: scale(0.92); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
