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

    setEffect(sprite: Sprite, effect: 'color' | 'brightness' | 'ghost', value: number) {
        sprite.setEffect(effect, value);
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
