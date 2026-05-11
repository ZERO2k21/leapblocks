/**
 * MIT App Inventor Blocks - Main Entry Point
 * Imports all block definitions
 */

// Import all block definitions
import './builtin_blocks';
import './text_list_blocks';
import './color_component_blocks';

// Export colors and utilities
export { MIT_COLORS } from './builtin_blocks';
export { createComponentBlocks } from './color_component_blocks';

/**
 * Initialize all blocks
 * This function should be called before creating the Blockly workspace
 */
export function initializeAllBlocks() {
    console.log('✅ MIT App Inventor blocks initialized');
}
