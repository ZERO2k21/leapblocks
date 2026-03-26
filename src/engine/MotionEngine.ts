import { Sprite } from '../stage/Sprite';
import { spriteManager } from './SpriteManager';

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
            return sprite.x <= -230 || sprite.x >= 230 || sprite.y <= -170 || sprite.y >= 170;
        }
        const targetSprite = spriteManager.getSpriteByName(target) || spriteManager.getSprite(target);
        if (!targetSprite) return false;

        // Simple AABB collision
        const dx = Math.abs(sprite.x - targetSprite.x);
        const dy = Math.abs(sprite.y - targetSprite.y);
        const combinedWidth = (sprite.size / 100 * 40 + targetSprite.size / 100 * 40) / 2;
        const combinedHeight = (sprite.size / 100 * 40 + targetSprite.size / 100 * 40) / 2;
        return dx <= combinedWidth && dy <= combinedHeight;
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
