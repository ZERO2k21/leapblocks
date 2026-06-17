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
}

export default function LeapLabAuthButton({ variant = 'light', size = 'md' }: LeapLabAuthButtonProps) {
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
            <div style={{ position: 'relative', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
                <button
                    onClick={() => setIsDropdownOpen(v => !v)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isSmall ? '6px' : '8px',
                        padding: isSmall ? '5px 10px 5px 6px' : '6px 14px 6px 8px',
                        borderRadius: '10px',
                        border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#100051'}`,
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
                        color: isDark ? '#fff' : '#100051',
                        cursor: 'pointer',
                        fontSize: isSmall ? '12px' : '13px',
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(8px)',
                        boxShadow: isDark
                            ? '0 2px 8px rgba(0,0,0,0.3)'
                            : '0 2px 8px rgba(16,0,81,0.08)',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                        (e.currentTarget as HTMLElement).style.boxShadow = isDark
                            ? '0 4px 12px rgba(0,0,0,0.4)'
                            : '0 4px 12px rgba(16,0,81,0.15)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.boxShadow = isDark
                            ? '0 2px 8px rgba(0,0,0,0.3)'
                            : '0 2px 8px rgba(16,0,81,0.08)';
                    }}
                    aria-label="User menu"
                    id="leaplab-user-menu-btn"
                >
                    <div style={{
                        width: isSmall ? '22px' : '26px',
                        height: isSmall ? '22px' : '26px',
                        borderRadius: '7px',
                        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <User style={{ width: isSmall ? '12px' : '14px', height: isSmall ? '12px' : '14px', color: '#fff' }} />
                    </div>
                    <span style={{
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {username}
                    </span>
                    <ChevronDown style={{
                        width: '12px',
                        height: '12px',
                        opacity: 0.6,
                        transition: 'transform 0.2s',
                        transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                    }} />
                </button>

                {/* Dropdown */}
                {isDropdownOpen && (
                    <>
                        {/* Backdrop to close dropdown */}
                        <div
                            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                            onClick={() => setIsDropdownOpen(false)}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                top: 'calc(100% + 6px)',
                                right: 0,
                                minWidth: '200px',
                                background: '#fff',
                                border: '2px solid #100051',
                                borderRadius: '12px',
                                boxShadow: '4px 4px 0px #100051',
                                padding: '8px',
                                zIndex: 9999,
                                animation: 'leaplab-dropdown-in 0.15s ease-out',
                                fontFamily: 'inherit',
                            }}
                            id="leaplab-user-dropdown"
                        >
                            {/* User info */}
                            <div style={{
                                padding: '10px 12px',
                                borderBottom: '1px solid rgba(16,0,81,0.1)',
                                marginBottom: '6px',
                            }}>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    color: '#100051',
                                    marginBottom: '2px',
                                }}>
                                    {username}
                                </div>
                                {institutionName && (
                                    <div style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#64748B',
                                    }}>
                                        {institutionName}
                                    </div>
                                )}
                            </div>
                            {/* Sign out */}
                            <button
                                onClick={handleSignOut}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 12px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    color: '#DC2626',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    fontFamily: 'inherit',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.06)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                id="leaplab-sign-out-btn"
                            >
                                <LogOut style={{ width: '14px', height: '14px' }} />
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
                onClick={() => setIsModalOpen(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isSmall ? '5px' : '7px',
                    padding: isSmall ? '6px 12px' : '8px 16px',
                    borderRadius: '10px',
                    border: `2px solid ${isDark ? 'rgba(255,255,255,0.25)' : '#100051'}`,
                    background: isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'linear-gradient(135deg, #100051, #1a0070)',
                    color: isDark ? '#fff' : '#fff',
                    fontSize: isSmall ? '12px' : '13px',
                    fontWeight: 800,
                    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backdropFilter: isDark ? 'blur(8px)' : 'none',
                    boxShadow: isDark
                        ? '0 2px 8px rgba(0,0,0,0.3)'
                        : '3px 3px 0px #100051',
                    letterSpacing: '0.02em',
                }}
                onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'translateY(-1px)';
                    if (!isDark) {
                        el.style.background = 'linear-gradient(135deg, #1a0070, #4F46E5)';
                        el.style.boxShadow = '4px 4px 0px #100051';
                    } else {
                        el.style.background = 'rgba(255,255,255,0.15)';
                    }
                }}
                onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'translateY(0)';
                    if (!isDark) {
                        el.style.background = 'linear-gradient(135deg, #100051, #1a0070)';
                        el.style.boxShadow = '3px 3px 0px #100051';
                    } else {
                        el.style.background = 'rgba(255,255,255,0.08)';
                    }
                }}
                onMouseDown={e => {
                    const el = e.currentTarget as HTMLElement;
                    if (!isDark) {
                        el.style.transform = 'translate(3px, 3px)';
                        el.style.boxShadow = 'none';
                    }
                }}
                onMouseUp={e => {
                    const el = e.currentTarget as HTMLElement;
                    if (!isDark) {
                        el.style.transform = 'translateY(-1px)';
                        el.style.boxShadow = '4px 4px 0px #100051';
                    }
                }}
                aria-label="Sign in to LeapLab"
                id="leaplab-sign-in-btn"
            >
                <LogIn style={{ width: isSmall ? '13px' : '15px', height: isSmall ? '13px' : '15px' }} />
                Sign in
            </button>

            <SignInModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
