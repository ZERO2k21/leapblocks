/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
/**
 * SpriteBridge - Bridges intermediate blocks sprite functions with Python IDE
 * This allows intermediate blocks to call sprite panel functions effectively
 * without changing the Python IDE structure.
 */

import { useStage } from '../leapembed/client/context/stageContext';

// ─── Sprite Action Logger ───────────────────────────────────────────────────
// Logs sprite actions to terminal for visibility
export class SpriteActionLogger {
    constructor(addLog) {
        this.addLog = addLog;
    }

    logSpriteAction(spriteName, action, params = {}) {
        const paramStr = Object.entries(params)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
        const message = `🤖 ${spriteName}: ${action}${paramStr ? ` (${paramStr})` : ''}`;
        this.addLog(message, 'info');
    }

    logSpriteError(spriteName, action, error) {
        this.addLog(`❌ ${spriteName} ${action} failed: ${error}`, 'error');
    }
}

// ─── Sprite Panel Functions (Intermediate Blocks Compatible) ────────────────
// These functions can be called from intermediate blocks and update the Python IDE sprites

export class SpritePanelFunctions {
    constructor(sprites, setSprites, selectedSpriteId, logger) {
        this.sprites = sprites;
        this.setSprites = setSprites;
        this.selectedSpriteId = selectedSpriteId;
        this.logger = logger;
    }

    // Get sprite by name or ID
    getSprite(nameOrId) {
        return this.sprites.find(s =>
            s.id === nameOrId ||
            s.name.toLowerCase() === String(nameOrId).toLowerCase()
        );
    }

    // Get selected sprite
    getSelectedSprite() {
        return this.sprites.find(s => s.id === this.selectedSpriteId);
    }

    // ─── Movement Functions ─────────────────────────────────────────────────

    moveSprite(spriteName, steps) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) {
            this.logger.logSpriteError(spriteName, 'move', 'Sprite not found');
            return;
        }

        const angle = sprite.direction ?? sprite.angle ?? 0;
        const rad = (angle * Math.PI) / 180;
        const pos = sprite.position || { x: sprite.x || 0, y: sprite.y || 0 };
        const newX = pos.x + Math.cos(rad) * steps;
        const newY = pos.y + Math.sin(rad) * steps;

        this.setSprites(prev => prev.map(s => {
            if (s.id !== sprite.id) return s;
            return {
                ...s,
                x: newX,
                y: newY,
                position: { x: newX, y: newY }
            };
        }));

        this.logger.logSpriteAction(sprite.name, 'move', { steps, direction: angle });
    }

    moveSpriteRelative(spriteName, direction, steps) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) {
            this.logger.logSpriteError(spriteName, 'moveRelative', 'Sprite not found');
            return;
        }

        let dx = 0, dy = 0;
        if (direction === "RIGHT") dx = steps;
        if (direction === "LEFT") dx = -steps;
        if (direction === "UP") dy = steps;
        if (direction === "DOWN") dy = -steps;

        const pos = sprite.position || { x: sprite.x || 0, y: sprite.y || 0 };
        const newX = pos.x + dx;
        const newY = pos.y + dy;

        this.setSprites(prev => prev.map(s => {
            if (s.id !== sprite.id) return s;
            return {
                ...s,
                x: newX,
                y: newY,
                position: { x: newX, y: newY }
            };
        }));

        this.logger.logSpriteAction(sprite.name, 'moveRelative', { direction, steps });
    }

    turnSprite(spriteName, degrees) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) {
            this.logger.logSpriteError(spriteName, 'turn', 'Sprite not found');
            return;
        }

        const currentAngle = sprite.direction ?? sprite.angle ?? 0;
        const newAngle = (currentAngle + degrees) % 360;

        this.setSprites(prev => prev.map(s => {
            if (s.id !== sprite.id) return s;
            return {
                ...s,
                direction: newAngle,
                angle: newAngle
            };
        }));

        this.logger.logSpriteAction(sprite.name, 'turn', { degrees, newDirection: newAngle });
    }

    goToSprite(spriteName, x, y) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) {
            this.logger.logSpriteError(spriteName, 'goTo', 'Sprite not found');
            return;
        }

        this.setSprites(prev => prev.map(s => {
            if (s.id !== sprite.id) return s;
            return {
                ...s,
                x: x,
                y: y,
                position: { x: x, y: y }
            };
        }));

        this.logger.logSpriteAction(sprite.name, 'goTo', { x, y });
    }

    // ─── Appearance Functions ───────────────────────────────────────────────

    spriteSay(spriteName, message, duration = 2) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) {
            this.logger.logSpriteError(spriteName, 'say', 'Sprite not found');
            return;
        }

        this.setSprites(prev => prev.map(s => {
            if (s.id !== sprite.id) return s;
            return {
                ...s,
                speech: message
            };
        }));

        this.logger.logSpriteAction(sprite.name, 'say', { message, duration });

        // Clear speech after duration
        if (duration > 0) {
            setTimeout(() => {
                this.setSprites(prev => prev.map(s => {
                    if (s.id !== sprite.id) return s;
                    return {
                        ...s,
                        speech: ''
                    };
                }));
            }, duration * 1000);
        }
    }

    spriteThink(spriteName, message, duration = 2) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) {
            this.logger.logSpriteError(spriteName, 'think', 'Sprite not found');
            return;
        }

        this.setSprites(prev => prev.map(s => {
            if (s.id !== sprite.id) return s;
            return {
                ...s,
                speech: '💭 ' + message
            };
        }));

        this.logger.logSpriteAction(sprite.name, 'think', { message, duration });

        // Clear speech after duration
        if (duration > 0) {
            setTimeout(() => {
                this.setSprites(prev => prev.map(s => {
                    if (s.id !== sprite.id) return s;
                    return {
                        ...s,
                        speech: ''
                    };
                }));
            }, duration * 1000);
        }
    }

    showSprite(spriteName) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) {
            this.logger.logSpriteError(spriteName, 'show', 'Sprite not found');
            return;
        }

        this.setSprites(prev => prev.map(s => {
            if (s.id !== sprite.id) return s;
            return {
                ...s,
                visible: true
            };
        }));

        this.logger.logSpriteAction(sprite.name, 'show');
    }

    hideSprite(spriteName) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) {
            this.logger.logSpriteError(spriteName, 'hide', 'Sprite not found');
            return;
        }

        this.setSprites(prev => prev.map(s => {
            if (s.id !== sprite.id) return s;
            return {
                ...s,
                visible: false
            };
        }));

        this.logger.logSpriteAction(sprite.name, 'hide');
    }

    setSpriteSize(spriteName, size) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) {
            this.logger.logSpriteError(spriteName, 'setSize', 'Sprite not found');
            return;
        }

        this.setSprites(prev => prev.map(s => {
            if (s.id !== sprite.id) return s;
            return {
                ...s,
                size: Math.max(1, Math.min(500, size))
            };
        }));

        this.logger.logSpriteAction(sprite.name, 'setSize', { size });
    }

    changeSpriteSize(spriteName, delta) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) {
            this.logger.logSpriteError(spriteName, 'changeSize', 'Sprite not found');
            return;
        }

        const newSize = Math.max(1, Math.min(500, (sprite.size || 100) + delta));

        this.setSprites(prev => prev.map(s => {
            if (s.id !== sprite.id) return s;
            return {
                ...s,
                size: newSize
            };
        }));

        this.logger.logSpriteAction(sprite.name, 'changeSize', { delta, newSize });
    }

    nextCostume(spriteName) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) {
            this.logger.logSpriteError(spriteName, 'nextCostume', 'Sprite not found');
            return;
        }

        const costumeKeys = Object.keys(sprite.costumes || {});
        if (costumeKeys.length === 0) {
            this.logger.logSpriteError(sprite.name, 'nextCostume', 'No costumes available');
            return;
        }

        const currentIdx = costumeKeys.indexOf(sprite.currentCostume);
        const nextIdx = (currentIdx + 1) % costumeKeys.length;
        const nextCostume = costumeKeys[nextIdx] || 'default';

        this.setSprites(prev => prev.map(s => {
            if (s.id !== sprite.id) return s;
            return {
                ...s,
                currentCostume: nextCostume
            };
        }));

        this.logger.logSpriteAction(sprite.name, 'nextCostume', { newCostume: nextCostume });
    }

    switchCostume(spriteName, costumeName) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) {
            this.logger.logSpriteError(spriteName, 'switchCostume', 'Sprite not found');
            return;
        }

        if (!sprite.costumes || !sprite.costumes[costumeName]) {
            this.logger.logSpriteError(sprite.name, 'switchCostume', `Costume '${costumeName}' not found`);
            return;
        }

        this.setSprites(prev => prev.map(s => {
            if (s.id !== sprite.id) return s;
            return {
                ...s,
                currentCostume: costumeName
            };
        }));

        this.logger.logSpriteAction(sprite.name, 'switchCostume', { costume: costumeName });
    }

    // ─── Direction Functions ────────────────────────────────────────────────

    pointSpriteInDirection(spriteName, angle) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) {
            this.logger.logSpriteError(spriteName, 'pointInDirection', 'Sprite not found');
            return;
        }

        const normalizedAngle = angle % 360;
        const finalAngle = normalizedAngle < 0 ? normalizedAngle + 360 : normalizedAngle;

        this.setSprites(prev => prev.map(s => {
            if (s.id !== sprite.id) return s;
            return {
                ...s,
                direction: finalAngle,
                angle: finalAngle
            };
        }));

        this.logger.logSpriteAction(sprite.name, 'pointInDirection', { angle: finalAngle });
    }

    // ─── Utility Functions ──────────────────────────────────────────────────

    getSpritePosition(spriteName) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) return null;
        return sprite.position || { x: sprite.x || 0, y: sprite.y || 0 };
    }

    getSpriteDirection(spriteName) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) return null;
        return sprite.direction ?? sprite.angle ?? 0;
    }

    getSpriteSize(spriteName) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) return null;
        return sprite.size || 100;
    }

    isSpriteVisible(spriteName) {
        const sprite = this.getSprite(spriteName);
        if (!sprite) return false;
        return sprite.visible !== false;
    }
}

// ─── Intermediate Blocks Integration ────────────────────────────────────────
// This function creates a bridge between intermediate blocks and Python IDE

export function createIntermediateBlocksBridge(sprites, setSprites, selectedSpriteId, addLog) {
    const logger = new SpriteActionLogger(addLog);
    const panelFunctions = new SpritePanelFunctions(sprites, setSprites, selectedSpriteId, logger);

    return {
        // Movement functions
        move: (spriteName, steps) => panelFunctions.moveSprite(spriteName, steps),
        moveRelative: (spriteName, direction, steps) => panelFunctions.moveSpriteRelative(spriteName, direction, steps),
        turn: (spriteName, degrees) => panelFunctions.turnSprite(spriteName, degrees),
        goTo: (spriteName, x, y) => panelFunctions.goToSprite(spriteName, x, y),

        // Appearance functions
        say: (spriteName, message, duration) => panelFunctions.spriteSay(spriteName, message, duration),
        think: (spriteName, message, duration) => panelFunctions.spriteThink(spriteName, message, duration),
        show: (spriteName) => panelFunctions.showSprite(spriteName),
        hide: (spriteName) => panelFunctions.hideSprite(spriteName),
        setSize: (spriteName, size) => panelFunctions.setSpriteSize(spriteName, size),
        changeSize: (spriteName, delta) => panelFunctions.changeSpriteSize(spriteName, delta),
        nextCostume: (spriteName) => panelFunctions.nextCostume(spriteName),
        switchCostume: (spriteName, costumeName) => panelFunctions.switchCostume(spriteName, costumeName),

        // Direction functions
        pointInDirection: (spriteName, angle) => panelFunctions.pointSpriteInDirection(spriteName, angle),

        // Utility functions
        getPosition: (spriteName) => panelFunctions.getSpritePosition(spriteName),
        getDirection: (spriteName) => panelFunctions.getSpriteDirection(spriteName),
        getSize: (spriteName) => panelFunctions.getSpriteSize(spriteName),
        isVisible: (spriteName) => panelFunctions.isSpriteVisible(spriteName),

        // Logger for external access
        logger: logger
    };
}

// ─── React Hook for Sprite Bridge ───────────────────────────────────────────
// This hook provides easy access to the sprite bridge in React components

export function useSpriteBridge() {
    const {
        sprites,
        setSprites,
        selectedSpriteId,
        setSelectedSpriteId,
        selectedSprite,
        addSprite,
        deleteSprite,
        updateSprite,
        updateSpriteProperty,
        resetStage
    } = useStage();

    // Create a simple addLog function for the bridge
    const addLog = (message, type = 'info') => {
        console.log(`[SpriteBridge] ${message}`);
        // You can extend this to also update terminal output if needed
    };

    const bridge = createIntermediateBlocksBridge(sprites, setSprites, selectedSpriteId, addLog);

    return {
        ...bridge,
        sprites,
        selectedSpriteId,
        setSelectedSpriteId,
        selectedSprite,
        addSprite,
        deleteSprite,
        updateSprite,
        updateSpriteProperty,
        resetStage
    };
}

// ─── Default Sprite Presets ─────────────────────────────────────────────────
// These presets can be used by intermediate blocks to quickly add default sprites
let _DEFAULT_SPRITE_PRESETS = null;
export const getDefaultSpritePresets = () => {
    if (!_DEFAULT_SPRITE_PRESETS) {
        _DEFAULT_SPRITE_PRESETS = {
            robot: {
                name: 'Robot',
                type: 'robot',
                costumes: {
                    default: "assets/sprites/robot/robot_idle.svg",
                    wave1: "assets/sprites/robot/robot_wave1.svg",
                    wave2: "assets/sprites/robot/robot_wave2.svg",
                    talk: "assets/sprites/robot/robot_talk1.svg"
                }
            },
            cat: {
                name: 'Cat',
                type: 'cat',
                costumes: {
                    default: "assets/sprites/cat/cat_idle.svg",
                    walk1: "assets/sprites/cat/cat_walk1.svg",
                    walk2: "assets/sprites/cat/cat_walk2.svg"
                }
            },
            ball: {
                name: 'Ball',
                type: 'ball',
                costumes: {
                    default: "assets/sprites/ball/ball.svg"
                }
            }
        };
    }
    return _DEFAULT_SPRITE_PRESETS;
};

// ─── Helper function to add default sprite ──────────────────────────────────
export function addDefaultSprite(spriteType, addSprite) {
    const preset = getDefaultSpritePresets()[spriteType];
    if (!preset) {
        console.error(`Unknown sprite type: ${spriteType}`);
        return null;
    }

    return addSprite({
        name: preset.name,
        type: preset.type,
        costumes: preset.costumes,
        position: { x: 0, y: 0 },
        direction: 0,
        size: 100,
        visible: true
    });
}
