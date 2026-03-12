import { Sprite } from '../stage/Sprite';

class CostumeEngine {
    setCostume(sprite: Sprite, nameOrIndex: string | number) {
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
}

export const costumeEngine = new CostumeEngine();
export default costumeEngine;
