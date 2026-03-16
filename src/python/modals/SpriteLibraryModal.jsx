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

export default function SpriteLibraryModal({ showSpriteLibrary, setShowSpriteLibrary, SPRITE_LIBRARY, addSpriteFromLibrary }) {
    if (!showSpriteLibrary) return null;

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
                width: '600px',
                maxHeight: '80vh',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
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
                    Choose a Sprite
                    <div
                        onClick={() => setShowSpriteLibrary(false)}
                        style={{ cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}
                    >×</div>
                </div>
                <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(5, 1fr)', 
                        gap: '12px' 
                    }}>
                        {SPRITE_LIBRARY.map(sp => (
                            <div 
                                key={sp.name} 
                                onClick={() => {
                                    addSpriteFromLibrary(sp);
                                    setShowSpriteLibrary(false);
                                }}
                                style={{
                                    background: '#F5F0FF',
                                    border: '2px solid transparent',
                                    borderRadius: 10,
                                    padding: 12,
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = C.PURPLE;
                                    e.currentTarget.style.background = C.LIGHT_PURPLE;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'transparent';
                                    e.currentTarget.style.background = '#F5F0FF';
                                }}
                            >
                                <img 
                                    src={sp.img} 
                                    alt={sp.name} 
                                    style={{ width: 48, height: 48, objectFit: 'contain' }} 
                                    onError={e => { e.target.style.display = 'none'; }} 
                                />
                                <div style={{ fontSize: 10, fontWeight: 600, color: C.TEXT, marginTop: 4 }}>{sp.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
