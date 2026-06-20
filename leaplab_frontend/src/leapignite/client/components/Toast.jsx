import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext(null);

export function useToast() {
    return useContext(ToastContext);
}

// Global toast function for non-React code (e.g., Interpreter.js)
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

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    const removeToast = useCallback((id) => {
        console.log(`[TOAST] ⏳ removeToast(${id}) — starting exit animation`);
        // Mark toast as exiting first (for exit animation)
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

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const requestTime = Date.now();
        console.log(`[TOAST] 🆕 addToast("${message}", type=${type}, duration=${duration}ms) — requested at ${new Date().toLocaleTimeString()}`);
        // Dismiss any existing toasts of the same purpose to prevent stacking
        dismissAll();

        const id = Date.now() + Math.random();
        // Delay so dismiss exit animation plays fully before new toast enters
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

    // Set global toast functions
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

// Inject keyframes once
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
        <div style={{
            position: 'fixed',
            top: '56px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'none',
            width: '100%',
            maxWidth: '460px',
            padding: '0 16px',
            boxSizing: 'border-box',
        }}>
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

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
            <div style={{
                width: 32, height: 32, borderRadius: '10px',
                background: config.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 2px 8px ${config.accent}40`,
                flexShrink: 0,
                position: 'relative',
            }}>
                {/* Spinning loader ring */}
                <div style={{
                    width: 18, height: 18,
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'toastSpinner 1.2s linear infinite',
                }} />
            </div>
        );
    }

    if (type === 'success') {
        return (
            <div style={{
                width: 32, height: 32, borderRadius: '10px',
                background: config.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 2px 8px ${config.accent}40`,
                flexShrink: 0,
            }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'toastCheckPop 0.8s ease-out' }}>
                    <path d="M3 8.5L6.5 12L13 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        );
    }

    if (type === 'error') {
        return (
            <div style={{
                width: 32, height: 32, borderRadius: '10px',
                background: config.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 2px 8px ${config.accent}40`,
                flexShrink: 0,
                animation: 'toastIconPulse 2s ease-in-out infinite',
            }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3V9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="8" cy="12" r="1.25" fill="white" />
                </svg>
            </div>
        );
    }

    if (type === 'warning') {
        return (
            <div style={{
                width: 32, height: 32, borderRadius: '10px',
                background: config.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 2px 8px ${config.accent}40`,
                flexShrink: 0,
            }}>
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

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                width: '100%',
                background: config.gradient,
                border: `1px solid ${config.border}`,
                borderRadius: '14px',
                padding: '0',
                color: 'white',
                fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
                boxShadow: hovered
                    ? `${config.glow}, 0 0 0 1px ${config.accent}30`
                    : config.glow,
                animation: `${animName} ${animDuration} cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                pointerEvents: 'auto',
                backdropFilter: 'blur(20px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s ease',
            }}
            onClick={() => onDismiss(toast.id)}
        >
            {/* Shimmer overlay for info type */}
            {toast.type === 'info' && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'toastShimmer 3.5s ease-in-out infinite',
                    borderRadius: '14px',
                    pointerEvents: 'none',
                }} />
            )}

            {/* Content */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                position: 'relative',
                zIndex: 1,
            }}>
                <ToastIcon type={toast.type} />

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        lineHeight: 1.4,
                        letterSpacing: '0.01em',
                        color: '#f1f5f9',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {toast.message}
                    </div>
                </div>

                {/* Close hint */}
                <div style={{
                    width: 22, height: 22,
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: hovered ? 'rgba(255,255,255,0.1)' : 'transparent',
                    transition: 'background 0.15s ease',
                    flexShrink: 0,
                    opacity: hovered ? 1 : 0.3,
                }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1 1L9 9M9 1L1 9" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </div>
            </div>

            {/* Progress bar */}
            {toast.duration > 0 && !toast.exiting && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2.5px',
                    borderRadius: '0 0 14px 14px',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        height: '100%',
                        background: config.progressColor,
                        backgroundSize: '200% 100%',
                        transformOrigin: 'left',
                        animation: `toastProgress ${toast.duration}ms linear forwards`,
                        borderRadius: '0 0 14px 14px',
                    }} />
                </div>
            )}
        </div>
    );
}
