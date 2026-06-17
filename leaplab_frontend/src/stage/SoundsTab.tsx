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
}

export const SoundsTab: React.FC<SoundsTabProps> = ({
    selectedSpriteId,
    sprites,
    stageManager,
    addLog,
    onClose
}) => {
    // If Stage is selected, render Sound Editor for Stage
    if (selectedSpriteId === 'stage') {
        const allSounds = stageManager.getAllSounds();

        return (
            <div style={styles.container}>
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
