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
    { id: 'school', name: 'School', src: 'assets/backdrops/school.png', color: '#C62828' },
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

const TABS = [
    { id: 'backdrops', label: '🖼️ Backdrops' },
    { id: 'colors', label: '🎨 Solid Colors' },
];

function ColorSwatch({ color, name, onSelect }) {
    return (
        <div
            onClick={onSelect}
            className="cursor-pointer rounded-xl overflow-hidden border-2 border-slate-200 transition-all duration-200 shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:scale-105"
        >
            <div className={`w-full pt-[75%] rounded-t-xl ${color === '#FFFFFF' ? 'border border-slate-100' : ''}`} style={{ background: color }} />
            <div className="p-2 text-[11px] font-bold text-slate-600 text-center bg-white">{name}</div>
        </div>
    );
}

function BackdropCard({ bg, hoveredId, onSelect, onHover }) {
    const isHovered = hoveredId === bg.id;
    return (
        <div
            onClick={() => onSelect(bg.name, bg.src)}
            onMouseEnter={() => onHover(bg.id)}
            onMouseLeave={() => onHover(null)}
            className={`cursor-pointer rounded-xl overflow-hidden transition-all duration-200 ${
                isHovered
                    ? 'border-[3px] border-[#7B4FC4] scale-[1.03] shadow-[0_6px_20px_rgba(123,79,196,0.25)]'
                    : 'border-2 border-slate-200 scale-100 shadow-[0_2px_6px_rgba(0,0,0,0.06)]'
            }`}
        >
            <div className="w-full pt-[75%] relative" style={{ background: bg.color }}>
                <img
                    src={bg.src}
                    alt={bg.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                />
            </div>
            <div className="p-2 px-2.5 text-xs font-bold text-slate-700 text-center bg-white">{bg.name}</div>
        </div>
    );
}

export default function BackdropChooser({ onSelect, onPaint, onClose }) {
    const [tab, setTab] = useState('backdrops');
    const [hoveredId, setHoveredId] = useState(null);

    return (
        <div className="fixed inset-0 w-full h-full bg-black/55 z-[3000] flex justify-center items-center backdrop-blur-xs">
            <div className="bg-white w-screen h-screen flex flex-col overflow-hidden">
                <div className="bg-gradient-to-br from-[#7B4FC4] to-[#9B6FE4] p-4 px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <Image size={22} color="white" />
                        <h2 className="m-0 text-lg font-bold text-white">
                            Choose a Backdrop
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/20 hover:bg-white/30 border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-150"
                    >
                        <X size={18} color="white" />
                    </button>
                </div>

                <div className="flex border-b border-slate-100 bg-slate-50">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex-1 p-3 px-4 border-none border-b-[3px] font-bold text-sm cursor-pointer transition-all duration-150 ${
                                tab === t.id
                                    ? 'bg-white border-[#7B4FC4] text-[#7B4FC4]'
                                    : 'bg-transparent border-transparent text-slate-400'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="p-5 overflow-y-auto flex-1">
                    {tab === 'backdrops' && (
                        <>
                            <div
                                onClick={onPaint}
                                className="flex items-center gap-2.5 p-3 px-4 mb-4 bg-gradient-to-br from-[#7B4FC4] to-[#9B6FE4] rounded-xl cursor-pointer transition-all duration-150 text-white hover:scale-[1.02]"
                            >
                                <Paintbrush size={20} />
                                <div>
                                    <div className="font-bold text-sm">Paint Custom Backdrop</div>
                                    <div className="text-xs opacity-80">Draw your own scene</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3.5">
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
                        <div className="grid grid-cols-4 gap-3.5">
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
