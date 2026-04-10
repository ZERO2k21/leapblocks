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
    sounds: { name: string; src: string }[];
    volume: number;
    soundEffects: {
        pitch: number;
        pan: number;
    };
    sayText: string | null;
    thinkText: string | null;
    sayTimer: number | null;
    thinkTimer: number | null;
    sayTimeout: number | null; // Keep for compatibility if needed, but we'll use timers
    effects: {
        color: number;      // color tint/hue shift 0-100
        brightness: number; // brightness 0-100
        ghost: number;      // transparency 0-100
        fisheye: number;    // fisheye distortion 0-100
        whirl: number;      // whirl/swirl distortion 0-100
        pixelate: number;   // pixelation level 0-100
        mosaic: number;     // mosaic tile size 0-100
    };
    // Pen drawing state
    isPenDown: boolean;
    penColor: string;
    penSize: number;
    scripts: any[];         // Blocks attached to sprite
    // For animation interpolation
    glideTarget: { x: number; y: number; startX: number; startY: number; duration: number; elapsed: number } | null;
    // Rotation style: how sprite rotates
    rotationStyle: 'left-right' | 'all around' | 'none';
    // Interactive visual state
    isDragging: boolean;
    jiggleStartTime: number | null;
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
            sounds: [],
            volume: 100,
            soundEffects: { pitch: 0, pan: 0 },
            sayText: null,
            thinkText: null,
            sayTimer: null,
            thinkTimer: null,
            sayTimeout: null,
            effects: { color: 0, brightness: 0, ghost: 0, fisheye: 0, whirl: 0, pixelate: 0, mosaic: 0 },
            glideTarget: null,
            rotationStyle: 'all around',
            scripts: [],
            isDragging: false,
            jiggleStartTime: null,
            // Pen state
            isPenDown: false,
            penColor: '#000000',
            penSize: 1,
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
    get thinkText() { return this.state.thinkText; }
    get sayTimer() { return this.state.sayTimer; }
    get thinkTimer() { return this.state.thinkTimer; }
    get currentCostume(): Costume | null {
        return this.state.costumes[this.state.currentCostumeIndex] || null;
    }
    get costumes() { return this.state.costumes; }
    get currentCostumeIndex() { return this.state.currentCostumeIndex; }
    get sounds() { return this.state.sounds; }
    get volume() { return this.state.volume; }
    get soundEffects() { return this.state.soundEffects; }
    get effects() { return this.state.effects; }
    get isGliding() { return this.state.glideTarget !== null; }
    get rotationStyle() { return this.state.rotationStyle; }
    get scripts() { return this.state.scripts; }
    get isDragging() { return this.state.isDragging; }
    get isPenDown() { return this.state.isPenDown; }
    get penColor() { return this.state.penColor; }
    get penSize() { return this.state.penSize; }

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

    setEffect(effect: 'color' | 'brightness' | 'ghost' | 'fisheye' | 'whirl' | 'pixelate' | 'mosaic', value: number) {
        this.state.effects[effect] = value;
        this.onUpdate();
    }

    clearEffects() {
        this.state.effects = { color: 0, brightness: 0, ghost: 0, fisheye: 0, whirl: 0, pixelate: 0, mosaic: 0 };
        this.onUpdate();
    }

    setRotationStyle(style: 'left-right' | 'all around' | 'none') {
        this.state.rotationStyle = style;
        this.onUpdate();
    }

    setPenDown(down: boolean) {
        this.state.isPenDown = down;
        this.onUpdate();
    }

    setPenColor(color: string) {
        this.state.penColor = color;
        this.onUpdate();
    }

    setPenSize(size: number) {
        this.state.penSize = Math.max(0.1, size);
        this.onUpdate();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CLONE SUPPORT
    // ═══════════════════════════════════════════════════════════════════════
    copyCostumesFrom(other: Sprite) {
        // Deep copy the costumes array (shallow copy of image objects is fine)
        this.state.costumes = other.state.costumes.map(c => ({
            name: c.name,
            image: c.image,
            width: c.width,
            height: c.height,
        }));
        this.state.currentCostumeIndex = other.state.currentCostumeIndex;
        this.onUpdate();
    }

    copySoundsFrom(other: Sprite) {
        this.state.sounds = other.state.sounds.map(s => ({ name: s.name, src: s.src }));
        this.state.volume = other.volume;
        this.state.soundEffects = { ...other.soundEffects };
        this.onUpdate();
    }

    deleteCostume(index: number): void {
        if (index >= 0 && index < this.state.costumes.length) {
            this.state.costumes.splice(index, 1);
            // Adjust currentCostumeIndex if we deleted the current or a previous costume
            if (this.state.currentCostumeIndex >= this.state.costumes.length) {
                this.state.currentCostumeIndex = Math.max(0, this.state.costumes.length - 1);
            }
            this.onUpdate();
        }
    }

    duplicateCostume(index: number): void {
        if (index >= 0 && index < this.state.costumes.length) {
            const original = this.state.costumes[index];
            const duplicate: Costume = {
                name: `${original.name} (copy)`,
                image: original.image,
                width: original.width,
                height: original.height,
            };
            this.state.costumes.splice(index + 1, 0, duplicate);
            this.onUpdate();
        }
    }

    setScripts(scripts: any[]) {
        this.state.scripts = scripts;
        this.onUpdate();
    }

    setDragging(isDragging: boolean) {
        this.state.isDragging = isDragging;
        this.onUpdate();
    }

    jiggle() {
        this.state.jiggleStartTime = performance.now();
        this.onUpdate();

        // Ensure UI updates enough times for the animation
        const interval = setInterval(() => this.onUpdate(), 16);
        setTimeout(() => {
            clearInterval(interval);
            this.state.jiggleStartTime = null;
            this.onUpdate();
        }, 300); // 300ms animation
    }

    triggerUpdate() {
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
    // SOUND MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    async addSound(name: string, src: string): Promise<void> {
        return new Promise((resolve) => {
            this.state.sounds.push({ name, src });
            this.onUpdate();
            resolve();
        });
    }

    setVolume(volume: number): void {
        const nextVolume = Math.max(0, Math.min(100, Number.isFinite(volume) ? volume : 100));
        this.state.volume = nextVolume;
        this.onUpdate();
    }

    changeVolume(delta: number): void {
        const nextDelta = Number.isFinite(delta) ? delta : 0;
        this.setVolume(this.state.volume + nextDelta);
    }

    setSoundEffect(effect: 'pitch' | 'pan', value: number): void {
        const numericValue = Number.isFinite(value) ? value : 0;
        if (effect === 'pan') {
            this.state.soundEffects.pan = Math.max(-100, Math.min(100, numericValue));
        } else {
            this.state.soundEffects.pitch = Math.max(-360, Math.min(360, numericValue));
        }
        this.onUpdate();
    }

    changeSoundEffect(effect: 'pitch' | 'pan', delta: number): void {
        const currentValue = this.state.soundEffects[effect];
        const nextDelta = Number.isFinite(delta) ? delta : 0;
        this.setSoundEffect(effect, currentValue + nextDelta);
    }

    clearSoundEffects(): void {
        this.state.soundEffects = { pitch: 0, pan: 0 };
        this.onUpdate();
    }

    deleteSound(index: number): void {
        if (index >= 0 && index < this.state.sounds.length) {
            this.state.sounds.splice(index, 1);
            this.onUpdate();
        }
    }

    duplicateSound(index: number): void {
        if (index >= 0 && index < this.state.sounds.length) {
            const soundToDuplicate = this.state.sounds[index];
            this.state.sounds.splice(index + 1, 0, {
                name: `${soundToDuplicate.name} (copy)`,
                src: soundToDuplicate.src
            });
            this.onUpdate();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
// LOOKS - Say / Think / Bubble System
// ═══════════════════════════════════════════════════════════════════════

    say(text: string, secs?: number): void {
        this.state.sayText = String(text || '').trim();
        this.state.thinkText = '';                    // clear think if any
        this.state.thinkTimer = null;

        if (secs && secs > 0) {
            this.state.sayTimer = Date.now() + secs * 1000;
        } else {
            this.state.sayTimer = null;               // permanent until cleared
        }

        this.triggerUpdate();                   // force Stage re-render
    }

    think(text: string, secs?: number): void {
        this.state.thinkText = String(text || '').trim();
        this.state.sayText = '';                      // clear say if any
        this.state.sayTimer = null;

        if (secs && secs > 0) {
            this.state.thinkTimer = Date.now() + secs * 1000;
        } else {
            this.state.thinkTimer = null;
        }

        this.triggerUpdate();
    }

    clearSay(): void {
        this.state.sayText = '';
        this.state.sayTimer = null;
        this.triggerUpdate();
    }

    clearThink(): void {
        this.state.thinkText = '';
        this.state.thinkTimer = null;
        this.triggerUpdate();
    }

    clearSayThink(): void {
        this.state.sayText = '';
        this.state.thinkText = '';
        this.state.sayTimer = null;
        this.state.thinkTimer = null;
        this.triggerUpdate();
    }

    hasVisibleBubble(): boolean {
        return !!(this.state.sayText || this.state.thinkText);
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

    stopGlide(): void {
        this.state.glideTarget = null;
    }

    updateGlide(deltaMs: number): boolean {
        if (!this.state.glideTarget) return false;

        this.state.glideTarget.elapsed += deltaMs;
        const t = Math.min(1, this.state.glideTarget.elapsed / this.state.glideTarget.duration);
        const easeT = 1 - Math.pow(1 - t, 2);   // easeOutQuad

        this.setX(this.state.glideTarget.startX + (this.state.glideTarget.x - this.state.glideTarget.startX) * easeT);
        this.setY(this.state.glideTarget.startY + (this.state.glideTarget.y - this.state.glideTarget.startY) * easeT);

        if (t >= 1) {
            this.state.glideTarget = null;
        }
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

        // Visual feedback animations (jiggle, drag)
        let animScale = 1;
        let animRotate = 0;

        if (this.state.jiggleStartTime) {
            const elapsed = performance.now() - this.state.jiggleStartTime;
            if (elapsed < 300) {
                const t = elapsed / 300;
                animScale = 1 + Math.sin(t * Math.PI) * 0.15;
                animRotate = Math.sin(t * Math.PI * 4) * 0.15;
            } else {
                this.state.jiggleStartTime = null;
            }
        }

        if (this.state.isDragging) {
            animScale *= 1.15;
        }

        ctx.scale(animScale, animScale);

        // Rotation style
        if (this.state.rotationStyle === 'all around') {
            ctx.rotate((this.state.direction - 90) * Math.PI / 180 + animRotate);
        } else {
            ctx.rotate(animRotate);
            if (this.state.rotationStyle === 'left-right' && 
                (this.state.direction > 180 || this.state.direction < 0)) {
                ctx.scale(-1, 1);
            }
        }

        const eff = this.state.effects;
        const alpha = 1 - (eff.ghost / 100);

        // Build filter string
        const filters: string[] = [];
        if (this.state.isDragging) {
            filters.push('drop-shadow(0px 15px 15px rgba(0,0,0,0.3))', 'brightness(110%)');
        }
        if (eff.brightness !== 0) {
            const pct = 100 + eff.brightness;
            filters.push(`brightness(${pct}%)`);
        }
        if (eff.color !== 0) {
            const deg = eff.color * 3.6;
            filters.push(`hue-rotate(${deg}deg)`);
        }
        if (filters.length > 0) {
            ctx.filter = filters.join(' ');
        }

        const scale = this.state.size / 100;

        ctx.globalAlpha = alpha;

        if (costume && costume.image) {
            const w = costume.width * scale;
            const h = costume.height * scale;

            const hasPixelate = eff.pixelate > 0 || eff.mosaic > 0;
            const hasFisheye = eff.fisheye > 0;
            const hasWhirl = eff.whirl > 0;
            const hasDistortion = hasPixelate || hasFisheye || hasWhirl;

            if (hasDistortion) {
                let factor = 1;
                if (hasPixelate) {
                    const pv = eff.pixelate > 0 ? eff.pixelate : eff.mosaic;
                    factor = Math.max(1, Math.floor(pv / 10) + 1);
                }

                const smallW = Math.max(1, Math.floor(w / factor));
                const smallH = Math.max(1, Math.floor(h / factor));

                const offscreen = document.createElement('canvas');
                offscreen.width = smallW;
                offscreen.height = smallH;
                const offCtx = offscreen.getContext('2d');

                if (offCtx) {
                    offCtx.drawImage(costume.image, 0, 0, smallW, smallH);

                    if (hasFisheye) this.applyFisheye(offCtx, smallW, smallH, eff.fisheye);
                    if (hasWhirl) this.applyWhirl(offCtx, smallW, smallH, eff.whirl);

                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(offscreen, -w / 2, -h / 2, w, h);
                    ctx.imageSmoothingEnabled = true;
                } else {
                    ctx.drawImage(costume.image, -w / 2, -h / 2, w, h);
                }
            } else {
                ctx.drawImage(costume.image, -w / 2, -h / 2, w, h);
            }
        } else {
            // Default vector sprites
            ctx.scale(scale, scale);
            this.renderDefaultSprite(ctx);
        }

        ctx.restore();

        // Render speech/think bubble on top
        if (this.sayText) {
            this.renderSpeechBubble(ctx, centerX, centerY, this.sayText, 'say');
        }
        if (this.thinkText) {
            this.renderSpeechBubble(ctx, centerX, centerY, this.thinkText, 'think');
        }
    }

    private renderDefaultSprite(ctx: CanvasRenderingContext2D): void {
        switch (this.state.spriteType) {
            case 'ball': this.renderBall(ctx); break;
            case 'arrow': this.renderArrow(ctx); break;
            case 'robot': this.renderRobot(ctx); break;
            default:
                this.renderBall(ctx);
                break;
        }
    }

    private renderBall(ctx: CanvasRenderingContext2D): void {
        // High-quality glossy ball
        const gradient = ctx.createRadialGradient(-10, -10, 5, 0, 0, 40);
        gradient.addColorStop(0, '#ff9999');
        gradient.addColorStop(0.4, '#ff0000');
        gradient.addColorStop(1, '#990000');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.fill();

        // Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-15, -15, 15, 10, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    private renderArrow(ctx: CanvasRenderingContext2D): void {
        // Sleek modern arrow
        ctx.fillStyle = '#4cc9f0';
        ctx.strokeStyle = '#4361ee';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(-40, -15);
        ctx.lineTo(10, -15);
        ctx.lineTo(10, -35);
        ctx.lineTo(45, 0);
        ctx.lineTo(10, 35);
        ctx.lineTo(10, 15);
        ctx.lineTo(-40, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Detail line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-30, -5);
        ctx.lineTo(0, -5);
        ctx.stroke();
    }

    private renderRobot(ctx: CanvasRenderingContext2D): void {
        // Cute techy robot
        // Head
        ctx.fillStyle = '#ced4da';
        ctx.strokeStyle = '#495057';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-25, -40, 50, 40, 8);
        else ctx.rect(-25, -40, 50, 40);
        ctx.fill();
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#00f5d4';
        ctx.beginPath();
        ctx.arc(-12, -25, 5, 0, Math.PI * 2);
        ctx.arc(12, -25, 5, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#adb5bd';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-35, 0, 70, 50, 5);
        else ctx.rect(-35, 0, 70, 50);
        ctx.fill();
        ctx.stroke();

        // Antenna
        ctx.strokeStyle = '#495057';
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(0, -55);
        ctx.stroke();
        ctx.fillStyle = '#f72585';
        ctx.beginPath();
        ctx.arc(0, -55, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    private renderSpeechBubble(
        ctx: CanvasRenderingContext2D, 
        x: number, 
        y: number, 
        text: string, 
        type: 'say' | 'think' = 'say'
    ): void {
        ctx.save();
        ctx.font = 'bold 13px Arial';
        const metrics = ctx.measureText(text);
        const padding = 10;
        const bubbleWidth = metrics.width + padding * 2 + 10;
        const bubbleHeight = 28;
        const bubbleX = x - bubbleWidth / 2;
        const bubbleY = y - 75;

        // Bubble background
        ctx.fillStyle = type === 'think' ? '#f0f0f0' : '#ffffff';
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 12);
        } else {
            ctx.rect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
        }
        ctx.fill();
        ctx.stroke();

        // Tail / pointer
        ctx.beginPath();
        ctx.moveTo(x - 6, bubbleY + bubbleHeight - 2);
        ctx.lineTo(x, bubbleY + bubbleHeight + 10);
        ctx.lineTo(x + 6, bubbleY + bubbleHeight - 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.fillStyle = '#222';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, bubbleY + bubbleHeight / 2);

        ctx.restore();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HIT TESTING
    // ═══════════════════════════════════════════════════════════════════════════

    isPointInSprite(scratchX: number, scratchY: number): boolean {
        const costume = this.currentCostume;
        const scale = this.state.size / 100;

        let spriteWidth = costume ? costume.width * scale : 40 * scale;
        let spriteHeight = costume ? costume.height * scale : 40 * scale;

        const halfWidth = spriteWidth / 2;
        const halfHeight = spriteHeight / 2;

        const dx = scratchX - this.state.x;
        const dy = scratchY - this.state.y;

        return Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DISTORTION EFFECTS (Fisheye, Whirl)
    // ═══════════════════════════════════════════════════════════════════════════

    private applyFisheye(ctx: CanvasRenderingContext2D, width: number, height: number, strength: number): void {
        // Your existing applyFisheye code (unchanged)
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const output = ctx.createImageData(width, height);
        const dst = output.data;
        const cx = width / 2;
        const cy = height / 2;
        const maxR = Math.min(width, height) / 2;
        const s = strength / 100;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const r = Math.sqrt(dx * dx + dy * dy);
                let srcX = x, srcY = y;

                if (r < maxR && r > 0) {
                    const amount = r / maxR;
                    const newR = r * (1 + s * amount * amount);
                    const angle = Math.atan2(dy, dx);
                    srcX = cx + Math.cos(angle) * newR;
                    srcY = cy + Math.sin(angle) * newR;
                }

                const dstIdx = (y * width + x) * 4;
                if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                    const sx = Math.round(srcX);
                    const sy = Math.round(srcY);
                    const srcIdx = (sy * width + sx) * 4;
                    dst[dstIdx] = data[srcIdx];
                    dst[dstIdx + 1] = data[srcIdx + 1];
                    dst[dstIdx + 2] = data[srcIdx + 2];
                    dst[dstIdx + 3] = data[srcIdx + 3];
                } else {
                    dst[dstIdx + 3] = 0;
                }
            }
        }
        ctx.putImageData(output, 0, 0);
    }

    private applyWhirl(ctx: CanvasRenderingContext2D, width: number, height: number, strength: number): void {
        // Your existing applyWhirl code (unchanged)
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const output = ctx.createImageData(width, height);
        const dst = output.data;
        const cx = width / 2;
        const cy = height / 2;
        const maxR = Math.min(width, height) / 2;
        const s = strength / 100;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const r = Math.sqrt(dx * dx + dy * dy);
                let srcX = x, srcY = y;

                if (r < maxR && r > 0) {
                    const amount = r / maxR;
                    const spin = s * (1 - amount) * Math.PI * 2;
                    const angle = Math.atan2(dy, dx) + spin;
                    srcX = cx + Math.cos(angle) * r;
                    srcY = cy + Math.sin(angle) * r;
                }

                const dstIdx = (y * width + x) * 4;
                if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
                    const sx = Math.round(srcX);
                    const sy = Math.round(srcY);
                    const srcIdx = (sy * width + sx) * 4;
                    dst[dstIdx] = data[srcIdx];
                    dst[dstIdx + 1] = data[srcIdx + 1];
                    dst[dstIdx + 2] = data[srcIdx + 2];
                    dst[dstIdx + 3] = data[srcIdx + 3];
                } else {
                    dst[dstIdx + 3] = 0;
                }
            }
        }
        ctx.putImageData(output, 0, 0);
    }
}