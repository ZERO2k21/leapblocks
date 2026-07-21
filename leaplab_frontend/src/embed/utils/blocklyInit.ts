import Blockly from '@blockly-runtime';
import { registerleapBlocks } from '../../blocks/leapBlocks';
import { arduinoBlocks } from '../../blocks/arduino-blocks';
import { esp32Blocks } from '../../blocks/esp32-blocks';
import { animationBlocks } from '../../blocks/animation-blocks';
import { hardwareBlocks } from '../../blocks/hardware-blocks';
import { registerCustomFields } from '../../blockly/registerCustomFields';
import { initPythonGenerator } from '../../generators/python-generator';
import { registerLeapRenderer } from '../../leapignite/server/blocks/LeapRenderer';
import { registerLeapBloxCategory } from '../../custom-toolbox';
import { spriteManager } from '../../engine/SpriteManager';
import { log } from './log';

const registerBlocks = () => {
    try {
        registerleapBlocks();
        log.app('Registered leap 3.0 blocks (100+ blocks)');
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        log.app(`Error registering leap blocks: ${errorMessage}`);
    }

    const blocksToRegister = [
        ...(Array.isArray(arduinoBlocks) ? arduinoBlocks : []),
        ...(Array.isArray(esp32Blocks) ? esp32Blocks : []),
        ...(Array.isArray(animationBlocks) ? animationBlocks : []),
        ...(Array.isArray(hardwareBlocks) ? hardwareBlocks : [])
    ];

    if (blocksToRegister.length > 0) {
        try {
            Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(blocksToRegister));
            log.app(`Registered ${blocksToRegister.length} additional blocks (Arduino/ESP32/Hardware).`);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
        }
    }
};

let _blocklyInitialized = false;
export const BLOCKLY_MEDIA_PATH = './blockly-media/';
export function resetBlocklyInitialized() { _blocklyInitialized = false; }

export function initBlocklyOnce() {
    if (_blocklyInitialized) return;
    _blocklyInitialized = true;

    registerLeapRenderer(Blockly);
    registerBlocks();
    initPythonGenerator();
    registerLeapBloxCategory();
    registerCustomFields();

    Blockly.dialog.setPrompt((message, defaultValue, callback) => {
        const result = window.prompt(message, defaultValue);
        callback(result);
    });

    Blockly.dialog.setAlert((message, callback) => {
        window.alert(message);
        if (callback) callback();
    });

    Blockly.dialog.setConfirm((message, callback) => {
        const result = window.confirm(message);
        callback(result);
    });

    if (!Blockly.Extensions.isRegistered('broadcast_dropdown_ext')) {
        Blockly.Extensions.register('broadcast_dropdown_ext', function (this: any) {
            this.setOnChange(function (this: any, event: any) {
                if (event.type === Blockly.Events.BLOCK_CHANGE && event.blockId === this.id) {
                    const fieldName = event.name;
                    if (fieldName === 'BROADCAST_INPUT' || fieldName === 'BROADCAST_OPTION') {
                        const newValue = event.newValue;
                        if (newValue === 'new') {
                            (window as any).createNewBroadcast((name: string | null) => {
                                if (name) {
                                    this.setFieldValue(name, fieldName);
                                } else {
                                    this.setFieldValue('message1', fieldName);
                                }
                            });
                        }
                    }
                }
            });
        });
    }
}

/**
 * Recursively scan workspace JSON blocks for broadcast-related field values
 * and register them with the AnimationVM.
 */
export function extractBroadcastValues(
    workspaceJson: { blocks?: { blocks?: any[] } },
    vm: { registerBroadcast: (msg: string) => void }
): void {
    const blocks = workspaceJson?.blocks?.blocks || [];
    const scanBlock = (block: any): void => {
        if (!block) return;
        if (block.fields) {
            const value = block.fields.BROADCAST_INPUT || block.fields.BROADCAST_OPTION || block.fields.MESSAGE;
            if (value && value !== 'new') {
                vm.registerBroadcast(String(value));
            }
        }
        if (block.inputs) {
            for (const key of Object.keys(block.inputs)) {
                const input = block.inputs[key];
                if (input?.block) scanBlock(input.block);
                if (input?.shadow) scanBlock(input.shadow);
            }
        }
        if (block.next?.block) scanBlock(block.next.block);
    };
    blocks.forEach(scanBlock);
}

/**
 * Validate and fix costume dropdown values in workspace JSON before loading.
 */
export function fixCostumeDropdownValues(workspaceJson: { blocks?: { blocks?: any[] } }, spriteId: string): void {
    const blocks = workspaceJson?.blocks?.blocks || [];
    const sprite = (spriteManager as any).getSprite?.(spriteId) || (spriteManager as any).sprites?.find?.((s: any) => s.id === spriteId);
    if (!sprite || !sprite.costumes || sprite.costumes.length === 0) return;

    const validCostumeNames = sprite.costumes.map((c: any) => c.name);
    const firstCostume = validCostumeNames[0];

    const scanBlock = (block: any): void => {
        if (!block) return;
        if (block.type === 'looks_switch_costume' && block.fields?.COSTUME) {
            const currentVal = typeof block.fields.COSTUME === 'string' ? block.fields.COSTUME : block.fields.COSTUME[0];
            const normalized = String(currentVal);
            const isValid = validCostumeNames.some((n: string) => n.toLowerCase() === normalized.toLowerCase());
            if (!isValid) {
                console.warn(`[fixCostumeDropdownValues] Block ${block.id}: costume "${normalized}" not found in sprite "${sprite.name}", using "${firstCostume}"`);
                block.fields.COSTUME = [firstCostume];
            }
        }
        if (block.inputs) {
            for (const key of Object.keys(block.inputs)) {
                const input = block.inputs[key];
                if (input?.block) scanBlock(input.block);
                if (input?.shadow) scanBlock(input.shadow);
            }
        }
        if (block.next?.block) scanBlock(block.next.block);
    };
    blocks.forEach(scanBlock);
}
