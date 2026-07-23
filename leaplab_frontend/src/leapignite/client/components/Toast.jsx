import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext(null);

export function useToast() {
    return useContext(ToastContext);
}

let _globalToast = null;
let _globalDismissAll = null;

export function showToast(message, type = 'info', duration = 5000) {
    if (_globalToast) {
        return _globalToast(message, type, duration);
    } else {
        alert(message);
    }
}

export function dismissAllToasts() {
    if (_globalDismissAll) {
        _globalDismissAll();
    }
}

// ── Auto-dismiss Timer Hook ────────────────────────────────────────────────
function useAutoDismiss(setToasts) {
    const timersRef = useRef({});

    const removeToast = useCallback((id) => {
        console.log(`[TOAST] ⏳ removeToast(${id}) — starting exit animation`);
        setToasts(prev => prev.map(t => {
            if (t.id === id) {
                const visibleTime = Date.now() - t.createdAt;
                console.log(`[TOAST] 📊 Toast "${t.message}" was visible for ${visibleTime}ms`);
                return { ...t, exiting: true };
            }
            return t;
        }));
        setTimeout(() => {
            console.log(`[TOAST] 🗑️ removeToast(${id}) — removed from DOM after 500ms exit animation`);
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 500);
        if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
        }
    }, []);

    const dismissAll = useCallback(() => {
        console.log(`[TOAST] 🧹 dismissAll() — clearing all existing toasts`);

        setToasts(prev => {
            const activeIds = prev.filter(t => !t.exiting).map(t => t.id);
            if (activeIds.length === 0) return prev;

            const updated = prev.map(t => activeIds.includes(t.id) ? { ...t, exiting: true } : t);

            activeIds.forEach(id => {
                setTimeout(() => {
                    setToasts(current => {
                        const found = current.find(t => t.id === id);
                        if (found) {
                            const visibleTime = Date.now() - found.createdAt;
                            console.log(`[TOAST] 🗑️ dismissAll cleanup — removed "${found.message}" (id: ${id}) from DOM after 500ms exit animation. Visible for: ${visibleTime}ms`);
                        }
                        return current.filter(t => t.id !== id);
                    });
                    if (timersRef.current[id]) {
                        clearTimeout(timersRef.current[id]);
                        delete timersRef.current[id];
                    }
                }, 500);
            });

            return updated;
        });
    }, []);

    useEffect(() => {
        return () => {
            Object.values(timersRef.current).forEach(clearTimeout);
        };
    }, []);

    return { removeToast, dismissAll, timersRef };
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const { removeToast, dismissAll, timersRef } = useAutoDismiss(setToasts);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const requestTime = Date.now();
        console.log(`[TOAST] 🆕 addToast("${message}", type=${type}, duration=${duration}ms) — requested at ${new Date().toLocaleTimeString()}`);
        dismissAll();

        const id = Date.now() + Math.random();
        console.log(`[TOAST] ⏳ Waiting 400ms for dismiss animation before showing new toast...`);
        setTimeout(() => {
            const delayActual = Date.now() - requestTime;
            console.log(`[TOAST] ✅ Toast "${message}" now entering DOM (actual delay: ${delayActual}ms)`);
            setToasts(prev => [...prev, { id, message, type, duration, exiting: false, createdAt: Date.now() }]);
            if (duration > 0) {
                console.log(`[TOAST] ⏰ Auto-remove scheduled in ${duration}ms (will disappear at ${new Date(Date.now() + duration).toLocaleTimeString()})`);
                timersRef.current[id] = setTimeout(() => {
                    console.log(`[TOAST] ⏰ Auto-remove triggered for "${message}" after ${duration}ms`);
                    removeToast(id);
                }, duration);
            }
        }, 400);
        return id;
    }, [removeToast, dismissAll]);

    useEffect(() => {
        _globalToast = addToast;
        _globalDismissAll = dismissAll;
        return () => { _globalToast = null; _globalDismissAll = null; };
    }, [addToast, dismissAll]);

    const toast = useCallback((message, duration) => {
        addToast(message, 'info', duration);
    }, [addToast]);

    toast.success = (message, duration) => addToast(message, 'success', duration);
    toast.error = (message, duration) => addToast(message, 'error', duration);
    toast.warning = (message, duration) => addToast(message, 'warning', duration);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
        </ToastContext.Provider>
    );
}

// ── Style Injection ────────────────────────────────────────────────────────
const STYLE_ID = 'leaplab-toast-styles';
function ensureStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
        @keyframes toastSlideIn {
            0% { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(0.88); filter: blur(6px); }
            50% { opacity: 0.8; transform: translateX(-50%) translateY(3px) scale(1.02); filter: blur(1px); }
            75% { opacity: 1; transform: translateX(-50%) translateY(-2px) scale(1.005); filter: blur(0); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes toastSlideOut {
            0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); filter: blur(0); }
            40% { opacity: 0.6; transform: translateX(-50%) translateY(-8px) scale(0.98); filter: blur(1px); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-22px) scale(0.92); filter: blur(5px); }
        }
        @keyframes toastProgress {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
        }
        @keyframes toastIconPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.18); }
        }
        @keyframes toastSpinner {
            to { transform: rotate(360deg); }
        }
        @keyframes toastShimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        @keyframes toastCheckPop {
            0% { transform: scale(0) rotate(-60deg); opacity: 0; }
            40% { transform: scale(1.25) rotate(5deg); opacity: 0.9; }
            70% { transform: scale(0.95) rotate(-2deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

function ToastContainer({ toasts, onDismiss }) {
    useEffect(() => { ensureStyles(); }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-2.5 pointer-events-none w-full max-w-[460px] px-4 box-border">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

// ── Toast Type Config ──────────────────────────────────────────────────────
const TOAST_CONFIG = {
    info: {
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        border: 'rgba(99, 102, 241, 0.45)',
        glow: '0 0 30px rgba(99, 102, 241, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4)',
        accent: '#818cf8',
        progressColor: 'linear-gradient(90deg, #6366f1, #818cf8, #6366f1)',
        iconBg: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    },
    success: {
        gradient: 'linear-gradient(135deg, #0a1f1a 0%, #0d2818 50%, #0f3020 100%)',
        border: 'rgba(52, 211, 153, 0.45)',
        glow: '0 0 30px rgba(52, 211, 153, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4)',
        accent: '#34d399',
        progressColor: 'linear-gradient(90deg, #10b981, #34d399, #10b981)',
        iconBg: 'linear-gradient(135deg, #059669, #10b981)',
    },
    error: {
        gradient: 'linear-gradient(135deg, #2a0a0a 0%, #3b1010 50%, #4a1515 100%)',
        border: 'rgba(248, 113, 113, 0.45)',
        glow: '0 0 30px rgba(248, 113, 113, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4)',
        accent: '#f87171',
        progressColor: 'linear-gradient(90deg, #ef4444, #f87171, #ef4444)',
        iconBg: 'linear-gradient(135deg, #dc2626, #ef4444)',
    },
    warning: {
        gradient: 'linear-gradient(135deg, #1f1a0a 0%, #2a2010 50%, #352a12 100%)',
        border: 'rgba(251, 191, 36, 0.45)',
        glow: '0 0 30px rgba(251, 191, 36, 0.15), 0 8px 32px rgba(0, 0, 0, 0.4)',
        accent: '#fbbf24',
        progressColor: 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)',
        iconBg: 'linear-gradient(135deg, #d97706, #f59e0b)',
    },
};

function ToastIcon({ type }) {
    const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;

    if (type === 'info') {
        return (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 relative" style={{ background: config.iconBg, boxShadow: `0 2px 8px ${config.accent}40` }}>
                <div className="w-4.5 h-4.5 border-2 border-white/20 border-t-white rounded-full animate-[toastSpinner_1.2s_linear_infinite]" />
            </div>
        );
    }

    if (type === 'success') {
        return (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: config.iconBg, boxShadow: `0 2px 8px ${config.accent}40` }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-[toastCheckPop_0.8s_ease-out]">
                    <path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        );
    }

    if (type === 'error') {
        return (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 animate-[toastIconPulse_2s_ease-in-out_infinite]" style={{ background: config.iconBg, boxShadow: `0 2px 8px ${config.accent}40` }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3V9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="8" cy="12" r="1.25" fill="white" />
                </svg>
            </div>
        );
    }

    if (type === 'warning') {
        return (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: config.iconBg, boxShadow: `0 2px 8px ${config.accent}40` }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M7.13 2.58a1 1 0 011.74 0l5.5 9.5A1 1 0 0113.5 14h-11a1 1 0 01-.87-1.5l5.5-9.42z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5" />
                    <path d="M8 6v3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="8" cy="11.25" r="0.75" fill="white" />
                </svg>
            </div>
        );
    }

    return null;
}

function ToastItem({ toast, onDismiss }) {
    const [hovered, setHovered] = useState(false);
    const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
    const animName = toast.exiting ? 'toastSlideOut' : 'toastSlideIn';
    const animDuration = toast.exiting ? '0.5s' : '0.7s';

    const renderShimmer = () => toast.type === 'info' && (
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)] bg-[length:200%_100%] animate-[toastShimmer_3.5s_ease-in-out_infinite] rounded-[14px] pointer-events-none" />
    );

    const renderCloseHint = () => (
        <div className={`w-5.5 h-5.5 rounded-md flex items-center justify-center transition-colors duration-150 shrink-0 ${hovered ? 'bg-white/10 opacity-100' : 'bg-transparent opacity-30'}`}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1L9 9M9 1L1 9" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        </div>
    );

    const renderContent = () => (
        <div className="flex items-center gap-3 p-[14px_16px] relative z-10">
            <ToastIcon type={toast.type} />
            <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold leading-snug tracking-wide text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis">{toast.message}</div>
            </div>
            {renderCloseHint()}
        </div>
    );

    const renderProgressBar = () => toast.duration > 0 && !toast.exiting && (
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-b-[14px] overflow-hidden">
            <div className="h-full bg-[length:200%_100%] origin-left rounded-b-[14px]" style={{
                background: config.progressColor,
                animation: `toastProgress ${toast.duration}ms linear forwards`,
            }} />
        </div>
    );

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="w-full rounded-[14px] p-0 text-white font-sans pointer-events-auto backdrop-blur-xl backdrop-saturate-150 relative overflow-hidden cursor-pointer transition-shadow duration-200"
            style={{
                background: config.gradient,
                border: `1px solid ${config.border}`,
                boxShadow: hovered
                    ? `${config.glow}, 0 0 0 1px ${config.accent}30`
                    : config.glow,
                animation: `${animName} ${animDuration} cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
            onClick={() => onDismiss(toast.id)}
        >
            {renderShimmer()}
            {renderContent()}
            {renderProgressBar()}
        </div>
    );
}
