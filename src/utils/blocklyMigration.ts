/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * Blockly Backward-Compatibility Migration
 *
 * Reverts projects saved during the brief field_input era (May-Jun 2026)
 * back to the standard input_value format, restoring expression support
 * inside say/think blocks.
 */

/**
 * Blocks that were temporarily defined with `field_input` / `field_number`
 * but have been restored to `input_value` connections.
 */
const FIELD_TO_INPUT_BLOCKS: string[] = [
    'looks_say',
    'looks_say_for_secs',
    'looks_sayforsecs',
    'looks_think',
    'looks_think_for_secs',
    'looks_thinkforsecs',
];

function migrateBlock(block: any): void {
    if (!block || typeof block !== 'object') return;

    // Depth-first recursion so children are migrated before parents
    if (block.next?.block) migrateBlock(block.next.block);
    if (block.next?.shadow) migrateBlock(block.next.shadow);

    if (block.inputs) {
        for (const key of Object.keys(block.inputs)) {
            const input = block.inputs[key];
            if (input?.block) migrateBlock(input.block);
            if (input?.shadow) migrateBlock(input.shadow);
        }
    }

    // Only migrate blocks that were in the field_input era
    if (!FIELD_TO_INPUT_BLOCKS.includes(block.type)) return;
    if (!block.fields) return;

    const inputs: Record<string, any> = { ...(block.inputs || {}) };
    let migrated = false;

    // Convert field MESSAGE -> input MESSAGE (text shadow)
    if (block.fields.MESSAGE !== undefined && !inputs.MESSAGE) {
        inputs.MESSAGE = {
            shadow: {
                type: 'text',
                fields: { TEXT: block.fields.MESSAGE }
            }
        };
        migrated = true;
    }

    // Convert field SECS -> input SECS (math_number shadow)
    if (block.fields.SECS !== undefined && !inputs.SECS) {
        inputs.SECS = {
            shadow: {
                type: 'math_number',
                fields: { NUM: block.fields.SECS }
            }
        };
        migrated = true;
    }

    if (migrated) {
        block.inputs = inputs;
        // Remove the legacy fields since inputs now own the values
        const remainingFields = { ...block.fields };
        delete remainingFields.MESSAGE;
        delete remainingFields.SECS;
        if (Object.keys(remainingFields).length > 0) {
            block.fields = remainingFields;
        } else {
            delete block.fields;
        }
    }
}

/**
 * Migrate a full workspace JSON object.
 * Returns a deep-cloned, migrated copy (original is untouched).
 */
export function migrateWorkspaceBlocks(workspaceJson: any): any {
    if (!workspaceJson) return workspaceJson;

    const result = JSON.parse(JSON.stringify(workspaceJson));

    if (result.blocks?.blocks && Array.isArray(result.blocks.blocks)) {
        for (const block of result.blocks.blocks) {
            migrateBlock(block);
        }
    }

    return result;
}

/**
 * Migrate a single block JSON object (for copy-paste operations).
 * Returns a deep-cloned, migrated copy (original is untouched).
 */
export function migrateSingleBlock(blockJson: any): any {
    if (!blockJson) return blockJson;
    const result = JSON.parse(JSON.stringify(blockJson));
    migrateBlock(result);
    return result;
}
