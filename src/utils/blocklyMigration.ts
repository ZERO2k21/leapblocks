/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 *
 * Blockly Backward-Compatibility Migration
 *
 * Reverts projects saved during the brief field_input era (May-Jun 2026)
 * back to the standard input_value format, restoring expression support
 * inside blocks and ensuring saved values are not lost.
 */

/**
 * Mapping of block types that were temporarily defined with `field_input` / `field_number`
 * but have been restored to `input_value` connections.
 * Each entry specifies which fields to convert and their target input/shadow types.
 */
interface FieldMigration {
    fieldName: string;
    inputName: string;
    shadowType: string;
    shadowFieldKey: string;
}

const BLOCK_FIELD_MIGRATIONS: Record<string, FieldMigration[]> = {
    // Looks blocks
    'looks_say': [
        { fieldName: 'MESSAGE', inputName: 'MESSAGE', shadowType: 'text', shadowFieldKey: 'TEXT' }
    ],
    'looks_say_for_secs': [
        { fieldName: 'MESSAGE', inputName: 'MESSAGE', shadowType: 'text', shadowFieldKey: 'TEXT' },
        { fieldName: 'SECS', inputName: 'SECS', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'looks_sayforsecs': [
        { fieldName: 'MESSAGE', inputName: 'MESSAGE', shadowType: 'text', shadowFieldKey: 'TEXT' },
        { fieldName: 'SECS', inputName: 'SECS', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'looks_think': [
        { fieldName: 'MESSAGE', inputName: 'MESSAGE', shadowType: 'text', shadowFieldKey: 'TEXT' }
    ],
    'looks_think_for_secs': [
        { fieldName: 'MESSAGE', inputName: 'MESSAGE', shadowType: 'text', shadowFieldKey: 'TEXT' },
        { fieldName: 'SECS', inputName: 'SECS', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'looks_thinkforsecs': [
        { fieldName: 'MESSAGE', inputName: 'MESSAGE', shadowType: 'text', shadowFieldKey: 'TEXT' },
        { fieldName: 'SECS', inputName: 'SECS', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    // Motion blocks
    'motion_move_steps': [
        { fieldName: 'STEPS', inputName: 'STEPS', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'motion_move_left': [
        { fieldName: 'STEPS', inputName: 'STEPS', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'motion_move_right': [
        { fieldName: 'STEPS', inputName: 'STEPS', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'motion_move_up': [
        { fieldName: 'STEPS', inputName: 'STEPS', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'motion_move_down': [
        { fieldName: 'STEPS', inputName: 'STEPS', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'motion_turn_right': [
        { fieldName: 'DEGREES', inputName: 'DEGREES', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'motion_turn_left': [
        { fieldName: 'DEGREES', inputName: 'DEGREES', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'motion_go_to_xy': [
        { fieldName: 'X', inputName: 'X', shadowType: 'math_number', shadowFieldKey: 'NUM' },
        { fieldName: 'Y', inputName: 'Y', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'motion_glide_to_xy': [
        { fieldName: 'SECS', inputName: 'SECS', shadowType: 'math_number', shadowFieldKey: 'NUM' },
        { fieldName: 'X', inputName: 'X', shadowType: 'math_number', shadowFieldKey: 'NUM' },
        { fieldName: 'Y', inputName: 'Y', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'motion_point_direction': [
        { fieldName: 'DIRECTION', inputName: 'DIRECTION', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'motion_change_x': [
        { fieldName: 'DX', inputName: 'DX', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'motion_change_y': [
        { fieldName: 'DY', inputName: 'DY', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'motion_set_x': [
        { fieldName: 'X', inputName: 'X', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'motion_set_y': [
        { fieldName: 'Y', inputName: 'Y', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    // Control blocks
    'control_wait': [
        { fieldName: 'SECS', inputName: 'SECS', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    'control_repeat': [
        { fieldName: 'TIMES', inputName: 'TIMES', shadowType: 'math_number', shadowFieldKey: 'NUM' }
    ],
    // Sensing blocks
    'sensing_ask': [
        { fieldName: 'QUESTION', inputName: 'QUESTION', shadowType: 'text', shadowFieldKey: 'TEXT' }
    ],
};

/**
 * Special case: control_wait in leapBlocks.ts uses field_number named DURATION
 * instead of input_value SECS. When we encounter a saved block with fields.SECS,
 * and the active definition expects DURATION, we need to rename the field.
 * This mapping handles block types where the field name changed.
 */
const FIELD_RENAME_MAP: Record<string, Record<string, string>> = {
    'control_wait': { 'SECS': 'DURATION' }
};

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

    // Check if this block type needs field → input migration
    const migrations = BLOCK_FIELD_MIGRATIONS[block.type];
    if (!migrations || !block.fields) return;

    const inputs: Record<string, any> = { ...(block.inputs || {}) };
    let migrated = false;

    for (const migration of migrations) {
        if (block.fields[migration.fieldName] !== undefined && !inputs[migration.inputName]) {
            inputs[migration.inputName] = {
                shadow: {
                    type: migration.shadowType,
                    fields: { [migration.shadowFieldKey]: block.fields[migration.fieldName] }
                }
            };
            migrated = true;
        }
    }

    if (migrated) {
        block.inputs = inputs;
        // Remove the migrated fields
        const remainingFields = { ...block.fields };
        for (const migration of migrations) {
            delete remainingFields[migration.fieldName];
        }
        if (Object.keys(remainingFields).length > 0) {
            block.fields = remainingFields;
        } else {
            delete block.fields;
        }
    }

    // Handle field renames for blocks where the active definition uses different field names
    const renames = FIELD_RENAME_MAP[block.type];
    if (renames && block.fields) {
        for (const [oldName, newName] of Object.entries(renames)) {
            if (block.fields[oldName] !== undefined && block.fields[newName] === undefined) {
                block.fields[newName] = block.fields[oldName];
                delete block.fields[oldName];
            }
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
