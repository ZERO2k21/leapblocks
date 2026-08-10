/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { Sprite } from '../stage/Sprite';
import { spriteManager } from './SpriteManager';

import { STAGE_CONFIG } from './StageConfig';

class MotionEngine {
    move(sprite: Sprite, steps: number) {
        const radians = (sprite.direction - 90) * Math.PI / 180;
        sprite.setX(sprite.x + Math.cos(radians) * steps);
        sprite.setY(sprite.y - Math.sin(radians) * steps);
    }

    turnRight(sprite: Sprite, degrees: number) {
        sprite.pointInDirection(sprite.direction + degrees);
    }

    turnLeft(sprite: Sprite, degrees: number) {
        this.turnRight(sprite, -degrees);
    }

    goTo(sprite: Sprite, x: number, y: number) {
        sprite.setX(x);
        sprite.setY(y);
    }

    /**
     * Instantly move a sprite to a target (mouse, random, or another sprite)
     * with strict boundary clamping.
     */
    goToTarget(
        target: string | 'random' | 'mouse',
        sprite: Sprite,
        stage: { width: number; height: number; mouseX: number; mouseY: number }
    ) {
        let tx = sprite.x;
        let ty = sprite.y;

        if (target === 'mouse' || target === '_mouse_') {
            tx = stage.mouseX;
            ty = stage.mouseY;
        } else if (target === 'random' || target === '_random_') {
            tx = (Math.random() - 0.5) * stage.width;
            ty = (Math.random() - 0.5) * stage.height;
        } else {
            const targetSprite = spriteManager.getSprite(target);
            if (targetSprite) {
                tx = targetSprite.x;
                ty = targetSprite.y;
            } else {
                console.warn(`[MotionEngine] Target sprite '${target}' not found`);
                return;
            }
        }

        // Apply strict clamping: sprite stays entirely within stage boundaries
        const costume = sprite.currentCostume;
        const scale = sprite.size / 100;
        const sw = (costume?.width || 40) * scale;
        const sh = (costume?.height || 40) * scale;

        const halfW = stage.width / 2;
        const halfH = stage.height / 2;

        const minX = -halfW + sw / 2;
        const maxX = halfW - sw / 2;
        const minY = -halfH + sh / 2;
        const maxY = halfH - sh / 2;

        tx = Math.max(minX, Math.min(maxX, tx));
        ty = Math.max(minY, Math.min(maxY, ty));

        sprite.setX(tx);
        sprite.setY(ty);
    }

    pointInDirection(sprite: Sprite, direction: number) {
        sprite.pointInDirection(direction);
    }

    glide(sprite: Sprite, x: number, y: number, durationSecs: number) {
        sprite.startGlide(x, y, durationSecs);
    }

    ifOnEdgeBounce(sprite: Sprite) {
        sprite.ifOnEdgeBounce();
    }

    setRotationStyle(sprite: Sprite, style: 'left-right' | 'all around' | 'none') {
        sprite.setRotationStyle(style);
    }

    isTouching(sprite: Sprite, target: string): boolean {
        if (target === '_mouse_') {
            return sprite.isPointInSprite((window as any).mouseX || 0, (window as any).mouseY || 0);
        }
        if (target === '_edge_') {
            const margin = 10;
            return sprite.x <= STAGE_CONFIG.MIN_X + margin || 
                   sprite.x >= STAGE_CONFIG.MAX_X - margin || 
                   sprite.y <= STAGE_CONFIG.MIN_Y + margin || 
                   sprite.y >= STAGE_CONFIG.MAX_Y - margin;
        }
        const targetSprite = spriteManager.getSpriteByName(target) || spriteManager.getSprite(target);
        if (!targetSprite) return false;

        // AABB collision using actual costume dimensions
        const dx = Math.abs(sprite.x - targetSprite.x);
        const dy = Math.abs(sprite.y - targetSprite.y);

        const spriteScale = sprite.size / 100;
        const targetScale = targetSprite.size / 100;
        const spriteWidth = (sprite.currentCostume?.width || 40) * spriteScale;
        const spriteHeight = (sprite.currentCostume?.height || 40) * spriteScale;
        const targetWidth = (targetSprite.currentCostume?.width || 40) * targetScale;
        const targetHeight = (targetSprite.currentCostume?.height || 40) * targetScale;

        return dx <= (spriteWidth + targetWidth) / 2 && dy <= (spriteHeight + targetHeight) / 2;
    }

    distanceTo(sprite: Sprite, target: string): number {
        let tx = 0, ty = 0;
        if (target === '_mouse_') {
            tx = (window as any).mouseX || 0;
            ty = (window as any).mouseY || 0;
        } else {
            const targetSprite = spriteManager.getSpriteByName(target) || spriteManager.getSprite(target);
            if (!targetSprite) return 10000;
            tx = targetSprite.x;
            ty = targetSprite.y;
        }
        const dx = sprite.x - tx;
        const dy = sprite.y - ty;
        return Math.sqrt(dx * dx + dy * dy);
    }

    pointTowards(sprite: Sprite, target: string) {
        let tx = 0, ty = 0;
        if (target === '_mouse_') {
            tx = (window as any).mouseX || 0;
            ty = (window as any).mouseY || 0;
        } else {
            const targetSprite = spriteManager.getSpriteByName(target) || spriteManager.getSprite(target);
            if (!targetSprite) return;
            tx = targetSprite.x;
            ty = targetSprite.y;
        }
        const dx = tx - sprite.x;
        const dy = ty - sprite.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        sprite.pointInDirection(angle);
    }
}
let _motionEngine: MotionEngine | null = null;
export function getMotionEngine(): MotionEngine {
    if (!_motionEngine) _motionEngine = new MotionEngine();
    return _motionEngine;
}
export const motionEngine: MotionEngine = new Proxy({} as MotionEngine, {
    get(_target, prop) {
        const instance = getMotionEngine();
        const value = (instance as any)[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
    set(_target, prop, value) { (getMotionEngine() as any)[prop] = value; return true; }
});
export default motionEngine;
