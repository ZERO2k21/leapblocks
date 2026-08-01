import React, { useState, useEffect, useRef } from "react";
import Blockly, { javascriptGenerator } from "@blockly-runtime";
import defineLeapBlocks from "../../server/blocks/blocks";
import defineLooksBlocks from "../../server/blocks/looksBlocks";
import defineSoundBlocks from "../../server/blocks/soundBlocks";
import { registerLeapRenderer } from "../../server/blocks/LeapRenderer";
import { getLessonConfig } from "../../server/engine/LessonConfig";
import { WorkspaceValidator } from "../../server/engine/WorkspaceValidator";
import { showToast } from "../components/Toast";
import { EXTENSIONS, registerExtensions, getIgniteExtension } from "../../../extensions/extensionDefinitions";
import { CATEGORIES, categoryContents, BLOCK_TYPE_TO_CATEGORY } from "./workspaceData";
import { getActiveSprite, captureSpriteState, handleBlockPreview } from "./workspacePreview";
import { handleBlockClickForPickers } from "./workspacePickers";

function tagBlockCategory(block) {
    try {
        const category = BLOCK_TYPE_TO_CATEGORY[block.type];
        if (category && block.svgGroup_) {
            block.svgGroup_.setAttribute('data-category', category);
        }
    } catch (_) { }
}

function registerBlocks() {
    defineLeapBlocks(Blockly, javascriptGenerator);
    defineLooksBlocks(Blockly, javascriptGenerator);
    defineSoundBlocks(Blockly, javascriptGenerator);
}

function patchBlocklyDropdowns() {
    if (!Blockly.FieldDropdown.prototype._originalShowEditor) {
        Blockly.FieldDropdown.prototype._originalShowEditor = Blockly.FieldDropdown.prototype.showEditor_;
        Blockly.FieldDropdown.prototype.showEditor_ = function (opt_e) {
            const block = this.getSourceBlock();
            if (block) {
                const color = block.getColour();
                document.documentElement.style.setProperty('--blockly-menu-highlight-color', color);
                const tint = color.startsWith('#') ? `${color}1A` : 'rgba(0,0,0,0.05)';
                document.documentElement.style.setProperty('--blockly-menu-bg-color', tint);
            }
            this._originalShowEditor(opt_e);
        };
    }

    if (!Blockly.FieldDropdown.prototype._arrowColourPatched) {
        const origApplyColour = Blockly.FieldDropdown.prototype.applyColour;
        Blockly.FieldDropdown.prototype.applyColour = function () {
            if (origApplyColour) origApplyColour.call(this);
            const svgArrow = this.svgArrow_ || this.svgArrow;
            if (svgArrow) {
                svgArrow.style.filter = 'brightness(0)';
            }
            const arrow = this.arrow_ || this.arrow;
            if (arrow) {
                try {
                    const arrowEl = arrow.getSvgRoot ? arrow.getSvgRoot() : arrow;
                    if (arrowEl && arrowEl.style) arrowEl.style.fill = '#333333';
                    if (arrowEl && arrowEl.setAttribute) arrowEl.setAttribute('fill', '#333333');
                } catch (e) { }
            }
            try {
                const fieldGroup = this.fieldGroup_ || this.fieldGroup;
                if (fieldGroup) {
                    const images = fieldGroup.querySelectorAll('image');
                    images.forEach(img => { img.style.filter = 'brightness(0)'; });
                }
            } catch (e) { }
        };
        Blockly.FieldDropdown.prototype._arrowColourPatched = true;
    }
}

function setupFlyoutTracking(flyout, setFlyoutHeight) {
    if (!flyout) return;

    const FIXED_SCALE = 1.0;
    flyout.getFlyoutScale = () => FIXED_SCALE;
    if (flyout.getWorkspace()) {
        flyout.getWorkspace().setScale(FIXED_SCALE);
    }

    const syncFlyoutHeight = () => {
        try {
            const h = flyout.getHeight();
            if (h > 0) setFlyoutHeight(h);
        } catch (_) {}
    };

    if (flyout.svgGroup_) {
        const observer = new MutationObserver(syncFlyoutHeight);
        observer.observe(flyout.svgGroup_, { attributes: true, attributeFilter: ['height'] });
    }

    setTimeout(syncFlyoutHeight, 200);
}

export function useJuniorWorkspace({
    workspaceRef,
    blocklyDiv,
    activeSpriteIdRef,
    scenesRef,
    setIsSoundRecorderOpen,
    saveCurrentWorkspace,
    spriteActions,
    currentToolboxContentsRef,
    isLoadingWorkspaceRef,
    draggedBlockRef,
    setIsDraggingBlock,
    lastMousePosRef,
    onBlocksDropped
}) {
    const [activeCategory, setActiveCategory] = useState("events");
    const [categories, setCategories] = useState(CATEGORIES);
    const [categoryBlocks, setCategoryBlocks] = useState(categoryContents);
    const [isExtensionLibraryOpen, setIsExtensionLibraryOpen] = useState(false);
    const [flyoutHeight, setFlyoutHeight] = useState(100);
    const installedExtensionsRef = useRef(new Set());

    // Pickers UI State
    const [showPicker, setShowPicker] = useState(false);
    const [pickerCallback, setPickerCallback] = useState(null);
    const [showDirPicker, setShowDirPicker] = useState(false);
    const [showInstPicker, setShowInstPicker] = useState(false);
    const [showPianoPicker, setShowPianoPicker] = useState(false);
    const [pickerPos, setPickerPos] = useState(null);
    const [activeBlock, setActiveBlock] = useState(null);

    const previewRevertTimerRef = useRef(null);

    const getToolboxXml = (catId, currentCategoryBlocks = categoryBlocks) => {
        const config = getLessonConfig();
        const allowedShapes = config.allowedShapes || ["stack", "hat", "c-block", "cap"];

        let blocks = currentCategoryBlocks[catId] || [];

        if (!allowedShapes.includes("c-block")) {
            blocks = blocks.filter(b => !["control_forever", "control_repeat"].includes(b.type));
        }

        let xml = '<xml xmlns="https://developers.google.com/blockly/xml">';
        blocks.forEach(b => {
            if (b.kind === "button") {
                xml += `<button text="${b.text}" callbackKey="${b.callbackKey}"></button>`;
            } else if (b.kind === "label") {
                xml += `<label text="${b.text}"></label>`;
            } else if (b.kind === "sep") {
                xml += `<sep></sep>`;
            } else {
                xml += `<block type="${b.type}">`;
                if (b.type === 'looks_call') xml += `<field name="NAME">Tobi</field>`;
                if (b.type === 'sound_animal') xml += `<field name="VAL">grunt</field>`;
                xml += `</block>`;
            }
        });
        xml += '</xml>';
        return xml;
    };

    const resetFlyoutScale = () => {
        const flyout = workspaceRef.current?.getFlyout();
        if (flyout && flyout.getWorkspace()) {
            flyout.getWorkspace().setScale(1.0);
        }
    };

    const handleCategoryClick = (catId, overrideBlocks) => {
        setActiveCategory(catId);
        if (workspaceRef.current) {
            const blocks = overrideBlocks || categoryBlocks;
            const toolboxXml = getToolboxXml(catId, blocks);
            workspaceRef.current.updateToolbox(toolboxXml);

            // Store toolbox contents for flyout restoration after workspace switches
            if (currentToolboxContentsRef) {
                currentToolboxContentsRef.current = blocks[catId] || [];
            }

            resetFlyoutScale();
            setTimeout(() => {
                workspaceRef.current?.resize();
                // Sync flyout height after reflow completes
                try {
                    const flyout = workspaceRef.current?.getFlyout();
                    if (flyout) {
                        const h = flyout.getHeight();
                        if (h > 0) setFlyoutHeight(h);
                    }
                } catch (_) {}
            }, 80);
        }
    };

    const handleAddExtension = (extId) => {
        setIsExtensionLibraryOpen(false);

        // Normalize ID (face-detection -> face_detection)
        const id = extId.replace(/-/g, '_');
        const ext = getIgniteExtension(id) || EXTENSIONS[id];

        if (ext) {
            // Already added? Just switch category
            if (categories.find(c => c.id === id)) {
                handleCategoryClick(id);
                return;
            }

            // 1. Register blocks and generators (if not already done)
            registerExtensions(Blockly, [id]);
            // Register Ignite-specific block definitions
            if (EXTENSIONS[id]?.registerIgniteBlocks) {
                EXTENSIONS[id].registerIgniteBlocks(Blockly);
            }

            // Track installed extension
            installedExtensionsRef.current = new Set([...installedExtensionsRef.current, id]);

            // 2. Add to categories and toolbox state
            const newCategory = {
                id: id,
                name: ext.name,
                color: ext.color,
                icon: <span>{ext.icon || '🧩'}</span>
            };

            const nextCategories = [...categories, newCategory];
            const extBlocks = ext.getToolbox();
            const nextCategoryBlocks = { ...categoryBlocks, [id]: extBlocks };

            setCategories(nextCategories);
            setCategoryBlocks(nextCategoryBlocks);

            // 3. Switch to it — pass new blocks directly to avoid stale closure
            setTimeout(() => {
                handleCategoryClick(id, nextCategoryBlocks);
            }, 50);
        } else {
            console.warn(`[JuniorWorkspace] Unknown extension ID: ${extId}`);
        }
    };

    useEffect(() => {
        registerBlocks();
        patchBlocklyDropdowns();
        registerLeapRenderer(Blockly);

        if (blocklyDiv.current && !workspaceRef.current) {
            // Reset any lingering flyout contents from Intermediate mode
            if (typeof _continuousFlyoutContents !== 'undefined') {
                _continuousFlyoutContents = [];
            }

            workspaceRef.current = Blockly.inject(blocklyDiv.current, {
                toolbox: getToolboxXml("events"),
                scrollbars: false,
                trashcan: false,
                horizontalLayout: true,
                toolboxPosition: "end",
                renderer: 'leap',
                sounds: false,
                zoom: {
                    controls: false,
                    wheel: true,
                    startScale: 0.85,
                    maxScale: 3,
                    minScale: 0.3,
                    scaleSpeed: 1.2
                },
                move: { scrollbars: true, drag: true, wheel: false }
            });

            const flyout = workspaceRef.current.getFlyout();
            if (flyout) {
                flyout.autoClose = false;
                // Force refresh the flyout with Junior blocks
                const toolbox = getToolboxXml("events");
                workspaceRef.current.updateToolbox(toolbox);
            }

            workspaceRef.current.registerButtonCallback('RECORD_SOUND', () => {
                setIsSoundRecorderOpen(true);
            });

            setupFlyoutTracking(flyout, setFlyoutHeight);

            // Initialize toolbox contents for flyout restoration on first load
            if (currentToolboxContentsRef && (!currentToolboxContentsRef.current || currentToolboxContentsRef.current.length === 0)) {
                currentToolboxContentsRef.current = categoryContents["events"] || [];
            }

            setTimeout(() => {
                workspaceRef.current.resize();
                window.dispatchEvent(new Event('resize'));
            }, 100);

            // --- Main workspace click listener (pickers + preview) ---
            const handleBlockClick = (e) => {
                if (e.type !== Blockly.Events.CLICK) return;
                const block = workspaceRef.current.getBlockById(e.blockId);
                if (!block) return;

                handleBlockClickForPickers(block, {
                    workspaceRef,
                    setPickerCallback,
                    setShowPicker,
                    setActiveBlock,
                    setShowDirPicker,
                    setShowInstPicker,
                    setShowPianoPicker,
                    setPickerPos
                });

                const activeSprite = getActiveSprite(scenesRef, activeSpriteIdRef);
                if (!activeSprite) return;
                const savedState = captureSpriteState(activeSprite);
                handleBlockPreview(block, spriteActions, activeSprite, savedState, previewRevertTimerRef);
            };
            workspaceRef.current.addChangeListener(handleBlockClick);

            // --- Flyout click listener (preview only) ---
            if (flyout) {
                const flyoutWs = flyout.getWorkspace();
                const handleFlyoutClick = (e) => {
                    if (e.type !== Blockly.Events.CLICK) return;
                    const block = flyoutWs.getBlockById(e.blockId);
                    if (!block) return;

                    const activeSprite = getActiveSprite(scenesRef, activeSpriteIdRef);
                    if (!activeSprite) return;
                    const savedState = captureSpriteState(activeSprite);
                    handleBlockPreview(block, spriteActions, activeSprite, savedState, previewRevertTimerRef);
                };
                flyoutWs.addChangeListener(handleFlyoutClick);
            }

            // --- Workspace change handler (validation, drag tracking, save) ---
            const handleWorkspaceChange = (e) => {
                if (e.type === Blockly.Events.UI) return;

                // Tag blocks with data-category for CSS styling on create
                if (e.type === Blockly.Events.BLOCK_CREATE) {
                    const block = workspaceRef.current.getBlockById(e.blockId);
                    if (block) tagBlockCategory(block);
                }

                // Ignore changes during workspace loading to prevent saving empty/intermediate states
                if (isLoadingWorkspaceRef && isLoadingWorkspaceRef.current) {
                    console.log('[JuniorWorkspace] Ignoring workspace change during load phase');
                    return;
                }

                saveCurrentWorkspace();

                if (e.type === Blockly.Events.BLOCK_CREATE || e.type === Blockly.Events.BLOCK_CHANGE || e.type === Blockly.Events.BLOCK_MOVE) {
                    const config = getLessonConfig();
                    const MAX_BLOCKS = config.maxBlocks || 500;

                    const blocks = workspaceRef.current.getAllBlocks(false);
                    if (blocks.length > MAX_BLOCKS) {
                        showToast(`Lesson Limit: You can only use ${MAX_BLOCKS} blocks!`, 'warning');
                        setTimeout(() => workspaceRef.current.undo(false), 0);
                        return;
                    }

                    const validation = WorkspaceValidator.validateWorkspace(workspaceRef.current);
                    if (!validation.isValid) {
                        if (!validation.error.includes("connected to a Start") && !validation.error.includes("Start block")) {
                            showToast(validation.error, 'error');
                            if (validation.victim) {
                                setTimeout(() => validation.victim.dispose(), 0);
                            }
                        }
                    }
                }

                // --- BLOCK DRAG TRACKING ---
                if (e.type === Blockly.Events.BLOCK_DRAG) {
                    if (e.isStart) {
                        const mainWs = workspaceRef.current;
                        const flyoutWs = mainWs.getFlyout()?.getWorkspace();
                        const block = mainWs.getBlockById(e.blockId) || flyoutWs?.getBlockById(e.blockId);

                        if (block && draggedBlockRef) {
                            console.log(`[JuniorWorkspace] Started dragging block: ${block.type}`);
                            const json = Blockly.serialization.blocks.save(block);
                            draggedBlockRef.current = json;
                            if (setIsDraggingBlock) setIsDraggingBlock(true);
                        }
                    } else {
                        console.log(`[JuniorWorkspace] Finished dragging block`);

                        // Reliability Check: See if we dropped on a sprite card
                        if (lastMousePosRef?.current) {
                            const { x, y } = lastMousePosRef.current;
                            const element = document.elementFromPoint(x, y);
                            const card = element?.closest('[data-sprite-id]');
                            if (card) {
                                const targetId = card.getAttribute('data-sprite-id');
                                console.log(`[JuniorWorkspace] Robust drop detected on: ${targetId}`);
                                onBlocksDropped(targetId);
                            }
                        }

                        // Delay clearing so the drop target has a chance to catch it
                        setTimeout(() => {
                            if (draggedBlockRef) draggedBlockRef.current = null;
                            if (setIsDraggingBlock) setIsDraggingBlock(false);
                        }, 100);
                    }
                }
            };
            workspaceRef.current.addChangeListener(handleWorkspaceChange);

            window.dispatchEvent(new Event('resize'));
        }

        return () => {
            try {
                if (Blockly.WidgetDiv) {
                    Blockly.WidgetDiv.hide();
                }
            } catch (e) { }

            try {
                if (Blockly.DropDownDiv) {
                    Blockly.DropDownDiv.hideWithoutAnimation();
                }
            } catch (e) { }

            if (workspaceRef.current) {
                workspaceRef.current.dispose();
                workspaceRef.current = null;
            }
        };
    }, []);

    const restoreExtensions = (extensionIds) => {
        if (!Array.isArray(extensionIds) || extensionIds.length === 0) return;

        let nextCategories = [...categories];
        let nextCategoryBlocks = { ...categoryBlocks };

        for (const extId of extensionIds) {
            if (installedExtensionsRef.current.has(extId)) continue;

            const ext = getIgniteExtension(extId) || EXTENSIONS[extId];
            if (!ext) continue;

            // Register blocks and generators
            registerExtensions(Blockly, [extId]);
            if (EXTENSIONS[extId]?.registerIgniteBlocks) {
                EXTENSIONS[extId].registerIgniteBlocks(Blockly);
            }

            // Track installed extension
            installedExtensionsRef.current = new Set([...installedExtensionsRef.current, extId]);

            // Add to categories and toolbox state
            const newCategory = {
                id: extId,
                name: ext.name,
                color: ext.color,
                icon: <span>{ext.icon || '🧩'}</span>
            };
            nextCategories = [...nextCategories, newCategory];
            nextCategoryBlocks = { ...nextCategoryBlocks, [extId]: ext.getToolbox() };
        }

        setCategories(nextCategories);
        setCategoryBlocks(nextCategoryBlocks);
    };

    return {
        activeCategory,
        categories,
        setCategories,
        categoryBlocks,
        setCategoryBlocks,
        flyoutHeight,
        handleCategoryClick,
        resetFlyoutScale,
        isExtensionLibraryOpen,
        setIsExtensionLibraryOpen,
        handleAddExtension,
        installedExtensionsRef,
        restoreExtensions,
        showPicker,
        setShowPicker,
        pickerCallback,
        setPickerCallback,
        showDirPicker,
        setShowDirPicker,
        showInstPicker,
        setShowInstPicker,
        showPianoPicker,
        setShowPianoPicker,
        pickerPos,
        activeBlock,
        setActiveBlock
    };
}
