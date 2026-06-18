import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Eye, EyeOff, AlertCircle, Mail, Lock } from 'lucide-react';
import { useLeapLabAuthStore } from './leaplabAuthStore';

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const { signIn, isLoading, error, clearError } = useLeapLabAuthStore();

    useEffect(() => {
        if (isOpen) {
            setUsername('');
            setPassword('');
            setShowPassword(false);
            setFormError(null);
            clearError();
        }
    }, [isOpen, clearError]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, onClose]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === modalRef.current) onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        clearError();

        if (!username.trim() || !password) {
            setFormError('Please enter both email and password.');
            return;
        }

        const success = await signIn(username, password);
        if (success) onClose();
    };

    if (!isOpen) return null;

    const displayError = formError || error;

    return createPortal(
        <>
            {/* Scoped style override — neutralize the global orange focus-visible ring inside this modal */}
            <style dangerouslySetInnerHTML={{ __html: `
                .leaplab-signin-modal *:focus-visible,
                .leaplab-signin-modal input:focus-visible,
                .leaplab-signin-modal button:focus-visible {
                    outline: none !important;
                    outline-offset: 0 !important;
                }
                @keyframes leaplab-modal-overlay-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes leaplab-modal-card-in {
                    from { opacity: 0; transform: scale(0.92) translateY(12px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes leaplab-shake {
                    0%, 100% { transform: translateX(0); }
                    20%  { transform: translateX(-6px); }
                    40%  { transform: translateX(6px); }
                    60%  { transform: translateX(-4px); }
                    80%  { transform: translateX(4px); }
                }
            `}} />

            <div
                ref={modalRef}
                onClick={handleOverlayClick}
                className="leaplab-signin-modal"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    background: 'rgba(10, 1, 40, 0.55)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    animation: 'leaplab-modal-overlay-in 0.25s ease-out',
                    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
                }}
            >
                {/* ─── Card ─── */}
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '380px',
                        background: '#fff',
                        borderRadius: '20px',
                        border: '3px solid #100051',
                        boxShadow: '6px 6px 0px #100051, 0 24px 48px rgba(10,1,40,0.18)',
                        padding: '36px 32px 32px',
                        animation: 'leaplab-modal-card-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    {/* ─── Close Button ─── */}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close sign-in"
                        style={{
                            position: 'absolute',
                            top: '14px',
                            right: '14px',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px',
                            border: '2px solid #100051',
                            background: '#fff',
                            color: '#100051',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: '2px 2px 0px #100051',
                            padding: 0,
                        }}
                        onMouseEnter={e => {
                            const el = e.currentTarget;
                            el.style.background = '#f1f5f9';
                            el.style.transform = 'translate(1px, 1px)';
                            el.style.boxShadow = '1px 1px 0px #100051';
                        }}
                        onMouseLeave={e => {
                            const el = e.currentTarget;
                            el.style.background = '#fff';
                            el.style.transform = 'translate(0, 0)';
                            el.style.boxShadow = '2px 2px 0px #100051';
                        }}
                        onMouseDown={e => {
                            const el = e.currentTarget;
                            el.style.transform = 'translate(2px, 2px)';
                            el.style.boxShadow = 'none';
                        }}
                        onMouseUp={e => {
                            const el = e.currentTarget;
                            el.style.transform = 'translate(1px, 1px)';
                            el.style.boxShadow = '1px 1px 0px #100051';
                        }}
                    >
                        <X style={{ width: '14px', height: '14px' }} />
                    </button>

                    {/* ─── Header ─── */}
                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                        {/* Logo */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '56px',
                            height: '56px',
                            borderRadius: '14px',
                            border: '3px solid #100051',
                            background: '#100051',
                            padding: '8px',
                            boxShadow: '3px 3px 0px rgba(16,0,81,0.2)',
                            marginBottom: '16px',
                        }}>
                            <img
                                src="/assets/leaplabicon.ico"
                                alt="LeapLab Logo"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </div>
                        {/* Title */}
                        <h2 style={{
                            fontSize: '22px',
                            fontWeight: 900,
                            color: '#100051',
                            letterSpacing: '-0.02em',
                            margin: '0 0 4px',
                        }}>
                            Sign in to LeapLab
                        </h2>
                        {/* Subtitle */}
                        <p style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#94a3b8',
                            margin: 0,
                        }}>
                            Use your school credentials
                        </p>
                    </div>

                    {/* ─── Form ─── */}
                    <form onSubmit={handleSubmit}>
                        {/* Email Field */}
                        <div style={{ marginBottom: '18px' }}>
                            <label
                                htmlFor="leaplab-username"
                                style={{
                                    display: 'block',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    color: '#100051',
                                    marginBottom: '6px',
                                }}
                            >
                                Email
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    left: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    pointerEvents: 'none',
                                    zIndex: 1,
                                }}>
                                    <Mail style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
                                </div>
                                <input
                                    id="leaplab-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="you@school.edu"
                                    autoFocus
                                    autoComplete="username"
                                    style={{
                                        width: '100%',
                                        height: '46px',
                                        borderRadius: '10px',
                                        border: '2.5px solid #e2e8f0',
                                        background: '#f8fafc',
                                        color: '#0f172a',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        fontFamily: 'inherit',
                                        paddingLeft: '42px',
                                        paddingRight: '14px',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s ease',
                                        outline: 'none',
                                    }}
                                    onFocus={e => {
                                        e.currentTarget.style.borderColor = '#4F46E5';
                                        e.currentTarget.style.background = '#fff';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
                                    }}
                                    onBlur={e => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.background = '#f8fafc';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div style={{ marginBottom: '22px' }}>
                            <label
                                htmlFor="leaplab-password"
                                style={{
                                    display: 'block',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    color: '#100051',
                                    marginBottom: '6px',
                                }}
                            >
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    left: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    pointerEvents: 'none',
                                    zIndex: 1,
                                }}>
                                    <Lock style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
                                </div>
                                <input
                                    id="leaplab-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    style={{
                                        width: '100%',
                                        height: '46px',
                                        borderRadius: '10px',
                                        border: '2.5px solid #e2e8f0',
                                        background: '#f8fafc',
                                        color: '#0f172a',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        fontFamily: 'inherit',
                                        paddingLeft: '42px',
                                        paddingRight: '44px',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s ease',
                                        outline: 'none',
                                    }}
                                    onFocus={e => {
                                        e.currentTarget.style.borderColor = '#4F46E5';
                                        e.currentTarget.style.background = '#fff';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)';
                                    }}
                                    onBlur={e => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.background = '#f8fafc';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        bottom: 0,
                                        right: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        border: 'none',
                                        background: 'none',
                                        padding: 0,
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#4F46E5'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
                                >
                                    {showPassword ? (
                                        <EyeOff style={{ width: '16px', height: '16px' }} />
                                    ) : (
                                        <Eye style={{ width: '16px', height: '16px' }} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {displayError && (
                            <div
                                role="alert"
                                aria-live="polite"
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                    borderRadius: '10px',
                                    border: '2px solid #fecaca',
                                    background: '#fef2f2',
                                    padding: '10px 12px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#dc2626',
                                    marginBottom: '18px',
                                    animation: 'leaplab-shake 0.4s ease-in-out',
                                }}
                            >
                                <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '1px' }} />
                                <span>{displayError}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                height: '48px',
                                borderRadius: '12px',
                                border: '3px solid #100051',
                                background: 'linear-gradient(135deg, #4F46E5, #6366f1)',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '15px',
                                fontFamily: 'inherit',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '4px 4px 0px #100051',
                                transition: 'all 0.12s ease',
                                opacity: isLoading ? 0.65 : 1,
                                letterSpacing: '0.01em',
                            }}
                            onMouseEnter={e => {
                                if (isLoading) return;
                                const el = e.currentTarget;
                                el.style.background = 'linear-gradient(135deg, #4338ca, #4F46E5)';
                                el.style.transform = 'translate(-1px, -1px)';
                                el.style.boxShadow = '5px 5px 0px #100051';
                            }}
                            onMouseLeave={e => {
                                const el = e.currentTarget;
                                el.style.background = 'linear-gradient(135deg, #4F46E5, #6366f1)';
                                el.style.transform = 'translate(0, 0)';
                                el.style.boxShadow = '4px 4px 0px #100051';
                            }}
                            onMouseDown={e => {
                                if (isLoading) return;
                                const el = e.currentTarget;
                                el.style.transform = 'translate(4px, 4px)';
                                el.style.boxShadow = 'none';
                            }}
                            onMouseUp={e => {
                                const el = e.currentTarget;
                                el.style.transform = 'translate(-1px, -1px)';
                                el.style.boxShadow = '5px 5px 0px #100051';
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                                    Signing in…
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>,
        document.body
    );
}
