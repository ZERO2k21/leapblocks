/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
// StageManager.ts

export interface BackdropState {
    name: string;
    src: string;
    image?: HTMLImageElement;
}

export class StageManager {
    private backdrops: BackdropState[] = [];
    private currentBackdropIndex: number = -1;
    private sounds: { name: string; src: string }[] = [];
    private onUpdate: () => void;

    constructor(onUpdate: () => void) {
        this.onUpdate = onUpdate;
        this.initDefaultBackdrop();
    }

    private initDefaultBackdrop(): void {
        // Keep default stage transparent until user chooses a backdrop.
        this.addBackdrop('Default', '');
    }

    // Reset stage manager to initial state (for new projects)
    reset(): void {
        this.clearBackdrops();
        this.clearSounds();
        this.initDefaultBackdrop();
    }

    clearBackdrops(): void {
        this.backdrops = [];
        this.currentBackdropIndex = -1;
        this.onUpdate();
    }

    async addBackdrop(name: string, src: string): Promise<void> {
        return new Promise((resolve) => {
            if (!src) {
                this.backdrops.push({ name, src });
                if (this.currentBackdropIndex === -1) this.currentBackdropIndex = 0;
                this.onUpdate();
                resolve();
                return;
            }

            const img = new Image();
            img.onload = () => {
                this.backdrops.push({ name, src, image: img });
                if (this.currentBackdropIndex === -1) this.currentBackdropIndex = 0;
                this.onUpdate();
                resolve();
            };
            img.onerror = () => {
                console.warn(`[StageManager] Failed to load backdrop: ${name} (${src}). Falling back to empty state.`);
                // Still add it so the list isn't broken, but without the image
                this.backdrops.push({ name, src });
                if (this.currentBackdropIndex === -1) this.currentBackdropIndex = 0;
                this.onUpdate();
                resolve();
            };
            img.src = src;
        });
    }

    setBackdrop(nameOrIndex: string | number): void {
        if (typeof nameOrIndex === 'number') {
            if (nameOrIndex >= 0 && nameOrIndex < this.backdrops.length) {
                this.currentBackdropIndex = nameOrIndex;
            }
        } else {
            const idx = this.backdrops.findIndex(b => b.name === nameOrIndex);
            if (idx >= 0) {
                this.currentBackdropIndex = idx;
            }
        }
        const b = this.getCurrentBackdrop();
        if (b && b.src && (!b.image || !b.image.complete)) {
            const img = new Image();
            img.onload = () => {
                b.image = img;
                this.onUpdate();
            };
            img.src = b.src;
        }
        this.onUpdate();
    }

    nextBackdrop(): void {
        if (this.backdrops.length === 0) return;
        this.currentBackdropIndex = (this.currentBackdropIndex + 1) % this.backdrops.length;
        this.onUpdate();
    }

    previousBackdrop(): void {
        if (this.backdrops.length === 0) return;
        this.currentBackdropIndex = (this.currentBackdropIndex - 1 + this.backdrops.length) % this.backdrops.length;
        this.onUpdate();
    }

    async updateBackdrop(index: number, name: string, src: string): Promise<void> {
        if (index < 0 || index >= this.backdrops.length) return;
        return new Promise((resolve) => {
            if (!src) {
                this.backdrops[index] = { name, src };
                this.onUpdate();
                resolve();
                return;
            }
            const img = new Image();
            img.onload = () => {
                this.backdrops[index] = { name, src, image: img };
                this.onUpdate();
                resolve();
            };
            img.onerror = () => {
                this.backdrops[index] = { name, src };
                this.onUpdate();
                resolve();
            };
            img.src = src;
        });
    }

    deleteBackdrop(index: number): void {
        if (index >= 0 && index < this.backdrops.length) {
            this.backdrops.splice(index, 1);
            if (this.currentBackdropIndex >= this.backdrops.length) {
                this.currentBackdropIndex = Math.max(0, this.backdrops.length - 1);
            }
            this.onUpdate();
        }
    }

    duplicateBackdrop(index: number): void {
        if (index >= 0 && index < this.backdrops.length) {
            const original = this.backdrops[index];
            const duplicate: BackdropState = {
                name: `${original.name} (copy)`,
                src: original.src,
                image: original.image,
            };
            this.backdrops.splice(index + 1, 0, duplicate);
            this.onUpdate();
        }
    }

    // --- SOUND MANAGEMENT --- //
    async addSound(name: string, src: string): Promise<void> {
        return new Promise((resolve) => {
            this.sounds.push({ name, src });
            this.onUpdate();
            resolve();
        });
    }

    clearSounds(): void {
        this.sounds = [];
        this.onUpdate();
    }

    deleteSound(index: number): void {
        if (index >= 0 && index < this.sounds.length) {
            this.sounds.splice(index, 1);
            this.onUpdate();
        }
    }

    duplicateSound(index: number): void {
        if (index >= 0 && index < this.sounds.length) {
            const soundToDuplicate = this.sounds[index];
            this.sounds.splice(index + 1, 0, {
                name: `${soundToDuplicate.name} (copy)`,
                src: soundToDuplicate.src
            });
            this.onUpdate();
        }
    }

    getAllSounds() {
        return [...this.sounds];
    }

    getCurrentBackdrop(): BackdropState | null {
        if (this.currentBackdropIndex >= 0 && this.currentBackdropIndex < this.backdrops.length) {
            return this.backdrops[this.currentBackdropIndex];
        }
        return null;
    }

    getAllBackdrops(): BackdropState[] {
        return [...this.backdrops];
    }

    getCurrentBackdropIndex(): number {
        return this.currentBackdropIndex;
    }

    get currentBackdrop(): BackdropState | null {
        return this.getCurrentBackdrop();
    }
}

let _stageManager: StageManager | null = null;
export function getStageManager(): StageManager {
    if (!_stageManager) _stageManager = new StageManager(() => {
        window.dispatchEvent(new Event('leap-stage-update'));
    });
    return _stageManager;
}
export const stageManager: StageManager = new Proxy({} as StageManager, {
    get(_target, prop) {
        const instance = getStageManager();
        const value = (instance as any)[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
    set(_target, prop, value) { (getStageManager() as any)[prop] = value; return true; }
});
