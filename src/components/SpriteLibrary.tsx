import React, { useState, useRef, useCallback } from 'react';
import { scratchSprites } from './generated_scratch_sprites';

// ═══════════════════════════════════════════════════════════════════════════
// SPRITE CATALOG — All available sprites organized by category
// ═══════════════════════════════════════════════════════════════════════════
export interface SpriteEntry {
    id: string;
    name: string;
    emoji: string;        // fallback emoji
    image?: string;       // optional image path
    costumes?: string[];   // multiple costumes for slideshow
    category: string;
}

const LEAPBLOCKS_SPRITES: SpriteEntry[] = [
    {
        id: 'robot',
        name: 'Robot',
        emoji: '🤖',
        image: '/assets/sprites/robot/robot_idle.svg',
        costumes: [
            '/assets/sprites/robot/robot_idle.svg',
            '/assets/sprites/robot/image-Photoroom.png',
            '/assets/sprites/robot/image-removebg-preview (1).png',
            '/assets/sprites/robot/image-removebg-preview.png'
        ],
        category: 'Fantasy'
    }
];

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

const mappedScratchSprites = scratchSprites.map((sprite: any) => {
    const tags = Array.isArray(sprite.tags) ? sprite.tags.map((t: string) => t.toLowerCase()) : [];

    let category = 'Objects';

    if (tags.includes('animals')) category = 'Animals';
    else if (tags.includes('people') || tags.includes('person')) category = 'People';
    else if (tags.includes('fantasy')) category = 'Fantasy';
    else if (tags.includes('dance') || tags.includes('dancing')) category = 'Dance';
    else if (tags.includes('music') || tags.includes('instruments')) category = 'Music';
    else if (tags.includes('sports') || tags.includes('fitness')) category = 'Sports';
    else if (tags.includes('food') || tags.includes('drink')) category = 'Food';
    else if (tags.includes('fashion') || tags.includes('clothing')) category = 'Fashion';
    else if (tags.includes('letters')) category = 'Letters';
    else if (tags.includes('transportation') || tags.includes('vehicles')) category = 'Transport';

    return { ...sprite, category } as SpriteEntry;
});

export const FULL_CATALOG = [...LEAPBLOCKS_SPRITES, ...mappedScratchSprites];

// ═══════════════════════════════════════════════════════════════════════════
// EMOJI PICKER DATA
// ═══════════════════════════════════════════════════════════════════════════
const EMOJI_GROUPS = [
    { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '🤤', '😌', '😷', '🤒', '🤕', '🤢', '🤮', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'] },
    { name: 'Animals', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦕', '🦖', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒'] },
    { name: 'Food', emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥗', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪'] },
    { name: 'Objects', emojis: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💾', '💿', '📀', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯', '🛢️', '💸', '✏️', '🖊️', '🖋️', '📝', '📁', '📂', '🗂️', '📅', '📆', '📌', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒', '🔓', '🔑', '🗝️', '🔨', '🪓', '🔧', '🪛', '🔩', '⛏️', '🛠️', '🗡️', '⚔️', '💣', '🏹', '🛡️'] },
    { name: 'Hearts & Symbols', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '⭐', '🌟', '✨', '💫', '🔥', '💥', '❄️', '🌈', '☀️', '🌙', '⚡', '💧', '🌊', '🎵', '🎶', '🔔', '🎈', '🎉', '🎊', '🎀', '🎁', '🏅', '🥇', '🥈', '🥉', '🏆', '🎯', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄'] },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
interface SpriteLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSprite: (sprite: SpriteEntry) => void;
    onUploadSprite?: () => void;
    onPaintSprite?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND REMOVAL UTIL
// ═══════════════════════════════════════════════════════════════════════════
const removeWhiteBackground = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(dataUrl);

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Simple threshold to remove near-white background
            const threshold = 240;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // If the pixel is very light/white, make it transparent
                if (r > threshold && g > threshold && b > threshold) {
                    data[i + 3] = 0; // Alpha 0
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
};

export const SpriteLibrary: React.FC<SpriteLibraryProps> = ({
    isOpen,
    onClose,
    onSelectSprite,
    onUploadSprite,
    onPaintSprite,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeTab, setActiveTab] = useState<'sprites' | 'emoji'>('sprites');
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [slideshowIndex, setSlideshowIndex] = useState(0);
    const slideshowIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // Filter sprites
    const filteredSprites = FULL_CATALOG.filter(sprite => {
        const matchesCategory = activeCategory === 'All' || sprite.category === activeCategory;
        const matchesSearch = !searchQuery ||
            sprite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sprite.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // In Electron, File objects have a 'path' property
        const imagePath = (file as any).path;

        if (imagePath && window.electronAPI) {
            // ML-based exact object extraction
            try {
                const result = await window.electronAPI.removeBackground(imagePath);

                if (result.success) {
                    // Python script outputs a .png
                    const newPath = imagePath.replace(/\.[^/.]+$/, '.png');

                    // We need to read the new local file into a data URL for the canvas/app
                    // We can either fetch it via file:// or read it directly if we had a node api.
                    // A simple fetch file:// works in many electron configs if webSecurity is false,
                    // but since we only have path, we can try fetching it.
                    // Better approach: Since we don't have fs, we can just use the absolute path 
                    // with a cache-buster as the image source if local files are allowed.
                    const cacheBuster = `t=${Date.now()}`;
                    const finalUrl = `file://${newPath}?${cacheBuster}`;

                    const customSprite: SpriteEntry = {
                        id: `custom_${Date.now()}`,
                        name: file.name.replace(/\.[^/.]+$/, ''),
                        emoji: '🖼️',
                        image: finalUrl,
                        category: 'Objects'
                    };
                    onSelectSprite(customSprite);
                } else {
                    console.error("BG Removal failed:", result.error);
                    fallbackUpload(file);
                }
            } catch (err) {
                console.error("IPC Remove BG failed:", err);
                fallbackUpload(file);
            }
        } else {
            // Web fallback
            fallbackUpload(file);
        }

        e.target.value = '';
    };

    const fallbackUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            // Legacy simplistic white bg removal
            const processedDataUrl = await removeWhiteBackground(dataUrl);

            const customSprite: SpriteEntry = {
                id: `custom_${Date.now()}`,
                name: file.name.replace(/\.[^/.]+$/, ''),
                emoji: '🖼️',
                image: processedDataUrl,
                category: 'Objects'
            };
            onSelectSprite(customSprite);
        };
        reader.readAsDataURL(file);
    };

    const handleEmojiSelect = (emoji: string) => {
        const customSprite: SpriteEntry = {
            id: `emoji_${Date.now()}`,
            name: `Emoji`,
            emoji: emoji,
            category: 'Objects'
        };
        onSelectSprite(customSprite);
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <button style={styles.backButton} onClick={onClose}>
                        ← Back
                    </button>
                    <h2 style={styles.title}>Choose a Sprite</h2>
                    <div style={{ width: 80 }} /> {/* spacer */}
                </div>

                {/* Tab Bar */}
                <div style={styles.tabRow}>
                    <button
                        style={activeTab === 'sprites' ? styles.mainTabActive : styles.mainTab}
                        onClick={() => setActiveTab('sprites')}
                    >
                        🎭 Sprites
                    </button>
                    <button
                        style={activeTab === 'emoji' ? styles.mainTabActive : styles.mainTab}
                        onClick={() => setActiveTab('emoji')}
                    >
                        😀 Emoji
                    </button>
                </div>

                {activeTab === 'sprites' ? (
                    <>
                        {/* Search + Category Filters */}
                        <div style={styles.filterRow}>
                            <div style={styles.searchBox}>
                                <span style={styles.searchIcon}>🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search sprites..."
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

                        {/* Sprite Grid */}
                        <div style={styles.gridContainer}>
                            <div style={styles.grid}>
                                {filteredSprites.map(sprite => (
                                    <div
                                        key={sprite.id}
                                        style={{
                                            ...styles.spriteCard,
                                            ...(hoveredId === sprite.id ? styles.spriteCardHover : {}),
                                        }}
                                        onClick={() => onSelectSprite(sprite)}
                                        onMouseEnter={() => {
                                            setHoveredId(sprite.id);
                                            if (sprite.costumes && sprite.costumes.length > 1) {
                                                setSlideshowIndex(0);
                                                slideshowIntervalRef.current = setInterval(() => {
                                                    setSlideshowIndex(prev => (prev + 1) % sprite.costumes!.length);
                                                }, 500); // 500ms cycle
                                            }
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredId(null);
                                            if (slideshowIntervalRef.current) {
                                                clearInterval(slideshowIntervalRef.current);
                                                slideshowIntervalRef.current = null;
                                            }
                                            setSlideshowIndex(0);
                                        }}
                                    >
                                        <div style={styles.spritePreview}>
                                            {sprite.image || (sprite.costumes && sprite.costumes.length > 0) ? (
                                                <img
                                                    src={
                                                        hoveredId === sprite.id && sprite.costumes && sprite.costumes.length > 1
                                                            ? sprite.costumes[slideshowIndex]
                                                            : (sprite.image || sprite.costumes?.[0])
                                                    }
                                                    alt={sprite.name}
                                                    style={styles.spriteImage}
                                                    onError={(e) => {
                                                        // Fallback to emoji if image fails
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                                                    }}
                                                />
                                            ) : null}
                                            <span
                                                style={{
                                                    ...styles.spriteEmoji,
                                                    ...(sprite.image ? { display: 'none' } : {}),
                                                    ...(sprite.category === 'Letters' ? styles.letterEmoji : {}),
                                                }}
                                            >
                                                {sprite.emoji}
                                            </span>
                                        </div>
                                        <div style={styles.spriteName}>{sprite.name}</div>
                                    </div>
                                ))}
                                {filteredSprites.length === 0 && (
                                    <div style={styles.emptyState}>
                                        <span style={{ fontSize: 48 }}>🔍</span>
                                        <p>No sprites found for "{searchQuery}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Emoji Picker */
                    <div style={styles.gridContainer}>
                        <div style={styles.emojiContent}>
                            {EMOJI_GROUPS.map(group => (
                                <div key={group.name}>
                                    <div style={styles.emojiGroupTitle}>{group.name}</div>
                                    <div style={styles.emojiGrid}>
                                        {group.emojis.map((emoji, i) => (
                                            <button
                                                key={`${group.name}_${i}`}
                                                style={styles.emojiButton}
                                                onClick={() => handleEmojiSelect(emoji)}
                                                title={`Add ${emoji} as sprite`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Floating Action Buttons */}
                <div style={styles.fabContainer}>
                    {onPaintSprite && (
                        <button
                            style={{ ...styles.fab, backgroundColor: '#855CD6' }}
                            onClick={onPaintSprite}
                            title="Paint a sprite"
                        >
                            🖌️
                        </button>
                    )}
                    <button
                        style={{ ...styles.fab, backgroundColor: '#0FBD8C' }}
                        onClick={() => setActiveTab('emoji')}
                        title="Choose an emoji"
                    >
                        😀
                    </button>
                    <button
                        style={{ ...styles.fab, backgroundColor: '#4C97FF' }}
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload a sprite"
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
    tabRow: {
        display: 'flex',
        gap: '0',
        backgroundColor: '#f0f0f0',
        borderBottom: '1px solid #d9d9d9',
    },
    mainTab: {
        flex: 1,
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '600',
        border: 'none',
        background: 'transparent',
        color: '#575E75',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    mainTabActive: {
        flex: 1,
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '600',
        border: 'none',
        background: '#fff',
        color: '#855CD6',
        cursor: 'pointer',
        borderBottom: '3px solid #855CD6',
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: '12px',
    },
    spriteCard: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '2px solid #e8e8e8',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    spriteCardHover: {
        border: '2px solid #855CD6',
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 16px rgba(133, 92, 214, 0.2)',
    },
    spritePreview: {
        width: '100%',
        height: '90px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
        padding: '8px',
    },
    spriteImage: {
        maxWidth: '80px',
        maxHeight: '80px',
        objectFit: 'contain',
    },
    spriteEmoji: {
        fontSize: '48px',
        lineHeight: 1,
    },
    letterEmoji: {
        fontSize: '42px',
        fontWeight: '900',
        color: '#FF8C1A',
        textShadow: '2px 2px 0 #333, -1px -1px 0 #333',
        fontFamily: '"Arial Black", "Impact", sans-serif',
    },
    spriteName: {
        width: '100%',
        padding: '6px 4px',
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
    // Emoji picker styles
    emojiContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    emojiGroupTitle: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#575E75',
        padding: '4px 0',
        borderBottom: '1px solid #eee',
        marginBottom: '8px',
    },
    emojiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
        gap: '4px',
    },
    emojiButton: {
        width: '44px',
        height: '44px',
        fontSize: '28px',
        border: 'none',
        background: 'transparent',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s',
    },
    // FABs
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

export default SpriteLibrary;
