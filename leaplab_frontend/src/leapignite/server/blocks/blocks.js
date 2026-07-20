/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { registerFieldDirectionPicker } from './common';
import { defineMotionBlocks } from './motionBlocks';
import { defineControlBlocks } from './controlBlocks';
import { defineEventBlocks } from './eventBlocks';
import { definePenBlocks } from './penBlocks';

export default function defineLeapBlocks(Blockly, javascriptGenerator) {
    if (!Blockly || !javascriptGenerator) return;

    registerFieldDirectionPicker(Blockly);
    defineMotionBlocks(Blockly, javascriptGenerator);
    defineControlBlocks(Blockly, javascriptGenerator);
    defineEventBlocks(Blockly, javascriptGenerator);
    definePenBlocks(Blockly, javascriptGenerator);
}

