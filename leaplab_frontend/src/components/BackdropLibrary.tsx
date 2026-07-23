/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef } from 'react';
import { leapBackdrops } from './generated_leap_backdrops';

// ═══════════════════════════════════════════════════════════════════════════
// BACKDROP CATALOG
// ═══════════════════════════════════════════════════════════════════════════
export interface BackdropEntry {
    id: string;
    name: string;
    image: string;
    category: string;
}

const CATEGORIES = [
    { id: 'All', color: '#FF4C4C' },
    { id: 'Fantasy', color: '#CF63CF' },
    { id: 'Music', color: '#FFAB19' },
    { id: 'Sports', color: '#FF8C1A' },
    { id: 'Outdoors', color: '#0FBD8C' },
    { id: 'Indoors', color: '#9966FF' },
    { id: 'Space', color: '#4CBFE6' },
    { id: 'Underwater', color: '#4C97FF' },
    { id: 'Patterns', color: '#F97316' },
];

const mappedleapBackdrops = leapBackdrops.map((backdrop: any, index: number) => {
    const tags = Array.isArray(backdrop.tags) ? backdrop.tags.map((t: string) => t.toLowerCase()) : [];
    let category = 'Outdoors';

    if (tags.includes('fantasy')) category = 'Fantasy';
    else if (tags.includes('music')) category = 'Music';
    else if (tags.includes('sports')) category = 'Sports';
    else if (tags.includes('indoors')) category = 'Indoors';
    else if (tags.includes('space')) category = 'Space';
    else if (tags.includes('underwater')) category = 'Underwater';
    else if (tags.includes('patterns')) category = 'Patterns';

    return {
        ...backdrop,
        // Guarantee a unique, stable id — use existing id/name or fall back to index
        id: backdrop.id ?? backdrop.name ?? `leap_backdrop_${index}`,
        image: `assets/backdrops/${backdrop.md5ext || backdrop.md5}`,
        category
    } as BackdropEntry;
});

const PRESET_BACKDROPS: BackdropEntry[] = [
    { id: 'maze', name: 'Maze', image: 'assets/backdrops/maze.svg', category: 'Patterns' },
    { id: 'park', name: 'Park', image: 'assets/backdrops/park.svg', category: 'Outdoors' },
    { id: 'preset_underwater', name: 'Underwater', image: 'assets/backdrops/underwater.svg', category: 'Underwater' },
    { id: 'space_bg', name: 'Space', image: 'assets/backdrops/space_bg.svg', category: 'Space' },
    { id: 'city', name: 'City', image: 'assets/backdrops/city.svg', category: 'Outdoors' },
    { id: 'arctic', name: 'Arctic', image: 'assets/backdrops/Artic.png', category: 'Outdoors' },
    { id: 'beach', name: 'Beach', image: 'assets/backdrops/Beach.png', category: 'Outdoors' },
    { id: 'castle', name: 'Castle', image: 'assets/backdrops/Castle.png', category: 'Fantasy' },
    { id: 'space_photo', name: 'Galaxy', image: 'assets/backdrops/Space.png', category: 'Space' },
    { id: 'school', name: 'School', image: 'assets/backdrops/school.png', category: 'Outdoors' },
];

// Deduplicate by id — preset backdrops take priority over generated ones
const seen = new Set<string>();
const FULL_CATALOG = [...PRESET_BACKDROPS, ...mappedleapBackdrops].filter(b => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
});

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
interface BackdropLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectBackdrop: (backdrop: BackdropEntry) => void;
}

export const BackdropLibrary: React.FC<BackdropLibraryProps> = ({
    isOpen,
    onClose,
    onSelectBackdrop,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // Filter backdrops
    const filteredBackdrops = FULL_CATALOG.filter(backdrop => {
        const matchesCategory = activeCategory === 'All' || backdrop.category === activeCategory;
        const matchesSearch = !searchQuery ||
            backdrop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            backdrop.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const customBackdrop: BackdropEntry = {
                id: `custom_${Date.now()}`,
                name: file.name.replace(/\.[^/.]+$/, ''),
                image: dataUrl,
                category: 'Outdoors'
            };
            onSelectBackdrop(customBackdrop);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    return (
        <div className="fixed inset-0 w-screen h-screen bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-xs" onClick={onClose}>
            <div className="w-screen h-screen bg-white flex flex-col overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 px-6 flex items-center justify-between">
                    <button type="button" className="bg-white/20 border-0 text-white text-sm font-semibold p-2 px-4 rounded-full cursor-pointer transition-colors hover:bg-white/30" onClick={onClose}>
                        ← Back
                    </button>
                    <h2 className="text-white text-lg font-bold m-0 tracking-wide">Choose a Backdrop</h2>
                    <div className="w-20" /> {/* spacer */}
                </div>

                {/* Search + Category Filters */}
                <div className="p-4 px-5 pb-3 flex flex-col gap-3 border-b border-slate-100">
                    <div className="flex items-center bg-slate-100 rounded-full px-4 border border-slate-300 max-w-xs">
                        <span className="text-sm mr-2">🔍</span>
                        <input
                            type="text"
                            placeholder="Search backdrops..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="border-0 bg-transparent py-2.5 text-sm outline-none flex-1 text-slate-800"
                        />
                        {searchQuery && (
                            <button type="button" className="border-0 bg-transparent cursor-pointer text-sm text-slate-400 p-1 hover:text-slate-600" onClick={() => setSearchQuery('')}>
                                ✕
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                className={`py-1.5 px-3.5 rounded-full text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                                    activeCategory === cat.id
                                        ? 'text-white border-0'
                                        : 'text-slate-600 bg-transparent border border-slate-300 hover:border-slate-400'
                                }`}
                                style={{ backgroundColor: activeCategory === cat.id ? cat.color : undefined }}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                {cat.id}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Backdrop Grid */}
                <div className="flex-1 overflow-auto p-4 px-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                        {filteredBackdrops.map(backdrop => (
                            <div
                                key={backdrop.id}
                                className="bg-white rounded-xl border-2 border-slate-200 cursor-pointer transition-all duration-200 overflow-hidden flex flex-col hover:border-purple-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-600/20"
                                onClick={() => onSelectBackdrop(backdrop)}
                                onMouseEnter={() => setHoveredId(backdrop.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                <div className="w-full h-24 bg-slate-50 flex justify-center items-center overflow-hidden">
                                    <img
                                        src={backdrop.image}
                                        alt={backdrop.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="w-full p-1.5 px-2 text-xs font-semibold text-slate-600 text-center border-t border-slate-100 whitespace-nowrap overflow-hidden text-ellipsis">{backdrop.name}</div>
                            </div>
                        ))}
                        {filteredBackdrops.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-400">
                                <span className="text-5xl">🔍</span>
                                <p className="mt-2">No backdrops found for "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Floating Action Buttons */}
                <div className="absolute bottom-5 right-6 flex flex-col gap-2.5 z-10">
                    <button
                        type="button"
                        className="w-12 h-12 rounded-full border-0 text-xl text-white bg-blue-500 cursor-pointer flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload a backdrop"
                    >
                        ⬆️
                    </button>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.svg"
                    onChange={handleFileUpload}
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default BackdropLibrary;
