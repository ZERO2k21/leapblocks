import { registerFieldDirectionPicker } from './common';
import { defineMotionBlocks } from './motionBlocks';
import { defineControlBlocks } from './controlBlocks';
import { defineEventBlocks } from './eventBlocks';
import { definePenBlocks } from './penBlocks';

export default function defineLeapBlocks(Blockly: any, javascriptGenerator: any): void {
    if (!Blockly || !javascriptGenerator) return;

    registerFieldDirectionPicker(Blockly);
    defineMotionBlocks(Blockly, javascriptGenerator);
    defineControlBlocks(Blockly, javascriptGenerator);
    defineEventBlocks(Blockly, javascriptGenerator);
    definePenBlocks(Blockly, javascriptGenerator);
}
