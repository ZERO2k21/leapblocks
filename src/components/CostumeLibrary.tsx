import React, { useState, useRef, useEffect } from 'react';

// Define costume categories similar to SoundLibrary
const CATEGORIES = [
    { id: 'All', color: '#FF4C4C' },
    { id: 'Animals', color: '#4C97FF' },
    { id: 'People', color: '#9966FF' },
    { id: 'Fantasy', color: '#CF63CF' },
    { id: 'Dance', color: '#E066FF' },
    { id: 'Music', color: '#FFAB19' },
    { id: 'Sports', color: '#FF8C1A' },
    { id: 'Food', color: '#0FBD8C' },
    { id: 'Fashion', color: '#F97316' },
    { id: 'Letters', color: '#FF6680' },
    { id: 'Objects', color: '#855CD6' },
    { id: 'Transport', color: '#4CBFE6' },
];

// Catalog of available costumes from built-in assets
// In a full implementation, this would be loaded from a manifest
const DEFAULT_COSTUMES = [
    // Robot sprites
    { name: 'Robot Idle', src: '/assets/sprites/robot/robot_idle.svg', category: 'Fantasy' },
    { name: 'Robot Talk 1', src: '/assets/sprites/robot/robot_talk.png', category: 'Fantasy' },
    { name: 'Robot Talk 2', src: '/assets/sprites/robot/robot_talk1.svg', category: 'Fantasy' },
    { name: 'Robot Wave 1', src: '/assets/sprites/robot/robot_wave1.png', category: 'Fantasy' },
    { name: 'Robot Wave 2', src: '/assets/sprites/robot/robot_wave1.svg', category: 'Fantasy' },
    { name: 'Robot Wave 3', src: '/assets/sprites/robot/robot_wave2.png', category: 'Fantasy' },
    { name: 'Robot Wave 4', src: '/assets/sprites/robot/robot_wave2.svg', category: 'Fantasy' },
    // Scratch default cat (if available)
    { name: 'Cat', src: '/assets/sprites/scratch/cat.svg', category: 'Animals' },
    // Add more as needed
];

interface CostumeLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCostume: (name: string, src: string) => void;
}

export const CostumeLibrary: React.FC<CostumeLibraryProps> = ({
    isOpen,
    onClose,
    onSelectCostume
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    if (!isOpen) return null;

    // Filter costumes
    const filteredCostumes = DEFAULT_COSTUMES.filter(costume => {
        const matchesCategory = activeCategory === 'All' || costume.category === activeCategory;
        const matchesSearch = !searchQuery ||
            costume.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleSelect = (costume: typeof DEFAULT_COSTUMES[0]) => {
        // Load image to ensure it's available
        const img = new Image();
        img.onload = () => {
            onSelectCostume(costume.name, costume.src);
        };
        img.onerror = () => {
            console.warn(`Could not load ${costume.name}, skipping.`);
            onSelectCostume(costume.name, costume.src); // still try to add
        };
        img.src = costume.src;
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Choose a Costume</h2>
                    <button style={styles.closeButton} onClick={onClose}>✕</button>
                </div>

                {/* Search and Category Bar */}
                <div style={styles.toolbar}>
                    <input
                        type="text"
                        placeholder="Search costumes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={styles.searchInput}
                    />
                    <div style={styles.categoryBar}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                style={{
                                    ...styles.categoryButton,
                                    backgroundColor: activeCategory === cat.id ? cat.color : '#f0f0f0',
                                    color: activeCategory === cat.id ? 'white' : '#333',
                                }}
                            >
                                {cat.id}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Costume Grid */}
                <div style={styles.grid}>
                    {filteredCostumes.map(costume => (
                        <div
                            key={costume.name + costume.src}
                            style={styles.item}
                            onClick={() => handleSelect(costume)}
                        >
                            <div style={styles.preview}>
                                <img
                                    src={costume.src}
                                    alt={costume.name}
                                    style={styles.image}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>
                            <div style={styles.name}>{costume.name}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
    },
    modal: {
        backgroundColor: '#fff',
        width: '80%',
        maxWidth: '1000px',
        height: '80%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    },
    header: {
        padding: '16px 24px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#855CD6',
        color: 'white',
    },
    title: {
        margin: 0,
        fontSize: '20px',
        fontWeight: 600,
    },
    closeButton: {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '24px',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '4px',
    },
    toolbar: {
        padding: '12px 16px',
        backgroundColor: '#f9f9f9',
        borderBottom: '1px solid #eee',
    },
    searchInput: {
        width: '100%',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #ddd',
        fontSize: '14px',
        marginBottom: '8px',
        outline: 'none',
    },
    categoryBar: {
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap' as const,
    },
    categoryButton: {
        padding: '4px 12px',
        borderRadius: '12px',
        border: 'none',
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    grid: {
        padding: '16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '16px',
        overflowY: 'auto',
        flex: 1,
    },
    item: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        transition: 'background-color 0.2s',
    },
    preview: {
        width: '100%',
        paddingTop: '100%', // Square
        borderRadius: '8px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '32px',
        marginBottom: '8px',
        border: '2px solid #e0e0e0',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
    },
    image: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    name: {
        fontSize: '12px',
        fontWeight: 500,
        color: '#333',
        textAlign: 'center' as const,
        wordBreak: 'break-word' as const,
    },
};

export default CostumeLibrary;
