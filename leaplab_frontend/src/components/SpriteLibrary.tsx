/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef, useCallback } from 'react';
import { leapSprites } from './generated_leap_sprites';

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
        image: 'assets/sprites/robot/robot_idle.svg',
        costumes: [
            'assets/sprites/robot/robot_idle.svg',
            'assets/sprites/robot/image-Photoroom.png',
            'assets/sprites/robot/image-removebg-preview (1).png',
            'assets/sprites/robot/image-removebg-preview.png'
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

const mappedleapSprites = leapSprites.map((sprite: any) => {
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

    // Fix image paths: use relative paths (no leading '/') for Electron file:// compatibility
    const fixedImage = sprite.image || undefined;
    const fixedCostumes = sprite.costumes || undefined;

    return {
        ...sprite,
        category,
        image: fixedImage,
        costumes: fixedCostumes
    } as SpriteEntry;
});

export const FULL_CATALOG = [...LEAPBLOCKS_SPRITES, ...mappedleapSprites];

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
// BACKGROUND REMOVAL UTIL — flood-fill from edges
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

            const w = canvas.width;
            const h = canvas.height;
            const imageData = ctx.getImageData(0, 0, w, h);
            const data = imageData.data;

            // Color-distance threshold for flood-fill
            const tolerance = 40;

            const colorMatch = (idx: number, refR: number, refG: number, refB: number): boolean => {
                const r = data[idx], g = data[idx + 1], b = data[idx + 2];
                const dr = r - refR, dg = g - refG, db = b - refB;
                return Math.sqrt(dr * dr + dg * dg + db * db) < tolerance;
            };

            const markTransparent = (idx: number) => { data[idx + 3] = 0; };

            const visited = new Uint8Array(w * h);
            const queue: number[] = [];

            const enqueue = (x: number, y: number) => {
                if (x < 0 || x >= w || y < 0 || y >= h) return;
                const pi = y * w + x;
                if (visited[pi]) return;
                const idx = pi * 4;
                if (data[idx + 3] === 0) return; // already transparent
                visited[pi] = 1;
                queue.push(x, y);
            };

            // Sample reference colors from corners and mid-edges
            const corners: [number, number][] = [
                [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
                [Math.floor(w / 2), 0], [Math.floor(w / 2), h - 1],
                [0, Math.floor(h / 2)], [w - 1, Math.floor(h / 2)],
            ];

            for (const [cx, cy] of corners) {
                const ci = (cy * w + cx) * 4;
                const refR = data[ci], refG = data[ci + 1], refB = data[ci + 2];
                if (data[ci + 3] === 0) continue;

                queue.length = 0;
                enqueue(cx, cy);

                while (queue.length > 0) {
                    const y = queue.pop()!;
                    const x = queue.pop()!;
                    const pi = y * w + x;
                    const idx = pi * 4;

                    if (!colorMatch(idx, refR, refG, refB)) continue;

                    markTransparent(idx);
                    enqueue(x + 1, y);
                    enqueue(x - 1, y);
                    enqueue(x, y + 1);
                    enqueue(x, y - 1);
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
        <div className="fixed inset-0 w-screen h-screen bg-black/50 z-[9999] flex items-center justify-center backdrop-blur-xs" onClick={onClose}>
            <div className="w-screen h-screen bg-white flex flex-col overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-[#855CD6] to-[#6D44C0] px-6 py-4 flex items-center justify-between">
                    <button className="bg-white/20 border-none text-white text-sm font-semibold px-4 py-2 rounded-full cursor-pointer transition-colors hover:bg-white/30" onClick={onClose}>
                        ← Back
                    </button>
                    <h2 className="text-white text-lg font-bold m-0 tracking-wide">Choose a Sprite</h2>
                    <div className="w-20" /> {/* spacer */}
                </div>

                {/* Tab Bar */}
                <div className="flex bg-[#f0f0f0] border-b border-[#d9d9d9]">
                    <button
                        className={`flex-1 py-3 px-5 text-sm font-semibold border-none cursor-pointer transition-all ${
                            activeTab === 'sprites' ? 'bg-white text-[#855CD6] border-b-3 border-[#855CD6]' : 'bg-transparent text-[#575E75]'
                        }`}
                        onClick={() => setActiveTab('sprites')}
                    >
                        🎭 Sprites
                    </button>
                    <button
                        className={`flex-1 py-3 px-5 text-sm font-semibold border-none cursor-pointer transition-all ${
                            activeTab === 'emoji' ? 'bg-white text-[#855CD6] border-b-3 border-[#855CD6]' : 'bg-transparent text-[#575E75]'
                        }`}
                        onClick={() => setActiveTab('emoji')}
                    >
                        😀 Emoji
                    </button>
                </div>

                {activeTab === 'sprites' ? (
                    <>
                        {/* Search + Category Filters */}
                        <div className="p-4 px-5 pb-3 flex flex-col gap-3 border-b border-gray-200">
                            <div className="flex items-center bg-[#f5f5f5] rounded-full px-4 border border-[#d9d9d9] max-w-[300px]">
                                <span className="text-sm mr-2">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search sprites..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="border-none bg-transparent py-2.5 text-sm outline-none flex-1 text-gray-800"
                                />
                                {searchQuery && (
                                    <button className="border-none bg-transparent cursor-pointer text-sm text-gray-400 p-1" onClick={() => setSearchQuery('')}>
                                        ✕
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        style={{ backgroundColor: activeCategory === cat.id ? cat.color : 'transparent' }}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${
                                            activeCategory === cat.id ? 'text-white border-none' : 'text-[#575E75] border border-[#d9d9d9] hover:bg-gray-100'
                                        }`}
                                        onClick={() => setActiveCategory(cat.id)}
                                    >
                                        {cat.id}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sprite Grid */}
                        <div className="flex-1 overflow-auto p-4 px-5">
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
                                {filteredSprites.map(sprite => (
                                    <div
                                        key={sprite.id}
                                        className={`bg-white rounded-xl border-2 cursor-pointer transition-all duration-200 overflow-hidden flex flex-col items-center ${
                                            hoveredId === sprite.id ? 'border-[#855CD6] -translate-y-0.5 shadow-[0_6px_16px_rgba(133,92,214,0.2)]' : 'border-[#e8e8e8]'
                                        }`}
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
                                        <div className="w-full h-[90px] flex items-center justify-center bg-[#fafafa] p-2">
                                            {sprite.image || (sprite.costumes && sprite.costumes.length > 0) ? (
                                                <img
                                                    src={
                                                        hoveredId === sprite.id && sprite.costumes && sprite.costumes.length > 1
                                                            ? sprite.costumes[slideshowIndex]
                                                            : (sprite.image || sprite.costumes?.[0])
                                                    }
                                                    alt={sprite.name}
                                                    className="max-w-[80px] max-h-[80px] object-contain"
                                                    onError={(e) => {
                                                        // Fallback to emoji if image fails
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                                                    }}
                                                />
                                            ) : null}
                                            <span
                                                className={`text-[48px] leading-none ${sprite.image ? 'hidden' : ''} ${
                                                    sprite.category === 'Letters' ? 'text-[42px] font-black text-[#FF8C1A] drop-shadow-[2px_2px_0_#333] font-sans' : ''
                                                }`}
                                            >
                                                {sprite.emoji}
                                            </span>
                                        </div>
                                        <div className="w-full py-1.5 px-1 text-[11px] font-semibold text-[#575E75] text-center border-t border-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">
                                            {sprite.name}
                                        </div>
                                    </div>
                                ))}
                                {filteredSprites.length === 0 && (
                                    <div className="col-span-full text-center py-15 px-5 text-gray-400">
                                        <span className="text-5xl block mb-2">🔍</span>
                                        <p>No sprites found for "{searchQuery}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Emoji Picker */
                    <div className="flex-1 overflow-auto p-4 px-5">
                        <div className="flex flex-col gap-5">
                            {EMOJI_GROUPS.map(group => (
                                <div key={group.name}>
                                    <div className="text-sm font-bold text-[#575E75] py-1 border-b border-gray-200 mb-2">{group.name}</div>
                                    <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1">
                                        {group.emojis.map((emoji, i) => (
                                            <button
                                                key={`${group.name}_${i}`}
                                                className="w-11 h-11 text-28px border-none bg-transparent rounded-lg cursor-pointer flex items-center justify-center transition-colors hover:bg-purple-100"
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
                <div className="absolute bottom-5 right-6 flex flex-col gap-2.5 z-10">
                    {onPaintSprite && (
                        <button
                            className="w-12 h-12 rounded-full border-none text-22px text-white cursor-pointer flex items-center justify-center shadow-lg hover:scale-110 transition-transform bg-[#855CD6]"
                            onClick={onPaintSprite}
                            title="Paint a sprite"
                        >
                            🖌️
                        </button>
                    )}
                    <button
                        className="w-12 h-12 rounded-full border-none text-22px text-white cursor-pointer flex items-center justify-center shadow-lg hover:scale-110 transition-transform bg-[#0FBD8C]"
                        onClick={() => setActiveTab('emoji')}
                        title="Choose an emoji"
                    >
                        😀
                    </button>
                    <button
                        className="w-12 h-12 rounded-full border-none text-22px text-white cursor-pointer flex items-center justify-center shadow-lg hover:scale-110 transition-transform bg-[#4C97FF]"
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
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default SpriteLibrary;
