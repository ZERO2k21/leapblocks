import React, { useState } from 'react';
import { Sprite, SpriteType } from './Sprite';

// ═══════════════════════════════════════════════════════════════════════════
// SPRITE PANEL - PictoBlox-style with property controls
// ═══════════════════════════════════════════════════════════════════════════

// Sprite type definitions for picker
const SPRITE_TYPES: { type: SpriteType; name: string; emoji: string; color: string }[] = [
    { type: 'cat', name: 'Cat', emoji: '🐱', color: '#FF8C1A' },
    { type: 'ball', name: 'Ball', emoji: '⚽', color: '#2980B9' },
    { type: 'arrow', name: 'Arrow', emoji: '➤', color: '#E74C3C' },
    { type: 'robot', name: 'Robot', emoji: '🤖', color: '#7D8C9C' },
];

interface SpritePanelProps {
    sprites: Sprite[];
    selectedSpriteId: string | null;
    onSelectSprite: (id: string) => void;
    onAddSprite: (type: SpriteType) => void;
    onDeleteSprite: (id: string) => void;
}

export const SpritePanel: React.FC<SpritePanelProps> = ({
    sprites,
    selectedSpriteId,
    onSelectSprite,
    onAddSprite,
    onDeleteSprite,
}) => {
    const [showPicker, setShowPicker] = useState(false);

    const selectedSprite = sprites.find(s => s.id === selectedSpriteId);

    const handleAddSprite = (type: SpriteType) => {
        onAddSprite(type);
        setShowPicker(false);
    };

    const getSpriteEmoji = (sprite: Sprite) => {
        const found = SPRITE_TYPES.find(t => t.type === sprite.spriteType);
        return found ? found.emoji : '🐱';
    };

    const getSpriteColor = (sprite: Sprite) => {
        const found = SPRITE_TYPES.find(t => t.type === sprite.spriteType);
        return found ? found.color : '#FF8C1A';
    };

    return (
        <div style={styles.container}>
            {/* Sprite Property Controls - PictoBlox style */}
            {selectedSprite && (
                <div style={styles.propertyPanel}>
                    <div style={styles.propertyRow}>
                        <label style={styles.propertyLabel}>Sprite</label>
                        <input
                            type="text"
                            value={selectedSprite.name}
                            readOnly
                            style={styles.propertyInput}
                        />
                        <div style={styles.propertyGroup}>
                            <span style={styles.propertyIcon}>↔️</span>
                            <span style={styles.propertyLabel}>x</span>
                            <input
                                type="number"
                                value={Math.round(selectedSprite.x)}
                                readOnly
                                style={styles.numberInput}
                            />
                        </div>
                        <div style={styles.propertyGroup}>
                            <span style={styles.propertyIcon}>↕️</span>
                            <span style={styles.propertyLabel}>y</span>
                            <input
                                type="number"
                                value={Math.round(selectedSprite.y)}
                                readOnly
                                style={styles.numberInput}
                            />
                        </div>
                    </div>
                    <div style={styles.propertyRow}>
                        <div style={styles.toggleGroup}>
                            <span style={styles.toggleLabel}>Show</span>
                            <button
                                style={{
                                    ...styles.toggleButton,
                                    backgroundColor: selectedSprite.visible ? '#4C97FF' : '#ccc'
                                }}
                            >
                                👁️
                            </button>
                        </div>
                        <div style={styles.propertyGroup}>
                            <span style={styles.propertyLabel}>Size</span>
                            <input
                                type="number"
                                value={Math.round(selectedSprite.size)}
                                readOnly
                                style={styles.numberInput}
                            />
                        </div>
                        <div style={styles.propertyGroup}>
                            <span style={styles.propertyLabel}>Direction</span>
                            <input
                                type="number"
                                value={Math.round(selectedSprite.direction)}
                                readOnly
                                style={styles.numberInput}
                            />
                            <div style={styles.directionIndicator}>
                                <div
                                    style={{
                                        ...styles.directionArrow,
                                        transform: `rotate(${selectedSprite.direction - 90}deg)`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sprite List */}
            <div style={styles.spriteListContainer}>
                <div style={styles.header}>
                    <span>🎭 Sprites</span>
                    <button
                        style={styles.addButton}
                        onClick={() => setShowPicker(!showPicker)}
                        title="Add Sprite"
                    >
                        ➕
                    </button>
                </div>

                {/* Sprite Picker */}
                {showPicker && (
                    <div style={styles.picker}>
                        <div style={styles.pickerTitle}>Choose a sprite:</div>
                        <div style={styles.pickerGrid}>
                            {SPRITE_TYPES.map(spriteType => (
                                <button
                                    key={spriteType.type}
                                    style={{
                                        ...styles.pickerItem,
                                        backgroundColor: spriteType.color,
                                    }}
                                    onClick={() => handleAddSprite(spriteType.type)}
                                    title={spriteType.name}
                                >
                                    <span style={styles.pickerEmoji}>{spriteType.emoji}</span>
                                    <span style={styles.pickerLabel}>{spriteType.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div style={styles.spriteList}>
                    {sprites.map(sprite => (
                        <div
                            key={sprite.id}
                            style={{
                                ...styles.spriteItem,
                                ...(selectedSpriteId === sprite.id ? styles.spriteItemSelected : {}),
                            }}
                            onClick={() => onSelectSprite(sprite.id)}
                        >
                            <div style={styles.spriteItemInner}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '4px',
                                    backgroundColor: getSpriteColor(sprite),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                }}>
                                    {sprite.currentCostume ? (
                                        <img
                                            src={sprite.currentCostume.image.src}
                                            alt={sprite.name}
                                            style={{ maxWidth: '40px', maxHeight: '40px', objectFit: 'contain' }}
                                        />
                                    ) : (
                                        getSpriteEmoji(sprite)
                                    )}
                                </div>
                                <div style={styles.spriteItemName}>{sprite.name}</div>
                                <button
                                    style={styles.deleteButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteSprite(sprite.id);
                                    }}
                                    title="Delete"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                    {sprites.length === 0 && (
                        <div style={styles.emptyMessage}>
                            No sprites. Click ➕ to add one!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        backgroundColor: '#f5f5f5',
        borderBottom: '1px solid #e0e0e0',
        fontWeight: 500,
        fontSize: '13px',
    },
    addButton: {
        padding: '4px 8px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: '#4C97FF',
        color: 'white',
        cursor: 'pointer',
        fontSize: '12px',
    },
    picker: {
        padding: '8px',
        backgroundColor: '#f9f9f9',
        borderBottom: '1px solid #e0e0e0',
    },
    pickerTitle: {
        fontSize: '11px',
        color: '#666',
        marginBottom: '6px',
    },
    pickerGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
    },
    pickerItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 4px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        color: 'white',
        transition: 'transform 0.1s',
    },
    pickerEmoji: {
        fontSize: '18px',
        marginBottom: '2px',
    },
    pickerLabel: {
        fontSize: '9px',
        fontWeight: 'bold',
    },
    spriteList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '8px',
        minHeight: '80px',
        maxHeight: '150px',
        overflowY: 'auto',
    },
    spriteItem: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px',
        border: '2px solid transparent',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
    spriteItemSelected: {
        border: '2px solid #4C97FF',
        backgroundColor: 'rgba(76, 151, 255, 0.1)',
    },
    spriteThumbnail: {
        width: '48px',
        height: '48px',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    spriteName: {
        fontSize: '11px',
        marginTop: '4px',
        textAlign: 'center',
        maxWidth: '60px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    deleteButton: {
        position: 'absolute',
        top: '2px',
        right: '2px',
        width: '18px',
        height: '18px',
        padding: 0,
        border: 'none',
        borderRadius: '50%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        fontSize: '10px',
        cursor: 'pointer',
        opacity: 0.6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyMessage: {
        color: '#999',
        fontSize: '12px',
        textAlign: 'center',
        padding: '20px',
        width: '100%',
    },
    // Property Panel styles (PictoBlox)
    propertyPanel: {
        padding: '8px 12px',
        backgroundColor: '#f8f8f8',
        borderBottom: '1px solid #e0e0e0',
    },
    propertyRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '6px',
    },
    propertyLabel: {
        fontSize: '11px',
        color: '#666',
        fontWeight: 500,
    },
    propertyInput: {
        width: '80px',
        padding: '4px 8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '11px',
        backgroundColor: 'white',
    },
    propertyGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    propertyIcon: {
        fontSize: '12px',
    },
    numberInput: {
        width: '50px',
        padding: '4px 6px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '11px',
        textAlign: 'center',
        backgroundColor: 'white',
    },
    toggleGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
    },
    toggleLabel: {
        fontSize: '11px',
        color: '#666',
    },
    toggleButton: {
        width: '24px',
        height: '24px',
        border: 'none',
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
    },
    directionIndicator: {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        border: '2px solid #ddd',
        backgroundColor: '#f8f8f8',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    directionArrow: {
        width: '0',
        height: '0',
        borderLeft: '4px solid transparent',
        borderRight: '4px solid transparent',
        borderBottom: '10px solid #855CD6',
        transformOrigin: 'center center',
    },
    spriteListContainer: {
        display: 'flex',
        flexDirection: 'column',
    },
    spriteItemInner: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    spriteItemName: {
        fontSize: '10px',
        marginTop: '4px',
        color: '#333',
        textAlign: 'center',
        maxWidth: '60px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
};

export default SpritePanel;
