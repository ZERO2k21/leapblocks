/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

const ConfirmDialogContext = createContext(null);

let _globalConfirmResolve = null;

export function showConfirm(message, { title = 'Confirm', confirmText = 'Delete', cancelText = 'Cancel', type = 'danger' } = {}) {
    return new Promise((resolve) => {
        _globalConfirmResolve = { resolve, message, title, confirmText, cancelText, type };
        window.dispatchEvent(new CustomEvent('leaplab-confirm-open'));
    });
}

export function ConfirmDialogProvider({ children }) {
    const [state, setState] = useState(null);
    const resolveRef = useRef(null);

    const close = useCallback((result) => {
        setState(null);
        if (resolveRef.current) {
            resolveRef.current(result);
            resolveRef.current = null;
        }
        _globalConfirmResolve = null;
    }, []);

    useEffect(() => {
        const handleOpen = () => {
            if (_globalConfirmResolve) {
                resolveRef.current = _globalConfirmResolve.resolve;
                setState({
                    message: _globalConfirmResolve.message,
                    title: _globalConfirmResolve.title,
                    confirmText: _globalConfirmResolve.confirmText,
                    cancelText: _globalConfirmResolve.cancelText,
                    type: _globalConfirmResolve.type,
                });
            }
        };
        window.addEventListener('leaplab-confirm-open', handleOpen);
        return () => window.removeEventListener('leaplab-confirm-open', handleOpen);
    }, []);

    useEffect(() => {
        const handleKey = (e) => {
            if (!state) return;
            if (e.key === 'Escape') close(false);
            if (e.key === 'Enter') close(true);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [state, close]);

    return (
        <ConfirmDialogContext.Provider value={showConfirm}>
            {children}
            {state && (
                <ConfirmDialog
                    {...state}
                    onConfirm={() => close(true)}
                    onCancel={() => close(false)}
                />
            )}
        </ConfirmDialogContext.Provider>
    );
}

export function useConfirm() {
    return useContext(ConfirmDialogContext);
}

function ConfirmDialog({ title, message, confirmText, cancelText, type, onConfirm, onCancel }) {
    const isDanger = type === 'danger';

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999999]" onClick={onCancel}>
            <div
                className="bg-white rounded-2xl w-[380px] max-w-[90vw] shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden animate-[confirmPopIn_0.25s_cubic-bezier(0.175,0.885,0.32,1.275)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 pt-6 pb-4 text-center">
                    <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-100' : 'bg-amber-100'}`}>
                        {isDanger ? (
                            <Trash2 size={26} className="text-red-500" />
                        ) : (
                            <AlertTriangle size={26} className="text-amber-500" />
                        )}
                    </div>
                    <h3 className="m-0 mb-2 text-lg font-bold text-gray-800">{title}</h3>
                    <p className="m-0 text-sm text-gray-500">{message}</p>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 font-semibold text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 py-2.5 rounded-xl border-0 font-semibold text-sm cursor-pointer text-white transition-colors ${
                            isDanger
                                ? 'bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/25'
                                : 'bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/25'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes confirmPopIn {
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
