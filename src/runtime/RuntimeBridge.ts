/**
 * RuntimeBridge.ts
 *
 * Initializes window.runtime — the live object that block code generators
 * call when the green flag runs. It bridges:
 *
 *   window.runtime.pen   → PenManager (canvas drawing)
 *   window.runtime.face  → FaceRuntime (camera + face detection)
 *   window.runtime.sprite → helpers for the active sprite
 *
 * Call `initRuntime(spriteGetter)` once during app mount.
 * Call `updateRuntimeSprite(spriteId)` whenever the active sprite changes.
 */

import { penManager } from '../engine/PenManager';
import { spriteManager } from '../engine/SpriteManager';

// ─────────────────────────────────────────────────────────────────────────────
// FACE RUNTIME
// ─────────────────────────────────────────────────────────────────────────────

export interface DetectedFace {
    x: number;
    y: number;
    width: number;
    height: number;
    emotion?: string;
    landmarks?: Record<string, { x: number; y: number }>;
}

class FaceRuntime {
    private faces: DetectedFace[] = [];
    private videoEl: HTMLVideoElement | null = null;
    private detectionInterval: ReturnType<typeof setInterval> | null = null;
    private isDetecting = false;
    private lastEmotion = 'neutral';

    /** Called by Stage when the video element is ready */
    setVideoElement(video: HTMLVideoElement | null) {
        this.videoEl = video;
    }

    /** Update detected faces from external detector (e.g. MediaPipe callback) */
    updateFaces(faces: DetectedFace[]) {
        this.faces = faces;
        if (faces.length > 0 && faces[0].emotion) {
            this.lastEmotion = faces[0].emotion;
        }
    }

    // ── Block API ──────────────────────────────────────────────────────────

    /** Start/stop/flip camera — delegates to isCameraOn state via callback */
    analyse(action: string) {
        if (action === 'analyze' || action === 'on') {
            this.startDetection();
        } else if (action === 'off') {
            this.stopDetection();
        }
        // 'flip' is a visual concern handled by the Stage component
    }

    getFaceCount(): number {
        return this.faces.length;
    }

    /** Get X position of face N (1-based) in Scratch coordinates */
    getX(n: number): number {
        const face = this.faces[n - 1];
        if (!face) return 0;
        // Convert from video pixel coords to Scratch stage coords (-240..240)
        const videoW = this.videoEl?.videoWidth || 480;
        return Math.round(((face.x + face.width / 2) / videoW) * 480 - 240);
    }

    /** Get Y position of face N (1-based) in Scratch coordinates */
    getY(n: number): number {
        const face = this.faces[n - 1];
        if (!face) return 0;
        const videoH = this.videoEl?.videoHeight || 360;
        return Math.round(180 - ((face.y + face.height / 2) / videoH) * 360);
    }

    getEmotion(): string {
        return this.lastEmotion;
    }

    detectFeature(feature: string): { x: number; y: number } | null {
        const face = this.faces[0];
        if (!face || !face.landmarks) return null;
        return face.landmarks[feature] || null;
    }

    // ── Internal detection loop ────────────────────────────────────────────

    private startDetection() {
        if (this.isDetecting) return;
        this.isDetecting = true;

        // Use the browser's built-in FaceDetector API if available
        if (typeof (window as any).FaceDetector !== 'undefined') {
            const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
            this.detectionInterval = setInterval(async () => {
                if (!this.videoEl || this.videoEl.readyState < 2) return;
                try {
                    const results = await detector.detect(this.videoEl);
                    this.faces = results.map((r: any) => ({
                        x: r.boundingBox.x,
                        y: r.boundingBox.y,
                        width: r.boundingBox.width,
                        height: r.boundingBox.height,
                    }));
                } catch (_) {
                    // FaceDetector may throw on some frames — ignore
                }
            }, 200);
        } else {
            // Fallback: no native detector — faces stay empty until updated externally
            console.warn('[FaceRuntime] FaceDetector API not available. Use updateFaces() to supply data.');
        }
    }

    private stopDetection() {
        this.isDetecting = false;
        if (this.detectionInterval !== null) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
        this.faces = [];
    }
}

export const faceRuntime = new FaceRuntime();

// ─────────────────────────────────────────────────────────────────────────────
// PEN RUNTIME WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thin wrapper so block generators can call window.runtime.pen.*
 * All heavy lifting is in PenManager; this just exposes a clean API
 * and keeps per-sprite pen state (color, size, isDown).
 */
class PenRuntime {
    eraseAll() {
        penManager.clear();
    }

    penDown() {
        const sprite = this._activeSprite();
        if (sprite) sprite.penDown = true;
    }

    penUp() {
        const sprite = this._activeSprite();
        if (sprite) sprite.penDown = false;
    }

    setColor(color: string) {
        const sprite = this._activeSprite();
        if (sprite) sprite.penColor = color;
    }

    setSize(size: number) {
        const sprite = this._activeSprite();
        if (sprite) sprite.penSize = size;
    }

    changeSize(delta: number) {
        const sprite = this._activeSprite();
        if (sprite) sprite.penSize = Math.max(1, (sprite.penSize || 1) + delta);
    }

    stamp() {
        const sprite = this._activeSprite();
        if (!sprite) return;
        // Stamp the sprite's current costume onto the pen canvas
        const costume = sprite.getCurrentCostumeImage?.();
        if (costume) {
            penManager.stamp(
                costume,
                costume.naturalWidth || 96,
                costume.naturalHeight || 96,
                sprite.x,
                sprite.y,
                sprite.size,
                sprite.direction,
                sprite.rotationStyle || 'all around'
            );
        }
    }

    private _activeSprite() {
        const id = (window as any).__activeSpriteId as string | undefined;
        return id ? spriteManager.getSprite(id) : undefined;
    }
}

export const penRuntime = new PenRuntime();

// ─────────────────────────────────────────────────────────────────────────────
// SPRITE RUNTIME HELPERS  (window.runtime.sprite)
// ─────────────────────────────────────────────────────────────────────────────

const spriteRuntime = {
    getX(id?: string): number {
        const s = spriteManager.getSprite(id || (window as any).__activeSpriteId || '');
        return s?.x ?? 0;
    },
    getY(id?: string): number {
        const s = spriteManager.getSprite(id || (window as any).__activeSpriteId || '');
        return s?.y ?? 0;
    },
    getDirection(id?: string): number {
        const s = spriteManager.getSprite(id || (window as any).__activeSpriteId || '');
        return s?.direction ?? 90;
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call once at app startup to attach window.runtime.
 * Safe to call multiple times — it only sets up once.
 */
export function initRuntime() {
    if ((window as any).runtime) return; // already initialized

    (window as any).runtime = {
        pen: penRuntime,
        face: faceRuntime,
        sprite: spriteRuntime,
    };

    console.log('[RuntimeBridge] window.runtime initialized');
}

/**
 * Update which sprite is "active" so pen/sprite helpers target the right one.
 * Call this whenever the selected sprite changes or a script starts for a sprite.
 */
export function setActiveSpriteId(id: string) {
    (window as any).__activeSpriteId = id;
}

/**
 * Give the FaceRuntime a reference to the live video element.
 * Call this from Stage.tsx after the video element mounts.
 */
export function setFaceVideoElement(video: HTMLVideoElement | null) {
    faceRuntime.setVideoElement(video);
}
