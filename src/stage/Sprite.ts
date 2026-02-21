// ═══════════════════════════════════════════════════════════════════════════
// SPRITE - Core animation entity
// ═══════════════════════════════════════════════════════════════════════════

export interface Costume {
    name: string;
    image: HTMLImageElement;
    width: number;
    height: number;
}

export type SpriteType = 'cat' | 'ball' | 'arrow' | 'robot';

export interface SpriteState {
    id: string;
    name: string;
    spriteType: SpriteType;
    x: number;
    y: number;
    direction: number;      // 0 = up, 90 = right, 180 = down, 270 = left
    size: number;           // percentage (100 = normal)
    visible: boolean;
    costumes: Costume[];
    currentCostumeIndex: number;
    sayText: string | null;
    sayTimeout: number | null;
    effects: {
        color: number;
        brightness: number;
        ghost: number;      // transparency 0-100
    };
    // For animation interpolation
    glideTarget: { x: number; y: number; startX: number; startY: number; duration: number; elapsed: number } | null;
    // Rotation style: how sprite rotates
    rotationStyle: 'left-right' | 'all around' | 'none';
}

export class Sprite {
    private state: SpriteState;
    private onUpdate: () => void;

    constructor(id: string, name: string, onUpdate: () => void, spriteType: SpriteType = 'cat') {
        this.onUpdate = onUpdate;
        this.state = {
            id,
            name,
            spriteType,
            x: 0,
            y: 0,
            direction: 90,  // facing right by default
            size: 100,
            visible: true,
            costumes: [],
            currentCostumeIndex: 0,
            sayText: null,
            sayTimeout: null,
            effects: { color: 0, brightness: 0, ghost: 0 },
            glideTarget: null,
            rotationStyle: 'all around',
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GETTERS
    // ═══════════════════════════════════════════════════════════════════════
    get id() { return this.state.id; }
    get name() { return this.state.name; }
    get spriteType() { return this.state.spriteType; }
    get x() { return this.state.x; }
    get y() { return this.state.y; }
    get direction() { return this.state.direction; }
    get size() { return this.state.size; }
    get visible() { return this.state.visible; }
    get sayText() { return this.state.sayText; }
    get currentCostume(): Costume | null {
        return this.state.costumes[this.state.currentCostumeIndex] || null;
    }
    get costumes() { return this.state.costumes; }
    get currentCostumeIndex() { return this.state.currentCostumeIndex; }
    get effects() { return this.state.effects; }
    get isGliding() { return this.state.glideTarget !== null; }
    get rotationStyle() { return this.state.rotationStyle; }

    getState(): SpriteState { return { ...this.state }; }

    // ═══════════════════════════════════════════════════════════════════════
    // STATE MODIFIERS
    // ═══════════════════════════════════════════════════════════════════════
    setX(x: number) { this.state.x = Math.max(-240, Math.min(240, x)); this.onUpdate(); }
    setY(y: number) { this.state.y = Math.max(-180, Math.min(180, y)); this.onUpdate(); }

    pointInDirection(degrees: number) {
        this.state.direction = degrees % 360;
        if (this.state.direction < 0) this.state.direction += 360;
        this.onUpdate();
    }

    setSize(percent: number) {
        this.state.size = Math.max(1, Math.min(500, percent));
        this.onUpdate();
    }

    changeSize(delta: number) {
        this.setSize(this.state.size + delta);
    }

    show() { this.state.visible = true; this.onUpdate(); }
    hide() { this.state.visible = false; this.onUpdate(); }

    setEffect(effect: 'color' | 'brightness' | 'ghost', value: number) {
        this.state.effects[effect] = value;
        this.onUpdate();
    }

    clearEffects() {
        this.state.effects = { color: 0, brightness: 0, ghost: 0 };
        this.onUpdate();
    }

    setRotationStyle(style: 'left-right' | 'all around' | 'none') {
        this.state.rotationStyle = style;
        this.onUpdate();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // COSTUME MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    async addCostume(name: string, src: string): Promise<void> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const maxDim = Math.max(img.width, img.height) || 100;
                const logicalBase = 150;
                const scaleFactor = logicalBase / maxDim;

                this.state.costumes.push({
                    name,
                    image: img,
                    width: img.width * scaleFactor,
                    height: img.height * scaleFactor,
                });
                this.onUpdate();
                resolve();
            };
            img.onerror = () => {
                console.warn(`[Sprite] Failed to load costume: ${name} (${src})`);
                resolve(); // Resolve anyway to proceed with initialization
            };
            img.src = src;
        });
    }

    switchCostume(nameOrIndex: string | number): void {
        if (typeof nameOrIndex === 'number') {
            this.state.currentCostumeIndex = Math.max(0, Math.min(nameOrIndex, this.state.costumes.length - 1));
        } else {
            const idx = this.state.costumes.findIndex(c => c.name === nameOrIndex);
            if (idx >= 0) this.state.currentCostumeIndex = idx;
        }
        this.onUpdate();
    }

    nextCostume(): void {
        if (this.state.costumes.length > 0) {
            this.state.currentCostumeIndex = (this.state.currentCostumeIndex + 1) % this.state.costumes.length;
            this.onUpdate();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LOOKS
    // ═══════════════════════════════════════════════════════════════════════
    say(text: string, durationSecs?: number): void {
        if (this.state.sayTimeout) {
            clearTimeout(this.state.sayTimeout);
            this.state.sayTimeout = null;
        }
        this.state.sayText = text;
        if (durationSecs && durationSecs > 0) {
            this.state.sayTimeout = window.setTimeout(() => {
                this.state.sayText = null;
                this.state.sayTimeout = null;
                this.onUpdate();
            }, durationSecs * 1000);
        }
        this.onUpdate();
    }

    clearSay(): void {
        if (this.state.sayTimeout) {
            clearTimeout(this.state.sayTimeout);
            this.state.sayTimeout = null;
        }
        this.state.sayText = null;
        this.onUpdate();
    }

    think(text: string, durationSecs?: number): void {
        this.say(text, durationSecs);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MOTION HELPERS
    // ═══════════════════════════════════════════════════════════════════════
    startGlide(x: number, y: number, durationSecs: number): void {
        this.state.glideTarget = {
            x,
            y,
            startX: this.state.x,
            startY: this.state.y,
            duration: durationSecs * 1000,
            elapsed: 0,
        };
    }

    updateGlide(deltaMs: number): boolean {
        if (!this.state.glideTarget) return false;
        this.state.glideTarget.elapsed += deltaMs;
        const t = Math.min(1, this.state.glideTarget.elapsed / this.state.glideTarget.duration);
        const easeT = 1 - Math.pow(1 - t, 2);
        this.setX(this.state.glideTarget.startX + (this.state.glideTarget.x - this.state.glideTarget.startX) * easeT);
        this.setY(this.state.glideTarget.startY + (this.state.glideTarget.y - this.state.glideTarget.startY) * easeT);
        if (t >= 1) this.state.glideTarget = null;
        return this.state.glideTarget === null;
    }

    ifOnEdgeBounce(): void {
        const margin = 20;
        let bounced = false;
        if (this.state.x >= 240 - margin || this.state.x <= -240 + margin) {
            this.state.direction = (180 - this.state.direction + 360) % 360;
            bounced = true;
        }
        if (this.state.y >= 180 - margin || this.state.y <= -180 + margin) {
            this.state.direction = (360 - this.state.direction) % 360;
            bounced = true;
        }
        if (bounced) this.onUpdate();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════
    render(ctx: CanvasRenderingContext2D, stageWidth: number, stageHeight: number): void {
        if (!this.state.visible) return;
        const costume = this.currentCostume;
        const centerX = stageWidth / 2 + this.state.x;
        const centerY = stageHeight / 2 - this.state.y;
        ctx.save();
        ctx.translate(centerX, centerY);
        if (this.state.rotationStyle === 'all around') {
            ctx.rotate((this.state.direction - 90) * Math.PI / 180);
        } else if (this.state.rotationStyle === 'left-right') {
            if (this.state.direction > 180 || this.state.direction < 0) ctx.scale(-1, 1);
        }
        ctx.globalAlpha = 1 - (this.state.effects.ghost / 100);
        if (costume) {
            const scale = this.state.size / 100;
            const w = costume.width * scale;
            const h = costume.height * scale;
            ctx.drawImage(costume.image, -w / 2, -h / 2, w, h);
        } else {
            this.renderDefaultSprite(ctx);
        }
        ctx.restore();
        if (this.state.sayText) this.renderSpeechBubble(ctx, centerX, centerY, this.state.sayText);
    }

    private renderDefaultSprite(ctx: CanvasRenderingContext2D): void {
        switch (this.state.spriteType) {
            case 'ball': this.renderBall(ctx); break;
            case 'arrow': this.renderArrow(ctx); break;
            case 'robot': this.renderRobot(ctx); break;
            default: this.renderCat(ctx); break;
        }
    }

    private renderCat(ctx: CanvasRenderingContext2D): void {
        const scale = this.state.size / 100;
        const size = 40 * scale;
        ctx.fillStyle = '#FF8C1A';
        ctx.beginPath();
        ctx.ellipse(0, 0, size / 2, size / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-size / 5, -size / 8, size / 8, size / 6, 0, 0, Math.PI * 2);
        ctx.ellipse(size / 5, -size / 8, size / 8, size / 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-size / 5, -size / 8, size / 16, 0, Math.PI * 2);
        ctx.arc(size / 5, -size / 8, size / 16, 0, Math.PI * 2);
        ctx.fill();
    }

    private renderBall(ctx: CanvasRenderingContext2D): void {
        const scale = this.state.size / 100;
        const radius = 20 * scale;
        const gradient = ctx.createRadialGradient(-radius / 3, -radius / 3, 0, 0, 0, radius);
        gradient.addColorStop(0, '#6DD5FA');
        gradient.addColorStop(0.5, '#2980B9');
        gradient.addColorStop(1, '#1A5276');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(-radius / 3, -radius / 3, radius / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    private renderArrow(ctx: CanvasRenderingContext2D): void {
        const scale = this.state.size / 100;
        const size = 40 * scale;
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(-size / 4, -size / 3);
        ctx.lineTo(-size / 4, -size / 6);
        ctx.lineTo(-size / 2, -size / 6);
        ctx.lineTo(-size / 2, size / 6);
        ctx.lineTo(-size / 4, size / 6);
        ctx.lineTo(-size / 4, size / 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#922B21';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
    }

    private renderRobot(ctx: CanvasRenderingContext2D): void {
        const scale = this.state.size / 100;
        const size = 40 * scale;
        ctx.fillStyle = '#7D8C9C';
        ctx.fillRect(-size / 2.5, -size / 3, size / 1.25, size / 1.5);
        ctx.fillStyle = '#5D6C7C';
        ctx.fillRect(-size / 3, -size / 2.2, size / 1.5, size / 4);
        ctx.fillStyle = '#2ECC71';
        ctx.beginPath();
        ctx.arc(-size / 6, -size / 3, size / 12, 0, Math.PI * 2);
        ctx.arc(size / 6, -size / 3, size / 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5D6C7C';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(0, -size / 2.2);
        ctx.lineTo(0, -size / 1.5);
        ctx.stroke();
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.arc(0, -size / 1.5, size / 15, 0, Math.PI * 2);
        ctx.fill();
    }

    private renderSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
        ctx.save();
        ctx.font = '12px Arial';
        const metrics = ctx.measureText(text);
        const padding = 8;
        const bubbleWidth = metrics.width + padding * 2;
        const bubbleHeight = 24;
        const bubbleX = x - bubbleWidth / 2;
        const bubbleY = y - 60;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 8);
        else ctx.rect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 5, bubbleY + bubbleHeight);
        ctx.lineTo(x, bubbleY + bubbleHeight + 8);
        ctx.lineTo(x + 5, bubbleY + bubbleHeight);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, bubbleY + bubbleHeight / 2);
        ctx.restore();
    }
}
