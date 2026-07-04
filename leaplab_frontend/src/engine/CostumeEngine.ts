/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
import { Sprite } from '../stage/Sprite';

class CostumeEngine {
    setCostume(sprite: Sprite, nameOrIndex: string | number) {
        // Validate costume exists before switching to prevent silent failures
        if (typeof nameOrIndex === 'string') {
            const costumeNames = sprite.costumes.map((c: any) => c.name);
            const found = costumeNames.some((n: string) => n.toLowerCase() === nameOrIndex.toLowerCase());
            if (!found) {
                console.warn(`[CostumeEngine] Costume "${nameOrIndex}" not found on sprite "${sprite.name}", falling back to first costume`);
                if (sprite.costumes.length > 0) {
                    sprite.switchCostume(sprite.costumes[0].name);
                }
                return;
            }
        }
        sprite.switchCostume(nameOrIndex);
    }

    nextCostume(sprite: Sprite) {
        sprite.nextCostume();
    }

    setSize(sprite: Sprite, percent: number) {
        sprite.setSize(percent);
    }

    changeSize(sprite: Sprite, delta: number) {
        sprite.changeSize(delta);
    }

    setEffect(sprite: Sprite, effect: 'color' | 'brightness' | 'ghost' | 'fisheye' | 'whirl' | 'pixelate' | 'mosaic', value: number) {
        sprite.setEffect(effect, value);
    }

    changeEffect(sprite: Sprite, effect: 'color' | 'brightness' | 'ghost' | 'fisheye' | 'whirl' | 'pixelate' | 'mosaic', change: number) {
        const currentValue = sprite.effects?.[effect] ?? 0;
        sprite.setEffect(effect, currentValue + change);
    }

    clearEffects(sprite: Sprite) {
        sprite.clearEffects();
    }

    show(sprite: Sprite) {
        sprite.show();
    }

    hide(sprite: Sprite) {
        sprite.hide();
    }

    toggleMirror(sprite: Sprite) {
        sprite.toggleMirror();
    }
}

let _costumeEngine: CostumeEngine | null = null;
export function getCostumeEngine(): CostumeEngine {
    if (!_costumeEngine) _costumeEngine = new CostumeEngine();
    return _costumeEngine;
}
export const costumeEngine: CostumeEngine = new Proxy({} as CostumeEngine, {
    get(_target, prop) {
        const instance = getCostumeEngine();
        const value = (instance as any)[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
    set(_target, prop, value) { (getCostumeEngine() as any)[prop] = value; return true; }
});
export default costumeEngine;
