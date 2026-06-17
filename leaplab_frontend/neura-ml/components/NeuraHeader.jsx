/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import { Home, Save, Settings, HelpCircle, BookOpen, Trophy, MessageSquareWarning } from 'lucide-react';

export default function NeuraHeader({ onBack, onSave, projectName, onProjectNameChange, showProjectInput = false }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
            padding: '0px 18px',
            background: 'linear-gradient(135deg, #0a015a 0%, #080a25 100%)',
            boxShadow: 'rgba(8, 10, 37, 0.45) 0px 4px 20px, rgba(255, 255, 255, 0.06) 0px -1px 0px inset',
            zIndex: 100,
            borderBottom: '1px solid rgba(100, 180, 255, 0.1)',
            userSelect: 'none'
        }}>
            {/* ── LEFT SECTION ────────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 0%', minWidth: '0px' }}>
                {onBack && (
                    <button
                        title="Back to Home"
                        onClick={onBack}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            color: 'rgb(255, 255, 255)',
                            cursor: 'pointer',
                            transition: '0.2s',
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                    >
                        <Home size={20} strokeWidth={2.2} />
                    </button>
                )}

                <div style={{ height: '32px', width: '1px', background: 'rgba(255, 255, 255, 0.1)', flexShrink: 0 }}></div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginRight: '14px',
                    flexShrink: 0,
                    filter: 'drop-shadow(rgba(80, 200, 255, 0.3) 0px 0px 14px) drop-shadow(rgba(0, 0, 0, 0.3) 0px 2px 6px)'
                }}>
                    <img
                        alt="LeapLab"
                        src="assets/leaplab_logo_transparent.png"
                        style={{ height: '52px', objectFit: 'contain' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: '10px', lineHeight: '1.1' }}>
                        <span style={{ color: 'rgb(255, 213, 0)', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', fontFamily: '"Segoe UI", Inter, sans-serif' }}>
                            LEAPLAB
                        </span>
                        <span style={{ color: 'rgb(255, 255, 255)', fontSize: '16px', fontWeight: 900, letterSpacing: '0.08em', fontFamily: '"Segoe UI", Inter, sans-serif' }}>
                            NEURA ML
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        border: 'none',
                        color: 'rgb(255, 255, 255)',
                        fontSize: '13px',
                        fontWeight: 600,
                        fontFamily: '"Segoe UI", Inter, sans-serif',
                        cursor: 'pointer',
                        borderRadius: '20px',
                        transition: '0.2s',
                        background: 'transparent',
                        letterSpacing: '0.02em'
                    }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                        <BookOpen size={14} strokeWidth={2.2} style={{ opacity: 0.9 }} />
                        Tutorials
                    </button>
                </div>
            </div>

            {/* ── MIDDLE SECTION ──────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '0px 16px' }}>
                {showProjectInput && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        height: '40px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: '20px',
                        paddingLeft: '18px',
                        paddingRight: '5px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        gap: '8px',
                        transition: '0.2s'
                    }}>
                        <span style={{ fontSize: '14px', opacity: 0.45 }}>🧠</span>
                        <input
                            placeholder="My ML Project"
                            type="text"
                            value={projectName || ''}
                            onChange={(e) => onProjectNameChange && onProjectNameChange(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgb(255, 255, 255)',
                                fontSize: '14px',
                                fontWeight: 700,
                                fontFamily: '"Segoe UI", Inter, sans-serif',
                                width: '170px',
                                textAlign: 'center',
                                outline: 'none',
                                letterSpacing: '0.01em'
                            }}
                        />
                        {onSave && (
                            <button
                                title="Save Project"
                                onClick={onSave}
                                style={{
                                    background: 'rgb(34, 197, 94)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '42px',
                                    height: '42px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'rgb(255, 255, 255)',
                                    boxShadow: 'rgba(0, 0, 0, 0.3) 0px 4px 6px -1px',
                                    transition: 'transform 0.2s',
                                    flexShrink: 0,
                                    transform: 'scale(1)'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'none'; }}
                            >
                                <Save size={18} strokeWidth={2.8} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* ── RIGHT SECTION ───────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '20px', flex: '1 1 0%', minWidth: '0px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    paddingRight: '16px',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    height: '32px',
                    flexShrink: 0
                }}>
                    <button title="Feedback" style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.55)', cursor: 'pointer', padding: '0px', transition: '0.2s', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)')}
                    >
                        <MessageSquareWarning size={20} strokeWidth={2.2} />
                    </button>
                    <button title="Achievements" style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.55)', cursor: 'pointer', padding: '0px', transition: '0.2s', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)')}
                    >
                        <Trophy size={20} strokeWidth={2.2} />
                    </button>
                    <button title="Settings" style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.55)', cursor: 'pointer', padding: '0px', transition: '0.2s', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)')}
                    >
                        <Settings size={20} strokeWidth={2.2} />
                    </button>
                    <button title="Help" style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.55)', cursor: 'pointer', padding: '0px', transition: '0.2s', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.55)')}
                    >
                        <HelpCircle size={20} strokeWidth={2.2} />
                    </button>
                </div>

                <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '38px',
                    gap: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    color: 'rgb(255, 255, 255)',
                    fontWeight: 700,
                    fontSize: '13px',
                    fontFamily: '"Segoe UI", Inter, sans-serif',
                    paddingLeft: '5px',
                    paddingRight: '18px',
                    transition: '0.2s',
                    boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 8px',
                    flexShrink: 0
                }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                >
                    <div style={{
                        width: '28px',
                        height: '28px',
                        background: 'linear-gradient(135deg, rgb(255, 209, 102), rgb(245, 158, 11))',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid rgba(255, 255, 255, 0.25)',
                        boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 4px'
                    }}>
                        <img src="/assets/leaplabicon.ico" alt="LeapLab" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                    </div>
                    Sign In
                </button>

                <div style={{
                    marginLeft: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    filter: 'drop-shadow(rgba(255, 255, 255, 0.15) 0px 0px 14px) drop-shadow(rgba(0, 0, 0, 0.4) 0px 2px 8px)'
                }}>
                    <img
                        alt="Leap into the AI Future"
                        src="assets/Copy of CREOLEAP LOGO LEAP INTO THE AI FUTURE Final.svg"
                        style={{ height: '160px', objectFit: 'contain', filter: 'brightness(1.2) contrast(1.1) drop-shadow(rgba(255, 255, 255, 0.2) 0px 0px 2px)' }}
                    />
                </div>
            </div>
        </div>
    )
}
