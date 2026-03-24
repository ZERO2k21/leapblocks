import React, { useState, useEffect, useRef } from "react";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";

import defineLeapBlocks from "../blocks/blocks";
import defineLooksBlocks from "../blocks/looksBlocks";
import defineSoundBlocks from "../blocks/soundBlocks";
import defineExtensionBlocks from "../blocks/extensionBlocks";
import { registerLeapRenderer } from "../blocks/LeapRenderer";

import { getLessonConfig } from "../engine/LessonConfig";
import { WorkspaceValidator } from "../engine/WorkspaceValidator";
import { previewActions } from "../engine/previewActions";
import { looksPreview } from "../engine/looksPreview";

// Robot Assets
const robotIdle = "/assets/sprites/robot/robot_idle.svg";
const robotWave1 = "/assets/sprites/robot/robot_wave1.svg";
const robotWave2 = "/assets/sprites/robot/robot_wave2.svg";
const robotTalk1 = "/assets/sprites/robot/robot_talk1.svg";

// Categories
const CATEGORIES = [
    { id: "events", name: "Events", color: "#FFBF00", icon: <span role="img" aria-label="flag">🏁</span> },
    { id: "motion", name: "Motion", color: "#4C97FF", icon: <span role="img" aria-label="motion">👣</span> },
    { id: "looks", name: "Looks", color: "#9966FF", icon: <span role="img" aria-label="looks">👁️</span> },
    { id: "sound", name: "Sound", color: "#CF63CF", icon: <span role="img" aria-label="sound">🔊</span> },
    { id: "control", name: "Control", color: "#FFAB19", icon: <span role="img" aria-label="control">✋</span> },
    { id: "pen", name: "Pen", color: "#0FBD8C", icon: <span role="img" aria-label="pen">🖊️</span> },
];

const categoryContents = {
    motion: [
        { kind: "block", type: "move_right" },
        { kind: "block", type: "move_left" },
        { kind: "block", type: "move_up" },
        { kind: "block", type: "move_down" },
        { kind: "block", type: "turn_right" },
        { kind: "block", type: "turn_left" },
        { kind: "block", type: "jump" },
        { kind: "block", type: "go_to_location" },
        { kind: "block", type: "go_random" },
        { kind: "block", type: "change_speed" }
    ],
    looks: [
        { kind: "block", type: "say_text" },
        { kind: "block", type: "show_sprite" },
        { kind: "block", type: "hide_sprite" },
        { kind: "block", type: "junior_change_costume" },
        { kind: "block", type: "change_size" },
        { kind: "block", type: "looks_reset_size" },
        { kind: "block", type: "looks_next_costume" },
        { kind: "block", type: "looks_change_costume" },
        { kind: "block", type: "looks_mirror" },
        { kind: "block", type: "select_sprite" },
        { kind: "block", type: "switch_scene" }
    ],
    control: [
        { kind: "block", type: "control_forever" },
        { kind: "block", type: "control_repeat" },
        { kind: "block", type: "control_wait" },
        { kind: "block", type: "control_stop" },
        { kind: "block", type: "control_scene" }
    ],
    events: [
        { kind: "block", type: "event_flag" },
        { kind: "block", type: "event_up" },
        { kind: "block", type: "event_down" },
        { kind: "block", type: "event_press" },
        { kind: "block", type: "broadcast_message" },
        { kind: "block", type: "when_receive_message" }
    ],
    sound: [
        { kind: "block", type: "sound_play" },
        { kind: "button", text: "🎤", callbackKey: "RECORD_SOUND" },
        { kind: "block", type: "sound_play_music" },
        { kind: "block", type: "sound_instrument" },
        { kind: "block", type: "sound_note" },
        { kind: "block", type: "sound_stop" }
    ],
    pen: [
        { kind: "block", type: "pen_down" },
        { kind: "block", type: "pen_up" },
        { kind: "block", type: "pen_set_color" },
        { kind: "block", type: "pen_set_size" },
        { kind: "block", type: "pen_stamp" },
        { kind: "block", type: "pen_eraser" }
    ]
};

export function useJuniorWorkspace({
    workspaceRef,
    blocklyDiv,
    activeSpriteIdRef,
    scenesRef,
    setIsSoundRecorderOpen,
    saveCurrentWorkspace,
    spriteActions,
    currentToolboxContentsRef,
    isLoadingWorkspaceRef
}) {
    const [activeCategory, setActiveCategory] = useState("events");
    const [categories, setCategories] = useState(CATEGORIES);
    const [categoryBlocks, setCategoryBlocks] = useState(categoryContents);
    const [isExtensionLibraryOpen, setIsExtensionLibraryOpen] = useState(false);

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

    const handleCategoryClick = (catId) => {
        setActiveCategory(catId);
        if (workspaceRef.current) {
            const toolboxXml = getToolboxXml(catId, categoryBlocks);
            workspaceRef.current.updateToolbox(toolboxXml);

            // Store toolbox contents for flyout restoration after workspace switches
            if (currentToolboxContentsRef) {
                currentToolboxContentsRef.current = categoryBlocks[catId] || [];
            }

            resetFlyoutScale();
            setTimeout(() => workspaceRef.current?.resize(), 50);
        }
    };

    const handleAddExtension = (extId) => {
        setIsExtensionLibraryOpen(false);

        let newCategory = null;
        let newBlocks = [];

        if (extId === 'face_detection') {
            if (!categories.find(c => c.id === 'face_detection')) {
                newCategory = { id: "face_detection", name: "Face Detection", color: "#D43D41", icon: <span>👤</span> };
                newBlocks = [
                    { kind: "block", type: "fd_camera" },
                    { kind: "block", type: "fd_analyze" },
                    { kind: "block", type: "fd_count" },
                    { kind: "block", type: "fd_guess_emotion" },
                    { kind: "block", type: "fd_feature" },
                    { kind: "block", type: "fd_when_emotion" }
                ];
            }
        } else if (extId === 'hand_pose') {
            if (!categories.find(c => c.id === 'hand_pose')) {
                newCategory = { id: "hand_pose", name: "Hand Pose", color: "#D43D41", icon: <span>✋</span> };
                newBlocks = [
                    { kind: "block", type: "hp_camera" },
                    { kind: "block", type: "hp_analyze" },
                    { kind: "block", type: "hp_move_with" },
                    { kind: "block", type: "hp_guess_sign" },
                    { kind: "block", type: "hp_when_sign" }
                ];
            }
        }

        if (newCategory) {
            const nextCategories = [...categories, newCategory];
            const nextCategoryBlocks = { ...categoryBlocks, [extId]: newBlocks };
            setCategories(nextCategories);
            setCategoryBlocks(nextCategoryBlocks);

            setTimeout(() => {
                setActiveCategory(extId);
                if (workspaceRef.current) {
                    workspaceRef.current.updateToolbox(getToolboxXml(extId, nextCategoryBlocks));
                    resetFlyoutScale();
                    setTimeout(() => workspaceRef.current?.resize(), 50);
                }
            }, 50);
        }
    };

    useEffect(() => {
        defineLeapBlocks(Blockly, javascriptGenerator);
        defineLooksBlocks(Blockly, javascriptGenerator);
        defineSoundBlocks(Blockly, javascriptGenerator);
        defineExtensionBlocks(Blockly, javascriptGenerator);

        // Dynamic Dropdown Colors
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

        // Force dropdown arrows to be black
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
                    startScale: 0.8,
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

            const initFlyout = workspaceRef.current.getFlyout();
            if (initFlyout) {
                const FIXED_SCALE = 1.0;
                initFlyout.getFlyoutScale = () => FIXED_SCALE;
                if (initFlyout.getWorkspace()) {
                    initFlyout.getWorkspace().setScale(FIXED_SCALE);
                }
                initFlyout.height_ = 140;
            }

            setTimeout(() => {
                workspaceRef.current.resize();
                window.dispatchEvent(new Event('resize'));
            }, 100);

            // UI Listeners (Pickers & Previews)
            workspaceRef.current.addChangeListener((e) => {
                if (e.type === Blockly.Events.CLICK) {
                    const block = workspaceRef.current.getBlockById(e.blockId);
                    if (!block) return;

                    if (block.type === "go_to_location") {
                        setPickerCallback(() => (x, y) => {
                            block.posX = x;
                            block.posY = y;
                            if (window.goToLocation) window.goToLocation(x, y);
                        });
                        setShowPicker(true);
                    }

                    if (block.type === "move_relative") {
                        setActiveBlock(block);
                        setShowDirPicker(true);
                    }

                    if (block.type === "sound_instrument") {
                        setActiveBlock(block);
                        const xy = block.getRelativeToSurfaceXY();
                        const scale = workspaceRef.current.getScale();
                        const injectionDiv = workspaceRef.current.getInjectionDiv();
                        const bBox = injectionDiv.getBoundingClientRect();

                        setPickerPos({
                            x: bBox.left + (xy.x * scale) + (block.width / 2 * scale) - 90,
                            y: bBox.top + (xy.y * scale) + (block.height * scale) + 10
                        });
                        setShowInstPicker(true);
                    }

                    if (block.type === "sound_note") {
                        setActiveBlock(block);
                        const xy = block.getRelativeToSurfaceXY();
                        const scale = workspaceRef.current.getScale();
                        const injectionDiv = workspaceRef.current.getInjectionDiv();
                        const bBox = injectionDiv.getBoundingClientRect();

                        setPickerPos({
                            x: bBox.left + (xy.x * scale) + (block.width / 2 * scale) - 160,
                            y: bBox.top + (xy.y * scale) + (block.height * scale) + 10
                        });
                        setShowPianoPicker(true);
                    }

                    // PROPER PREVIEW
                    const sid = activeSpriteIdRef.current || window.activeSpriteId;
                    const latestScenes = scenesRef.current;
                    let activeSprite = null;
                    if (latestScenes) {
                        for (const scene of latestScenes) {
                            activeSprite = scene.sprites.find(s => s.id === sid);
                            if (activeSprite) break;
                        }
                    }
                    if (!activeSprite) return;

                    if (previewRevertTimerRef.current) {
                        clearTimeout(previewRevertTimerRef.current);
                        previewRevertTimerRef.current = null;
                    }

                    const savedState = {
                        x: activeSprite.x,
                        y: activeSprite.y,
                        angle: activeSprite.angle,
                        size: activeSprite.size,
                        visible: activeSprite.visible,
                        mirrored: activeSprite.mirrored,
                        speech: activeSprite.speech,
                        currentCostume: activeSprite.currentCostume
                    };

                    let previewed = false;
                    if (looksPreview[block.type]) {
                        looksPreview[block.type](block);
                        previewed = true;
                    } else if (previewActions[block.type]) {
                        previewActions[block.type](block);
                        previewed = true;
                    }

                    if (previewed) {
                        if (window.jiggle) window.jiggle(activeSprite.id);

                        previewRevertTimerRef.current = setTimeout(() => {
                            console.log(`[JuniorApp] Reverting preview for ${activeSprite.name}`);
                            spriteActions.update(activeSprite.id, savedState);
                            previewRevertTimerRef.current = null;
                        }, 2000);
                    }
                }
            });

            // Flyout preview listener
            if (flyout) {
                const flyoutWs = flyout.getWorkspace();
                flyoutWs.addChangeListener((e) => {
                    if (e.type === Blockly.Events.CLICK) {
                        const block = flyoutWs.getBlockById(e.blockId);
                        if (!block) return;

                        const sid = activeSpriteIdRef.current || window.activeSpriteId;
                        const latestScenes = scenesRef.current;
                        let activeSprite = null;
                        if (latestScenes) {
                            for (const scene of latestScenes) {
                                activeSprite = scene.sprites.find(s => s.id === sid);
                                if (activeSprite) break;
                            }
                        }
                        if (!activeSprite) return;

                        if (previewRevertTimerRef.current) {
                            clearTimeout(previewRevertTimerRef.current);
                            previewRevertTimerRef.current = null;
                        }

                        const savedState = {
                            x: activeSprite.x,
                            y: activeSprite.y,
                            angle: activeSprite.angle,
                            size: activeSprite.size,
                            visible: activeSprite.visible,
                            mirrored: activeSprite.mirrored,
                            speech: activeSprite.speech,
                            currentCostume: activeSprite.currentCostume
                        };

                        let previewed = false;
                        if (looksPreview[block.type]) {
                            looksPreview[block.type](block);
                            previewed = true;
                        } else if (previewActions[block.type]) {
                            previewActions[block.type](block);
                            previewed = true;
                        }

                        if (previewed) {
                            if (window.jiggle) window.jiggle(activeSprite.id);

                            previewRevertTimerRef.current = setTimeout(() => {
                                console.log(`[JuniorApp] Reverting flyout preview for ${activeSprite.name}`);
                                spriteActions.update(activeSprite.id, savedState);
                                previewRevertTimerRef.current = null;
                            }, 2000);
                        }
                    }
                });
            }

            const handleWorkspaceChange = (e) => {
                if (e.type === Blockly.Events.UI) return;

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
                        alert(`Lesson Limit: You can only use ${MAX_BLOCKS} blocks!`);
                        setTimeout(() => workspaceRef.current.undo(false), 0);
                        return;
                    }

                    const validation = WorkspaceValidator.validateWorkspace(workspaceRef.current);
                    if (!validation.isValid) {
                        if (!validation.error.includes("connected to a Start") && !validation.error.includes("Start block")) {
                            alert(validation.error);
                            if (validation.victim) {
                                setTimeout(() => validation.victim.dispose(), 0);
                            }
                        }
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

    return {
        activeCategory,
        categories,
        handleCategoryClick,
        resetFlyoutScale,
        isExtensionLibraryOpen,
        setIsExtensionLibraryOpen,
        handleAddExtension,
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
