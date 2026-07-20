/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// DROPDOWN MENU — Glassmorphism + slide-in animation (same design as Intermediate)
// ═══════════════════════════════════════════════════════════════════════════
export default function DropdownMenu({ label, icon: Icon, items, isOpen, onToggle, onClose }) {
    const menuRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onCloseRef.current();
            }
        };
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside, true);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [isOpen]);

    return (
        <div ref={menuRef} style={{ position: 'relative' }}>
            <button
                onClick={onToggle}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    border: 'none',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                    cursor: 'pointer',
                    borderRadius: 22,
                    transition: 'all 0.2s ease',
                    background: isOpen ? 'rgba(255,255,255,0.18)' : 'transparent',
                    backdropFilter: isOpen ? 'blur(4px)' : 'none',
                    letterSpacing: '0.02em',
                }}
                onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = isOpen ? 'rgba(255,255,255,0.18)' : 'transparent'; }}
            >
                {Icon && <Icon size={16} strokeWidth={2.2} style={{ opacity: 0.9 }} />}
                {label}
                <ChevronDown
                    size={14}
                    strokeWidth={2.5}
                    style={{
                        opacity: 0.5,
                        transition: 'transform 0.2s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    minWidth: 200,
                    overflow: 'hidden',
                    zIndex: 1000,
                    padding: '6px 0',
                    animation: 'jrMenuSlideIn 0.18s ease-out',
                }}>
                    <style>{`
                        @keyframes jrMenuSlideIn {
                            from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                            to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                    `}</style>
                    {items.map((item, idx) => (
                        item.divider ? (
                            <div key={idx} style={{
                                height: 1,
                                background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)',
                                margin: '5px 12px',
                            }} />
                        ) : (
                            <button
                                key={idx}
                                onClick={() => { item.onClick?.(); onClose(); }}
                                disabled={item.disabled}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    width: '100%',
                                    padding: '9px 14px',
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: 15,
                                    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                                    fontWeight: 500,
                                    textAlign: 'left',
                                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                                    color: item.disabled ? '#bbb' : '#374151',
                                    transition: 'all 0.12s ease',
                                    borderRadius: 0,
                                    letterSpacing: '0.01em',
                                }}
                                onMouseEnter={e => {
                                    if (!item.disabled) {
                                        e.currentTarget.style.background = 'rgba(107,70,193,0.08)';
                                        e.currentTarget.style.color = '#6B46C1';
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = item.disabled ? '#bbb' : '#374151';
                                }}
                            >
                                {item.icon && <item.icon size={16} color="#7C3AED" strokeWidth={2} style={{ opacity: 0.85, flexShrink: 0 }} />}
                                <span style={{ flex: 1 }}>{item.label}</span>
                                {item.shortcut && (
                                    <span style={{
                                        fontSize: 11,
                                        color: '#aaa',
                                        fontWeight: 500,
                                        background: 'rgba(0,0,0,0.04)',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        fontFamily: "'Segoe UI', monospace",
                                    }}>{item.shortcut}</span>
                                )}
                            </button>
                        )
                    ))}
                </div>
            )}
        </div>
    );
}
