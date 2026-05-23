/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 * 
 * ANIMATION-ONLY BLOCK DEFINITIONS
 * 
 * This file contains block definitions specifically for Stage/Animation mode in Embed.
 * These blocks use input_value connections (not field_input) to support shadow blocks
 * in the toolbox.
 * 
 * DO NOT import leapBlocks.ts when using these blocks, as they have conflicting
 * definitions for looks_say, looks_think, etc.
 */

import Blockly from '@blockly-runtime';

/**
 * Register ONLY the animation-specific looks blocks that conflict with leapBlocks.
 * These must be registered BEFORE leapBlocks to take precedence.
 */
export const registerAnimationLooksBlocks = () => {
    // Only register if not already defined
    if (Blockly.Blocks['looks_say']) {
        return; // Already registered
    }

    // Define looks_say with input_value (for animation mode)
    Blockly.Blocks['looks_say'] = {
        init: function (this: Blockly.Block) {
            this.appendValueInput('MESSAGE')
                .appendField('🗣️ say');
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour('#9966FF');
            this.setTooltip('Say message');
            this.setHelpUrl('');
        }
    };

    // Define looks_say_for_secs with input_value
    Blockly.Blocks['looks_say_for_secs'] = {
        init: function (this: Blockly.Block) {
            this.appendValueInput('MESSAGE')
                .appendField('🗣️ say');
            this.appendValueInput('SECS')
                .appendField('for');
            this.appendDummyInput()
                .appendField('seconds');
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour('#9966FF');
            this.setTooltip('Say message for seconds');
            this.setHelpUrl('');
        }
    };

    // Define looks_think with input_value
    Blockly.Blocks['looks_think'] = {
        init: function (this: Blockly.Block) {
            this.appendValueInput('MESSAGE')
                .appendField('💭 think');
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour('#9966FF');
            this.setTooltip('Show thought bubble');
            this.setHelpUrl('');
        }
    };

    // Define looks_think_for_secs with input_value
    Blockly.Blocks['looks_think_for_secs'] = {
        init: function (this: Blockly.Block) {
            this.appendValueInput('MESSAGE')
                .appendField('💭 think');
            this.appendValueInput('SECS')
                .appendField('for');
            this.appendDummyInput()
                .appendField('seconds');
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour('#9966FF');
            this.setTooltip('Show thought bubble for seconds');
            this.setHelpUrl('');
        }
    };
};
