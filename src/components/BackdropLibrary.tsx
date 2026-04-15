/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef } from 'react';
import { scratchBackdrops } from './generated_scratch_backdrops';

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

const mappedScratchBackdrops = scratchBackdrops.map((backdrop: any) => {
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
        image: `/assets/backdrops/${backdrop.md5ext || backdrop.md5}`,
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
];

const FULL_CATALOG = [...PRESET_BACKDROPS, ...mappedScratchBackdrops];

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
                id: `custom_${Date.now()} `,
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
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <button style={styles.backButton} onClick={onClose}>
                        ← Back
                    </button>
                    <h2 style={styles.title}>Choose a Backdrop</h2>
                    <div style={{ width: 80 }} /> {/* spacer */}
                </div>

                {/* Search + Category Filters */}
                <div style={styles.filterRow}>
                    <div style={styles.searchBox}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search backdrops..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={styles.searchInput}
                        />
                        {searchQuery && (
                            <button style={styles.clearSearch} onClick={() => setSearchQuery('')}>
                                ✕
                            </button>
                        )}
                    </div>
                    <div style={styles.categoryTabs}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                style={{
                                    ...styles.categoryTab,
                                    backgroundColor: activeCategory === cat.id ? cat.color : 'transparent',
                                    color: activeCategory === cat.id ? '#fff' : '#575E75',
                                    border: activeCategory === cat.id ? 'none' : '1px solid #d9d9d9',
                                }}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                {cat.id}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Backdrop Grid */}
                <div style={styles.gridContainer}>
                    <div style={styles.grid}>
                        {filteredBackdrops.map(backdrop => (
                            <div
                                key={backdrop.id}
                                style={{
                                    ...styles.backdropCard,
                                    ...(hoveredId === backdrop.id ? styles.backdropCardHover : {}),
                                }}
                                onClick={() => onSelectBackdrop(backdrop)}
                                onMouseEnter={() => setHoveredId(backdrop.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                <div style={styles.backdropPreview}>
                                    <img
                                        src={backdrop.image}
                                        alt={backdrop.name}
                                        style={styles.backdropImage}
                                    />
                                </div>
                                <div style={styles.backdropName}>{backdrop.name}</div>
                            </div>
                        ))}
                        {filteredBackdrops.length === 0 && (
                            <div style={styles.emptyState}>
                                <span style={{ fontSize: 48 }}>🔍</span>
                                <p>No backdrops found for "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Floating Action Buttons */}
                <div style={styles.fabContainer}>
                    <button
                        style={{ ...styles.fab, backgroundColor: '#4C97FF' }}
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
                    style={{ display: 'none' }}
                />
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════
const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
    },
    modal: {
        width: '100vw',
        height: '100vh',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
    },
    header: {
        background: 'linear-gradient(135deg, #855CD6, #6D44C0)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        background: 'rgba(255,255,255,0.2)',
        border: 'none',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        padding: '8px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
    title: {
        color: '#fff',
        fontSize: '18px',
        fontWeight: '700',
        margin: 0,
        letterSpacing: '0.3px',
    },
    filterRow: {
        padding: '16px 20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderBottom: '1px solid #eee',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '24px',
        padding: '0 16px',
        border: '1px solid #d9d9d9',
        maxWidth: '300px',
    },
    searchIcon: {
        fontSize: '14px',
        marginRight: '8px',
    },
    searchInput: {
        border: 'none',
        background: 'transparent',
        padding: '10px 0',
        fontSize: '14px',
        outline: 'none',
        flex: 1,
        color: '#333',
    },
    clearSearch: {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#999',
        padding: '4px',
    },
    categoryTabs: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
    },
    categoryTab: {
        padding: '6px 14px',
        borderRadius: '16px',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
    },
    gridContainer: {
        flex: 1,
        overflow: 'auto',
        padding: '16px 20px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '12px',
    },
    backdropCard: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '2px solid #e8e8e8',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    backdropCardHover: {
        border: '2px solid #855CD6',
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 16px rgba(133, 92, 214, 0.2)',
    },
    backdropPreview: {
        width: '100%',
        height: '96px',
        backgroundColor: '#fafafa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    backdropImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    backdropName: {
        width: '100%',
        padding: '6px 8px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#575E75',
        textAlign: 'center',
        borderTop: '1px solid #eee',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    emptyState: {
        gridColumn: '1 / -1',
        textAlign: 'center',
        padding: '60px 20px',
        color: '#999',
    },
    fabContainer: {
        position: 'absolute',
        bottom: '20px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 10,
    },
    fab: {
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: 'none',
        fontSize: '22px',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        transition: 'transform 0.15s',
    },
};

export default BackdropLibrary;
