import React from "react";

// ─── Theme (Leapblocks Colors) ─────────────────────────────────────────────────
const C = {
    PURPLE: "#8B5CF6",
    DARK_PURPLE: "#7C3AED",
    LIGHT_PURPLE: "#EDE9FE",
    PURPLE_BG: "#F5F3FF",
    BORDER: "#E5E7EB",
    BG: "#F9FAFB",
    BG2: "#F3F4F6",
    TEXT: "#1F2937",
    MUTED: "#6B7280",
    GREEN: "#10B981",
    RED: "#EF4444",
    BLUE: "#3B82F6",
    ORANGE: "#F59E0B",
    ACCENT: "#8B5CF6",
    HEADER_BG: "#8B5CF6",
};

export default function PromptModal({ modalState, modalInput, setModalInput, handleModalSubmit, handleModalCancel }) {
    if (!modalState.isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                width: '400px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                overflow: 'hidden',
            }}>
                <div style={{
                    backgroundColor: C.PURPLE,
                    color: 'white',
                    padding: '12px 16px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    {modalState.title}
                    <div
                        onClick={handleModalCancel}
                        style={{ cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}
                    >×</div>
                </div>
                <div style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '10px', fontSize: '14px', color: '#575E75' }}>
                        {modalState.message}
                    </div>
                    <input
                        autoFocus
                        type="text"
                        value={modalInput}
                        onChange={(e) => setModalInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleModalSubmit();
                            if (e.key === 'Escape') handleModalCancel();
                        }}
                        style={{
                            padding: '12px',
                            fontSize: '16px',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            width: '100%',
                            fontFamily: 'inherit',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    padding: '0 20px 20px',
                }}>
                    <button onClick={handleModalCancel} style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#666',
                    }}>Cancel</button>
                    <button onClick={handleModalSubmit} style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: C.PURPLE,
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                    }}>OK</button>
                </div>
            </div>
        </div>
    );
}
