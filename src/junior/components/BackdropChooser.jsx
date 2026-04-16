import React, { useState } from 'react';
import { X, Paintbrush, Image } from 'lucide-react';
import { leapBackdrops } from '../../components/generated_leap_backdrops';

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
    src: `/assets/backdrops/${bg.md5ext || bg.md5}`,
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

export default function BackdropChooser({ onSelect, onPaint, onClose }) {
    const [tab, setTab] = useState('backdrops'); // 'backdrops' | 'colors'
    const [hoveredId, setHoveredId] = useState(null);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.55)', zIndex: 3000,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                background: 'white', width: '100vw', height: '100vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #7B4FC4 0%, #9B6FE4 100%)',
                    padding: '16px 24px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Image size={22} color="white" />
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'white' }}>
                            Choose a Backdrop
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.2)', border: 'none',
                            borderRadius: '50%', width: '32px', height: '32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    >
                        <X size={18} color="white" />
                    </button>
                </div>

                {/* Tab Bar */}
                <div style={{
                    display: 'flex', borderBottom: '1px solid #eee',
                    background: '#fafafa',
                }}>
                    {[
                        { id: 'backdrops', label: '🖼️ Backdrops' },
                        { id: 'colors', label: '🎨 Solid Colors' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            style={{
                                flex: 1, padding: '12px 16px',
                                background: tab === t.id ? 'white' : 'transparent',
                                border: 'none',
                                borderBottom: tab === t.id ? '3px solid #7B4FC4' : '3px solid transparent',
                                color: tab === t.id ? '#7B4FC4' : '#999',
                                fontWeight: 700, fontSize: '14px',
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    {tab === 'backdrops' && (
                        <>
                            {/* Paint custom button */}
                            <div
                                onClick={onPaint}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 16px', marginBottom: '16px',
                                    background: 'linear-gradient(135deg, #7B4FC4 0%, #9B6FE4 100%)',
                                    borderRadius: '12px', cursor: 'pointer',
                                    transition: 'all 0.15s', color: 'white',
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Paintbrush size={20} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px' }}>Paint Custom Backdrop</div>
                                    <div style={{ fontSize: '11px', opacity: 0.8 }}>Draw your own scene</div>
                                </div>
                            </div>

                            {/* Backdrop Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '14px',
                            }}>
                                {BACKDROP_LIBRARY.map(bg => (
                                    <div
                                        key={bg.id}
                                        onClick={() => onSelect(bg.name, bg.src)}
                                        onMouseEnter={() => setHoveredId(bg.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        style={{
                                            cursor: 'pointer',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            border: hoveredId === bg.id ? '3px solid #7B4FC4' : '2px solid #e0e0e0',
                                            transition: 'all 0.2s',
                                            transform: hoveredId === bg.id ? 'scale(1.03)' : 'scale(1)',
                                            boxShadow: hoveredId === bg.id
                                                ? '0 6px 20px rgba(123,79,196,0.25)'
                                                : '0 2px 6px rgba(0,0,0,0.06)',
                                        }}
                                    >
                                        {/* Preview */}
                                        <div style={{
                                            width: '100%',
                                            paddingTop: '75%',
                                            position: 'relative',
                                            background: bg.color,
                                        }}>
                                            <img
                                                src={bg.src}
                                                alt={bg.name}
                                                style={{
                                                    position: 'absolute', top: 0, left: 0,
                                                    width: '100%', height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                                onError={e => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        </div>
                                        {/* Label */}
                                        <div style={{
                                            padding: '8px 10px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            color: '#444',
                                            textAlign: 'center',
                                            background: 'white',
                                        }}>
                                            {bg.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {tab === 'colors' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '14px',
                        }}>
                            {SOLID_COLORS.map(c => (
                                <div
                                    key={c.name}
                                    onClick={() => onSelect(c.name, null, c.color)}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    style={{
                                        cursor: 'pointer',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '2px solid #e0e0e0',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                    }}
                                >
                                    <div style={{
                                        width: '100%',
                                        paddingTop: '75%',
                                        background: c.color,
                                        border: c.color === '#FFFFFF' ? '1px solid #eee' : 'none',
                                        borderRadius: '10px 10px 0 0',
                                    }} />
                                    <div style={{
                                        padding: '8px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: '#555',
                                        textAlign: 'center',
                                        background: 'white',
                                    }}>
                                        {c.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
