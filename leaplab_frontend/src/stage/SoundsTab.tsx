/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React from 'react';
import SoundEditor from '../components/SoundEditor';
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
            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden h-full w-full">
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
            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden h-full w-full">
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
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden h-full w-full">
            <div className="flex-1 flex flex-col items-center justify-center text-purple-600 text-center p-8">
                <span className="text-5xl mb-2">🎵</span>
                <h3 className="text-lg font-bold text-slate-800 m-0">No Sprite Selected</h3>
                <p className="text-sm text-slate-500 mt-1">Select a sprite or stage from the panel to edit its sounds.</p>
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

    return (
        <div className="flex flex-row gap-1.5 p-1.5 px-3 border-b border-slate-200 overflow-x-auto overflow-y-hidden shrink-0 bg-slate-100 items-center">
            {/* Stage tile */}
            <div
                className={`flex flex-col items-center gap-0.5 p-1 px-1.5 rounded-lg border-2 cursor-pointer transition-all shrink-0 min-w-13 max-w-16 ${
                    selectedSpriteId === 'stage'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => onSelectSprite?.('stage')}
                title={`Stage (${stageSounds.length} sounds)`}
            >
                <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
                    <span className="text-lg">🎭</span>
                </div>
                <div className="text-[9px] font-semibold text-slate-600 text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-13">Stage</div>
            </div>

            {/* Sprite tiles */}
            {sprites.map((sprite) => (
                <div
                    key={sprite.id}
                    className={`flex flex-col items-center gap-0.5 p-1 px-1.5 rounded-lg border-2 cursor-pointer transition-all shrink-0 min-w-13 max-w-16 ${
                        selectedSpriteId === sprite.id
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    onClick={() => onSelectSprite?.(sprite.id)}
                    title={`${sprite.name} (${sprite.sounds.length} sounds)`}
                >
                    <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center">
                        <span className="text-lg">🐱</span>
                    </div>
                    <div className="text-[9px] font-semibold text-slate-600 text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-13">{sprite.name}</div>
                </div>
            ))}
        </div>
    );
};
