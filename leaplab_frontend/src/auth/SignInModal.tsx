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
                className="leaplab-signin-modal fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#0a0128]/55 backdrop-blur-md animate-[leaplab-modal-overlay-in_0.25s_ease-out] font-sans"
            >
                {/* ─── Card ─── */}
                <div className="relative w-full max-w-[380px] bg-white rounded-3xl border-[3px] border-[#100051] shadow-[6px_6px_0px_#100051,0_24px_48px_rgba(10,1,40,0.18)] p-9 px-8 pb-8 animate-[leaplab-modal-card-in_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
                    {/* ─── Close Button ─── */}
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close sign-in"
                        className="absolute top-3.5 right-3.5 w-7.5 h-7.5 flex items-center justify-center rounded-lg border-2 border-[#100051] bg-white text-[#100051] cursor-pointer transition-all duration-150 shadow-[2px_2px_0px_#100051] p-0 hover:bg-slate-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#100051] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>

                    {/* ─── Header ─── */}
                    <div className="text-center mb-7">
                        {/* Logo */}
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border-[3px] border-[#100051] bg-[#100051] p-2 shadow-[3px_3px_0px_rgba(16,0,81,0.2)] mb-4">
                            <img
                                src="/assets/leaplabicon.ico"
                                alt="LeapLab Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        {/* Title */}
                        <h2 className="text-[22px] font-black text-[#100051] tracking-tight m-0 mb-1">
                            Sign in to LeapLab
                        </h2>
                        {/* Subtitle */}
                        <p className="text-xs font-medium text-slate-400 m-0">
                            Use your school credentials
                        </p>
                    </div>

                    {/* ─── Form ─── */}
                    <form onSubmit={handleSubmit}>
                        {/* Email Field */}
                        <div className="mb-4.5">
                            <label
                                htmlFor="leaplab-username"
                                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#100051] mb-1.5"
                            >
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute top-0 bottom-0 left-3.5 flex items-center pointer-events-none z-10">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                </div>
                                <input
                                    id="leaplab-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="you@school.edu"
                                    autoFocus
                                    autoComplete="username"
                                    className="w-full h-11.5 rounded-xl border-[2.5px] border-slate-200 bg-slate-50 text-slate-900 font-semibold text-sm pl-10.5 pr-3.5 box-border transition-all duration-200 outline-none focus:border-indigo-600 focus:bg-white focus:ring-3 focus:ring-indigo-600/10"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="mb-5.5">
                            <label
                                htmlFor="leaplab-password"
                                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#100051] mb-1.5"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute top-0 bottom-0 left-3.5 flex items-center pointer-events-none z-10">
                                    <Lock className="w-4 h-4 text-slate-400" />
                                </div>
                                <input
                                    id="leaplab-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="w-full h-11.5 rounded-xl border-[2.5px] border-slate-200 bg-slate-50 text-slate-900 font-semibold text-sm pl-10.5 pr-11 box-border transition-all duration-200 outline-none focus:border-indigo-600 focus:bg-white focus:ring-3 focus:ring-indigo-600/10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    className="absolute top-0 bottom-0 right-3 flex items-center border-none bg-none p-0 text-slate-400 cursor-pointer transition-colors hover:text-indigo-600"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {displayError && (
                            <div
                                role="alert"
                                aria-live="polite"
                                className="flex items-start gap-2 rounded-xl border-2 border-red-200 bg-red-50 p-2.5 px-3 text-xs font-semibold text-red-600 mb-4.5 animate-[leaplab-shake_0.4s_ease-in-out]"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{displayError}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl border-[3px] border-[#100051] bg-gradient-to-br from-indigo-600 to-indigo-500 text-white font-extrabold text-sm cursor-pointer flex items-center justify-center gap-2 shadow-[4px_4px_0px_#100051] transition-all duration-125 disabled:opacity-65 disabled:cursor-not-allowed tracking-tight hover:enabled:from-indigo-700 hover:enabled:to-indigo-600 hover:enabled:-translate-x-0.5 hover:enabled:-translate-y-0.5 hover:enabled:shadow-[5px_5px_0px_#100051] active:enabled:translate-x-[4px] active:enabled:translate-y-[4px] active:enabled:shadow-none"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
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
