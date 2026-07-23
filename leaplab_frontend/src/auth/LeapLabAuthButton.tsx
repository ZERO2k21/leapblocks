/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState } from 'react';
import { LogIn, LogOut, User, ChevronDown } from 'lucide-react';
import { useLeapLabAuthStore } from './leaplabAuthStore';
import SignInModal from './SignInModal';

interface LeapLabAuthButtonProps {
    /** 'dark' for dark backgrounds, 'light' for light backgrounds */
    variant?: 'dark' | 'light';
    /** Button size */
    size?: 'sm' | 'md';
    /** Custom inline style overrides */
    style?: React.CSSProperties;
}

export default function LeapLabAuthButton({ variant = 'light', size = 'md', style }: LeapLabAuthButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { isAuthenticated, username, institutionName, signOut } = useLeapLabAuthStore();

    const handleSignOut = () => {
        signOut();
        setIsDropdownOpen(false);
    };

    const isDark = variant === 'dark';
    const isSmall = size === 'sm';

    // ─── SIGNED IN: show user chip with dropdown ───
    if (isAuthenticated && username) {
        return (
            <div className="relative font-sans" style={style}>
                <button
                    type="button"
                    onClick={() => setIsDropdownOpen(v => !v)}
                    className={`flex items-center rounded-xl border-2 cursor-pointer font-bold transition-all backdrop-blur-md shadow-sm hover:-translate-y-0.5 hover:shadow-md ${
                        isSmall ? 'gap-1.5 py-1 px-2.5 text-xs' : 'gap-2 py-1.5 px-3 text-sm'
                    } ${
                        isDark 
                            ? 'border-white/20 bg-white/10 text-white shadow-black/30' 
                            : 'border-indigo-950 bg-white/90 text-indigo-950 shadow-indigo-950/10'
                    }`}
                    aria-label="User menu"
                    id="leaplab-user-menu-btn"
                >
                    <div className={`rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 ${
                        isSmall ? 'w-5.5 h-5.5' : 'w-6.5 h-6.5'
                    }`}>
                        <User className={`text-white ${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                    </div>
                    <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {username}
                    </span>
                    <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsDropdownOpen(false)}
                        />
                        <div
                            className="absolute top-full mt-1.5 right-0 min-w-[200px] bg-white border-2 border-indigo-950 rounded-xl shadow-[4px_4px_0px_#100051] p-2 z-50 animate-[leaplab-dropdown-in_0.15s_ease-out] font-sans"
                            id="leaplab-user-dropdown"
                        >
                            <div className="p-2.5 border-b border-indigo-950/10 mb-1.5">
                                <div className="text-sm font-extrabold text-indigo-950 mb-0.5">
                                    {username}
                                </div>
                                {institutionName && (
                                    <div className="text-xs font-semibold text-slate-500">
                                        {institutionName}
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-2 p-2 rounded-lg bg-transparent text-red-600 text-sm font-bold cursor-pointer hover:bg-red-50 transition-colors"
                                id="leaplab-sign-out-btn"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Sign out
                            </button>
                        </div>
                    </>
                )}

                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes leaplab-dropdown-in {
                        from { opacity: 0; transform: translateY(-4px) scale(0.97); }
                        to   { opacity: 1; transform: translateY(0) scale(1); }
                    }
                `}} />
            </div>
        );
    }

    // ─── SIGNED OUT: show sign-in button ───
    return (
        <>
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className={`flex items-center rounded-xl border-2 font-extrabold font-sans cursor-pointer transition-all tracking-wide ${
                    isSmall ? 'gap-1.25 py-1.5 px-3 text-xs' : 'gap-1.75 py-2 px-4 text-sm'
                } ${
                    isDark 
                        ? 'border-white/25 bg-white/10 text-white backdrop-blur-md shadow-md hover:bg-white/20' 
                        : 'border-indigo-950 bg-gradient-to-r from-indigo-950 to-indigo-900 text-white shadow-[3px_3px_0px_#100051] hover:bg-gradient-to-r hover:from-indigo-900 hover:to-indigo-600 hover:shadow-[4px_4px_0px_#100051] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
                }`}
                style={style}
                aria-label="Sign in to LeapLab"
                id="leaplab-sign-in-btn"
            >
                <LogIn className={isSmall ? 'w-3.25 h-3.25' : 'w-3.75 h-3.75'} />
                Sign in
            </button>

            <SignInModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
