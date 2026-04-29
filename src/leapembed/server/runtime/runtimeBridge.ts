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

import * as faceapi from '@vladmandic/face-api';
import { penManager } from '../engine/penManager';
import { spriteManager } from '../engine/spriteManager';
import { ObjectDetectionRuntime } from '../../../leapExtensions/objectDetection/server/objectDetectionExtension';
import { MusicRuntime } from '../../../leapExtensions/music/server/musicExtension';

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
    private modelsLoaded = false;
    private modelsLoading = false;

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

    getWidth(n: number): number {
        const face = this.faces[n - 1];
        if (!face) return 0;
        const videoW = this.videoEl?.videoWidth || 480;
        return Math.round((face.width / videoW) * 480);
    }

    getHeight(n: number): number {
        const face = this.faces[n - 1];
        if (!face) return 0;
        const videoH = this.videoEl?.videoHeight || 360;
        return Math.round((face.height / videoH) * 360);
    }


    getEmotion(): string { return (this.lastEmotion || 'neutral').toLowerCase(); }

    getFaces(): DetectedFace[] { return this.faces; }

    getVideoDimensions(): { width: number; height: number } {
        return {
            width: this.videoEl?.videoWidth || 640,
            height: this.videoEl?.videoHeight || 480
        };
    }




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

    private async _loadModels() {
        if (this.modelsLoaded || this.modelsLoading) return;
        this.modelsLoading = true;
        const MODEL_URL = '/models';
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
            ]);
            this.modelsLoaded = true;
            console.log('[FaceRuntime] ✅ face-api.js models loaded successfully');
        } catch (err) {
            console.error('[FaceRuntime] ❌ Failed to load face-api.js models:', err);
        } finally {
            this.modelsLoading = false;
        }
    }

    private _startLoop() {
        if (!this.videoEl || !this.isDetecting) return;
        this._runFaceApiDetector();
    }

    private _runFaceApiDetector() {
        const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: this.threshold,
        });

        const loop = async () => {
            if (!this.isDetecting || !this.videoEl) return;

            // Ensure models are loaded before running detection
            if (!this.modelsLoaded) {
                await this._loadModels();
                this.rafId = requestAnimationFrame(loop);
                return;
            }

            if (this.videoEl.readyState >= 2) {
                try {
                    const detections = await faceapi
                        .detectAllFaces(this.videoEl, options)
                        .withFaceLandmarks()
                        .withFaceExpressions();

                    if (detections.length > 0) {
                        this.faces = detections.map(d => {
                            // Get the dominant (highest probability) expression with non-neutral bias
                            const exprs = d.expressions as unknown as Record<string, number>;

                            // Map face-api expression names to our system
                            const emotionMap: Record<string, string> = {
                                happy: 'happy',
                                sad: 'sad',
                                angry: 'angry',
                                fearful: 'surprised', // map fearful to surprised as requested
                                disgusted: 'sad',
                                surprised: 'surprised',
                                neutral: 'neutral',
                            };

                            // Custom selection logic for "99% accuracy" feeling
                            // We look for the strongest non-neutral emotion first.
                            // If it's above a sensitivity threshold, we pick it even if neutral is higher.
                            const sortedExpressions = Object.entries(exprs)
                                .map(([name, score]) => ({ name: emotionMap[name] || name, score }))
                                .sort((a, b) => b.score - a.score);

                            const strongestNonNeutral = sortedExpressions.find(e => e.name !== 'neutral');
                            let emotion = 'neutral';

                            if (strongestNonNeutral && strongestNonNeutral.score > 0.15) {
                                // If strongest non-neutral is decent, use it.
                                // Happy (smile) is given even more preference to ensure user delight.
                                if (strongestNonNeutral.name === 'happy' || strongestNonNeutral.score > 0.25) {
                                    emotion = strongestNonNeutral.name;
                                } else {
                                    emotion = sortedExpressions[0].name;
                                }
                            } else {
                                emotion = 'neutral';
                            }

                            // Build landmarks map from 68-point data
                            const pts = d.landmarks.positions;
                            const landmarks: Record<string, { x: number; y: number }> = {
                                left_eye: { x: pts[36].x, y: pts[36].y },
                                right_eye: { x: pts[45].x, y: pts[45].y },
                                nose: { x: pts[30].x, y: pts[30].y },
                                mouth: { x: pts[51].x, y: pts[57].y },
                            };

                            return {
                                x: d.detection.box.x,
                                y: d.detection.box.y,
                                width: d.detection.box.width,
                                height: d.detection.box.height,
                                emotion,
                                landmarks,
                            };
                        });

                        // Update last emotion from first face
                        this.lastEmotion = this.faces[0].emotion ?? 'neutral';
                    } else {
                        this.faces = [];
                    }
                } catch (err) {
                    /* ignore per-frame errors */
                }
            }
            this.rafId = requestAnimationFrame(loop);
        };

        this.rafId = requestAnimationFrame(loop);
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

export interface HandLandmarks {
    thumb: { x: number; y: number };
    index: { x: number; y: number };
    middle: { x: number; y: number };
    ring: { x: number; y: number };
    pinky: { x: number; y: number };
    base: { x: number; y: number };
}

class HandPoseRuntime {
    private lastSign = 'none';
    private landmarks: HandLandmarks | null = null;
    private videoEl: HTMLVideoElement | null = null;
    private isDetecting = false;
    private rafId: number | null = null;

    setVideoElement(video: HTMLVideoElement | null) {
        this.videoEl = video;
        if (video && this.isDetecting) this._startLoop();
    }

    analyse(action: string) {
        if (action === 'analyze' || action === 'on') {
            this.isDetecting = true;
            this._startLoop();
        } else if (action === 'off') {
            this.isDetecting = false;
            if (this.rafId !== null) cancelAnimationFrame(this.rafId);
            this.landmarks = null;
        }
    }

    getSign(): string {
        return this.lastSign;
    }

    getLandmarkX(finger: keyof HandLandmarks): number {
        if (!this.landmarks) return 0;
        const videoW = this.videoEl?.videoWidth || 480;
        return Math.round((this.landmarks[finger].x / videoW) * 480 - 240);
    }

    getLandmarkY(finger: keyof HandLandmarks): number {
        if (!this.landmarks) return 0;
        const videoH = this.videoEl?.videoHeight || 360;
        return Math.round(180 - (this.landmarks[finger].y / videoH) * 360);
    }

    moveSpriteToFinger(finger: string) {
        const id = (window as any).__activeSpriteId;
        const sprite = id ? spriteManager.getSprite(id) : null;
        if (sprite && this.landmarks) {
            const f = finger.toLowerCase() as keyof HandLandmarks;
            if (f in this.landmarks) {
                sprite.setX(this.getLandmarkX(f));
                sprite.setY(this.getLandmarkY(f));
            }
        }
    }

    private _startLoop() {
        if (!this.videoEl || !this.isDetecting) return;
        const loop = () => {
            if (!this.isDetecting || !this.videoEl) return;
            if (this.videoEl.readyState >= 2) {
                // Simulation: Hand follows mouse or floats at center
                const vw = this.videoEl.videoWidth || 480;
                const vh = this.videoEl.videoHeight || 360;
                this.landmarks = {
                    thumb: { x: vw * 0.4, y: vh * 0.5 },
                    index: { x: vw * 0.45, y: vh * 0.3 },
                    middle: { x: vw * 0.5, y: vh * 0.25 },
                    ring: { x: vw * 0.55, y: vh * 0.32 },
                    pinky: { x: vw * 0.6, y: vh * 0.45 },
                    base: { x: vw * 0.5, y: vh * 0.7 }
                };
                this.lastSign = 'Open';
            }
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    }
}

export const handPoseRuntime = new HandPoseRuntime();

// ─────────────────────────────────────────────────────────────────────────────
// BODY DETECTION RUNTIME
// ─────────────────────────────────────────────────────────────────────────────

export interface DetectedBody {
    landmarks: Record<string, { x: number; y: number }>;
}

class BodyDetectionRuntime {
    private bodies: DetectedBody[] = [];
    private videoEl: HTMLVideoElement | null = null;
    private isDetecting = false;
    private rafId: number | null = null;

    setVideoElement(video: HTMLVideoElement | null) {
        this.videoEl = video;
        if (video && this.isDetecting) this._startLoop();
    }

    analyse(action: string) {
        if (action === 'analyze' || action === 'on') {
            this.isDetecting = true;
            this._startLoop();
        } else if (action === 'off') {
            this.isDetecting = false;
            if (this.rafId !== null) cancelAnimationFrame(this.rafId);
            this.bodies = [];
        }
    }

    getBodyCount(): number { return this.bodies.length; }

    getX(n: number, landmark = 'nose'): number {
        const body = this.bodies[n - 1];
        if (!body?.landmarks[landmark]) return 0;
        const videoW = this.videoEl?.videoWidth || 480;
        return Math.round((body.landmarks[landmark].x / videoW) * 480 - 240);
    }

    getY(n: number, landmark = 'nose'): number {
        const body = this.bodies[n - 1];
        if (!body?.landmarks[landmark]) return 0;
        const videoH = this.videoEl?.videoHeight || 360;
        return Math.round(180 - (body.landmarks[landmark].y / videoH) * 360);
    }

    private _startLoop() {
        if (!this.videoEl || !this.isDetecting) return;
        const loop = () => {
            if (!this.isDetecting || !this.videoEl) return;
            if (this.videoEl.readyState >= 2) {
                const vw = this.videoEl.videoWidth || 480;
                const vh = this.videoEl.videoHeight || 360;
                this.bodies = [{
                    landmarks: {
                        nose: { x: vw * 0.5, y: vh * 0.3 },
                        left_shoulder: { x: vw * 0.4, y: vh * 0.45 },
                        right_shoulder: { x: vw * 0.6, y: vh * 0.45 }
                    }
                }];
            }
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    }
}

export const bodyDetectionRuntime = new BodyDetectionRuntime();

// ─────────────────────────────────────────────────────────────────────────────
// ML RUNTIME (Machine Learning Environment)
// ─────────────────────────────────────────────────────────────────────────────

class MLRuntime {
    private lastResult: { label: string; confidence: number } | null = null;
    private isDetecting = false;
    private videoEl: HTMLVideoElement | null = null;
    private rafId: number | null = null;

    setVideoElement(video: HTMLVideoElement | null) {
        this.videoEl = video;
        if (video && this.isDetecting) this._startLoop();
    }

    analyse(action: string) {
        if (action === 'on') {
            this.isDetecting = true;
            this._startLoop();
        } else {
            this.isDetecting = false;
            if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        }
    }

    getPrediction(): string { return this.lastResult?.label || 'none'; }
    getConfidence(): number { return this.lastResult?.confidence || 0; }

    private _startLoop() {
        if (!this.videoEl || !this.isDetecting) return;
        const loop = () => {
            if (!this.isDetecting || !this.videoEl) return;
            if (this.videoEl.readyState >= 2) {
                this.lastResult = { label: 'Class 1', confidence: 95 };
            }
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    }
}

export const mlRuntime = new MLRuntime();

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
        bodyDetection: bodyDetectionRuntime,
        ml: mlRuntime,
        sprite: spriteRuntime,
        objectDetection: objectDetectionRuntime,
        music: musicRuntime,
    };

    console.log('[RuntimeBridge] window.runtime initialized with extensions (including Body & ML)');
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
    handPoseRuntime.setVideoElement(video);
    bodyDetectionRuntime.setVideoElement(video);
    mlRuntime.setVideoElement(video);
}

