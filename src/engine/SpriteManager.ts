import { Sprite } from '../stage/Sprite';

class SpriteManager {
    private sprites: Map<string, Sprite> = new Map();
    private selectedSpriteId: string | null = null;
    private onUpdate: () => void;

    constructor(onUpdate: () => void = () => { }) {
        this.onUpdate = onUpdate;
    }

    setUpdateCallback(callback: () => void) {
        this.onUpdate = callback;
    }

    addSprite(sprite: Sprite) {
        this.sprites.set(sprite.id, sprite);
        if (!this.selectedSpriteId) {
            this.selectedSpriteId = sprite.id;
        }
        this.onUpdate();
    }

    removeSprite(id: string) {
        this.sprites.delete(id);
        if (this.selectedSpriteId === id) {
            const keys = Array.from(this.sprites.keys());
            this.selectedSpriteId = keys.length > 0 ? keys[0] : null;
        }
        this.onUpdate();
    }

    selectSprite(id: string) {
        if (this.sprites.has(id)) {
            this.selectedSpriteId = id;
            this.onUpdate();
        }
    }

    getSprite(id: string): Sprite | undefined {
        return this.sprites.get(id);
    }

    getSelectedSprite(): Sprite | null {
        if (!this.selectedSpriteId) return null;
        return this.sprites.get(this.selectedSpriteId) || null;
    }

    getAllSprites(): Sprite[] {
        return Array.from(this.sprites.values());
    }

    clear() {
        this.sprites.clear();
        this.selectedSpriteId = null;
        this.onUpdate();
    }
}

export const spriteManager = new SpriteManager();
export default spriteManager;
