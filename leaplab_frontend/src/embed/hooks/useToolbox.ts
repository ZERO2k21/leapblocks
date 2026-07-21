import { useCallback } from 'react';
import type React from 'react';
import { arduinoToolbox } from '../../blocks/arduino-blocks';
import { esp32Toolbox } from '../../blocks/esp32-blocks';
import { animationToolbox } from '../../blocks/animation-blocks';
import { EXTENSIONS } from '../../extensions/extensionDefinitions';
import { withCategoryHeaders } from '../utils/toolboxHelpers';

export function useToolbox(
    editorMode: string,
    selectedBoard: string,
    selectedSpriteId: string | null,
    installedExtensions: Set<string>,
    installedExtensionsRef: React.MutableRefObject<Set<string>>,
) {
    const getCurrentToolbox = useCallback(() => {
        const extensionCategories: any[] = [];
        const ext = installedExtensionsRef.current;

        ext.forEach(id => {
            const definition = EXTENSIONS[id];
            if (definition) {
                extensionCategories.push({
                    kind: 'leapbloxCategory',
                    name: definition.name,
                    colour: definition.color,
                    contents: definition.getToolbox(),
                });
            }
        });

        const injectExtensions = (contents: any[]) => {
            if (extensionCategories.length === 0) return contents;
            const myBlocksIdx = contents.findIndex((c: any) => c.name === 'My Blocks');
            if (myBlocksIdx === -1) return [...contents, ...extensionCategories];
            return [
                ...contents.slice(0, myBlocksIdx + 1),
                ...extensionCategories,
                ...contents.slice(myBlocksIdx + 1),
            ];
        };

        if (editorMode === 'stage') {
            const filteredContents = animationToolbox.contents.filter((cat: any) => cat.name !== 'Pen');

            if (selectedSpriteId === 'stage') {
                return {
                    ...animationToolbox,
                    contents: withCategoryHeaders(
                        injectExtensions(filteredContents
                            .filter((cat: any) => cat.name !== 'Motion')
                            .map((cat: any) => {
                                let contents = cat.contents;
                                if (!contents) return cat;

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
                        )
                    )
                };
            }

            return {
                ...animationToolbox,
                contents: withCategoryHeaders(injectExtensions(filteredContents))
            };
        }

        const hardwareToolbox = selectedBoard === 'esp32' ? esp32Toolbox : arduinoToolbox;

        return {
            ...hardwareToolbox,
            contents: withCategoryHeaders(hardwareToolbox.contents)
        };
    }, [editorMode, selectedBoard, selectedSpriteId, installedExtensions]);

    return { getCurrentToolbox };
}
