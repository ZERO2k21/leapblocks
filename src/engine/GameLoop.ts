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

export const gameLoop = new GameLoop();
export default gameLoop;
