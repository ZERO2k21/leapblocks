class GameLoop {
    private animationId: number | null = null;
    private lastTime: number = 0;
    private callbacks: Set<(deltaMs: number) => void> = new Set();
    private isRunning: boolean = false;

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    stop() {
        this.isRunning = false;
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    addUpdateCallback(callback: (deltaMs: number) => void) {
        this.callbacks.add(callback);
    }

    removeUpdateCallback(callback: (deltaMs: number) => void) {
        this.callbacks.delete(callback);
    }

    private loop = (time: number) => {
        if (!this.isRunning) return;

        const deltaMs = time - this.lastTime;
        this.lastTime = time;

        this.callbacks.forEach(cb => cb(deltaMs));

        this.animationId = requestAnimationFrame(this.loop);
    };
}

let _gameLoop: GameLoop | null = null;
export function getGameLoop(): GameLoop {
    if (!_gameLoop) _gameLoop = new GameLoop();
    return _gameLoop;
}
export const gameLoop: GameLoop = new Proxy({} as GameLoop, {
    get(_target, prop) {
        const instance = getGameLoop();
        const value = (instance as any)[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
    set(_target, prop, value) { (getGameLoop() as any)[prop] = value; return true; }
});
export default gameLoop;
