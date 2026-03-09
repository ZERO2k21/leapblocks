import React from 'react';
import PaintEditor from '../components/PaintEditor';
import { Sprite } from './Sprite';
import { StageManager } from '../engine/StageManager';

interface CostumesTabProps {
    selectedSpriteId: string | null;
    sprites: Sprite[];
    stageManager: StageManager;
    addLog: (msg: string) => void;
    onClose: () => void;
}

export const CostumesTab: React.FC<CostumesTabProps> = ({
    selectedSpriteId,
    sprites,
    stageManager,
    addLog,
    onClose
}) => {
    // If Stage is selected, render Backdrop Editor
    if (selectedSpriteId === 'stage') {
        const currentBackdrop = stageManager.getCurrentBackdrop()?.src || '';
        const allBackdrops = stageManager.getAllBackdrops().map((b, i) => ({
            id: i.toString(),
            name: b.name,
            image: b.src
        }));

        return (
            <div style={styles.container}>
                <PaintEditor
                    mode="intermediate"
                    title="Backdrop Editor"
                    spriteName="Stage"
                    initialImage={currentBackdrop}
                    costumes={allBackdrops}
                    onSave={async (imageData: string, svgData?: string, name?: string) => {
                        const savedData = svgData || imageData;
                        const backdropName = name || 'custom';
                        await stageManager.addBackdrop(backdropName, savedData);
                        stageManager.setBackdrop(backdropName);
                        addLog(`Saved backdrop for Stage: ${backdropName}`);
                    }}
                    onDeleteSound={(index: number) => {
                        stageManager.deleteBackdrop(index);
                        addLog(`Deleted backdrop from Stage`);
                    }}
                    onDuplicateSound={(index: number) => {
                        stageManager.duplicateBackdrop(index);
                        addLog(`Duplicated backdrop on Stage`);
                    }}
                    onClose={onClose}
                />
            </div>
        );
    }

    // If Sprite is selected, render Costume Editor
    const selectedSprite = sprites.find(s => s.id === selectedSpriteId);
    if (selectedSprite) {
        const currentCostume = selectedSprite.currentCostume?.image.src || '';
        const allCostumes = selectedSprite.costumes.map((c: any, i: number) => ({
            id: i.toString(),
            name: c.name,
            image: c.image.src
        }));

        return (
            <div style={styles.container}>
                <PaintEditor
                    mode="intermediate"
                    title="Costume Editor"
                    spriteName={selectedSprite.name}
                    initialImage={currentCostume}
                    costumes={allCostumes}
                    onSave={async (imageData: string, svgData?: string, name?: string) => {
                        const savedData = svgData || imageData;
                        const costumeName = name || 'custom';
                        await selectedSprite.addCostume(costumeName, savedData);
                        selectedSprite.switchCostume(costumeName);
                        addLog(`Saved costume for ${selectedSprite.name}: ${costumeName}`);
                    }}
                    onDeleteSound={(index: number) => {
                        selectedSprite.deleteCostume(index);
                        addLog(`Deleted costume from ${selectedSprite.name}`);
                    }}
                    onDuplicateSound={(index: number) => {
                        selectedSprite.duplicateCostume(index);
                        addLog(`Duplicated costume on ${selectedSprite.name}`);
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
                <span style={{ fontSize: '48px' }}>🎨</span>
                <h3>No Sprite Selected</h3>
                <p>Select a sprite or stage from the panel to edit its costumes/backdrops.</p>
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
