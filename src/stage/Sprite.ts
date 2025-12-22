// ═══════════════════════════════════════════════════════════════════════════
// SPRITE - Core animation entity
// ═══════════════════════════════════════════════════════════════════════════

// Logging utility for Sprite
const spriteLog = {
    motion: (name: string, action: string, data?: any) =>
        console.log(`[Sprite.Motion] ${name}: ${action}`, data ?? ''),
    looks: (name: string, action: string, data?: any) =>
        console.log(`[Sprite.Looks] ${name}: ${action}`, data ?? ''),
    state: (name: string, msg: string, data?: any) =>
        console.log(`[Sprite.State] ${name}: ${msg}`, data ?? ''),
};

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
    get effects() { return this.state.effects; }
    get isGliding() { return this.state.glideTarget !== null; }
    get rotationStyle() { return this.state.rotationStyle; }

    getState(): SpriteState { return { ...this.state }; }

    // ═══════════════════════════════════════════════════════════════════════
    // COSTUME MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    async addCostume(name: string, src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.state.costumes.push({
                    name,
                    image: img,
                    width: img.width,
                    height: img.height,
                });
                this.onUpdate();
                resolve();
            };
            img.onerror = reject;
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
    // MOTION
    // ═══════════════════════════════════════════════════════════════════════
    move(steps: number): void {
        const radians = (this.state.direction - 90) * Math.PI / 180;
        const oldX = this.state.x;
        const oldY = this.state.y;
        this.state.x += Math.cos(radians) * steps;
        this.state.y -= Math.sin(radians) * steps; // Y is inverted in screen coords
        this.clampPosition();
        spriteLog.motion(this.state.name, 'move', {
            steps,
            from: { x: oldX.toFixed(1), y: oldY.toFixed(1) },
            to: { x: this.state.x.toFixed(1), y: this.state.y.toFixed(1) }
        });
        this.onUpdate();
    }

    goTo(x: number, y: number): void {
        const oldX = this.state.x;
        const oldY = this.state.y;
        this.state.x = x;
        this.state.y = y;
        this.clampPosition();
        spriteLog.motion(this.state.name, 'goTo', {
            from: { x: oldX.toFixed(1), y: oldY.toFixed(1) },
            to: { x: this.state.x.toFixed(1), y: this.state.y.toFixed(1) }
        });
        this.onUpdate();
    }

    startGlide(x: number, y: number, durationSecs: number): void {
        spriteLog.motion(this.state.name, 'startGlide', {
            from: { x: this.state.x.toFixed(1), y: this.state.y.toFixed(1) },
            to: { x, y },
            duration: `${durationSecs}s`
        });
        this.state.glideTarget = {
            x,
            y,
            startX: this.state.x,
            startY: this.state.y,
            duration: durationSecs * 1000,
            elapsed: 0,
        };
    }

    // Called each frame during glide
    updateGlide(deltaMs: number): boolean {
        if (!this.state.glideTarget) return false;

        this.state.glideTarget.elapsed += deltaMs;
        const t = Math.min(1, this.state.glideTarget.elapsed / this.state.glideTarget.duration);

        // Ease-out interpolation
        const easeT = 1 - Math.pow(1 - t, 2);

        this.state.x = this.state.glideTarget.startX + (this.state.glideTarget.x - this.state.glideTarget.startX) * easeT;
        this.state.y = this.state.glideTarget.startY + (this.state.glideTarget.y - this.state.glideTarget.startY) * easeT;

        if (t >= 1) {
            this.state.x = this.state.glideTarget.x;
            this.state.y = this.state.glideTarget.y;
            this.state.glideTarget = null;
        }

        this.onUpdate();
        return this.state.glideTarget === null; // returns true when done
    }

    turnRight(degrees: number): void {
        const oldDir = this.state.direction;
        this.state.direction = (this.state.direction + degrees) % 360;
        if (this.state.direction < 0) this.state.direction += 360;
        spriteLog.motion(this.state.name, 'turnRight', { degrees, from: oldDir, to: this.state.direction });
        this.onUpdate();
    }

    turnLeft(degrees: number): void {
        spriteLog.motion(this.state.name, 'turnLeft', { degrees });
        this.turnRight(-degrees);
    }

    pointInDirection(degrees: number): void {
        const oldDir = this.state.direction;
        this.state.direction = degrees % 360;
        if (this.state.direction < 0) this.state.direction += 360;
        spriteLog.motion(this.state.name, 'pointInDirection', { from: oldDir, to: this.state.direction });
        this.onUpdate();
    }

    changeX(delta: number): void {
        const oldX = this.state.x;
        this.state.x += delta;
        this.clampPosition();
        spriteLog.motion(this.state.name, 'changeX', { delta, from: oldX.toFixed(1), to: this.state.x.toFixed(1) });
        this.onUpdate();
    }

    changeY(delta: number): void {
        const oldY = this.state.y;
        this.state.y += delta;
        this.clampPosition();
        spriteLog.motion(this.state.name, 'changeY', { delta, from: oldY.toFixed(1), to: this.state.y.toFixed(1) });
        this.onUpdate();
    }

    setX(x: number): void {
        const oldX = this.state.x;
        this.state.x = x;
        this.clampPosition();
        spriteLog.motion(this.state.name, 'setX', { from: oldX.toFixed(1), to: this.state.x.toFixed(1) });
        this.onUpdate();
    }

    setY(y: number): void {
        const oldY = this.state.y;
        this.state.y = y;
        this.clampPosition();
        spriteLog.motion(this.state.name, 'setY', { from: oldY.toFixed(1), to: this.state.y.toFixed(1) });
        this.onUpdate();
    }

    private clampPosition(): void {
        // Stage is 480x360, center is (0,0), so x: -240 to 240, y: -180 to 180
        this.state.x = Math.max(-240, Math.min(240, this.state.x));
        this.state.y = Math.max(-180, Math.min(180, this.state.y));
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PICTOBLOX MOTION BLOCKS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Go to a target position (random or mouse)
     */
    goToTarget(target: 'random' | 'mouse', mouseX: number, mouseY: number): void {
        if (target === 'random') {
            // Random position within stage bounds
            const newX = Math.random() * 480 - 240; // -240 to 240
            const newY = Math.random() * 360 - 180; // -180 to 180
            spriteLog.motion(this.state.name, 'goToTarget', { target: 'random', x: newX.toFixed(1), y: newY.toFixed(1) });
            this.goTo(newX, newY);
        } else {
            // Go to mouse position
            spriteLog.motion(this.state.name, 'goToTarget', { target: 'mouse', x: mouseX, y: mouseY });
            this.goTo(mouseX, mouseY);
        }
    }

    /**
     * Glide to a target position (random or mouse)
     */
    glideToTarget(target: 'random' | 'mouse', secs: number, mouseX: number, mouseY: number): void {
        if (target === 'random') {
            const targetX = Math.random() * 480 - 240;
            const targetY = Math.random() * 360 - 180;
            spriteLog.motion(this.state.name, 'glideToTarget', { target: 'random', secs, x: targetX.toFixed(1), y: targetY.toFixed(1) });
            this.startGlide(targetX, targetY, secs);
        } else {
            spriteLog.motion(this.state.name, 'glideToTarget', { target: 'mouse', secs, x: mouseX, y: mouseY });
            this.startGlide(mouseX, mouseY, secs);
        }
    }

    /**
     * Point towards a target (mouse or random direction)
     */
    pointTowards(target: 'mouse' | 'random', mouseX: number, mouseY: number): void {
        if (target === 'random') {
            const randomDir = Math.random() * 360;
            spriteLog.motion(this.state.name, 'pointTowards', { target: 'random', direction: randomDir.toFixed(1) });
            this.pointInDirection(randomDir);
        } else {
            // Calculate angle to mouse
            const dx = mouseX - this.state.x;
            const dy = this.state.y - mouseY; // Inverted because y-axis is flipped
            const angle = Math.atan2(dx, dy) * 180 / Math.PI; // Convert to degrees (0 = up)
            // Convert to Scratch-style direction (0 = up, 90 = right)
            const direction = angle;
            spriteLog.motion(this.state.name, 'pointTowards', { target: 'mouse', direction: direction.toFixed(1) });
            this.pointInDirection(direction);
        }
    }

    /**
     * If on edge, bounce - reverse direction when touching stage edge
     */
    ifOnEdgeBounce(): void {
        const margin = 20; // How close to edge before bouncing
        let bounced = false;

        // Check horizontal edges
        if (this.state.x >= 240 - margin || this.state.x <= -240 + margin) {
            // Bounce horizontally: reflect direction across vertical axis
            this.state.direction = (180 - this.state.direction + 360) % 360;
            bounced = true;
        }

        // Check vertical edges
        if (this.state.y >= 180 - margin || this.state.y <= -180 + margin) {
            // Bounce vertically: reflect direction across horizontal axis
            this.state.direction = (360 - this.state.direction) % 360;
            bounced = true;
        }

        if (bounced) {
            spriteLog.motion(this.state.name, 'ifOnEdgeBounce', { newDirection: this.state.direction.toFixed(1) });
            this.clampPosition();
            this.onUpdate();
        }
    }

    /**
     * Set rotation style - controls how sprite rotates
     */
    setRotationStyle(style: 'left-right' | 'all around' | 'none'): void {
        spriteLog.motion(this.state.name, 'setRotationStyle', { style });
        this.state.rotationStyle = style;
        this.onUpdate();
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
        spriteLog.looks(this.state.name, 'say', { text, duration: durationSecs ?? 'forever' });

        if (durationSecs && durationSecs > 0) {
            this.state.sayTimeout = window.setTimeout(() => {
                this.state.sayText = null;
                this.state.sayTimeout = null;
                spriteLog.looks(this.state.name, 'say cleared (timeout)');
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
        spriteLog.looks(this.state.name, 'clearSay');
        this.onUpdate();
    }

    show(): void {
        this.state.visible = true;
        spriteLog.looks(this.state.name, 'show');
        this.onUpdate();
    }

    hide(): void {
        this.state.visible = false;
        spriteLog.looks(this.state.name, 'hide');
        this.onUpdate();
    }

    setSize(percent: number): void {
        const oldSize = this.state.size;
        this.state.size = Math.max(1, Math.min(500, percent));
        spriteLog.looks(this.state.name, 'setSize', { from: oldSize, to: this.state.size });
        this.onUpdate();
    }

    changeSize(delta: number): void {
        spriteLog.looks(this.state.name, 'changeSize', { delta, newSize: this.state.size + delta });
        this.setSize(this.state.size + delta);
    }

    setEffect(effect: 'color' | 'brightness' | 'ghost', value: number): void {
        this.state.effects[effect] = value;
        spriteLog.looks(this.state.name, 'setEffect', { effect, value });
        this.onUpdate();
    }

    clearEffects(): void {
        this.state.effects = { color: 0, brightness: 0, ghost: 0 };
        spriteLog.looks(this.state.name, 'clearEffects');
        this.onUpdate();
    }

    // Think bubble (similar to say but different visual)
    think(text: string, durationSecs?: number): void {
        spriteLog.looks(this.state.name, 'think', { text, duration: durationSecs ?? 'forever' });
        // For now, use the same implementation as say
        // A more complete implementation would show a thought bubble instead of speech bubble
        this.say(text, durationSecs);
    }

    // Layer control
    goToLayer(layer: 'front' | 'back'): void {
        spriteLog.looks(this.state.name, 'goToLayer', { layer });
        // This will be handled by the VM/Stage when layering is implemented
        this.onUpdate();
    }

    goForwardLayers(direction: 'forward' | 'backward', count: number): void {
        spriteLog.looks(this.state.name, 'goForwardLayers', { direction, count });
        // This will be handled by the VM/Stage when layering is implemented
        this.onUpdate();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════
    render(ctx: CanvasRenderingContext2D, stageWidth: number, stageHeight: number): void {
        if (!this.state.visible) return;

        const costume = this.currentCostume;
        const centerX = stageWidth / 2 + this.state.x;
        const centerY = stageHeight / 2 - this.state.y; // Flip Y for screen coords

        ctx.save();
        ctx.translate(centerX, centerY);

        // Apply rotation based on rotation style
        if (this.state.rotationStyle === 'all around') {
            // Full rotation
            ctx.rotate((this.state.direction - 90) * Math.PI / 180);
        } else if (this.state.rotationStyle === 'left-right') {
            // Only flip horizontally when facing left
            if (this.state.direction > 180 || this.state.direction < 0) {
                ctx.scale(-1, 1); // Flip horizontally
            }
        }
        // 'none' = no rotation applied

        // Apply ghost effect
        ctx.globalAlpha = 1 - (this.state.effects.ghost / 100);

        if (costume) {
            const scale = this.state.size / 100;
            const w = costume.width * scale;
            const h = costume.height * scale;
            ctx.drawImage(costume.image, -w / 2, -h / 2, w, h);
        } else {
            // Default cat-like shape if no costume
            this.renderDefaultSprite(ctx);
        }

        ctx.restore();

        // Render speech bubble
        if (this.state.sayText) {
            this.renderSpeechBubble(ctx, centerX, centerY, this.state.sayText);
        }
    }

    private renderDefaultSprite(ctx: CanvasRenderingContext2D): void {
        switch (this.state.spriteType) {
            case 'ball':
                this.renderBall(ctx);
                break;
            case 'arrow':
                this.renderArrow(ctx);
                break;
            case 'robot':
                this.renderRobot(ctx);
                break;
            case 'cat':
            default:
                this.renderCat(ctx);
                break;
        }
    }

    private renderCat(ctx: CanvasRenderingContext2D): void {
        const scale = this.state.size / 100;
        const size = 40 * scale;

        // Orange cat body
        ctx.fillStyle = '#FF8C1A';
        ctx.beginPath();
        ctx.ellipse(0, 0, size / 2, size / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-size / 5, -size / 8, size / 8, size / 6, 0, 0, Math.PI * 2);
        ctx.ellipse(size / 5, -size / 8, size / 8, size / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-size / 5, -size / 8, size / 16, 0, Math.PI * 2);
        ctx.arc(size / 5, -size / 8, size / 16, 0, Math.PI * 2);
        ctx.fill();
    }

    private renderBall(ctx: CanvasRenderingContext2D): void {
        const scale = this.state.size / 100;
        const radius = 20 * scale;

        // Gradient ball
        const gradient = ctx.createRadialGradient(-radius / 3, -radius / 3, 0, 0, 0, radius);
        gradient.addColorStop(0, '#6DD5FA');
        gradient.addColorStop(0.5, '#2980B9');
        gradient.addColorStop(1, '#1A5276');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(-radius / 3, -radius / 3, radius / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    private renderArrow(ctx: CanvasRenderingContext2D): void {
        const scale = this.state.size / 100;
        const size = 40 * scale;

        // Arrow pointing right
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);           // tip
        ctx.lineTo(-size / 4, -size / 3);  // top
        ctx.lineTo(-size / 4, -size / 6);  // notch top
        ctx.lineTo(-size / 2, -size / 6);  // tail top
        ctx.lineTo(-size / 2, size / 6);   // tail bottom
        ctx.lineTo(-size / 4, size / 6);   // notch bottom
        ctx.lineTo(-size / 4, size / 3);   // bottom
        ctx.closePath();
        ctx.fill();

        // Outline
        ctx.strokeStyle = '#922B21';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
    }

    private renderRobot(ctx: CanvasRenderingContext2D): void {
        const scale = this.state.size / 100;
        const size = 40 * scale;

        // Body (square)
        ctx.fillStyle = '#7D8C9C';
        ctx.fillRect(-size / 2.5, -size / 3, size / 1.25, size / 1.5);

        // Head
        ctx.fillStyle = '#5D6C7C';
        ctx.fillRect(-size / 3, -size / 2.2, size / 1.5, size / 4);

        // Eyes (LED style)
        ctx.fillStyle = '#2ECC71';
        ctx.beginPath();
        ctx.arc(-size / 6, -size / 3, size / 12, 0, Math.PI * 2);
        ctx.arc(size / 6, -size / 3, size / 12, 0, Math.PI * 2);
        ctx.fill();

        // Antenna
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

        // Bubble background
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 8);
        ctx.fill();
        ctx.stroke();

        // Bubble tail
        ctx.beginPath();
        ctx.moveTo(x - 5, bubbleY + bubbleHeight);
        ctx.lineTo(x, bubbleY + bubbleHeight + 8);
        ctx.lineTo(x + 5, bubbleY + bubbleHeight);
        ctx.closePath();
        ctx.fill();

        // Text
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, bubbleY + bubbleHeight / 2);
        ctx.restore();
    }
}
