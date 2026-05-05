/**
 * useBlocklyInit.ts
 * One-time Blockly setup: renderer, blocks, generators, dialogs, extensions.
 * Also owns the toolbox builder (getCurrentToolbox).
 */
import { useCallback } from 'react';
import Blockly from '../../server/blockly/runtime';
import { registerLeapRenderer } from '../../../leapignite/server/blocks/LeapRenderer';
import { registerleapBlocks } from '../../server/blocks/leapBlocks';
import { arduinoBlocks, arduinoToolbox } from '../../server/blocks/arduinoBlocks';
import { esp32Blocks, esp32Toolbox } from '../../server/blocks/esp32Blocks';
import { animationBlocks, animationToolbox } from '../../server/blocks/animationBlocks';
import { hardwareBlocks } from '../../server/blocks/hardwareBlocks';
import { initPythonGenerator } from '../../server/generators/pythonGenerator';
import { registerPictoBloxCategory } from '../../server/blockly/customToolbox';
import { EXTENSIONS } from '../../../leapExtensions/server/extensionRegistry';

// ─── Toolbox helpers (module-level, no state needed) ─────────────────────────

const MORE_BLOCKS_NAME = 'More Blocks';
const MORE_BLOCKS_COLOUR = '#94A3B8';

const isCategory = (c: any) =>
    c?.kind === 'pictobloxCategory' || c?.kind === 'pictoBloxCategory' || c?.kind === 'category';

const slugify = (v: string) =>
    v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const categoryLabel = (text: string) => ({
    kind: 'label', text,
    'web-class': `category-header category-header-${slugify(text)}`,
});

const moreBlocksCategory = () => ({
    kind: 'pictobloxCategory',
    name: MORE_BLOCKS_NAME,
    colour: MORE_BLOCKS_COLOUR,
    custom: 'LEAP_MOREBLOCKS',
});

export const withCategoryHeaders = (contents: any[]) => {
    const withMore = contents.some((c: any) => c?.name === MORE_BLOCKS_NAME)
        ? contents
        : [...contents, moreBlocksCategory()];
    return withMore.map((cat: any) => {
        if (!isCategory(cat) || !Array.isArray(cat.contents)) return cat;
        return { ...cat, contents: [categoryLabel(cat.name), ...cat.contents] };
    });
};

// ─── One-time init guard ──────────────────────────────────────────────────────

let _initialized = false;

export function initBlocklyOnce(
    setPromptState: (s: any) => void,
    setPromptInput: (v: string) => void
) {
    if (_initialized) return;
    _initialized = true;

    registerLeapRenderer(Blockly);

    // Register all block types
    try { registerleapBlocks(); } catch { }
    const extra = [
        ...(Array.isArray(arduinoBlocks) ? arduinoBlocks : []),
        ...(Array.isArray(esp32Blocks) ? esp32Blocks : []),
        ...(Array.isArray(animationBlocks) ? animationBlocks : []),
        ...(Array.isArray(hardwareBlocks) ? hardwareBlocks : []),
    ].filter((b: any) => b?.type && !Blockly.Blocks[b.type]);
    if (extra.length > 0) {
        try {
            Blockly.common.defineBlocks(
                Blockly.common.createBlockDefinitionsFromJsonArray(extra)
            );
        } catch { }
    }

    initPythonGenerator();
    registerPictoBloxCategory();

    // Override Blockly dialogs to use our React prompt instead of native browser dialogs
    Blockly.dialog.setPrompt((message: string, defaultValue: string, callback: any) => {
        setPromptState({ isOpen: true, message, defaultValue, callback, type: 'standard' });
        setPromptInput(defaultValue);
    });
    Blockly.dialog.setAlert((message: string, callback: any) => {
        window.alert(message);
        if (callback) callback();
    });
    Blockly.dialog.setConfirm((message: string, callback: any) => {
        callback(window.confirm(message));
    });

    // Broadcast dropdown "New message…" extension
    if (!Blockly.Extensions.isRegistered('broadcast_dropdown_ext')) {
        Blockly.Extensions.register('broadcast_dropdown_ext', function (this: any) {
            this.setOnChange(function (this: any, event: any) {
                if (event.type === Blockly.Events.BLOCK_CHANGE && event.blockId === this.id) {
                    const fn = event.name;
                    if ((fn === 'BROADCAST_INPUT' || fn === 'BROADCAST_OPTION') && event.newValue === 'new') {
                        (window as any).createNewBroadcast((name: string | null) => {
                            this.setFieldValue(name || 'message1', fn);
                        });
                    }
                }
            });
        });
    }
}

// ─── Toolbox builder hook ─────────────────────────────────────────────────────

export function useToolbox(
    editorMode: 'stage' | 'upload',
    selectedBoard: string,
    selectedSpriteId: string | null,
    installedExtensions: Set<string>
) {
    const getCurrentToolbox = useCallback(() => {
        // Build extension categories to inject after "My Blocks"
        const extCats: any[] = [];
        installedExtensions.forEach(id => {
            const def = EXTENSIONS[id];
            if (def) extCats.push({
                kind: 'pictobloxCategory',
                name: def.name,
                colour: def.color,
                contents: def.getToolbox(),
            });
        });

        const injectExtensions = (contents: any[]) => {
            if (extCats.length === 0) return contents;
            const idx = contents.findIndex((c: any) => c.name === 'My Blocks');
            if (idx === -1) return [...contents, ...extCats];
            return [...contents.slice(0, idx + 1), ...extCats, ...contents.slice(idx + 1)];
        };

        if (editorMode === 'stage') {
            const filtered = (animationToolbox as any).contents.filter((c: any) => c.name !== 'Pen');

            if (selectedSpriteId === 'stage') {
                return {
                    ...animationToolbox,
                    contents: withCategoryHeaders(injectExtensions(
                        filtered
                            .filter((c: any) => c.name !== 'Motion')
                            .map((cat: any) => {
                                if (!cat.contents) return cat;
                                let contents = cat.contents;
                                if (cat.name === 'Looks') {
                                    contents = contents.filter((item: any) => {
                                        if (item.kind !== 'block') return true;
                                        const t = item.type;
                                        return !t.startsWith('looks_say') && !t.startsWith('looks_think') &&
                                            t !== 'looks_show' && t !== 'looks_hide' &&
                                            t !== 'looks_switch_costume' && t !== 'looks_next_costume' &&
                                            t !== 'looks_set_size' && t !== 'looks_change_size' &&
                                            t !== 'looks_go_to_layer' && t !== 'looks_go_forward_layers' &&
                                            t !== 'looks_size' && !t.startsWith('looks_costume_');
                                    });
                                } else if (cat.name === 'Events') {
                                    contents = contents.map((item: any) =>
                                        (item.kind === 'block' && item.type === 'event_sprite_clicked')
                                            ? { ...item, type: 'event_stage_clicked' } : item
                                    );
                                } else if (cat.name === 'Control') {
                                    contents = contents.filter((item: any) =>
                                        item.kind !== 'block' || item.type !== 'control_delete_clone'
                                    );
                                } else if (cat.name === 'Sensing') {
                                    contents = contents.filter((item: any) => {
                                        if (item.kind !== 'block') return true;
                                        const t = item.type;
                                        return t !== 'sensing_touching' && t !== 'sensing_touching_color' &&
                                            t !== 'sensing_color_touching_color' && t !== 'sensing_distance_to';
                                    });
                                }
                                return { ...cat, contents };
                            })
                    )),
                };
            }

            return {
                ...animationToolbox,
                contents: withCategoryHeaders(injectExtensions(filtered)),
            };
        }

        const hwToolbox = selectedBoard === 'esp32' ? esp32Toolbox : arduinoToolbox;
        return { ...hwToolbox, contents: withCategoryHeaders((hwToolbox as any).contents) };
    }, [editorMode, selectedBoard, selectedSpriteId, installedExtensions]);

    return { getCurrentToolbox };
}
