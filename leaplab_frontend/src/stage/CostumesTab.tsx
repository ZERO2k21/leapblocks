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

const LOG_PREFIX = '[CostumesTab]';

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
    const renderCount = useRef(0);

    useEffect(() => {
        console.log(LOG_PREFIX, 'MOUNTED | selectedSpriteId:', selectedSpriteId, '| sprites count:', sprites.length, '| sprites:', sprites.map(s => ({ id: s.id, name: s.name, costumeCount: s.costumes?.length })));
        return () => console.log(LOG_PREFIX, 'UNMOUNTED');
    }, []);

    useEffect(() => {
        console.log(LOG_PREFIX, 'PROPS CHANGED | selectedSpriteId:', selectedSpriteId, '| sprites count:', sprites.length, '| sprites:', sprites.map(s => ({ id: s.id, name: s.name, costumeCount: s.costumes?.length })));
    }, [selectedSpriteId, sprites]);

    renderCount.current++;
    console.log(LOG_PREFIX, 'RENDER #' + renderCount.current, '| selectedSpriteId:', selectedSpriteId, '| activeCostumeIndex:', activeCostumeIndex, '| renameIndex:', renameIndex, '| contextMenu:', contextMenu, '| draggedIndex:', draggedIndex, '| dropIndex:', dropIndex, '| refreshTick:', refreshTick);

    const selectedSprite = useMemo(
        () => sprites.find(s => s.id === selectedSpriteId) || null,
        [sprites, selectedSpriteId]
    );

    useEffect(() => {
        if (!selectedSprite) { console.log(LOG_PREFIX, 'NO SPRITE SELECTED - skipping activeCostumeIndex sync'); return; }
        console.log(LOG_PREFIX, 'SYNC activeCostumeIndex | sprite:', selectedSprite.name, selectedSprite.id, '| currentCostumeIndex:', selectedSprite.currentCostumeIndex, '| costumes:', selectedSprite.costumes.map(c => ({ name: c.name, src: c.image?.src?.slice?.(0, 50) })));
        setActiveCostumeIndex(selectedSprite.currentCostumeIndex || 0);
    }, [selectedSprite, refreshTick]);

    useEffect(() => {
        console.log(LOG_PREFIX, 'SETUP window.click listener for contextMenu close');
        const onWindowClick = () => setContextMenu(null);
        window.addEventListener('click', onWindowClick);
        return () => window.removeEventListener('click', onWindowClick);
    }, []);

    const refresh = () => { console.log(LOG_PREFIX, 'refresh() called'); setRefreshTick((v) => v + 1); };

    const selectCostume = (index: number) => {
        if (!selectedSprite) { console.log(LOG_PREFIX, 'selectCostume SKIP - no selectedSprite'); return; }
        console.log(LOG_PREFIX, 'selectCostume | index:', index, '| sprite:', selectedSprite.name, '| costumes before:', selectedSprite.costumes.map(c => c.name));
        selectedSprite.switchCostume(index);
        setActiveCostumeIndex(index);
        setRenameIndex(null);
        setContextMenu(null);
        refresh();
        console.log(LOG_PREFIX, 'selectCostume DONE | new activeIndex:', index, '| currentCostumeIndex after switch:', selectedSprite.currentCostumeIndex);
    };

    const saveRename = (index: number) => {
        if (!selectedSprite) { console.log(LOG_PREFIX, 'saveRename SKIP - no selectedSprite'); return; }
        const nextName = renameValue.trim();
        console.log(LOG_PREFIX, 'saveRename | index:', index, '| renameValue:', renameValue, '| trimmed:', nextName);
        if (!nextName) {
            console.log(LOG_PREFIX, 'saveRename empty name - just closing');
            setRenameIndex(null);
            return;
        }
        const target = selectedSprite.costumes[index];
        if (target) {
            console.log(LOG_PREFIX, 'saveRename applying | old name:', target.name, '| new name:', nextName);
            target.name = nextName;
            selectedSprite.switchCostume(selectedSprite.currentCostumeIndex);
            addLog(`Renamed costume to ${nextName}`);
        } else {
            console.log(LOG_PREFIX, 'saveRename WARNING - no target costume at index:', index, '| costumes:', selectedSprite.costumes.map(c => c.name));
        }
        setRenameIndex(null);
        refresh();
    };

    const duplicateCostume = (index: number) => {
        if (!selectedSprite) { console.log(LOG_PREFIX, 'duplicateCostume SKIP - no selectedSprite'); return; }
        console.log(LOG_PREFIX, 'duplicateCostume | index:', index, '| sprite:', selectedSprite.name, '| costumes count before:', selectedSprite.costumes.length, '| costumes:', selectedSprite.costumes.map(c => c.name));
        selectedSprite.duplicateCostume(index);
        console.log(LOG_PREFIX, 'duplicateCostume done | costumes after:', selectedSprite.costumes.map(c => c.name));
        selectCostume(Math.min(index + 1, selectedSprite.costumes.length - 1));
        addLog(`Duplicated costume on ${selectedSprite.name}`);
    };

    const deleteCostume = (index: number) => {
        if (!selectedSprite) { console.log(LOG_PREFIX, 'deleteCostume SKIP - no selectedSprite'); return; }
        console.log(LOG_PREFIX, 'deleteCostume | index:', index, '| sprite:', selectedSprite.name, '| costumes count before:', selectedSprite.costumes.length, '| costumes:', selectedSprite.costumes.map(c => c.name));
        if (selectedSprite.costumes.length <= 1) {
            console.log(LOG_PREFIX, 'deleteCostume BLOCKED - only 1 costume left');
            alert('At least one costume is required.');
            return;
        }
        selectedSprite.deleteCostume(index);
        console.log(LOG_PREFIX, 'deleteCostume done | costumes after:', selectedSprite.costumes.map(c => c.name));
        const nextIndex = Math.min(index, selectedSprite.costumes.length - 1);
        selectCostume(Math.max(0, nextIndex));
        addLog(`Deleted costume from ${selectedSprite.name}`);
    };

    const exportCostume = (index: number) => {
        if (!selectedSprite) { console.log(LOG_PREFIX, 'exportCostume SKIP - no selectedSprite'); return; }
        const costume = selectedSprite.costumes[index];
        console.log(LOG_PREFIX, 'exportCostume | index:', index, '| costume:', costume?.name, '| has src:', !!costume?.image?.src, '| src preview:', costume?.image?.src?.slice?.(0, 60));
        if (!costume?.image?.src) { console.log(LOG_PREFIX, 'exportCostume SKIP - no image src'); return; }
        const link = document.createElement('a');
        link.href = costume.image.src;
        link.download = `${costume.name || `costume_${index + 1}`}.png`;
        link.click();
        addLog(`Exported costume: ${costume.name}`);
        console.log(LOG_PREFIX, 'exportCostume DONE | download triggered:', link.download);
    };

    const reorderCostumes = (from: number, to: number) => {
        if (!selectedSprite || from === to) { console.log(LOG_PREFIX, 'reorderCostumes SKIP', { from, to, hasSprite: !!selectedSprite }); return; }
        const arr = selectedSprite.costumes;
        const current = selectedSprite.currentCostume;
        console.log(LOG_PREFIX, 'reorderCostumes | from:', from, 'to:', to, '| current costume:', current?.name, '| before:', arr.map(c => c.name));
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        const nextCurrentIndex = current ? arr.findIndex((c) => c === current) : 0;
        console.log(LOG_PREFIX, 'reorderCostumes | after splice:', arr.map(c => c.name), '| nextCurrentIndex:', nextCurrentIndex);
        selectedSprite.switchCostume(Math.max(0, nextCurrentIndex));
        setActiveCostumeIndex(Math.max(0, nextCurrentIndex));
        setDraggedIndex(null);
        setDropIndex(null);
        refresh();
        addLog(`Reordered costumes`);
    };

    const createBlankCostume = async () => {
        if (!selectedSprite) { console.log(LOG_PREFIX, 'createBlankCostume SKIP - no selectedSprite'); return; }
        console.log(LOG_PREFIX, 'createBlankCostume | sprite:', selectedSprite.name, '| costume count before:', selectedSprite.costumes.length, '| costumes:', selectedSprite.costumes.map(c => c.name));
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        const data = canvas.toDataURL('image/png');
        const name = `costume${selectedSprite.costumes.length + 1}`;
        console.log(LOG_PREFIX, 'createBlankCostume | calling addCostume with name:', name, '| data length:', data.length);
        await selectedSprite.addCostume(name, data);
        console.log(LOG_PREFIX, 'createBlankCostume | addCostume DONE | costumes after:', selectedSprite.costumes.map(c => c.name));
        selectCostume(selectedSprite.costumes.length - 1);
        addLog(`Created blank costume: ${name}`);
    };

    const addSurpriseCostume = async () => {
        if (!selectedSprite) { console.log(LOG_PREFIX, 'addSurpriseCostume SKIP - no selectedSprite'); return; }
        const randomAssets = [
            'assets/sprites/leap/cat.svg',
            'assets/sprites/leap/butterfly.svg',
            'assets/sprites/leap/dolphin.svg',
            'assets/sprites/leap/elephant.svg',
            'assets/sprites/robot/robot_idle.svg'
        ];
        const src = randomAssets[Math.floor(Math.random() * randomAssets.length)];
        const name = `surprise_${selectedSprite.costumes.length + 1}`;
        console.log(LOG_PREFIX, 'addSurpriseCostume | sprite:', selectedSprite.name, '| selected src:', src, '| name:', name, '| costume count before:', selectedSprite.costumes.length);
        await selectedSprite.addCostume(name, src);
        console.log(LOG_PREFIX, 'addSurpriseCostume DONE | costumes after:', selectedSprite.costumes.map(c => c.name));
        selectCostume(selectedSprite.costumes.length - 1);
        addLog(`Added surprise costume`);
    };

    const onUploadCostume = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedSprite) { console.log(LOG_PREFIX, 'onUploadCostume SKIP - no selectedSprite'); return; }
        const file = e.target.files?.[0];
        if (!file) { console.log(LOG_PREFIX, 'onUploadCostume SKIP - no file'); return; }
        console.log(LOG_PREFIX, 'onUploadCostume | file name:', file.name, '| size:', file.size, '| type:', file.type);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const src = String(event.target?.result || '');
            if (!src) { console.log(LOG_PREFIX, 'onUploadCostume reader.onload - empty src'); return; }
            const name = file.name.replace(/\.[^/.]+$/, '') || `costume${selectedSprite.costumes.length + 1}`;
            console.log(LOG_PREFIX, 'onUploadCostume reader.onload | name:', name, '| src length:', src.length);
            await selectedSprite.addCostume(name, src);
            console.log(LOG_PREFIX, 'onUploadCostume addCostume DONE | costumes after:', selectedSprite.costumes.map(c => c.name));
            selectCostume(selectedSprite.costumes.length - 1);
            addLog(`Uploaded costume: ${name}`);
        };
        reader.onerror = (err) => console.log(LOG_PREFIX, 'onUploadCostume reader.onerror:', err);
        reader.readAsDataURL(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const updateCurrentCostumeFromEditor = async (imageData: string, _svgData?: string, name?: string, rotationCenter?: { x: number; y: number }) => {
        if (!selectedSprite) { console.log(LOG_PREFIX, 'updateCurrentCostumeFromEditor SKIP - no selectedSprite'); return; }
        const targetIndex = activeCostumeIndex;
        const target = selectedSprite.costumes[targetIndex];
        console.log(LOG_PREFIX, 'updateCurrentCostumeFromEditor | targetIndex:', targetIndex, '| target:', target?.name, '| name param:', name, '| rotationCenter:', rotationCenter, '| imageData length:', imageData.length, '| has svgData:', !!_svgData);
        if (!target) { console.log(LOG_PREFIX, 'updateCurrentCostumeFromEditor SKIP - no target at index', targetIndex); return; }
        await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
                const maxDim = Math.max(img.width, img.height) || 100;
                const logicalBase = 150;
                const scaleFactor = logicalBase / maxDim;
                console.log(LOG_PREFIX, 'updateCurrentCostumeFromEditor image loaded | img size:', img.width, 'x', img.height, '| scaleFactor:', scaleFactor);
                target.image = img;
                target.width = img.width * scaleFactor;
                target.height = img.height * scaleFactor;
                target.name = name?.trim() ? name.trim() : target.name;
                if (rotationCenter) {
                    target.rotationCenterX = rotationCenter.x;
                    target.rotationCenterY = rotationCenter.y;
                    console.log(LOG_PREFIX, 'updateCurrentCostumeFromEditor rotationCenter set:', rotationCenter);
                }
                resolve();
            };
            img.onerror = (err) => { console.log(LOG_PREFIX, 'updateCurrentCostumeFromEditor image load ERROR:', err); resolve(); };
            img.src = imageData;
        });
        selectedSprite.switchCostume(targetIndex);
        refresh();
        addLog(`Updated costume for ${selectedSprite.name}: ${selectedSprite.costumes[targetIndex]?.name}`);
        console.log(LOG_PREFIX, 'updateCurrentCostumeFromEditor DONE | new costume name:', selectedSprite.costumes[targetIndex]?.name);
    };

    // If Stage is selected, render Backdrop Editor
    if (selectedSpriteId === 'stage') {
        const currentBackdrop = stageManager.getCurrentBackdrop()?.src || '';
        const allBackdrops = stageManager.getAllBackdrops().map((b, i) => {
            console.log(LOG_PREFIX, 'BACKDROP map | index:', i, '| name:', b.name, '| src:', b.src?.slice?.(0, 60));
            return { id: i.toString(), name: b.name, image: b.src };
        });

        console.log(LOG_PREFIX, 'RENDER BACKDROP EDITOR | currentBackdrop length:', currentBackdrop.length, '| allBackdrops count:', allBackdrops.length, '| allBackdrops:', allBackdrops);

        const handleBackdropClick = (e: React.MouseEvent) => {
            const target = e.target as HTMLElement;
            console.log(LOG_PREFIX, 'BACKDROP CLICK on:', target.tagName, target.className, '| text:', target.textContent?.slice?.(0, 30), '| pos:', e.clientX, e.clientY);
        };

        return (
            <div style={styles.container} onClick={handleBackdropClick}>
                <PaintEditor
                    mode="intermediate"
                    title="Backdrop Editor"
                    spriteName={stageManager.getAllBackdrops()[stageManager.getCurrentBackdropIndex()]?.name || 'Stage'}
                    initialImage={currentBackdrop}
                    costumes={allBackdrops}
                    onSwitchCostume={(index: number) => {
                        console.log(LOG_PREFIX, 'BACKDROP onSwitchCostume | index:', index);
                        stageManager.setBackdrop(index);
                    }}
                    onSave={async (imageData: string, svgData?: string, name?: string, rotationCenter?: { x: number; y: number }) => {
                        const idx = stageManager.getCurrentBackdropIndex();
                        const backdropName = name || stageManager.getAllBackdrops()[idx]?.name || 'custom';
                        console.log(LOG_PREFIX, 'BACKDROP onSave | idx:', idx, '| backdropName:', backdropName, '| imageData length:', imageData.length, '| has svgData:', !!svgData, '| rotationCenter:', rotationCenter);
                        if (idx >= 0) {
                            await stageManager.updateBackdrop(idx, backdropName, imageData);
                            stageManager.setBackdrop(idx);
                            console.log(LOG_PREFIX, 'BACKDROP onSave updated existing');
                        } else {
                            await stageManager.addBackdrop(backdropName, imageData);
                            stageManager.setBackdrop(backdropName);
                            console.log(LOG_PREFIX, 'BACKDROP onSave added new');
                        }
                        addLog(`Saved backdrop for Stage: ${backdropName}`);
                    }}
                    onDeleteSound={(index: number) => {
                        console.log(LOG_PREFIX, 'BACKDROP onDeleteSound | index:', index);
                        stageManager.deleteBackdrop(index);
                        addLog(`Deleted backdrop from Stage`);
                    }}
                    onDuplicateSound={(index: number) => {
                        console.log(LOG_PREFIX, 'BACKDROP onDuplicateSound | index:', index);
                        stageManager.duplicateBackdrop(index);
                        addLog(`Duplicated backdrop on Stage`);
                    }}
                    onRenameCostume={(index: number, newName: string) => {
                        console.log(LOG_PREFIX, 'BACKDROP onRenameCostume | index:', index, '| newName:', newName);
                        if (newName.trim()) {
                            const backdrop = stageManager.getAllBackdrops()[index];
                            if (backdrop) {
                                console.log(LOG_PREFIX, 'BACKDROP rename applying | old name:', backdrop.name, '| new:', newName.trim());
                                stageManager.updateBackdrop(index, newName.trim(), backdrop.src);
                            } else {
                                console.log(LOG_PREFIX, 'BACKDROP rename - no backdrop at index:', index);
                            }
                        }
                    }}
                    onClose={() => { console.log(LOG_PREFIX, 'BACKDROP onClose'); onClose(); }}
                    onOpenLibrary={() => { console.log(LOG_PREFIX, 'BACKDROP onOpenLibrary'); onOpenLibrary?.(); }}
                />
            </div>
        );
    }

    // If Sprite is selected, render Costume Editor
    if (selectedSprite) {
        const getCostumeSrc = (c: any): string => {
            if (!c) return '';
            if (typeof c === 'string') return c;
            if (typeof c === 'object' && c.src && typeof c.src === 'string') return c.src;
            if (c.image) {
                if (typeof c.image === 'string') return c.image;
                if (typeof c.image === 'object' && c.image.src && typeof c.image.src === 'string') return c.image.src;
            }
            return '';
        };
        const currentCostume = getCostumeSrc(selectedSprite.costumes[activeCostumeIndex]);
        const allCostumes = selectedSprite.costumes.map((c: any, i: number) => ({
            id: i.toString(),
            name: c.name,
            image: getCostumeSrc(c)
        }));

        const handleContainerClick = (e: React.MouseEvent) => {
            const target = e.target as HTMLElement;
            console.log(LOG_PREFIX, 'CLICK on:', target.tagName, target.className, target.id, '| text:', target.textContent?.slice?.(0, 30), '| pos:', e.clientX, e.clientY);
        };

        return (
            <div style={styles.container} key={`${selectedSprite.id}-${refreshTick}`} onClick={handleContainerClick}>
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
                                        onMouseEnter={() => console.log(LOG_PREFIX, 'MOUSE_ENTER costume card | index:', i, 'name:', c.name)}
                                        onMouseLeave={() => console.log(LOG_PREFIX, 'MOUSE_LEAVE costume card | index:', i, 'name:', c.name)}
                                        onDragStart={(e) => {
                                            console.log(LOG_PREFIX, 'DRAG_START | index:', i, 'name:', c.name);
                                            setDraggedIndex(i);
                                            e.dataTransfer.effectAllowed = 'move';
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDropIndex(i);
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            console.log(LOG_PREFIX, 'DRAG_DROP | from:', draggedIndex, 'to:', i, 'name:', c.name);
                                            if (draggedIndex !== null) reorderCostumes(draggedIndex, i);
                                        }}
                                        onDragEnd={() => {
                                            console.log(LOG_PREFIX, 'DRAG_END | final draggedIndex:', draggedIndex, 'dropIndex:', dropIndex);
                                            setDraggedIndex(null);
                                            setDropIndex(null);
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            console.log(LOG_PREFIX, 'CONTEXT_MENU | index:', i, 'name:', c.name, 'at:', e.clientX, e.clientY);
                                            setContextMenu({ x: e.clientX, y: e.clientY, index: i });
                                        }}
                                        onClick={(e) => {
                                            console.log(LOG_PREFIX, 'CLICK costume card | index:', i, 'name:', c.name, 'active:', isActive);
                                            selectCostume(i);
                                        }}
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
                                                    onChange={(e) => {
                                                        console.log(LOG_PREFIX, 'RENAME_INPUT change | index:', i, 'value:', e.target.value);
                                                        setRenameValue(e.target.value);
                                                    }}
                                                    onFocus={() => console.log(LOG_PREFIX, 'RENAME_INPUT focus | index:', i)}
                                                    onBlur={() => {
                                                        console.log(LOG_PREFIX, 'RENAME_INPUT blur | index:', i, 'value:', renameValue);
                                                        saveRename(i);
                                                    }}
                                                    onClick={(e) => { console.log(LOG_PREFIX, 'RENAME_INPUT click | index:', i); e.stopPropagation(); }}
                                                    onKeyDown={(e) => {
                                                        console.log(LOG_PREFIX, 'RENAME_INPUT keydown | index:', i, 'key:', e.key);
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
                                                        console.log(LOG_PREFIX, 'DOUBLE_CLICK name | index:', i, 'name:', c.name);
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
                            <button style={styles.actionButton} onClick={() => { console.log(LOG_PREFIX, 'CLICK Choose button'); onOpenLibrary?.(); }}>🐱 Choose</button>
                            <button style={styles.actionButton} onClick={() => { console.log(LOG_PREFIX, 'CLICK Paint button'); createBlankCostume(); }}>🎨 Paint</button>
                            <button style={styles.actionButton} onClick={() => { console.log(LOG_PREFIX, 'CLICK Surprise button'); addSurpriseCostume(); }}>😮 Surprise</button>
                            <button style={styles.actionButton} onClick={() => { console.log(LOG_PREFIX, 'CLICK Upload button'); fileInputRef.current?.click(); }}>⬆️ Upload</button>
                            <button
                                style={styles.actionButton}
                                onClick={async () => {
                                    console.log(LOG_PREFIX, 'CLICK Camera button');
                                    try {
                                        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } });
                                        console.log(LOG_PREFIX, 'CAMERA stream obtained | tracks:', stream.getTracks().map(t => ({ kind: t.kind, label: t.label, enabled: t.enabled })));
                                        const modal = document.createElement('div');
                                        modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px)';
                                        const box = document.createElement('div');
                                        box.style.cssText = 'background:white;border-radius:16px;overflow:hidden;width:480px;max-width:90vw;box-shadow:0 25px 50px rgba(0,0,0,0.25)';
                                        const header = document.createElement('div');
                                        header.style.cssText = 'background:#7B4FC4;padding:12px 20px;display:flex;align-items:center;justify-content:space-between';
                                        header.innerHTML = '<span style="color:white;font-weight:700">📷 Camera Capture</span>';
                                        const closeBtn = document.createElement('button');
                                        closeBtn.textContent = '×';
                                        closeBtn.style.cssText = 'color:white;font-size:20px;font-weight:700;background:none;border:none;cursor:pointer';
                                        closeBtn.onclick = () => { console.log(LOG_PREFIX, 'CAMERA modal closed by × button'); stream.getTracks().forEach(t => t.stop()); document.body.removeChild(modal); };
                                        header.appendChild(closeBtn);
                                        const videoWrap = document.createElement('div');
                                        videoWrap.style.cssText = 'padding:16px';
                                        const video = document.createElement('video');
                                        video.srcObject = stream;
                                        video.autoplay = true;
                                        video.playsInline = true;
                                        video.muted = true;
                                        video.style.cssText = 'width:100%;border-radius:8px;background:black;max-height:300px;object-fit:contain';
                                        video.onloadedmetadata = () => console.log(LOG_PREFIX, 'CAMERA video metadata loaded | video size:', video.videoWidth, 'x', video.videoHeight);
                                        video.onclick = () => console.log(LOG_PREFIX, 'CAMERA video clicked');
                                        videoWrap.appendChild(video);
                                        const btnWrap = document.createElement('div');
                                        btnWrap.style.cssText = 'display:flex;justify-content:center;padding:0 16px 16px';
                                        const captureBtn = document.createElement('button');
                                        captureBtn.textContent = '📷 CAPTURE';
                                        captureBtn.style.cssText = 'padding:12px 32px;background:#22c55e;color:white;border:none;border-radius:16px;font-size:18px;font-weight:900;cursor:pointer';
                                        captureBtn.onclick = async () => {
                                            console.log(LOG_PREFIX, 'CAMERA capture clicked | video size:', video.videoWidth, 'x', video.videoHeight);
                                            const offscreen = document.createElement('canvas');
                                            offscreen.width = video.videoWidth;
                                            offscreen.height = video.videoHeight;
                                            const ctx = offscreen.getContext('2d');
                                            if (ctx) {
                                                ctx.drawImage(video, 0, 0);
                                                const dataUrl = offscreen.toDataURL('image/png');
                                                const name = `camera_${selectedSprite.costumes.length + 1}`;
                                                console.log(LOG_PREFIX, 'CAMERA captured | dataUrl length:', dataUrl.length, '| name:', name, '| costume count before:', selectedSprite.costumes.length);
                                                await selectedSprite.addCostume(name, dataUrl);
                                                console.log(LOG_PREFIX, 'CAMERA addCostume DONE | costumes after:', selectedSprite.costumes.map(c => c.name));
                                                selectCostume(selectedSprite.costumes.length - 1);
                                                addLog(`Captured camera costume: ${name}`);
                                            }
                                            stream.getTracks().forEach(t => t.stop());
                                            document.body.removeChild(modal);
                                        };
                                        btnWrap.appendChild(captureBtn);
                                        box.appendChild(header);
                                        box.appendChild(videoWrap);
                                        box.appendChild(btnWrap);
                                        modal.appendChild(box);
                                        document.body.appendChild(modal);
                                        console.log(LOG_PREFIX, 'CAMERA modal appended to body');
                                    } catch (err) {
                                        console.log(LOG_PREFIX, 'CAMERA error:', err);
                                        alert('Camera access denied or not available.');
                                    }
                                }}
                            >📷 Camera</button>
                        </div>
                    </div>
                    <div style={styles.rightPanel}>
                        <PaintEditor
                            key={`editor-${activeCostumeIndex}-${refreshTick}`}
                            mode="intermediate"
                            title="Costume Editor"
                            spriteName={selectedSprite.costumes[activeCostumeIndex]?.name || selectedSprite.name}
                            initialImage={currentCostume}
                            costumes={allCostumes}
                            onSave={updateCurrentCostumeFromEditor}
                            onDeleteSound={() => deleteCostume(activeCostumeIndex)}
                            onDuplicateSound={() => duplicateCostume(activeCostumeIndex)}
                            onRenameCostume={(index: number, newName: string) => {
                                if (!newName.trim()) return;
                                const target = selectedSprite.costumes[activeCostumeIndex];
                                if (target) {
                                    target.name = newName.trim();
                                    selectedSprite.switchCostume(selectedSprite.currentCostumeIndex);
                                    refresh();
                                }
                            }}
                            onClose={() => {}}
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
                        onClick={(e) => { console.log(LOG_PREFIX, 'CONTEXT MENU clicked inside - stopping propagation'); e.stopPropagation(); }}
                    >
                        <button style={styles.menuItem} onClick={() => { console.log(LOG_PREFIX, 'CONTEXT MENU Duplicate | index:', contextMenu.index); duplicateCostume(contextMenu.index); setContextMenu(null); }}>Duplicate</button>
                        <button style={styles.menuItem} onClick={() => { console.log(LOG_PREFIX, 'CONTEXT MENU Export | index:', contextMenu.index); exportCostume(contextMenu.index); setContextMenu(null); }}>Export</button>
                        <button style={{ ...styles.menuItem, color: '#d14343' }} onClick={() => { console.log(LOG_PREFIX, 'CONTEXT MENU Delete | index:', contextMenu.index); deleteCostume(contextMenu.index); setContextMenu(null); }}>Delete</button>
                    </div>
                )}
            </div>
        );
    }

    // Fallback if nothing is selected
    console.log(LOG_PREFIX, 'RENDER FALLBACK - no sprite selected | selectedSpriteId:', selectedSpriteId, '| sprites:', sprites.map(s => s.id));
    const handleFallbackClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        console.log(LOG_PREFIX, 'FALLBACK CLICK on:', target.tagName, target.className, '| text:', target.textContent?.slice?.(0, 30), '| pos:', e.clientX, e.clientY);
    };
    return (
        <div style={styles.container} onClick={handleFallbackClick}>
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
        minHeight: 0,
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
        width: '100%',
        minHeight: 0,
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
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        padding: '2px'
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
        gridTemplateColumns: '1fr 1fr 1fr',
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
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
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
