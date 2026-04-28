/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState } from 'react';
import { X, Paintbrush, Image } from 'lucide-react';
import { leapBackdrops } from '../../../leapembed/client/assets/generatedLeapBackdrops';

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

const mappedleapBackdrops = leapBackdrops.map((bg: any) => ({
    id: bg.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    name: bg.name,
    src: `/assets/backdrops/${bg.md5ext || (bg as any).md5}`,
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

interface BackdropChooserProps {
    onSelect: (name: string, src: string | null, solidColor?: string | null) => void;
    onPaint: () => void;
    onClose: () => void;
}

export default function BackdropChooser({ onSelect, onPaint, onClose }: BackdropChooserProps) {
    const [tab, setTab] = useState<'backdrops' | 'colors'>('backdrops');
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 bg-black/55 z-[3000] flex justify-center items-center backdrop-blur-[4px]">
            <div className="bg-white w-screen h-screen flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#7B4FC4] to-[#9B6FE4] px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                        <Image size={22} color="white" />
                        <h2 className="m-0 text-lg font-bold text-white">
                            Choose a Backdrop
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/20 border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-all hover:bg-white/30"
                    >
                        <X size={18} color="white" />
                    </button>
                </div>

                {/* Tab Bar */}
                <div className="flex border-b border-gray-200 bg-[#fafafa]">
                    {[
                        { id: 'backdrops', label: '🖼️ Backdrops' },
                        { id: 'colors', label: '🎨 Solid Colors' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as 'backdrops' | 'colors')}
                            className={`flex-1 px-4 py-3 border-none text-sm font-bold cursor-pointer transition-all ${
                                tab === t.id
                                    ? 'bg-white border-b-[3px] border-b-[#7B4FC4] text-[#7B4FC4]'
                                    : 'bg-transparent border-b-[3px] border-b-transparent text-[#999]'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto flex-1">
                    {tab === 'backdrops' && (
                        <>
                            {/* Paint custom */}
                            <div
                                onClick={onPaint}
                                className="flex items-center gap-2.5 px-4 py-3 mb-4 bg-gradient-to-br from-[#7B4FC4] to-[#9B6FE4] rounded-xl cursor-pointer transition-all text-white hover:scale-[1.02]"
                            >
                                <Paintbrush size={20} />
                                <div>
                                    <div className="font-bold text-sm">Paint Custom Backdrop</div>
                                    <div className="text-[11px] opacity-80">Draw your own scene</div>
                                </div>
                            </div>

                            {/* Backdrop Grid */}
                            <div className="grid grid-cols-3 gap-3.5">
                                {BACKDROP_LIBRARY.map(bg => (
                                    <div
                                        key={bg.id}
                                        onClick={() => onSelect(bg.name, bg.src)}
                                        onMouseEnter={() => setHoveredId(bg.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        className={`cursor-pointer rounded-xl overflow-hidden transition-all duration-200 ${
                                            hoveredId === bg.id
                                                ? 'border-[3px] border-[#7B4FC4] scale-[1.03] shadow-[0_6px_20px_rgba(123,79,196,0.25)]'
                                                : 'border-2 border-[#e0e0e0] scale-100 shadow-[0_2px_6px_rgba(0,0,0,0.06)]'
                                        }`}
                                    >
                                        <div
                                            className="w-full relative"
                                            style={{ paddingTop: '75%', background: bg.color }}
                                        >
                                            <img
                                                src={bg.src}
                                                alt={bg.name}
                                                className="absolute inset-0 w-full h-full object-cover"
                                                onError={e => { (e.currentTarget.style.display = 'none'); }}
                                            />
                                        </div>
                                        <div className="px-2.5 py-2 text-xs font-bold text-[#444] text-center bg-white">
                                            {bg.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {tab === 'colors' && (
                        <div className="grid grid-cols-4 gap-3.5">
                            {SOLID_COLORS.map(c => (
                                <div
                                    key={c.name}
                                    onClick={() => onSelect(c.name, null, c.color)}
                                    className="cursor-pointer rounded-xl overflow-hidden border-2 border-[#e0e0e0] transition-all duration-200 shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:scale-105"
                                >
                                    <div
                                        className="w-full rounded-t-[10px]"
                                        style={{
                                            paddingTop: '75%',
                                            background: c.color,
                                            border: c.color === '#FFFFFF' ? '1px solid #eee' : 'none',
                                        }}
                                    />
                                    <div className="p-2 text-[11px] font-bold text-[#555] text-center bg-white">
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
