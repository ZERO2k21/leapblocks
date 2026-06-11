import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export function useToast() {
    return useContext(ToastContext);
}

// Global toast function for non-React code (e.g., Interpreter.js)
let _globalToast = null;
export function showToast(message, type = 'info', duration = 3000) {
    if (_globalToast) {
        _globalToast(message, type, duration);
    } else {
        // Fallback to alert if toast not initialized
        alert(message);
    }
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    // Set global toast function
    useEffect(() => {
        _globalToast = addToast;
        return () => { _globalToast = null; };
    }, [addToast]);

    const toast = useCallback((message, duration) => {
        addToast(message, 'info', duration);
    }, [addToast]);

    toast.success = (message, duration) => addToast(message, 'success', duration);
    toast.error = (message, duration) => addToast(message, 'error', duration);
    toast.warning = (message, duration) => addToast(message, 'warning', duration);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts }) {
    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
        }}>
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>
    );
}

function ToastItem({ toast }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    const colors = {
        info: { bg: '#7f00c8ff', border: '#4a4aff', icon: '💡' },
        success: { bg: '#7f00c8ff', border: '#4aff4a', icon: '✅' },
        error: { bg: '#7f00c8ff', border: '#ff4a4a', icon: '⚠️' },
        warning: { bg: '#7f00c8ff', border: '#ffaa4a', icon: '⚡' },
    };

    const style = colors[toast.type] || colors.info;

    return (
        <div style={{
            background: style.bg,
            border: `2px solid ${style.border}`,
            borderRadius: '12px',
            padding: '12px 24px',
            color: 'white',
            fontFamily: "'Segoe UI', sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.9)',
            transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            pointerEvents: 'auto',
            maxWidth: '400px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
        }}>
            <span style={{ fontSize: '18px' }}>{style.icon}</span>
            <span>{toast.message}</span>
        </div>
    );
}
