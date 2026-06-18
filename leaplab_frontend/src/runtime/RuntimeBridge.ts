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
import { penManager } from '../engine/PenManager';
import { spriteManager } from '../engine/SpriteManager';
import { ObjectDetectionRuntime } from '../extensions/object-detection/runtime';
import { MusicRuntime } from '../extensions/music/runtime';
import { OCRRuntime } from '../extensions/text-recognition/runtime';
import { TTSRuntime } from '../extensions/text-to-speech/runtime';
import { SpeechRecognitionRuntime } from '../extensions/speech-recognition/runtime';
import { VideoSensingRuntime } from '../extensions/video-sensing/runtime';
import { QRScannerRuntime } from '../extensions/qr-scanner/runtime';
import { PhysicsEngineRuntime } from '../extensions/physics-engine/runtime';
import { MakeyMakeyRuntime } from '../extensions/makey-makey/runtime';
import { VideoPlayerRuntime } from '../extensions/video-player/runtime';
import { HandPoseRuntime } from '../extensions/HandPose';

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
                                left_eye:  { x: pts[36].x, y: pts[36].y },
                                right_eye: { x: pts[45].x, y: pts[45].y },
                                nose:      { x: pts[30].x, y: pts[30].y },
                                mouth:     { x: pts[51].x, y: pts[57].y },
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

/** Convert pen color number (0-200) to hex color */
function penNumberToHex(value: number): string {
    if (value <= 0) return '#000000';
    if (value >= 200) return '#FFFFFF';
    const hue = (value / 200) * 360;
    const h = hue / 360;
    const s = 1;
    const l = 0.5;
    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1 / 3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1 / 3);
    const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

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

    setColorByNumber(value: number) {
        const hex = penNumberToHex(value);
        const s = spriteManager.getSprite((window as any).__activeSpriteId || ''); if (s) s.setPenColor(hex);
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

export const handPoseRuntime = new HandPoseRuntime();

// ─────────────────────────────────────────────────────────────────────────────
// BODY DETECTION RUNTIME — MoveNet real pose detection
// ─────────────────────────────────────────────────────────────────────────────

export interface DetectedBody {
    landmarks: Record<string, { x: number; y: number; score?: number }>;
}

// MoveNet keypoint name mapping: our dropdown names → MoveNet keypoint indices
const BODY_PART_MAP: Record<string, number> = {
    nose: 0,
    left_eye: 1,
    right_eye: 2,
    left_ear: 3,
    right_ear: 4,
    left_shoulder: 5,
    right_shoulder: 6,
    left_elbow: 7,
    right_elbow: 8,
    left_wrist: 9,
    right_wrist: 10,
    left_hip: 11,
    right_hip: 12,
    left_knee: 13,
    right_knee: 14,
    left_ankle: 15,
    right_ankle: 16,
    // aliases used by blocks
    left_hand: 9,
    right_hand: 10,
};

class BodyDetectionRuntime {
    public bodyCount = 0;
    public bodies: DetectedBody[] = [];
    public isCameraOn = false;
    private videoEl: HTMLVideoElement | null = null;
    private analyzeInterval: ReturnType<typeof setInterval> | null = null;
    private lastAnalyzeTime = 0;

    // MoveNet detector (lazy loaded)
    private detector: any = null;
    private detectorLoading = false;
    private detectorReady = false;

    setCameraOn(state: string) {
        this.isCameraOn = (state === "on");
        if (this.isCameraOn) {
            if (!this.videoEl) {
                this.videoEl = document.querySelector('video') || document.getElementById('stageVideo') as HTMLVideoElement;
            }
            this._startDetection();
        } else {
            this._stopDetection();
        }
    }

    analyse(action: string) {
        if (action === 'on' || action === 'analyze') {
            this.setCameraOn("on");
        } else if (action === 'off') {
            this.setCameraOn("off");
        }
    }

    private async _loadDetector() {
        if (this.detectorReady || this.detector) return;
        if (this.detectorLoading) {
            // Wait for ongoing load
            await new Promise<void>((resolve) => {
                const check = setInterval(() => {
                    if (this.detectorReady) { clearInterval(check); resolve(); }
                    if (!this.detectorLoading && !this.detectorReady) { clearInterval(check); resolve(); }
                }, 200);
            });
            return;
        }

        this.detectorLoading = true;
        try {
            // Dynamic import TF.js + pose-detection via npm (bundled by Vite)
            const tf = await import('@tensorflow/tfjs');
            await tf.ready();

            const poseDetection = await import('@tensorflow-models/pose-detection');

            if (poseDetection && poseDetection.createDetector) {
                this.detector = await poseDetection.createDetector(
                    poseDetection.SupportedModels.MoveNet,
                    { modelType: poseDetection.movenet?.modelType?.SINGLEPOSE_LIGHTNING || 'SinglePose.Lightning' }
                );
                this.detectorReady = true;
                console.log('[BodyDetection] MoveNet detector ready');
            } else {
                console.warn('[BodyDetection] pose-detection not available, using fallback');
            }
        } catch (err) {
            console.warn('[BodyDetection] Could not load MoveNet:', err);
        } finally {
            this.detectorLoading = false;
        }
    }

    private _startDetection() {
        this._stopDetection();
        this.analyzeInterval = setInterval(() => {
            if (this.isCameraOn) this._detectPerson();
        }, 120);
    }

    private _stopDetection() {
        if (this.analyzeInterval) {
            clearInterval(this.analyzeInterval);
            this.analyzeInterval = null;
        }
        this.bodyCount = 0;
        this.bodies = [];
    }

    private async _detectPerson() {
        if (!this.isCameraOn) return;
        const now = Date.now();
        if (now - this.lastAnalyzeTime < 100) return;
        this.lastAnalyzeTime = now;

        // Lazy-load the detector
        if (!this.detectorReady) {
            await this._loadDetector();
        }

        if (this.detector && this.videoEl && this.videoEl.readyState >= 2) {
            try {
                const poses = await this.detector.estimatePoses(this.videoEl);
                const videoW = this.videoEl.videoWidth || 640;
                const videoH = this.videoEl.videoHeight || 480;

                this.bodies = poses.map((pose: any) => {
                    const landmarks: Record<string, { x: number; y: number; score?: number }> = {};
                    for (const kp of pose.keypoints) {
                        // Map keypoint name to our format
                        const name = kp.name || '';
                        // Convert video coords → stage coords (480x360, origin center)
                        const stageX = Math.round((kp.x / videoW) * 480 - 240);
                        const stageY = Math.round(180 - (kp.y / videoH) * 360);
                        landmarks[name] = { x: stageX, y: stageY, score: kp.score };
                    }
                    return { landmarks };
                });

                this.bodyCount = this.bodies.length;
            } catch (err) {
                // Silently handle per-frame errors
            }
        } else {
            // Fallback when no detector: no bodies detected
            this.bodies = [];
            this.bodyCount = 0;
        }
    }

    getBodyCount(): number {
        return this.bodyCount;
    }

    getX(part: string, bodyIndex = 1): number {
        const body = this.bodies[bodyIndex - 1];
        if (!body) return 0;
        // Try direct match first, then alias
        const lm = body.landmarks[part] || body.landmarks[part.replace(' ', '_')];
        return lm?.x ?? 0;
    }

    getY(part: string, bodyIndex = 1): number {
        const body = this.bodies[bodyIndex - 1];
        if (!body) return 0;
        const lm = body.landmarks[part] || body.landmarks[part.replace(' ', '_')];
        return lm?.y ?? 0;
    }

    setVideoElement(video: HTMLVideoElement | null) {
        this.videoEl = video;
    }

    isVideoReady(): boolean {
        return !!(this.videoEl && this.videoEl.readyState >= 2);
    }

    waitForFirstDetection(_timeoutMs = 5000): Promise<void> {
        return Promise.resolve();
    }
}

export const bodyDetectionRuntime = new BodyDetectionRuntime();

// ─────────────────────────────────────────────────────────────────────────────
// ML RUNTIME — MobileNet + KNN classifier for image classification
// ─────────────────────────────────────────────────────────────────────────────

interface MLExample {
    embedding: any; // TF.js tensor
    label: string;
}

class MLRuntime {
    private lastPrediction: string = 'none';
    private lastConfidence: number = 0;
    private isDetecting = false;
    private videoEl: HTMLVideoElement | null = null;
    private rafId: number | null = null;

    // MobileNet for feature extraction
    private mobileNet: any = null;
    private mobileNetLoading = false;
    private mobileNetReady = false;

    // KNN classifier data
    private examples: Record<string, any> = {}; // label → concatenated tensor
    private trained = false;

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

    getPrediction(): string { return this.lastPrediction; }
    getConfidence(): number { return this.lastConfidence; }
    isClass(targetClass: string): boolean {
        return this.lastPrediction === targetClass;
    }

    // ── MobileNet Loading ──────────────────────────────────────────────────

    private async _loadMobileNet() {
        if (this.mobileNetReady) return;
        if (this.mobileNetLoading) {
            await new Promise<void>((resolve) => {
                const check = setInterval(() => {
                    if (this.mobileNetReady) { clearInterval(check); resolve(); }
                    if (!this.mobileNetLoading && !this.mobileNetReady) { clearInterval(check); resolve(); }
                }, 200);
            });
            return;
        }

        this.mobileNetLoading = true;
        try {
            // Load TF.js + MobileNet from CDN (same approach as MLEnvironment.tsx)
            const loadScript = (src: string) => new Promise<void>((res, rej) => {
                const s = document.createElement('script');
                s.src = src;
                s.onload = () => res();
                s.onerror = () => rej(new Error(`Failed to load ${src}`));
                document.head.appendChild(s);
            });

            if (!(window as any).tf) {
                await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js');
            }
            if (!(window as any).mobilenet) {
                await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js');
            }

            await (window as any).tf.ready();
            const model = await (window as any).mobilenet.load({ version: 2, alpha: 1.0 });
            this.mobileNet = model;
            this.mobileNetReady = true;
            console.log('[ML] MobileNet loaded');
        } catch (err) {
            console.warn('[ML] Could not load MobileNet:', err);
        } finally {
            this.mobileNetLoading = false;
        }
    }

    // ── Embedding extraction ───────────────────────────────────────────────

    private _getEmbedding(canvas: HTMLCanvasElement): any | null {
        if (!this.mobileNet || !(window as any).tf) return null;
        return (window as any).tf.tidy(() => {
            const tf = (window as any).tf;
            const imgTensor = tf.browser.fromPixels(canvas).toFloat().div(127.5).sub(1).expandDims(0);
            const result = this.mobileNet.infer(imgTensor, true);
            const embedding = result?.embedding ?? result;
            if (!embedding) return null;
            return embedding.squeeze();
        });
    }

    private _captureFrame(): HTMLCanvasElement | null {
        if (!this.videoEl || this.videoEl.readyState < 2) return null;
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(this.videoEl, 0, 0, 224, 224);
        return canvas;
    }

    // ── Training API ───────────────────────────────────────────────────────

    async addSample(label: string): Promise<boolean> {
        if (!this.mobileNetReady) await this._loadMobileNet();
        if (!this.mobileNetReady) return false;

        const canvas = this._captureFrame();
        if (!canvas) return false;

        const embedding = this._getEmbedding(canvas);
        if (!embedding) return false;

        // Store embedding under label
        if (!this.examples[label]) {
            this.examples[label] = embedding;
        } else {
            const prev = this.examples[label];
            this.examples[label] = (window as any).tf.concat([prev, embedding], 0);
            prev.dispose();
            embedding.dispose();
        }

        this.trained = false; // Need retrain after adding samples
        console.log(`[ML] Added sample for "${label}". Total classes: ${Object.keys(this.examples).length}`);
        return true;
    }

    train(): boolean {
        const labels = Object.keys(this.examples);
        if (labels.length < 2) {
            console.warn('[ML] Need at least 2 classes to train');
            return false;
        }

        const totalSamples = labels.reduce((sum, l) => sum + this.examples[l].shape[0], 0);
        if (totalSamples < 4) {
            console.warn('[ML] Need at least 4 total samples to train');
            return false;
        }

        this.trained = true;
        console.log(`[ML] Trained with ${totalSamples} samples across ${labels.length} classes`);
        return true;
    }

    // ── Prediction (KNN in-browser) ────────────────────────────────────────

    private async _predict(): Promise<void> {
        if (!this.trained || !this.mobileNetReady) return;

        const canvas = this._captureFrame();
        if (!canvas) return;

        const embedding = this._getEmbedding(canvas);
        if (!embedding) return;

        try {
            const tf = (window as any).tf;
            const labels = Object.keys(this.examples);
            if (!labels.length) { this.lastPrediction = 'none'; this.lastConfidence = 0; return; }

            const emb = embedding.expandDims(0);
            const scores: Record<string, number> = {};

            for (const label of labels) {
                const examples = this.examples[label];
                const sim = tf.tidy(() => {
                    const normEmb = tf.div(emb, tf.norm(emb));
                    const normEx = tf.div(examples, tf.norm(examples, 2, 1, true));
                    return normEmb.matMul(normEx.transpose()).squeeze();
                });
                const vals = await sim.data();
                sim.dispose();
                const sorted = Array.from(vals).sort((a: any, b: any) => b - a);
                scores[label] = sorted.slice(0, 3).reduce((s: number, v: any) => s + v, 0) / Math.min(3, sorted.length);
            }

            emb.dispose();

            const total = Object.values(scores).reduce((s, v) => s + Math.max(0, v), 0) || 1;
            const confidences: Record<string, number> = {};
            labels.forEach(l => confidences[l] = Math.max(0, scores[l]) / total);
            const winner = labels.reduce((a, b) => confidences[a] > confidences[b] ? a : b);

            this.lastPrediction = winner;
            this.lastConfidence = Math.round(confidences[winner] * 100);
        } catch (err) {
            console.error('[ML] Prediction error:', err);
        } finally {
            embedding.dispose();
        }
    }

    // ── Live prediction loop ───────────────────────────────────────────────

    private _startLoop() {
        if (!this.videoEl || !this.isDetecting) return;
        let lastPredTime = 0;
        const loop = async () => {
            if (!this.isDetecting || !this.videoEl) return;
            const now = Date.now();
            if (now - lastPredTime > 300 && this.trained) {
                lastPredTime = now;
                await this._predict();
            }
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    }

    // ── Utility ────────────────────────────────────────────────────────────

    getClassCount(): number { return Object.keys(this.examples).length; }
    getSampleCount(label: string): number { return this.examples[label]?.shape[0] ?? 0; }
    isTrained(): boolean { return this.trained; }

    clearAll() {
        const tf = (window as any).tf;
        if (tf) {
            Object.values(this.examples).forEach((t: any) => t.dispose());
        }
        this.examples = {};
        this.trained = false;
        this.lastPrediction = 'none';
        this.lastConfidence = 0;
    }

    clearClass(label: string) {
        const tf = (window as any).tf;
        if (this.examples[label] && tf) {
            this.examples[label].dispose();
            delete this.examples[label];
            this.trained = false;
        }
    }
}

export const mlRuntime = new MLRuntime();

// ─────────────────────────────────────────────────────────────────────────────
// TEXT TO SPEECH & SPEECH RECOGNITION (imported from standalone extension files)
// ─────────────────────────────────────────────────────────────────────────────

import { TTSRuntime as _TTSRuntime } from '../extensions/text-to-speech/runtime';
import { SpeechRecognitionRuntime as _SpeechRecognitionRuntime } from '../extensions/speech-recognition/runtime';
import { WeatherRuntime } from '../extensions/weather-data/runtime';
import { TranslateRuntime } from '../extensions/translate/runtime';
import { DataLoggerRuntime } from '../extensions/data-logger/runtime';
import { VisionRuntime } from '../extensions/computer-vision/runtime';

// Re-export classes for consumers that import from RuntimeBridge
export { _TTSRuntime as TTSRuntime };
export { _SpeechRecognitionRuntime as SpeechRecognitionRuntime };
export { WeatherRuntime };
export { TranslateRuntime };
export { DataLoggerRuntime };
export { VisionRuntime };
export { VideoPlayerRuntime };

// Singleton instances for window.runtime
export const ttsRuntime = new _TTSRuntime();
export const speechRecognitionRuntime = new _SpeechRecognitionRuntime();

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call once at app startup to attach window.runtime.
 * Safe to call multiple times — it only sets up once.
 */
export function initRuntime() {
    if ((window as any).runtime) return; // already initialized

    // Suppress TensorFlow.js noise logs (harmless re-registration warnings)
    const originalWarn = console.warn;
    console.warn = (...args) => {
        const msg = args.join(' ');
        if (
            msg.includes('already registered') ||
            msg.includes('Platform browser has already been set') ||
            msg.includes('Reusing existing backend factory')
        ) {
            return;
        }
        originalWarn(...args);
    };

    // Initialize extension runtimes
    const objectDetectionRuntime = new ObjectDetectionRuntime();
    const musicRuntime = new MusicRuntime();
    const ocrRuntime = new OCRRuntime();
    const weatherRuntime = new WeatherRuntime();
    const translateRuntime = new TranslateRuntime();
    const loggerRuntime = new DataLoggerRuntime();
    const visionRuntime = new VisionRuntime();
    const videoRuntime = new VideoPlayerRuntime();
    const videoSensingRuntime = new VideoSensingRuntime();
    const qrScannerRuntime = new QRScannerRuntime();
    const physicsRuntime = new PhysicsEngineRuntime();
    const makeyMakeyRuntime = new MakeyMakeyRuntime();

    (window as any).runtime = {
        pen: penRuntime,
        face: faceRuntime,
        handPose: handPoseRuntime,
        bodyDetection: bodyDetectionRuntime,
        ml: mlRuntime,
        sprite: spriteRuntime,
        objectDetection: objectDetectionRuntime,
        music: musicRuntime,
        tts: ttsRuntime,
        speech: speechRecognitionRuntime,
        ocr: ocrRuntime,
        weather: weatherRuntime,
        translate: translateRuntime,
        logger: loggerRuntime,
        vision: visionRuntime,
        video: videoRuntime,
        videoSensing: videoSensingRuntime,
        qrScanner: qrScannerRuntime,
        physics: physicsRuntime,
        makeyMakey: makeyMakeyRuntime,
    };

    console.log('[RuntimeBridge] window.runtime initialized with all extensions');
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
    if ((window as any).runtime?.objectDetection) {
        (window as any).runtime.objectDetection.setVideoElement(video);
    }
    if ((window as any).runtime?.ocr) {
        (window as any).runtime.ocr.setVideoElement(video);
    }
    if ((window as any).runtime?.vision) {
        (window as any).runtime.vision.setVideoElement(video);
    }
    if ((window as any).runtime?.videoSensing) {
        (window as any).runtime.videoSensing.setVideoElement(video);
    }
    if ((window as any).runtime?.qrScanner) {
        (window as any).runtime.qrScanner.setVideoElement(video);
    }
}

/**
 * Give the VideoPlayerRuntime a reference to the playback video element.
 * Call this from Stage.tsx after the video-playback element mounts.
 */
export function setVideoPlayerElement(video: HTMLVideoElement | null, container?: HTMLDivElement | null) {
    if ((window as any).runtime?.video) {
        (window as any).runtime.video.setVideoElement(video, container);
    }
}

