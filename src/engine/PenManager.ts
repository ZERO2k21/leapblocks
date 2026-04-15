/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * Unauthorized copying, distribution, or modification is strictly prohibited.
 */
// PenManager.ts - Handles pen drawing operations on the stage

export class PenManager {
    private static instance: PenManager;
    private penCanvas: HTMLCanvasElement | null = null;
    private penCtx: CanvasRenderingContext2D | null = null;

    private constructor() {}

    static getInstance(): PenManager {
        if (!PenManager.instance) {
            PenManager.instance = new PenManager();
        }
        return PenManager.instance;
    }

    setPenCanvas(canvas: HTMLCanvasElement | null) {
        this.penCanvas = canvas;
        this.penCtx = canvas ? canvas.getContext('2d') : null;
        if (canvas && this.penCtx) {
            // Set default pen style
            this.penCtx.lineCap = 'round';
            this.penCtx.lineJoin = 'round';
        }
    }

    clear() {
        if (this.penCtx && this.penCanvas) {
            this.penCtx.clearRect(0, 0, this.penCanvas.width, this.penCanvas.height);
        }
    }

    /**
     * Draw a line from previous position to current position
     */
    drawLine(
        fromX: number, fromY: number,
        toX: number, toY: number,
        color: string,
        size: number
    ) {
        if (!this.penCtx) return;
        this.penCtx.beginPath();
        this.penCtx.moveTo(fromX, fromY);
        this.penCtx.lineTo(toX, toY);
        this.penCtx.strokeStyle = color;
        this.penCtx.lineWidth = size;
        this.penCtx.stroke();
    }

    /**
     * Stamp the sprite's costume onto the canvas at the sprite's position
     */
    stamp(
        costumeImage: HTMLImageElement,
        costumeWidth: number,
        costumeHeight: number,
        spriteX: number,
        spriteY: number,
        spriteSize: number,
        spriteDirection: number,
        rotationStyle: 'left-right' | 'all around' | 'none'
    ) {
        if (!this.penCtx || !costumeImage) return;

        const canvas = this.penCanvas!;
        const centerX = canvas.width / 2 + spriteX;
        const centerY = canvas.height / 2 - spriteY;
        const scale = spriteSize / 100;
        const w = costumeWidth * scale;
        const h = costumeHeight * scale;

        this.penCtx.save();
        this.penCtx.translate(centerX, centerY);

        // Handle rotation
        if (rotationStyle === 'all around') {
            this.penCtx.rotate((spriteDirection - 90) * Math.PI / 180);
        } else if (rotationStyle === 'left-right' && (spriteDirection > 180 || spriteDirection < 0)) {
            this.penCtx.scale(-1, 1);
        }

        this.penCtx.drawImage(costumeImage, -w / 2, -h / 2, w, h);
        this.penCtx.restore();
    }

    /**
     * Check if pen canvas is ready
     */
    isReady(): boolean {
        return this.penCtx !== null && this.penCanvas !== null;
    }
}

export const penManager: PenManager = new Proxy({} as PenManager, {
    get(_target, prop) {
        const instance = PenManager.getInstance();
        const value = (instance as any)[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
    set(_target, prop, value) { (PenManager.getInstance() as any)[prop] = value; return true; }
});
