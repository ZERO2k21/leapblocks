import React from 'react';

const OVERLAY_STYLE = {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(10, 1, 90, 0.6)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 99998, animation: 'goalFadeIn 0.25s ease-out',
};

const CARD_STYLE = {
    position: 'relative', width: '400px', maxWidth: '90vw',
    background: 'white', borderRadius: '20px', overflow: 'hidden',
    animation: 'goalPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    boxShadow: '0 20px 60px rgba(10, 1, 90, 0.25), 0 0 0 1px rgba(123, 79, 196, 0.1)',
};

const HEADER_STYLE = {
    background: 'linear-gradient(135deg, #0a015a 0%, #0d0370 50%, #080a25 100%)',
    padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px',
};

const ICON_WRAPPER_STYLE = {
    width: '44px', height: '44px', borderRadius: '12px',
    background: 'linear-gradient(135deg, #7B4FC4, #9B6FE4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px', boxShadow: '0 4px 12px rgba(123, 79, 196, 0.4)',
    animation: 'goalIconPulse 2s ease-in-out infinite', flexShrink: 0,
};

const TITLE_STYLE = {
    fontSize: '20px', fontWeight: 800, color: 'white',
    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif", letterSpacing: '0.3px',
};

const GOAL_TEXT_STYLE = {
    fontSize: '15px', fontWeight: 500, color: '#444',
    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif", lineHeight: 1.6,
    background: '#f8f7fc', borderRadius: '12px', padding: '16px 18px',
    borderLeft: '4px solid #7B4FC4',
};

const OK_BUTTON_STYLE = {
    width: '100%', marginTop: '20px',
    background: 'linear-gradient(135deg, #7B4FC4, #9B6FE4)',
    color: 'white', border: 'none', borderRadius: '12px',
    padding: '13px 24px', fontSize: '15px', fontWeight: 700,
    fontFamily: "'Segoe UI', Inter, system-ui, sans-serif",
    cursor: 'pointer', transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(123, 79, 196, 0.3)',
};

const OK_BUTTON_HOVER_IN = {
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 20px rgba(123, 79, 196, 0.4)',
};

const OK_BUTTON_HOVER_OUT = {
    transform: 'translateY(0)',
    boxShadow: '0 4px 16px rgba(123, 79, 196, 0.3)',
};

const GoalPopup = ({ isOpen, goalText, onClose }) => {
    if (!isOpen || !goalText) return null;

    return (
        <div style={OVERLAY_STYLE}>
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

            <div style={CARD_STYLE}>
                <div style={HEADER_STYLE}>
                    <div style={ICON_WRAPPER_STYLE}>🎯</div>
                    <div style={TITLE_STYLE}>Goal</div>
                </div>

                <div style={{ padding: '24px' }}>
                    <div style={GOAL_TEXT_STYLE}>{goalText}</div>

                    <button
                        onClick={onClose}
                        style={OK_BUTTON_STYLE}
                        onMouseEnter={e => Object.assign(e.currentTarget.style, OK_BUTTON_HOVER_IN)}
                        onMouseLeave={e => Object.assign(e.currentTarget.style, OK_BUTTON_HOVER_OUT)}
                    >
                        OK, got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoalPopup;
