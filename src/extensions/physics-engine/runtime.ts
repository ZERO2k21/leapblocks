import Matter from 'matter-js';
import { spriteManager } from '../../engine/SpriteManager';
import { gameLoop } from '../../engine/GameLoop';
import { animationVM } from '../../vm/AnimationVM';

const STAGE_W = 480;
const STAGE_H = 360;
const HALF_W = STAGE_W / 2;
const HALF_H = STAGE_H / 2;

export class PhysicsEngineRuntime {
    private engine: Matter.Engine | null = null;
    private world: Matter.World | null = null;
    private bodies: Map<string, Matter.Body> = new Map();
    private collisionCallbacks: Map<string, Array<(otherSpriteId: string) => void>> = new Map();
    private _gravityX = 0;
    private _gravityY = 1;
    private _running = false;
    private _loopRegistered = false;
    private walls: Matter.Body[] = [];

    private getActiveSpriteId(): string {
        return (window as any).__activeSpriteId || '';
    }

    private getSpriteBody(spriteId: string): Matter.Body | null {
        return this.bodies.get(spriteId) || null;
    }

    start() {
        if (this._running) return;
        if (typeof Matter === 'undefined') {
            console.warn('[Physics] Matter.js not available');
            return;
        }

        this.engine = Matter.Engine.create({
            gravity: { x: this._gravityX, y: this._gravityY, scale: 0.001 }
        });
        this.world = this.engine.world;
        this._running = true;

        this.createWalls();
        this.registerCollisionEvents();
        this.hookGameLoop();

        console.log('[Physics] Engine started');
    }

    stop() {
        if (!this._running) return;
        this.unhookGameLoop();
        if (this.engine) {
            Matter.Engine.clear(this.engine);
        }
        this.bodies.clear();
        this.collisionCallbacks.clear();
        this.walls = [];
        this.engine = null;
        this.world = null;
        this._running = false;
        this._gravityX = 0;
        this._gravityY = 1;
        console.log('[Physics] Engine stopped');
    }

    private createWalls() {
        if (!this.world) return;
        const opts = { isStatic: true, friction: 0, restitution: 0.5, label: '_wall' } as Matter.IChamferableBodyDefinition;

        const bottom = Matter.Bodies.rectangle(0, HALF_H + 25, STAGE_W + 100, 50, opts);
        const top    = Matter.Bodies.rectangle(0, -HALF_H - 25, STAGE_W + 100, 50, opts);
        const left   = Matter.Bodies.rectangle(-HALF_W - 25, 0, 50, STAGE_H + 100, opts);
        const right  = Matter.Bodies.rectangle(HALF_W + 25, 0, 50, STAGE_H + 100, opts);

        this.walls = [bottom, top, left, right];
        Matter.Composite.add(this.world, this.walls);
    }

    private hookGameLoop() {
        if (this._loopRegistered) return;
        this._loopRegistered = true;
        gameLoop.addUpdateCallback(this.onGameLoopTick);
    }

    private unhookGameLoop() {
        if (!this._loopRegistered) return;
        this._loopRegistered = false;
        gameLoop.removeUpdateCallback(this.onGameLoopTick);
    }

    private onGameLoopTick = (deltaMs: number) => {
        if (!this._running || !this.engine) return;

        const deltaSec = Math.min(deltaMs / 1000, 0.05);
        Matter.Engine.update(this.engine, deltaSec * 1000);

        this.bodies.forEach((body, spriteId) => {
            const sprite = spriteManager.getSprite(spriteId);
            if (!sprite) return;
            sprite.setX(body.position.x);
            sprite.setY(body.position.y);
            const angleDeg = (body.angle * 180) / Math.PI;
            sprite.pointInDirection(90 - angleDeg);
        });
    };

    private registerCollisionEvents() {
        if (!this.engine) return;
        Matter.Events.on(this.engine, 'collisionStart', (event: Matter.IEventCollision<Matter.Engine>) => {
            for (const pair of event.pairs) {
                const spriteA = this.findSpriteForBody(pair.bodyA);
                const spriteB = this.findSpriteForBody(pair.bodyB);
                if (spriteA && spriteB) {
                    this.triggerCollision(spriteA, spriteB);
                    this.triggerCollision(spriteB, spriteA);
                }
            }
        });
    }

    private findSpriteForBody(body: Matter.Body): string | null {
        if (body.label === '_wall') return null;
        for (const [spriteId, b] of this.bodies) {
            if (b === body) return spriteId;
        }
        return null;
    }

    private triggerCollision(spriteId: string, otherSpriteId: string) {
        const cbs = this.collisionCallbacks.get(spriteId);
        if (cbs) cbs.forEach(cb => cb(otherSpriteId));
        animationVM.triggerPhysicsCollision(spriteId, otherSpriteId);
    }

    addBody(spriteId: string) {
        if (!this.world) {
            console.warn('[Physics] Engine not started');
            return;
        }
        if (this.bodies.has(spriteId)) return;

        const sprite = spriteManager.getSprite(spriteId);
        if (!sprite) {
            console.warn('[Physics] Sprite not found:', spriteId);
            return;
        }

        const costume = sprite.currentCostume;
        const w = (costume?.width || 80) * (sprite.size / 100);
        const h = (costume?.height || 80) * (sprite.size / 100);

        const body = Matter.Bodies.rectangle(sprite.x, sprite.y, w, h, {
            restitution: 0.5,
            friction: 0.1,
            frictionAir: 0.01,
            density: 0.001,
            label: spriteId,
        });

        Matter.Composite.add(this.world, body);
        this.bodies.set(spriteId, body);
        console.log(`[Physics] Body added for sprite: ${spriteId} (${w}x${h})`);
    }

    removeBody(spriteId: string) {
        const body = this.bodies.get(spriteId);
        if (!body || !this.world) return;
        Matter.Composite.remove(this.world, body);
        this.bodies.delete(spriteId);
        console.log(`[Physics] Body removed for sprite: ${spriteId}`);
    }

    setGravity(x: number, y: number) {
        this._gravityX = x;
        this._gravityY = y;
        if (this.engine) {
            this.engine.gravity.x = x;
            this.engine.gravity.y = y;
        }
    }

    addForce(spriteId: string, fx: number, fy: number) {
        const body = this.getSpriteBody(spriteId);
        if (!body) return;
        Matter.Body.applyForce(body, body.position, { x: fx, y: fy });
    }

    setBounce(spriteId: string, value: number) {
        const body = this.getSpriteBody(spriteId);
        if (!body) return;
        body.restitution = Math.max(0, Math.min(1, value));
    }

    setMass(spriteId: string, mass: number) {
        const body = this.getSpriteBody(spriteId);
        if (!body) return;
        Matter.Body.setMass(body, Math.max(0.01, mass));
    }

    setStatic(spriteId: string, isStatic: boolean) {
        const body = this.getSpriteBody(spriteId);
        if (!body) return;
        Matter.Body.setStatic(body, isStatic);
    }

    getVelocityX(spriteId: string): number {
        const body = this.getSpriteBody(spriteId);
        return body ? body.velocity.x : 0;
    }

    getVelocityY(spriteId: string): number {
        const body = this.getSpriteBody(spriteId);
        return body ? body.velocity.y : 0;
    }

    onCollision(spriteId: string, callback: (otherSpriteId: string) => void) {
        if (!this.collisionCallbacks.has(spriteId)) {
            this.collisionCallbacks.set(spriteId, []);
        }
        this.collisionCallbacks.get(spriteId)!.push(callback);
    }

    isRunning(): boolean {
        return this._running;
    }

    hasBody(spriteId: string): boolean {
        return this.bodies.has(spriteId);
    }
}
