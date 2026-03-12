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
    sayText: string | null;
    sayTimeout: number | null;
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
            sayText: null,
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
    get currentCostume(): Costume | null {
        return this.state.costumes[this.state.currentCostumeIndex] || null;
    }
    get costumes() { return this.state.costumes; }
    get currentCostumeIndex() { return this.state.currentCostumeIndex; }
    get sounds() { return this.state.sounds; }
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
    // HIT DETECTION
    // ═══════════════════════════════════════════════════════════════════════
    /**
     * Check if a point (in Scratch coordinates) is within this sprite's bounds
     * @param scratchX - X coordinate in Scratch space (-240 to 240)
     * @param scratchY - Y coordinate in Scratch space (-180 to 180)
     * @returns true if the point is within the sprite's costume bounds
     */
    isPointInSprite(scratchX: number, scratchY: number): boolean {
        const costume = this.currentCostume;
        if (!costume) return false;

        // Calculate the sprite's bounding box in Scratch coordinates
        const halfWidth = (costume.width * this.state.size) / 200;
        const halfHeight = (costume.height * this.state.size) / 200;

        // Check if point is within the sprite's bounding box
        const minX = this.state.x - halfWidth;
        const maxX = this.state.x + halfWidth;
        const minY = this.state.y - halfHeight;
        const maxY = this.state.y + halfHeight;

        return scratchX >= minX && scratchX <= maxX && scratchY >= minY && scratchY <= maxY;
    }

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

    stopGlide(): void {
        this.state.glideTarget = null;
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

        // Visual feedback animations
        let animScale = 1;
        let animRotate = 0;
        if (this.state.jiggleStartTime) {
            const elapsed = performance.now() - this.state.jiggleStartTime;
            if (elapsed < 300) {
                const t = elapsed / 300;
                animScale = 1 + Math.sin(t * Math.PI) * 0.15;
                animRotate = Math.sin(t * Math.PI * 4) * 0.15;
            }
        }

        if (this.state.isDragging) {
            animScale *= 1.15; // enlarge while dragged
        }

        ctx.scale(animScale, animScale);

        if (this.state.rotationStyle === 'all around') {
            ctx.rotate((this.state.direction - 90) * Math.PI / 180 + animRotate);
        } else {
            ctx.rotate(animRotate);
            if (this.state.rotationStyle === 'left-right' && (this.state.direction > 180 || this.state.direction < 0)) {
                ctx.scale(-1, 1);
            }
        }

        const eff = this.state.effects;
        const alpha = 1 - (eff.ghost / 100);

        // Build combined filter string from dragging, brightness, and color effects
        const filters: string[] = [];
        if (this.state.isDragging) {
            filters.push('drop-shadow(0px 15px 15px rgba(0,0,0,0.3))', 'brightness(110%)');
        }
        if (eff.brightness !== 0) {
            const pct = 100 + eff.brightness; // value can be negative
            filters.push(`brightness(${pct}%)`);
        }
        if (eff.color !== 0) {
            const deg = eff.color * 3.6; // 0-100 -> 0-360 degrees
            filters.push(`hue-rotate(${deg}deg)`);
        }
        if (filters.length > 0) {
            ctx.filter = filters.join(' ');
        }

        const scale = this.state.size / 100;

        if (costume) {
            const w = costume.width * scale;
            const h = costume.height * scale;

            const hasPixelate = eff.pixelate > 0 || eff.mosaic > 0;
            const hasFisheye = eff.fisheye > 0;
            const hasWhirl = eff.whirl > 0;
            const hasDistortion = hasPixelate || hasFisheye || hasWhirl;

            ctx.globalAlpha = alpha;

            if (hasDistortion) {
                // Determine pixelation factor (mosaic uses same factor)
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
                    // Draw costume downscaled to small canvas
                    offCtx.drawImage(costume.image, 0, 0, smallW, smallH);

                    // Apply additional pixel-level distortions
                    if (hasFisheye) {
                        this.applyFisheye(offCtx, smallW, smallH, eff.fisheye);
                    }
                    if (hasWhirl) {
                        this.applyWhirl(offCtx, smallW, smallH, eff.whirl);
                    }

                    // Render the distorted offscreen canvas scaled up with nearest-neighbor (pixelated)
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(offscreen, -w / 2, -h / 2, w, h);
                    ctx.imageSmoothingEnabled = true;
                } else {
                    // Fallback: direct draw if offscreen context fails
                    ctx.drawImage(costume.image, -w / 2, -h / 2, w, h);
                }
            } else {
                // No distortion; direct draw
                ctx.drawImage(costume.image, -w / 2, -h / 2, w, h);
            }
        } else {
            // Default vector sprites (cat, ball, arrow, robot)
            // Distortion effects not applicable to vector sprites
            ctx.globalAlpha = alpha;
            ctx.scale(scale, scale);
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

    // ═══════════════════════════════════════════════════════════════════════════
    // DISTORTION EFFECT HELPERS (Fisheye, Whirl)
    // Applied to offscreen canvases at low resolution for performance
    // ═══════════════════════════════════════════════════════════════════════════
    private applyFisheye(ctx: CanvasRenderingContext2D, width: number, height: number, strength: number): void {
        // Barrel distortion: magnifies center, compresses edges
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const output = ctx.createImageData(width, height);
        const dst = output.data;
        const cx = width / 2;
        const cy = height / 2;
        const maxR = Math.min(width, height) / 2;
        const s = strength / 100; // normalize to 0-1

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const r = Math.sqrt(dx * dx + dy * dy);
                let srcX = x, srcY = y;
                if (r < maxR && r > 0) {
                    const amount = r / maxR;
                    // Quadratic distortion: more push outward as radius increases
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
                    dst[dstIdx + 3] = 0; // transparent
                }
            }
        }
        ctx.putImageData(output, 0, 0);
    }

    private applyWhirl(ctx: CanvasRenderingContext2D, width: number, height: number, strength: number): void {
        // Swirl distortion: rotates pixels more near center
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const output = ctx.createImageData(width, height);
        const dst = output.data;
        const cx = width / 2;
        const cy = height / 2;
        const maxR = Math.min(width, height) / 2;
        const s = strength / 100; // normalize

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const r = Math.sqrt(dx * dx + dy * dy);
                let srcX = x, srcY = y;
                if (r < maxR && r > 0) {
                    const amount = r / maxR;
                    // Spin decreases linearly from center to edge; at center full rotation, at edge 0
                    const spin = s * (1 - amount) * Math.PI * 2; // up to 2π*s at center
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
