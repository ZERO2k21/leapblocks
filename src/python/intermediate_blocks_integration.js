/**
 * Intermediate Blocks Integration
 * This file shows how intermediate blocks can call sprite panel functions
 * without changing the Python IDE structure.
 */

// ─── Example: How to call sprite functions from intermediate blocks ─────────

// In your intermediate blocks code, you can now call:

// 1. Basic movement
// window.spritePanelFunctions.move('Robot', 50);
// window.spritePanelFunctions.moveRelative('Robot', 'RIGHT', 30);
// window.spritePanelFunctions.turn('Robot', 45);
// window.spritePanelFunctions.goTo('Robot', 100, 50);

// 2. Appearance
// window.spritePanelFunctions.say('Robot', 'Hello from blocks!', 3);
// window.spritePanelFunctions.think('Robot', 'Hmm...', 2);
// window.spritePanelFunctions.show('Robot');
// window.spritePanelFunctions.hide('Robot');
// window.spritePanelFunctions.setSize('Robot', 150);
// window.spritePanelFunctions.changeSize('Robot', 20);
// window.spritePanelFunctions.nextCostume('Robot');
// window.spritePanelFunctions.switchCostume('Robot', 'wave1');

// 3. Direction
// window.spritePanelFunctions.pointInDirection('Robot', 90);

// 4. Utility
// const pos = window.spritePanelFunctions.getPosition('Robot');
// const dir = window.spritePanelFunctions.getDirection('Robot');
// const size = window.spritePanelFunctions.getSize('Robot');
// const visible = window.spritePanelFunctions.isVisible('Robot');

// ─── Integration with Animation Compiler ────────────────────────────────────

/**
 * This function can be called from the AnimationCompiler to execute
 * sprite actions that update both the stage and terminal output.
 */
export function executeSpriteActionFromBlock(blockType, spriteName, params) {
    if (!window.spritePanelFunctions) {
        console.warn('Sprite bridge not available. Make sure Python IDE is loaded.');
        return false;
    }

    const bridge = window.spritePanelFunctions;

    try {
        switch (blockType) {
            // Movement blocks
            case 'motion_move_steps':
                bridge.move(spriteName, params.steps || 10);
                return true;
            case 'motion_turn_right':
                bridge.turn(spriteName, params.degrees || 15);
                return true;
            case 'motion_turn_left':
                bridge.turn(spriteName, -(params.degrees || 15));
                return true;
            case 'motion_go_to_xy':
                bridge.goTo(spriteName, params.x || 0, params.y || 0);
                return true;
            case 'motion_point_direction':
                bridge.pointInDirection(spriteName, params.direction || 90);
                return true;
            case 'motion_change_x':
                const pos = bridge.getPosition(spriteName);
                if (pos) bridge.goTo(spriteName, pos.x + (params.dx || 10), pos.y);
                return true;
            case 'motion_change_y':
                const pos2 = bridge.getPosition(spriteName);
                if (pos2) bridge.goTo(spriteName, pos2.x, pos2.y + (params.dy || 10));
                return true;
            case 'motion_set_x':
                const pos3 = bridge.getPosition(spriteName);
                if (pos3) bridge.goTo(spriteName, params.x || 0, pos3.y);
                return true;
            case 'motion_set_y':
                const pos4 = bridge.getPosition(spriteName);
                if (pos4) bridge.goTo(spriteName, pos4.x, params.y || 0);
                return true;

            // Looks blocks
            case 'looks_say':
                bridge.say(spriteName, params.message || 'Hello!', 0);
                return true;
            case 'looks_say_for_secs':
                bridge.say(spriteName, params.message || 'Hello!', params.secs || 2);
                return true;
            case 'looks_think':
                bridge.think(spriteName, params.message || 'Hmm...', 0);
                return true;
            case 'looks_think_for_secs':
                bridge.think(spriteName, params.message || 'Hmm...', params.secs || 2);
                return true;
            case 'looks_show':
                bridge.show(spriteName);
                return true;
            case 'looks_hide':
                bridge.hide(spriteName);
                return true;
            case 'looks_next_costume':
                bridge.nextCostume(spriteName);
                return true;
            case 'looks_switch_costume':
                bridge.switchCostume(spriteName, params.costume || 'default');
                return true;
            case 'looks_set_size':
                bridge.setSize(spriteName, params.size || 100);
                return true;
            case 'looks_change_size':
                bridge.changeSize(spriteName, params.delta || 10);
                return true;

            default:
                console.log(`[SpriteBridge] Unknown block type: ${blockType}`);
                return false;
        }
    } catch (error) {
        console.error(`[SpriteBridge] Error executing ${blockType}:`, error);
        return false;
    }
}

// ─── Helper: Get sprite name from Blockly block ─────────────────────────────

export function getSpriteNameFromBlock(block, workspace) {
    // Try to get sprite name from block field
    const spriteField = block.getField('SPRITE');
    if (spriteField) {
        return spriteField.getValue();
    }

    // Try to get from dropdown
    const spriteDropdown = block.getField('SPRITE_dropdown');
    if (spriteDropdown) {
        return spriteDropdown.getValue();
    }

    // Default to selected sprite
    return null; // Will use selected sprite in Python IDE
}

// ─── Integration with AnimationVM ───────────────────────────────────────────

/**
 * Hook into AnimationVM to execute sprite actions via the bridge
 */
export function integrateWithAnimationVM(animationVM) {
    // Store original executeStep function
    const originalExecuteStep = animationVM.executeStep;

    // Override executeStep to use sprite bridge when available
    animationVM.executeStep = function(step, spriteId) {
        // Check if sprite bridge is available
        if (window.spritePanelFunctions) {
            const spriteName = getSpriteNameById(spriteId);
            if (spriteName) {
                const executed = executeSpriteActionFromBlock(
                    step.type,
                    spriteName,
                    step.params || {}
                );
                if (executed) {
                    return; // Action handled by bridge
                }
            }
        }

        // Fall back to original implementation
        return originalExecuteStep.call(this, step, spriteId);
    };
}

// Helper to get sprite name by ID from Python IDE sprites
function getSpriteNameById(spriteId) {
    // This would need to access the sprites array from StageContext
    // For now, return the ID as name (works if names match IDs)
    return spriteId;
}

// ─── Auto-initialization ────────────────────────────────────────────────────

// This will be called when the Python IDE loads
if (typeof window !== 'undefined') {
    window.spriteBridgeReady = false;
    
    // Wait for sprite bridge to be available
    const checkBridge = setInterval(() => {
        if (window.spritePanelFunctions) {
            window.spriteBridgeReady = true;
            console.log('[SpriteBridge] Bridge ready for intermediate blocks integration');
            clearInterval(checkBridge);
        }
    }, 100);
    
    // Clear after 10 seconds to avoid infinite checking
    setTimeout(() => clearInterval(checkBridge), 10000);
}