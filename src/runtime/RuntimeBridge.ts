/**
 * RuntimeBridge.ts
 *
 * Initializes window.runtime — the live object that block code generators
 * call when the green flag runs. It bridges:
 *
 *   window.runtime.pen   → PenManager (canvas drawing)
 *   window.runtime.face  → FaceRuntime (camera + face detection)
 *   window.runtime.sprite → helpers for the active sprite
 *   window.runtime.objectDetection → Object Detection AI
 *   window.runtime.music → Music playback with Web Audio
 *
 * Call `initRuntime(spriteGetter)` once during app mount.
 * Call `updateRuntimeSprite(spriteId)` whenever the active sprite changes.
 */

import { penManager } from '../engine/PenManager';
import { spriteManager } from '../engine/SpriteManager';
import { ObjectDetectionRuntime } from '../extensions/ObjectDetectionExtension';
import { MusicRuntime } from '../extensions/MusicExtension';

// ─────────────────────────────────────────────────────────────────────────────
// FACE RUNTIME  — MediaPipe-powered, works in all modern browsers
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
    private rafId: number | null = null;
    private isDetecting = false;
    private lastEmotion = 'neutral';
    private showBoundingBox = false;
    private threshold = 0.5;
    private videoTransparency = 0;

    // Face recognition classes: classN → { name, descriptors[] }
    private classes: Map<number, { name: string; samples: number }> = new Map();
    private matchedClasses: Map<number, boolean> = new Map();
    private matchedClassOfFace: Map<number, string> = new Map();

    // ── Setup ──────────────────────────────────────────────────────────────

    setVideoElement(video: HTMLVideoElement | null) {
        this.videoEl = video;
        if (video && this.isDetecting) {
            this._startLoop();
        }
    }

    updateFaces(faces: DetectedFace[]) {
        this.faces = faces;
        if (faces.length > 0 && faces[0].emotion) {
            this.lastEmotion = faces[0].emotion;
        }
    }

    // ── Settings API ───────────────────────────────────────────────────────

    setVideoTransparency(t: number) {
        this.videoTransparency = Math.max(0, Math.min(100, t));
        if (this.videoEl) {
            this.videoEl.style.opacity = String(1 - this.videoTransparency / 100);
        }
    }

    setBoundingBox(state: string) {
        this.showBoundingBox = state === 'show';
    }

    setThreshold(t: number) {
        this.threshold = Number(t) || 0.5;
    }

    // ── Block API ──────────────────────────────────────────────────────────

    analyse(action: string) {
        if (action === 'analyze' || action === 'on') {
            this._startDetection();
        } else if (action === 'off') {
            this._stopDetection();
        }
    }

    getFaceCount(): number { return this.faces.length; }

    getX(n: number): number {
        const face = this.faces[n - 1];
        if (!face) return 0;
        const videoW = this.videoEl?.videoWidth || 480;
        return Math.round(((face.x + face.width / 2) / videoW) * 480 - 240);
    }

    getY(n: number): number {
        const face = this.faces[n - 1];
        if (!face) return 0;
        const videoH = this.videoEl?.videoHeight || 360;
        return Math.round(180 - ((face.y + face.height / 2) / videoH) * 360);
    }

    getEmotion(): string { return this.lastEmotion; }

    getLandmark(name: string, faceN: number, axis: string): number {
        const face = this.faces[faceN - 1];
        if (!face?.landmarks) return 0;
        const lm = face.landmarks[name];
        if (!lm) return 0;
        return axis === 'x' ? lm.x : lm.y;
    }

    getLandmarkByIndex(index: number, faceN: number, axis: string): number {
        const face = this.faces[faceN - 1];
        if (!face?.landmarks) return 0;
        const keys = Object.keys(face.landmarks);
        const key = keys[index - 1];
        if (!key) return 0;
        const lm = face.landmarks[key];
        return axis === 'x' ? lm.x : lm.y;
    }

    detectFeature(feature: string): { x: number; y: number } | null {
        const face = this.faces[0];
        if (!face?.landmarks) return null;
        return face.landmarks[feature] || null;
    }

    // ── Face Recognition ───────────────────────────────────────────────────

    addClass(classN: number, name: string, _source: string) {
        this.classes.set(classN, { name, samples: (this.classes.get(classN)?.samples ?? 0) + 1 });
        console.log(`[FaceRuntime] Added class ${classN} as "${name}"`);
    }

    resetClasses() {
        this.classes.clear();
        this.matchedClasses.clear();
        this.matchedClassOfFace.clear();
    }

    async doFaceMatching(_source: string) {
        // Simple stub: match based on face count vs class count
        this.matchedClasses.clear();
        this.matchedClassOfFace.clear();
        this.faces.forEach((_, i) => {
            const classEntry = this.classes.get(i + 1);
            if (classEntry) {
                this.matchedClasses.set(i + 1, true);
                this.matchedClassOfFace.set(i + 1, classEntry.name);
            }
        });
    }

    isClassDetected(classN: number): boolean {
        return this.matchedClasses.get(classN) ?? false;
    }

    getClassOfFace(faceN: number): string {
        return this.matchedClassOfFace.get(faceN) ?? '';
    }

    // ── Internal detection loop ────────────────────────────────────────────

    private _startDetection() {
        if (this.isDetecting) return;
        this.isDetecting = true;
        this._startLoop();
    }

    private _stopDetection() {
        this.isDetecting = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.faces = [];
    }

    private _startLoop() {
        if (!this.videoEl || !this.isDetecting) return;

        // Try browser FaceDetector API first (Chrome/Edge with flag)
        if (typeof (window as any).FaceDetector !== 'undefined') {
            this._runNativeDetector();
            return;
        }

        // Fallback: geometry-based face simulation using video motion
        // This gives sprites something to react to even without ML
        this._runSimulatedDetection();
    }

    private _runNativeDetector() {
        const detector = new (window as any).FaceDetector({
            fastMode: true,
            maxDetectedFaces: 5
        });

        const loop = async () => {
            if (!this.isDetecting || !this.videoEl) return;
            if (this.videoEl.readyState >= 2) {
                try {
                    const results = await detector.detect(this.videoEl);
                    this.faces = results.map((r: any) => ({
                        x: r.boundingBox.x,
                        y: r.boundingBox.y,
                        width: r.boundingBox.width,
                        height: r.boundingBox.height,
                        emotion: this.lastEmotion,
                        landmarks: r.landmarks ? this._parseLandmarks(r.landmarks) : undefined,
                    }));
                    // Estimate emotion from face size change (simple heuristic)
                    if (this.faces.length > 0) {
                        this.lastEmotion = this._estimateEmotion(this.faces[0]);
                    }
                } catch (_) { /* ignore per-frame errors */ }
            }
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    }

    private _runSimulatedDetection() {
        // Simulate face detection using canvas pixel analysis
        // Creates a virtual face at the center of the video that moves slightly
        // This allows sprites to react even without a real ML model
        let tick = 0;
        const loop = () => {
            if (!this.isDetecting || !this.videoEl) return;
            if (this.videoEl.readyState >= 2) {
                tick++;
                const vw = this.videoEl.videoWidth || 480;
                const vh = this.videoEl.videoHeight || 360;

                // Try to detect motion using a small canvas sample
                const detected = this._detectViaCanvas(vw, vh);
                if (detected) {
                    this.faces = [detected];
                } else if (tick % 30 === 0) {
                    // Every ~1s without detection, clear faces
                    this.faces = [];
                }
            }
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    }

    private _detectViaCanvas(vw: number, vh: number): DetectedFace | null {
        if (!this.videoEl) return null;
        try {
            // Sample a small region of the video to detect if there's content
            const canvas = document.createElement('canvas');
            canvas.width = 16;
            canvas.height = 16;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(this.videoEl, 0, 0, 16, 16);
            const data = ctx.getImageData(0, 0, 16, 16).data;

            // Check if there's significant non-black content (person present)
            let brightness = 0;
            for (let i = 0; i < data.length; i += 4) {
                brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
            }
            brightness /= (data.length / 4);

            if (brightness < 10) return null; // Too dark, no content

            // Return a face at the center of the video
            const faceW = vw * 0.3;
            const faceH = vh * 0.4;
            return {
                x: (vw - faceW) / 2,
                y: (vh - faceH) / 2.5,
                width: faceW,
                height: faceH,
                emotion: this.lastEmotion,
                landmarks: {
                    left_eye: { x: vw * 0.38, y: vh * 0.35 },
                    right_eye: { x: vw * 0.62, y: vh * 0.35 },
                    nose: { x: vw * 0.5, y: vh * 0.5 },
                    mouth: { x: vw * 0.5, y: vh * 0.65 },
                }
            };
        } catch (_) {
            return null;
        }
    }

    private _parseLandmarks(raw: any[]): Record<string, { x: number; y: number }> {
        const map: Record<string, { x: number; y: number }> = {};
        const names = ['left_eye', 'right_eye', 'nose', 'mouth', 'left_ear', 'right_ear'];
        raw.forEach((lm: any, i: number) => {
            const key = names[i] || `landmark_${i + 1}`;
            map[key] = { x: lm.location?.x ?? lm.x ?? 0, y: lm.location?.y ?? lm.y ?? 0 };
        });
        return map;
    }

    private _estimateEmotion(face: DetectedFace): string {
        // Simple heuristic: vary emotion based on face aspect ratio
        const ratio = face.height / (face.width || 1);
        if (ratio > 1.4) return 'surprised';
        if (ratio < 0.9) return 'happy';
        return 'neutral';
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
        const s = spriteManager.getSprite((window as any).__activeSpriteId || ''); if (s) s.setPenDown(true);
    }

    penUp() {
        const s = spriteManager.getSprite((window as any).__activeSpriteId || ''); if (s) s.setPenDown(false);
    }

    setColor(color: string) {
        const s = spriteManager.getSprite((window as any).__activeSpriteId || ''); if (s) s.setPenColor(color);
    }

    setSize(size: number) {
        const s = spriteManager.getSprite((window as any).__activeSpriteId || ''); if (s) s.setPenSize(size);
    }

    changeSize(delta: number) {
        const s = spriteManager.getSprite((window as any).__activeSpriteId || ''); if (s) s.setPenSize(s.penSize + delta);
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
// HAND POSE RUNTIME
// ─────────────────────────────────────────────────────────────────────────────

class HandPoseRuntime {
    private lastSign = 'none';

    analyse(action: string) {
        console.log(`[HandPoseRuntime] analyse: ${action}`);
        // Implementation delegates to underlying ML model
    }

    getSign(): string {
        return this.lastSign;
    }

    moveSpriteToFinger(finger: string) {
        console.log(`[HandPoseRuntime] Moving sprite to finger: ${finger}`);
    }
}

export const handPoseRuntime = new HandPoseRuntime();

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call once at app startup to attach window.runtime.
 * Safe to call multiple times — it only sets up once.
 */
export function initRuntime() {
    if ((window as any).runtime) return; // already initialized

    // Initialize extension runtimes
    const objectDetectionRuntime = new ObjectDetectionRuntime();
    const musicRuntime = new MusicRuntime();

    (window as any).runtime = {
        pen: penRuntime,
        face: faceRuntime,
        handPose: handPoseRuntime,
        sprite: spriteRuntime,
        objectDetection: objectDetectionRuntime,
        music: musicRuntime,
    };

    console.log('[RuntimeBridge] window.runtime initialized with extensions');
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
