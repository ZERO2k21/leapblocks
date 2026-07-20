/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState } from 'react';
import { X, Paintbrush, Image } from 'lucide-react';
import { leapBackdrops } from '../../../components/generated_leap_backdrops';

// Pre-built backdrops available in the library
const PRESET_BACKDROPS = [
    { id: 'maze', name: 'Maze', src: 'assets/backdrops/maze.svg', color: '#FFD54F' },
    { id: 'park', name: 'Park', src: 'assets/backdrops/park.svg', color: '#66BB6A' },
    { id: 'underwater', name: 'Underwater', src: 'assets/backdrops/underwater.svg', color: '#0288D1' },
    { id: 'space', name: 'Space', src: 'assets/backdrops/space_bg.svg', color: '#1A237E' },
    { id: 'city', name: 'City', src: 'assets/backdrops/city.svg', color: '#607D8B' },
    { id: 'arctic', name: 'Arctic', src: 'assets/backdrops/Artic.png', color: '#E0F7FA' },
    { id: 'beach', name: 'Beach', src: 'assets/backdrops/Beach.png', color: '#FFF9C4' },
    { id: 'castle', name: 'Castle', src: 'assets/backdrops/Castle.png', color: '#E1BEE7' },
    { id: 'space_photo', name: 'Galaxy', src: 'assets/backdrops/Space.png', color: '#0D0D2B' },
];

const mappedleapBackdrops = leapBackdrops.map(bg => ({
    id: bg.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    name: bg.name,
    src: `assets/backdrops/${bg.md5ext || bg.md5}`,
    color: '#E0E0E0'
}));

const BACKDROP_LIBRARY = [...PRESET_BACKDROPS, ...mappedleapBackdrops];

const SOLID_COLORS = [
    { name: 'White', color: '#FFFFFF' },
    { name: 'Sky Blue', color: '#87CEEB' },
    { name: 'Grass Green', color: '#66BB6A' },
    { name: 'Sand', color: '#FFE0B2' },
    { name: 'Sunset', color: '#FF8A65' },
    { name: 'Purple', color: '#CE93D8' },
    { name: 'Night', color: '#1A237E' },
    { name: 'Pink', color: '#F48FB1' },
];

const OVERLAY_STYLE = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.55)', zIndex: 3000,
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    backdropFilter: 'blur(4px)',
};

const MODAL_STYLE = {
    background: 'white', width: '100vw', height: '100vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
};

const HEADER_STYLE = {
    background: 'linear-gradient(135deg, #7B4FC4 0%, #9B6FE4 100%)',
    padding: '16px 24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
};

const CLOSE_BTN_STYLE = {
    background: 'rgba(255,255,255,0.2)', border: 'none',
    borderRadius: '50%', width: '32px', height: '32px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.15s',
};

const TAB_BAR_STYLE = { display: 'flex', borderBottom: '1px solid #eee', background: '#fafafa' };

const CONTENT_STYLE = { padding: '20px', overflowY: 'auto', flex: 1 };

const PAINT_CARD_STYLE = {
    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
    marginBottom: '16px', background: 'linear-gradient(135deg, #7B4FC4 0%, #9B6FE4 100%)',
    borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s', color: 'white',
};

const GRID_3_COL = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' };

const GRID_4_COL = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' };

const PREVIEW_BOX_STYLE = { width: '100%', paddingTop: '75%', position: 'relative' };

const IMG_STYLE = {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover',
};

const CARD_LABEL_STYLE = { padding: '8px 10px', fontSize: '12px', fontWeight: 700, color: '#444', textAlign: 'center', background: 'white' };

const COLOR_SWATCH_STYLE = { width: '100%', paddingTop: '75%', borderRadius: '10px 10px 0 0' };

const COLOR_LABEL_STYLE = { padding: '8px', fontSize: '11px', fontWeight: 700, color: '#555', textAlign: 'center', background: 'white' };

const getBackdropCardStyle = (isHovered) => ({
    cursor: 'pointer', borderRadius: '12px', overflow: 'hidden',
    border: isHovered ? '3px solid #7B4FC4' : '2px solid #e0e0e0',
    transition: 'all 0.2s',
    transform: isHovered ? 'scale(1.03)' : 'scale(1)',
    boxShadow: isHovered ? '0 6px 20px rgba(123,79,196,0.25)' : '0 2px 6px rgba(0,0,0,0.06)',
});

const getTabButtonStyle = (isActive) => ({
    flex: 1, padding: '12px 16px',
    background: isActive ? 'white' : 'transparent', border: 'none',
    borderBottom: isActive ? '3px solid #7B4FC4' : '3px solid transparent',
    color: isActive ? '#7B4FC4' : '#999',
    fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s',
});

const TABS = [
    { id: 'backdrops', label: '🖼️ Backdrops' },
    { id: 'colors', label: '🎨 Solid Colors' },
];

function ColorSwatch({ color, name, onSelect }) {
    return (
        <div
            onClick={onSelect}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            style={{
                cursor: 'pointer', borderRadius: '12px', overflow: 'hidden',
                border: '2px solid #e0e0e0', transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
        >
            <div style={{ ...COLOR_SWATCH_STYLE, background: color, border: color === '#FFFFFF' ? '1px solid #eee' : 'none' }} />
            <div style={COLOR_LABEL_STYLE}>{name}</div>
        </div>
    );
}

function BackdropCard({ bg, hoveredId, onSelect, onHover }) {
    return (
        <div
            onClick={() => onSelect(bg.name, bg.src)}
            onMouseEnter={() => onHover(bg.id)}
            onMouseLeave={() => onHover(null)}
            style={getBackdropCardStyle(hoveredId === bg.id)}
        >
            <div style={{ ...PREVIEW_BOX_STYLE, background: bg.color }}>
                <img
                    src={bg.src} alt={bg.name} style={IMG_STYLE}
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                />
            </div>
            <div style={CARD_LABEL_STYLE}>{bg.name}</div>
        </div>
    );
}

export default function BackdropChooser({ onSelect, onPaint, onClose }) {
    const [tab, setTab] = useState('backdrops');
    const [hoveredId, setHoveredId] = useState(null);

    return (
        <div style={OVERLAY_STYLE}>
            <div style={MODAL_STYLE}>
                <div style={HEADER_STYLE}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Image size={22} color="white" />
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'white' }}>
                            Choose a Backdrop
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={CLOSE_BTN_STYLE}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    >
                        <X size={18} color="white" />
                    </button>
                </div>

                <div style={TAB_BAR_STYLE}>
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            style={getTabButtonStyle(tab === t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div style={CONTENT_STYLE}>
                    {tab === 'backdrops' && (
                        <>
                            <div
                                onClick={onPaint}
                                style={PAINT_CARD_STYLE}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Paintbrush size={20} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Paint Custom Backdrop</div>
                                    <div style={{ fontSize: '11px', opacity: 0.8 }}>Draw your own scene</div>
                                </div>
                            </div>

                            <div style={GRID_3_COL}>
                                {BACKDROP_LIBRARY.map(bg => (
                                    <BackdropCard
                                        key={bg.id}
                                        bg={bg}
                                        hoveredId={hoveredId}
                                        onSelect={onSelect}
                                        onHover={setHoveredId}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {tab === 'colors' && (
                        <div style={GRID_4_COL}>
                            {SOLID_COLORS.map(c => (
                                <ColorSwatch
                                    key={c.name}
                                    color={c.color}
                                    name={c.name}
                                    onSelect={() => onSelect(c.name, null, c.color)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
