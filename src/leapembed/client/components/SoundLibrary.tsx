/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Square } from 'lucide-react';

// Load the leap sounds metadata
import soundsData from '../../../lib/libraries/sounds.json';
import { ADPCMSoundDecoder } from '../../../scratch-audio/src/ADPCMSoundDecoder';

export interface SoundEntry {
    name: string;
    md5ext: string;
    sampleCount: number;
    rate: number;
    format: string;
    tags: string[];
    category?: string;
}

const CATEGORIES = [
    { id: 'All', color: '#FF4C4C' },
    { id: 'Animals', color: '#4C97FF' },
    { id: 'Effects', color: '#9966FF' },
    { id: 'Loops', color: '#CF63CF' },
    { id: 'Notes', color: '#E066FF' },
    { id: 'Percussion', color: '#FFAB19' },
    { id: 'Space', color: '#FF8C1A' },
    { id: 'Sports', color: '#0FBD8C' },
    { id: 'Voice', color: '#F97316' },
    { id: 'Wacky', color: '#FF6680' },
];

const mappedSounds: SoundEntry[] = (soundsData as any[]).map((sound: any) => {
    const tags = Array.isArray(sound.tags) ? sound.tags.map((t: string) => t.toLowerCase()) : [];

    let category = 'Effects'; // Default

    if (tags.includes('animals') || tags.includes('animal')) category = 'Animals';
    else if (tags.includes('loops') || tags.includes('loop')) category = 'Loops';
    else if (tags.includes('notes') || tags.includes('note') || tags.includes('instruments')) category = 'Notes';
    else if (tags.includes('percussion') || tags.includes('drum')) category = 'Percussion';
    else if (tags.includes('space') || tags.includes('alien')) category = 'Space';
    else if (tags.includes('sports') || tags.includes('sport')) category = 'Sports';
    else if (tags.includes('voice') || tags.includes('human')) category = 'Voice';
    else if (tags.includes('wacky') || tags.includes('cartoon')) category = 'Wacky';

    return { ...sound, category } as SoundEntry;
});

interface SoundLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSound: (sound: { name: string, src: string }) => void;
}

// Global audio context management
let _audioContext: AudioContext | null = null;
const getAudioContext = () => {
    if (!_audioContext) {
        _audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (_audioContext.state === 'suspended') {
        _audioContext.resume();
    }
    return _audioContext;
};

export const SoundLibrary: React.FC<SoundLibraryProps> = ({
    isOpen,
    onClose,
    onSelectSound
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    // Stop playing when closed
    useEffect(() => {
        return () => {
            if (audioSourceRef.current) {
                try { audioSourceRef.current.stop(); } catch (e) { }
                audioSourceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!isOpen && audioSourceRef.current) {
            try { audioSourceRef.current.stop(); } catch (e) { }
            audioSourceRef.current = null;
            setPlayingId(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Filter sounds
    const filteredSounds = mappedSounds.filter(sound => {
        const matchesCategory = activeCategory === 'All' || sound.category === activeCategory;
        const matchesSearch = !searchQuery ||
            sound.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sound.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const getSoundUrl = (md5ext: string) => `/assets/sounds/${md5ext}`;

    const handlePlayPause = async (e: React.MouseEvent, sound: SoundEntry) => {
        e.stopPropagation();

        if (playingId === sound.md5ext && audioSourceRef.current) {
            try { audioSourceRef.current.stop(); } catch (e) { }
            audioSourceRef.current = null;
            setPlayingId(null);
            return;
        }

        if (audioSourceRef.current) {
            try { audioSourceRef.current.stop(); } catch (e) { }
            audioSourceRef.current = null;
        }

        setPlayingId(null);

        const url = getSoundUrl(sound.md5ext);
        const context = getAudioContext();
        const decoder = new ADPCMSoundDecoder(context);

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await decoder.decode(arrayBuffer);

            if (playingId === sound.md5ext) return; // Guard against rapid clicks

            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(context.destination);
            source.onended = () => {
                if (audioSourceRef.current === source) {
                    setPlayingId(null);
                    audioSourceRef.current = null;
                }
            };

            audioSourceRef.current = source;
            setPlayingId(sound.md5ext);
            source.start(0);

        } catch (err) {
            console.error("Playback failed", err);
            setPlayingId(null);
        }
    };

    const handleSelect = (sound: SoundEntry) => {
        const url = getSoundUrl(sound.md5ext);
        onSelectSound({
            name: sound.name,
            src: url
        });

        if (audioSourceRef.current) {
            try { audioSourceRef.current.stop(); } catch (e) { }
            audioSourceRef.current = null;
            setPlayingId(null);
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <button style={styles.backButton} onClick={onClose}>
                        ← Back
                    </button>
                    <h2 style={styles.title}>Choose a Sound</h2>
                    <div style={styles.searchBar}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search Sounds"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div style={styles.body}>
                    {/* Categories Sidebar */}
                    <div style={styles.sidebar}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                style={{
                                    ...styles.categoryBtn,
                                    backgroundColor: activeCategory === cat.id ? cat.color : 'transparent',
                                    color: activeCategory === cat.id ? '#FFF' : '#575E75',
                                    border: activeCategory === cat.id ? `2px solid ${cat.color}` : '2px solid transparent'
                                }}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                {cat.id}
                            </button>
                        ))}
                    </div>

                    {/* Sounds Grid */}
                    <div style={styles.gridContainer}>
                        <div style={styles.grid}>
                            {filteredSounds.map((sound, index) => (
                                <div
                                    key={sound.md5ext}
                                    style={{
                                        ...styles.card,
                                        borderColor: hoveredId === sound.md5ext ? '#855CD6' : '#E5E7EB',
                                        boxShadow: hoveredId === sound.md5ext ? '0 4px 12px rgba(133, 92, 214, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                                    }}
                                    onMouseEnter={() => setHoveredId(sound.md5ext)}
                                    onMouseLeave={() => setHoveredId(null)}
                                    onClick={() => handleSelect(sound)}
                                >
                                    <div style={styles.cardIconBox}>
                                        <div style={styles.iconCircle}>
                                            <Volume2 size={28} color="#855CD6" />
                                        </div>
                                    </div>

                                    <div style={styles.cardLabel} title={sound.name}>{sound.name}</div>

                                    {/* Playback Control Overlay */}
                                    <button
                                        style={styles.playButton}
                                        onClick={(e) => handlePlayPause(e, sound)}
                                    >
                                        {playingId === sound.md5ext ? (
                                            <Square size={16} fill="#cf63cf" color="#cf63cf" />
                                        ) : (
                                            <Play size={16} fill="#855CD6" color="#855CD6" style={{ marginLeft: '2px' }} />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                        {filteredSounds.length === 0 && (
                            <div style={styles.emptyState}>
                                😕 No sounds found for "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)',
        zIndex: 99999, // Ensure it's above action menu
    },
    modal: {
        width: '100vw',
        height: '100vh',
        backgroundColor: '#F9F9F9',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        height: '60px',
        backgroundColor: '#855CD6',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        color: 'white',
        flexShrink: 0
    },
    backButton: {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        padding: '8px 16px',
        marginRight: '24px',
        borderRadius: '20px',
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 'bold',
        flex: 1
    },
    searchBar: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: '20px',
        padding: '4px 12px',
        width: '300px'
    },
    searchIcon: {
        marginRight: '8px',
        fontSize: '14px'
    },
    searchInput: {
        background: 'transparent',
        border: 'none',
        color: 'white',
        outline: 'none',
        width: '100%',
        fontSize: '14px',
        fontWeight: 600
    },
    body: {
        display: 'flex',
        flex: 1,
        overflow: 'hidden' // Important for scrollable areas
    },
    sidebar: {
        width: '140px',
        backgroundColor: '#F9F9F9',
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 8px',
        gap: '4px',
        overflowY: 'auto'
    },
    categoryBtn: {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2sease',
        textAlign: 'left'
    },
    gridContainer: {
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        backgroundColor: '#FFFFFF'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '16px',
        alignContent: 'flex-start'
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '2px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        height: '140px',
        position: 'relative'
    },
    cardIconBox: {
        flex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: '#F2EBFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid transparent'
    },
    cardLabel: {
        marginTop: '8px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#575E75',
        textAlign: 'center',
        width: '100%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    },
    playButton: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: '#F6F3FF',
        border: '1px solid #E0D6FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
    },
    emptyState: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: '18px',
        marginTop: '60px',
        fontWeight: 'bold'
    }
};
