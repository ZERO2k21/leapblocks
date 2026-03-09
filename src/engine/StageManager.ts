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
        // Default white backdrop
        this.addBackdrop('default', '');
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

    deleteBackdrop(index: number): void {
        if (index >= 0 && index < this.backdrops.length) {
            this.backdrops.splice(index, 1);
            if (this.currentBackdropIndex >= this.backdrops.length) {
                this.currentBackdropIndex = Math.max(0, this.backdrops.length - 1);
            }
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

    get currentBackdrop(): BackdropState | null {
        return this.getCurrentBackdrop();
    }
}

// Singleton instance
export const stageManager = new StageManager(() => {
    // This will be connected to the GameLoop or direct render triggers
});
