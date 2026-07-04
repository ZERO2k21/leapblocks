/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import SoundEditor, { Sound } from '../components/SoundEditor';
import { Sprite } from './Sprite';
import type { StageManager } from '../engine/StageManager';

interface SoundsTabProps {
    selectedSpriteId: string | null;
    sprites: Sprite[];
    stageManager: StageManager;
    addLog: (msg: string) => void;
    onClose: () => void;
    isEmbedMode?: boolean;
    onSelectSprite?: (id: string) => void;
    onSoundChange?: () => void;
}

export const SoundsTab: React.FC<SoundsTabProps> = ({
    selectedSpriteId,
    sprites,
    stageManager,
    addLog,
    onClose,
    isEmbedMode = false,
    onSelectSprite,
    onSoundChange
}) => {
    // If Stage is selected, render Sound Editor for Stage
    if (selectedSpriteId === 'stage') {
        const allSounds = stageManager.getAllSounds();

        return (
            <div style={styles.container}>
                {isEmbedMode && (
                    <SpritePickerStrip
                        sprites={sprites}
                        selectedSpriteId={selectedSpriteId}
                        onSelectSprite={onSelectSprite}
                        stageManager={stageManager}
                    />
                )}
                <SoundEditor
                    mode="intermediate"
                    spriteName="Stage"
                    sounds={allSounds}
                    onAddSound={async (name: string, src: string) => {
                        await stageManager.addSound(name, src);
                        addLog('Added sound to Stage');
                    }}
                    onDeleteSound={(index: number) => {
                        stageManager.deleteSound(index);
                        addLog('Deleted sound from Stage');
                    }}
                    onDuplicateSound={(index: number) => {
                        stageManager.duplicateSound(index);
                        addLog('Duplicated sound on Stage');
                    }}
                    onClose={onClose}
                    onSoundChange={onSoundChange}
                />
            </div>
        );
    }

    // If Sprite is selected, render Sound Editor
    const selectedSprite = sprites.find(s => s.id === selectedSpriteId);
    if (selectedSprite) {
        const allSounds = selectedSprite.sounds;

        return (
            <div style={styles.container}>
                {isEmbedMode && (
                    <SpritePickerStrip
                        sprites={sprites}
                        selectedSpriteId={selectedSpriteId}
                        onSelectSprite={onSelectSprite}
                        stageManager={stageManager}
                    />
                )}
                <SoundEditor
                    mode="intermediate"
                    spriteName={selectedSprite.name}
                    sounds={allSounds}
                    onAddSound={async (name: string, src: string) => {
                        await selectedSprite.addSound(name, src);
                        addLog(`Added sound to ${selectedSprite.name}`);
                    }}
                    onDeleteSound={(index: number) => {
                        selectedSprite.deleteSound(index);
                        addLog(`Deleted sound from ${selectedSprite.name}`);
                    }}
                    onDuplicateSound={(index: number) => {
                        selectedSprite.duplicateSound(index);
                        addLog(`Duplicated sound on ${selectedSprite.name}`);
                    }}
                    onClose={onClose}
                    onSoundChange={onSoundChange}
                />
            </div>
        );
    }

    // Fallback if nothing is selected
    return (
        <div style={styles.container}>
            <div style={styles.placeholder}>
                <span style={{ fontSize: '48px' }}>🎵</span>
                <h3>No Sprite Selected</h3>
                <p>Select a sprite or stage from the panel to edit its sounds.</p>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// Sprite Picker Strip — compact horizontal sprite selector for embed mode
// ═══════════════════════════════════════════════════════════════════════════

const SpritePickerStrip: React.FC<{
    sprites: Sprite[];
    selectedSpriteId: string | null;
    onSelectSprite?: (id: string) => void;
    stageManager: StageManager;
}> = ({ sprites, selectedSpriteId, onSelectSprite, stageManager }) => {
    const stageSounds = stageManager.getAllSounds();
    const hasStageSounds = stageSounds.length > 0;

    return (
        <div style={stripStyles.container}>
            {/* Stage tile */}
            <div
                style={{
                    ...stripStyles.spriteTile,
                    borderColor: selectedSpriteId === 'stage' ? '#855CD6' : '#e0e0e0',
                    background: selectedSpriteId === 'stage' ? '#f0ebf7' : '#fff',
                }}
                onClick={() => onSelectSprite?.('stage')}
                title={`Stage (${stageSounds.length} sounds)`}
            >
                <div style={stripStyles.spriteThumb}>
                    <span style={{ fontSize: 18 }}>🎭</span>
                </div>
                <div style={stripStyles.spriteLabel}>Stage</div>
            </div>

            {/* Sprite tiles */}
            {sprites.map((sprite) => (
                <div
                    key={sprite.id}
                    style={{
                        ...stripStyles.spriteTile,
                        borderColor: selectedSpriteId === sprite.id ? '#855CD6' : '#e0e0e0',
                        background: selectedSpriteId === sprite.id ? '#f0ebf7' : '#fff',
                    }}
                    onClick={() => onSelectSprite?.(sprite.id)}
                    title={`${sprite.name} (${sprite.sounds.length} sounds)`}
                >
                    <div style={stripStyles.spriteThumb}>
                        <span style={{ fontSize: 18 }}>🐱</span>
                    </div>
                    <div style={stripStyles.spriteLabel}>{sprite.name}</div>
                </div>
            ))}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f9f9f9',
        overflow: 'hidden',
        height: '100%',
        width: '100%'
    },
    placeholder: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#855CD6',
        textAlign: 'center' as const,
        padding: '2rem'
    }
};

const stripStyles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        flexDirection: 'row',
        gap: '6px',
        padding: '6px 12px',
        borderBottom: '1px solid #e0e0e0',
        overflowX: 'auto',
        overflowY: 'hidden',
        flexShrink: 0,
        background: '#f5f5f5',
        alignItems: 'center',
    },
    spriteTile: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        padding: '4px 6px',
        borderRadius: '8px',
        border: '2px solid #e0e0e0',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
        minWidth: '52px',
        maxWidth: '64px',
    },
    spriteThumb: {
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        background: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    spriteLabel: {
        fontSize: '9px',
        fontWeight: 600,
        color: '#666',
        textAlign: 'center' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
        maxWidth: '52px',
    },
};
