/**
 * Leap App Inventor Blocks - Main Entry Point
 * Imports all block definitions
 */

// Import all block definitions
import './builtin_blocks';
import './text';
import './lists';
import './color_component_blocks';
import './dictionary_blocks';
import './matrices';
import './variables';
import './procedures';

// Export colors and utilities
export { MIT_COLORS } from './builtin_blocks';
export { createComponentBlocks } from './color_component_blocks';

/**
 * Initialize all blocks
 * This function should be called before creating the Blockly workspace
 */
export function initializeAllBlocks() {
    console.log('✅ Leap App Inventor blocks initialized');
}

