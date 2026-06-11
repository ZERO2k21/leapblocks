import React from 'react';

const GoalPopup = ({ isOpen, goalText, onClose }) => {
    if (!isOpen || !goalText) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(10, 1, 90, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99998,
            animation: 'goalFadeIn 0.25s ease-out',
        }}>
            <style>{`
                @keyframes goalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes goalPopIn {
                    from { transform: scale(0.85) translateY(20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes goalIconPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }
            `}</style>

            {/* Card */}
            <div style={{
                position: 'relative',
                width: '400px',
                maxWidth: '90vw',
                background: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                animation: 'goalPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 20px 60px rgba(10, 1, 90, 0.25), 0 0 0 1px rgba(123, 79, 196, 0.1)',
            }}>

                {/* Header - matches topbar gradient */}
                <div style={{
                    background: 'linear-gradient(135deg, #0a015a 0%, #0d0370 50%, #080a25 100%)',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                }}>
                    {/* Target icon */}
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #7B4FC4, #9B6FE4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        boxShadow: '0 4px 12px rgba(123, 79, 196, 0.4)',
                        animation: 'goalIconPulse 2s ease-in-out infinite',
                        flexShrink: 0,
                    }}>
                        🎯
                    </div>

                    {/* Title */}
                    <div style={{
                        fontSize: '20px',
                        fontWeight: 800,
                        color: 'white',
                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        letterSpacing: '0.3px',
                    }}>
                        Goal
                    </div>
                </div>

                {/* Body */}
                <div style={{
                    padding: '24px',
                }}>
                    {/* Goal text */}
                    <div style={{
                        fontSize: '15px',
                        fontWeight: 500,
                        color: '#444',
                        fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                        lineHeight: 1.6,
                        background: '#f8f7fc',
                        borderRadius: '12px',
                        padding: '16px 18px',
                        borderLeft: '4px solid #7B4FC4',
                    }}>
                        {goalText}
                    </div>

                    {/* OK button */}
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%',
                            marginTop: '20px',
                            background: 'linear-gradient(135deg, #7B4FC4, #9B6FE4)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '13px 24px',
                            fontSize: '15px',
                            fontWeight: 700,
                            fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 16px rgba(123, 79, 196, 0.3)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(123, 79, 196, 0.4)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(123, 79, 196, 0.3)';
                        }}
                    >
                        OK, got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoalPopup;
