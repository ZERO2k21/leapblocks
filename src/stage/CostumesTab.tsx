/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import PaintEditor from '../components/PaintEditor';
import { Sprite } from './Sprite';
import type { StageManager } from '../engine/StageManager';

interface CostumesTabProps {
    selectedSpriteId: string | null;
    sprites: Sprite[];
    stageManager: StageManager;
    addLog: (msg: string) => void;
    onClose: () => void;
    onOpenLibrary?: () => void;
}

export const CostumesTab: React.FC<CostumesTabProps> = ({
    selectedSpriteId,
    sprites,
    stageManager,
    addLog,
    onClose,
    onOpenLibrary
}) => {
    const [activeCostumeIndex, setActiveCostumeIndex] = useState(0);
    const [renameIndex, setRenameIndex] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    const [refreshTick, setRefreshTick] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedSprite = useMemo(
        () => sprites.find(s => s.id === selectedSpriteId) || null,
        [sprites, selectedSpriteId]
    );

    useEffect(() => {
        if (!selectedSprite) return;
        setActiveCostumeIndex(selectedSprite.currentCostumeIndex || 0);
    }, [selectedSprite, refreshTick]);

    useEffect(() => {
        const onWindowClick = () => setContextMenu(null);
        window.addEventListener('click', onWindowClick);
        return () => window.removeEventListener('click', onWindowClick);
    }, []);

    const refresh = () => setRefreshTick((v) => v + 1);

    const selectCostume = (index: number) => {
        if (!selectedSprite) return;
        selectedSprite.switchCostume(index);
        setActiveCostumeIndex(index);
        setRenameIndex(null);
        setContextMenu(null);
        refresh();
    };

    const saveRename = (index: number) => {
        if (!selectedSprite) return;
        const nextName = renameValue.trim();
        if (!nextName) {
            setRenameIndex(null);
            return;
        }
        const target = selectedSprite.costumes[index];
        if (target) {
            target.name = nextName;
            selectedSprite.switchCostume(selectedSprite.currentCostumeIndex);
            addLog(`Renamed costume to ${nextName}`);
        }
        setRenameIndex(null);
        refresh();
    };

    const duplicateCostume = (index: number) => {
        if (!selectedSprite) return;
        selectedSprite.duplicateCostume(index);
        selectCostume(Math.min(index + 1, selectedSprite.costumes.length - 1));
        addLog(`Duplicated costume on ${selectedSprite.name}`);
    };

    const deleteCostume = (index: number) => {
        if (!selectedSprite) return;
        if (selectedSprite.costumes.length <= 1) {
            alert('At least one costume is required.');
            return;
        }
        selectedSprite.deleteCostume(index);
        const nextIndex = Math.min(index, selectedSprite.costumes.length - 1);
        selectCostume(Math.max(0, nextIndex));
        addLog(`Deleted costume from ${selectedSprite.name}`);
    };

    const exportCostume = (index: number) => {
        if (!selectedSprite) return;
        const costume = selectedSprite.costumes[index];
        if (!costume?.image?.src) return;
        const link = document.createElement('a');
        link.href = costume.image.src;
        link.download = `${costume.name || `costume_${index + 1}`}.png`;
        link.click();
        addLog(`Exported costume: ${costume.name}`);
    };

    const reorderCostumes = (from: number, to: number) => {
        if (!selectedSprite || from === to) return;
        const arr = selectedSprite.costumes;
        const current = selectedSprite.currentCostume;
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        const nextCurrentIndex = current ? arr.findIndex((c) => c === current) : 0;
        selectedSprite.switchCostume(Math.max(0, nextCurrentIndex));
        setActiveCostumeIndex(Math.max(0, nextCurrentIndex));
        setDraggedIndex(null);
        setDropIndex(null);
        refresh();
        addLog(`Reordered costumes`);
    };

    const createBlankCostume = async () => {
        if (!selectedSprite) return;
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        const data = canvas.toDataURL('image/png');
        const name = `costume${selectedSprite.costumes.length + 1}`;
        await selectedSprite.addCostume(name, data);
        selectCostume(selectedSprite.costumes.length - 1);
        addLog(`Created blank costume: ${name}`);
    };

    const addSurpriseCostume = async () => {
        if (!selectedSprite) return;
        const randomAssets = [
            'assets/sprites/leap/cat.svg',
            'assets/sprites/leap/butterfly.svg',
            'assets/sprites/leap/dolphin.svg',
            'assets/sprites/leap/elephant.svg',
            'assets/sprites/robot/robot_idle.svg'
        ];
        const src = randomAssets[Math.floor(Math.random() * randomAssets.length)];
        const name = `surprise_${selectedSprite.costumes.length + 1}`;
        await selectedSprite.addCostume(name, src);
        selectCostume(selectedSprite.costumes.length - 1);
        addLog(`Added surprise costume`);
    };

    const onUploadCostume = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedSprite) return;
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const src = String(event.target?.result || '');
            if (!src) return;
            const name = file.name.replace(/\.[^/.]+$/, '') || `costume${selectedSprite.costumes.length + 1}`;
            await selectedSprite.addCostume(name, src);
            selectCostume(selectedSprite.costumes.length - 1);
            addLog(`Uploaded costume: ${name}`);
        };
        reader.readAsDataURL(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const updateCurrentCostumeFromEditor = async (imageData: string, _svgData?: string, name?: string) => {
        if (!selectedSprite) return;
        const targetIndex = activeCostumeIndex;
        const target = selectedSprite.costumes[targetIndex];
        if (!target) return;
        await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
                const maxDim = Math.max(img.width, img.height) || 100;
                const logicalBase = 150;
                const scaleFactor = logicalBase / maxDim;
                target.image = img;
                target.width = img.width * scaleFactor;
                target.height = img.height * scaleFactor;
                target.name = name?.trim() ? name.trim() : target.name;
                resolve();
            };
            img.onerror = () => resolve();
            img.src = imageData;
        });
        selectedSprite.switchCostume(targetIndex);
        refresh();
        addLog(`Updated costume for ${selectedSprite.name}: ${selectedSprite.costumes[targetIndex]?.name}`);
    };

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
                        // Use imageData (PNG) for the thumbnail `src` string, and keep the svg logic if needed somewhere else
                        // But StageManager expects an Image capable of being drawn to a Canvas, so PNG `imageData` is much safer and more reliable.
                        const savedData = imageData;
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
                    onOpenLibrary={onOpenLibrary}
                />
            </div>
        );
    }

    // If Sprite is selected, render Costume Editor
    if (selectedSprite) {
        const currentCostume = selectedSprite.costumes[activeCostumeIndex]?.image?.src || '';
        const allCostumes = selectedSprite.costumes.map((c: any, i: number) => ({
            id: i.toString(),
            name: c.name,
            image: c.image.src
        }));

        return (
            <div style={styles.container} key={`${selectedSprite.id}-${refreshTick}`}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.gif,image/*"
                    style={{ display: 'none' }}
                    onChange={onUploadCostume}
                />
                <div style={styles.splitLayout}>
                    <div style={styles.leftPanel}>
                        <div style={styles.leftHeader}>Costumes</div>
                        <div style={styles.costumeList}>
                            {allCostumes.map((c, i) => {
                                const isActive = i === activeCostumeIndex;
                                const isDragging = i === draggedIndex;
                                return (
                                    <div
                                        key={c.id}
                                        draggable
                                        onDragStart={(e) => {
                                            setDraggedIndex(i);
                                            e.dataTransfer.effectAllowed = 'move';
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDropIndex(i);
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            if (draggedIndex !== null) reorderCostumes(draggedIndex, i);
                                        }}
                                        onDragEnd={() => {
                                            setDraggedIndex(null);
                                            setDropIndex(null);
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            setContextMenu({ x: e.clientX, y: e.clientY, index: i });
                                        }}
                                        onClick={() => selectCostume(i)}
                                        style={{
                                            ...styles.costumeCard,
                                            ...(isActive ? styles.costumeCardActive : {}),
                                            ...(isDragging ? styles.costumeCardDragging : {})
                                        }}
                                    >
                                        {dropIndex === i && draggedIndex !== null && draggedIndex !== i && <div style={styles.dropLine} />}
                                        <div style={styles.dragHandle}>⠿</div>
                                        <div style={styles.thumbWrap}>
                                            <span style={styles.numberBadge}>{i + 1}</span>
                                            <img src={c.image} alt={c.name} style={styles.thumbImg} />
                                        </div>
                                        <div style={styles.nameWrap}>
                                            {renameIndex === i ? (
                                                <input
                                                    autoFocus
                                                    value={renameValue}
                                                    onChange={(e) => setRenameValue(e.target.value)}
                                                    onBlur={() => saveRename(i)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveRename(i);
                                                        if (e.key === 'Escape') setRenameIndex(null);
                                                    }}
                                                    style={styles.renameInput}
                                                />
                                            ) : (
                                                <div
                                                    style={{ ...styles.costumeName, ...(isActive ? styles.costumeNameActive : {}) }}
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        setRenameIndex(i);
                                                        setRenameValue(c.name);
                                                    }}
                                                >
                                                    {c.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={styles.bottomButtons}>
                            <button style={styles.actionButton} onClick={() => onOpenLibrary?.()}>🐱 Choose</button>
                            <button style={styles.actionButton} onClick={createBlankCostume}>🎨 Paint</button>
                            <button style={styles.actionButton} onClick={addSurpriseCostume}>😮 Surprise</button>
                            <button style={styles.actionButton} onClick={() => fileInputRef.current?.click()}>⬆️ Upload</button>
                        </div>
                    </div>
                    <div style={styles.rightPanel}>
                        <PaintEditor
                            key={`editor-${activeCostumeIndex}-${refreshTick}`}
                            mode="intermediate"
                            title="Costume Editor"
                            spriteName={selectedSprite.name}
                            initialImage={currentCostume}
                            costumes={[allCostumes[activeCostumeIndex]].filter(Boolean)}
                            onSave={updateCurrentCostumeFromEditor}
                            onDeleteSound={() => deleteCostume(activeCostumeIndex)}
                            onDuplicateSound={() => duplicateCostume(activeCostumeIndex)}
                            onClose={() => { }}
                            hideCostumeSidebar={true}
                        />
                    </div>
                </div>
                {contextMenu && (
                    <div
                        style={{
                            ...styles.contextMenu,
                            left: `${contextMenu.x}px`,
                            top: `${contextMenu.y}px`
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button style={styles.menuItem} onClick={() => { duplicateCostume(contextMenu.index); setContextMenu(null); }}>Duplicate</button>
                        <button style={styles.menuItem} onClick={() => { exportCostume(contextMenu.index); setContextMenu(null); }}>Export</button>
                        <button style={{ ...styles.menuItem, color: '#d14343' }} onClick={() => { deleteCostume(contextMenu.index); setContextMenu(null); }}>Delete</button>
                    </div>
                )}
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
    },
    splitLayout: {
        display: 'flex',
        height: '100%',
        width: '100%'
    },
    leftPanel: {
        width: '180px',
        borderRight: '1px solid #E5E7EB',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column'
    },
    leftHeader: {
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        fontWeight: 700,
        color: '#4c2f8e',
        borderBottom: '1px solid #EEEAF8'
    },
    costumeList: {
        flex: 1,
        overflowY: 'auto',
        padding: '8px'
    },
    costumeCard: {
        position: 'relative',
        height: '90px',
        borderRadius: '10px',
        border: '1px solid #ECEAF5',
        background: '#fff',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    },
    costumeCardActive: {
        border: '2px solid #7c3aed',
        background: 'rgba(124, 58, 237, 0.08)'
    },
    costumeCardDragging: {
        opacity: 0.6,
        transform: 'scale(1.03)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.18)'
    },
    dragHandle: {
        color: '#A1A1AA',
        fontSize: '14px',
        userSelect: 'none'
    },
    thumbWrap: {
        width: '60px',
        height: '60px',
        borderRadius: '8px',
        background: '#fff',
        border: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0
    },
    numberBadge: {
        position: 'absolute',
        top: '4px',
        left: '4px',
        minWidth: '16px',
        height: '16px',
        borderRadius: '999px',
        padding: '0 4px',
        background: '#9CA3AF',
        color: '#fff',
        fontSize: '10px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    thumbImg: {
        maxWidth: '52px',
        maxHeight: '52px',
        objectFit: 'contain'
    },
    nameWrap: {
        flex: 1,
        minWidth: 0
    },
    costumeName: {
        color: '#4B5563',
        fontSize: '12px',
        lineHeight: 1.25,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis'
    },
    costumeNameActive: {
        fontWeight: 700
    },
    renameInput: {
        width: '100%',
        border: 'none',
        borderBottom: '1px solid #7c3aed',
        outline: 'none',
        fontSize: '12px',
        color: '#374151',
        background: 'transparent',
        padding: '2px 0'
    },
    dropLine: {
        position: 'absolute',
        left: '6px',
        right: '6px',
        top: '-2px',
        height: '2px',
        background: '#7c3aed',
        borderRadius: '2px'
    },
    bottomButtons: {
        borderTop: '1px solid #EEEAF8',
        padding: '8px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px'
    },
    actionButton: {
        border: '1px solid #d4c8f0',
        background: '#fff',
        color: '#4c2f8e',
        borderRadius: '8px',
        padding: '8px 6px',
        fontSize: '11px',
        fontWeight: 700,
        cursor: 'pointer'
    },
    rightPanel: {
        flex: 1,
        minWidth: 0
    },
    contextMenu: {
        position: 'fixed',
        zIndex: 1000,
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
        minWidth: '120px',
        padding: '4px'
    },
    menuItem: {
        width: '100%',
        border: 'none',
        background: 'transparent',
        textAlign: 'left' as const,
        padding: '8px 10px',
        borderRadius: '6px',
        cursor: 'pointer',
        color: '#374151',
        fontSize: '12px'
    }
};
