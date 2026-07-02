// HandPose.ts - Hand pose detection using MediaPipe Hands
//
// HOW IT WORKS:
// ─────────────────────────────────────────────────────────────────────────────
// 1. hp_camera:      Turn camera on/off/flip for hand tracking
// 2. hp_analyze:     Analyze hand pose from camera or image
// 3. hp_move_with:   Move sprite跟随 specific finger
// 4. hp_guess_sign:  Recognize hand signs (Peace, Open, Thumbs Up)
// 5. hp_when_sign:   Hat block triggered when specific sign detected
// 6. hp_finger_x:    Get X position of a finger landmark
// 7. hp_finger_y:    Get Y position of a finger landmark

import Blockly from '@blockly-runtime';
import { animationVM } from '../vm/AnimationVM';

type HandCallback = (finger: string, x: number, y: number) => void;

export class HandPoseRuntime {
    private _stream: MediaStream | null = null;
    private _video: HTMLVideoElement | null = null;
    private _analyzing = false;
    private _loopRunning = false;
    private _landmarks: any[] = [];
    private _hands: any = null;
    private _camera: any = null;
    private _callbacks: HandCallback[] = [];
    private _lastSign: string = '';
    private _gestureCallbacks: Map<string, (() => void)[]> = new Map();

    // Finger landmark indices (MediaPipe)
    private static FINGER_TIPS = {
        'thumb': 4,
        'index': 8,
        'middle': 12,
        'ring': 16,
        'pinky': 20,
        'base': 0,
    };

    setVideoElement(video: HTMLVideoElement | null) {
        this._video = video;
        if (video && this._analyzing && !this._loopRunning) this._startDetectLoop();
    }

    async analyse(action: string): Promise<void> {
        if (action === 'on' || action === 'analyze') {
            await this.startDetection();
        } else if (action === 'off') {
            this.stopDetection();
        } else if (action === 'flip') {
            // Flip camera if needed
        }
    }

    private async startDetection(): Promise<void> {
        if (this._analyzing) return;
        this._analyzing = true; // Set immediately to prevent duplicate instances from forever loops

        try {
            // Load MediaPipe Hands
            if (!this._hands) {
                // @ts-ignore
                const vision = await import('@mediapipe/tasks-vision');
                const { HandLandmarker, FilesetResolver } = vision;
                
                const filesetResolver = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
                );
                
                this._hands = await HandLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                        delegate: 'GPU'
                    },
                    runningMode: 'VIDEO',
                    numHands: 2
                });
            }

            // If a shared video element was provided (via setVideoElement from RuntimeBridge),
            // use it instead of opening a new camera stream.
            if (this._video) {
                this._startDetectLoop();
                console.log('[HandPose] Detection started (shared video)');
                return;
            }

            // Wait briefly for a shared video element to arrive (from __setCameraOn async flow)
            const waitForVideo = await new Promise<boolean>((resolve) => {
                let waited = 0;
                const check = setInterval(() => {
                    if (this._video || waited >= 2000) {
                        clearInterval(check);
                        resolve(!!this._video);
                    }
                    waited += 50;
                }, 50);
            });

            if (waitForVideo && this._video) {
                this._startDetectLoop();
                console.log('[HandPose] Detection started (shared video, awaited)');
                return;
            }

            // No shared video — open our own camera stream
            this._stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });

            this._video = document.createElement('video');
            this._video.srcObject = this._stream;
            this._video.autoplay = true;
            await this._video.play();

            this._startDetectLoop();
            console.log('[HandPose] Detection started');
        } catch (err: any) {
            this._analyzing = false; // Reset on failure so retry is possible
            console.error('[HandPose] Failed to start detection:', err.message);
        }
    }

    private _startDetectLoop() {
        if (this._loopRunning) return;
        this._loopRunning = true;
        let lastDetectTime = 0;
        let lastTimestamp = 0;
        const FRAME_INTERVAL = 100; // ~10fps to avoid lag when BodyDetection also runs
        const loop = (now: number) => {
            if (!this._analyzing || !this._video || !this._hands) {
                this._loopRunning = false;
                return;
            }
            if (this._video.readyState >= 2 && (now - lastDetectTime) >= FRAME_INTERVAL) {
                lastDetectTime = now;
                // Ensure strictly increasing timestamps for MediaPipe
                const ts = Math.max(now, lastTimestamp + 1);
                lastTimestamp = ts;
                try {
                    const results = this._hands.detectForVideo(this._video, ts);
                    if (results.landmarks && results.landmarks.length > 0) {
                        this._landmarks = results.landmarks;
                        this.processLandmarks();
                    } else {
                        // Hand disappeared from camera
                        this._landmarks = [];
                        if (this._lastSign !== 'no_hand') {
                            this._lastSign = 'no_hand';
                            this.triggerGesture('no_hand');
                        }
                    }
                } catch (_e) {
                    // Ignore MediaPipe timestamp/processing errors — retry next frame
                }
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }



    private processLandmarks(): void {
        if (this._landmarks.length === 0) return;

        const hand = this._landmarks[0]; // Primary hand
        
        // Detect gesture
        const sign = this.detectGesture(hand);
        if (sign !== this._lastSign) {
            this._lastSign = sign;
            this.triggerGesture(sign);
        }

        // Notify callbacks
        this._callbacks.forEach(cb => {
            for (const [finger, tipIdx] of Object.entries(HandPoseRuntime.FINGER_TIPS)) {
                if (hand[tipIdx]) {
                    cb(finger, hand[tipIdx].x, hand[tipIdx].y);
                }
            }
        });
    }

    private detectGesture(landmarks: any[]): string {
        // Simple gesture detection based on finger positions
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const wrist = landmarks[0];

        // Check if fingers are extended
        const indexExtended = indexTip.y < landmarks[6].y;
        const middleExtended = middleTip.y < landmarks[10].y;
        const ringExtended = ringTip.y < landmarks[14].y;
        const pinkyExtended = pinkyTip.y < landmarks[18].y;
        const thumbExtended = thumbTip.x < landmarks[3].x; // Simplified

        // Peace sign: index and middle extended, others closed
        if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
            return '2';
        }
        
        // Open hand: all fingers extended
        if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
            return '5';
        }
        
        // Thumbs up: thumb extended, others closed
        if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
            return 'thumbs_up';
        }

        return 'none';
    }

    private triggerGesture(sign: string): void {
        const callbacks = this._gestureCallbacks.get(sign);
        if (callbacks) {
            callbacks.forEach(cb => cb());
        }
    }

    stopDetection(): void {
        this._analyzing = false;
        this._loopRunning = false;
        // Only close the stream if we opened it ourselves (not shared from RuntimeBridge)
        if (this._stream) {
            this._stream.getTracks().forEach(track => track.stop());
            this._stream = null;
        }
        this._video = null;
        this._landmarks = [];
        console.log('[HandPose] Detection stopped');
    }

    private getStageCoords(landmark: { x: number; y: number }): { sx: number; sy: number } {
        const video = this._video;
        let vw = 640, vh = 480;
        if (video && video.videoWidth && video.videoHeight) {
            vw = video.videoWidth;
            vh = video.videoHeight;
        }
        const stageEl = document.querySelector('.stage') as HTMLElement | null;
        const sw = stageEl ? stageEl.offsetWidth : 480;
        const sh = stageEl ? stageEl.offsetHeight : 360;

        const scale = Math.max(sw / vw, sh / vh);
        const renderW = vw * scale;
        const renderH = vh * scale;
        const offsetX = (renderW - sw) / (2 * renderW);
        const offsetY = (renderH - sh) / (2 * renderH);

        const visStartX = offsetX;
        const visEndX = 1 - offsetX;
        const visStartY = offsetY;
        const visEndY = 1 - offsetY;

        let normX = (landmark.x - visStartX) / (visEndX - visStartX);
        let normY = (landmark.y - visStartY) / (visEndY - visStartY);
        normX = Math.max(0, Math.min(1, normX));
        normY = Math.max(0, Math.min(1, normY));

        return { sx: normX * sw, sy: normY * sh };
    }

    moveSpriteToFinger(finger: string): void {
        const spriteId = (window as any).__activeSpriteId || (window as any).activeSpriteId;
        if (!spriteId) return;

        const tipIdx = (HandPoseRuntime.FINGER_TIPS as Record<string, number>)[finger];
        if (tipIdx !== undefined && this._landmarks.length > 0) {
            const hand = this._landmarks[0];
            const landmark = hand[tipIdx];
            if (landmark) {
                const { sx, sy } = this.getStageCoords(landmark);

                // Embed path: spriteManager (RuntimeBridge) with Sprite objects
                // Embed uses center-origin: (0,0) at center
                if ((window as any).spriteManager) {
                    const sprite = (window as any).spriteManager.getSprite(spriteId);
                    if (sprite) {
                        sprite.setX(sx - 240);
                        sprite.setY(180 - sy);
                        return;
                    }
                }

                // Ignite path: React state via updateSprite
                // Ignite uses top-left origin: (0,0) at top-left
                // Video has CSS scaleX(-1) mirror — flip x so sprite follows mirrored view
                if ((window as any).updateSprite) {
                    const stageEl = document.querySelector('.stage') as HTMLElement | null;
                    const sw = stageEl ? stageEl.offsetWidth : 480;
                    const SPRITE_HALF = 40;
                    const x = Math.round(sw - sx - SPRITE_HALF);
                    const y = Math.round(sy - SPRITE_HALF);
                    (window as any).updateSprite(spriteId, { x, y });
                }
            }
        }
    }

    getSign(): string {
        return this._lastSign;
    }

    getLandmarkX(finger: string): number {
        const tipIdx = (HandPoseRuntime.FINGER_TIPS as Record<string, number>)[finger];
        if (tipIdx !== undefined && this._landmarks.length > 0) {
            const landmark = this._landmarks[0][tipIdx];
            if (landmark) {
                const { sx } = this.getStageCoords(landmark);
                return Math.round(sx - 240);
            }
        }
        return 0;
    }

    getLandmarkY(finger: string): number {
        const tipIdx = (HandPoseRuntime.FINGER_TIPS as Record<string, number>)[finger];
        if (tipIdx !== undefined && this._landmarks.length > 0) {
            const landmark = this._landmarks[0][tipIdx];
            if (landmark) {
                const { sy } = this.getStageCoords(landmark);
                return Math.round(180 - sy);
            }
        }
        return 0;
    }

    onHand(callback: HandCallback): void {
        this._callbacks.push(callback);
    }

    onGesture(sign: string, callback: () => void): void {
        const callbacks = this._gestureCallbacks.get(sign) || [];
        callbacks.push(callback);
        this._gestureCallbacks.set(sign, callbacks);
    }

    destroy(): void {
        this.stopDetection();
        this._callbacks = [];
        this._gestureCallbacks.clear();
    }
}

export const handPoseBlocks = [
    {
        type: 'hp_camera',
        message0: 'camera %1',
        args0: [{
            type: 'field_dropdown',
            name: 'ACTION',
            options: [
                ['on', 'on'],
                ['off', 'off'],
                ['flip', 'flip']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#D43D41',
        tooltip: 'Turn camera on/off for hand tracking',
        helpUrl: ''
    },
    {
        type: 'hp_analyze',
        message0: '%1 hand',
        args0: [{
            type: 'field_dropdown',
            name: 'ACTION',
            options: [
                ['analyze', 'analyze'],
                ['show detection', 'show'],
                ['hide detection', 'hide']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#D43D41',
        tooltip: 'Analyze hand pose from camera',
        helpUrl: ''
    },
    {
        type: 'hp_move_with',
        message0: 'move sprite with %1',
        args0: [{
            type: 'field_dropdown',
            name: 'FINGER',
            options: [
                ['Thumb', 'thumb'],
                ['Index', 'index'],
                ['Middle', 'middle'],
                ['Ring', 'ring'],
                ['Pinky', 'pinky'],
                ['Base', 'base']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#D43D41',
        tooltip: 'Move the active sprite to follow a finger',
        helpUrl: ''
    },
    {
        type: 'hp_guess_sign',
        message0: 'guess sign',
        previousStatement: null,
        nextStatement: null,
        colour: '#D43D41',
        tooltip: 'Recognize the current hand sign',
        helpUrl: ''
    },
    {
        type: 'hp_when_sign',
        message0: 'when hand sign %1',
        args0: [{
            type: 'field_dropdown',
            name: 'SIGN',
            options: [
                ['Peace', '2'],
                ['Open', '5'],
                ['Thumbs Up', 'thumbs_up'],
                ['No Hand', 'no_hand']
            ]
        }],
        nextStatement: true,
        colour: '#D43D41',
        tooltip: 'When specific hand sign is detected',
        hat: 'event',
        helpUrl: ''
    },
    {
        type: 'hp_finger_x',
        message0: '%1 x position',
        args0: [{
            type: 'field_dropdown',
            name: 'FINGER',
            options: [
                ['Thumb', 'thumb'],
                ['Index', 'index'],
                ['Middle', 'middle'],
                ['Ring', 'ring'],
                ['Pinky', 'pinky'],
                ['Base', 'base']
            ]
        }],
        output: 'Number',
        colour: '#b71c1c',
        tooltip: 'Get X position of finger',
        helpUrl: ''
    },
    {
        type: 'hp_finger_y',
        message0: '%1 y position',
        args0: [{
            type: 'field_dropdown',
            name: 'FINGER',
            options: [
                ['Thumb', 'thumb'],
                ['Index', 'index'],
                ['Middle', 'middle'],
                ['Ring', 'ring'],
                ['Pinky', 'pinky'],
                ['Base', 'base']
            ]
        }],
        output: 'Number',
        colour: '#b71c1c',
        tooltip: 'Get Y position of finger',
        helpUrl: ''
    },
];

export function registerHandPoseBlocks() {
    const newBlocks = handPoseBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

export const handPoseExtension = {
    id: 'hand_pose',
    name: 'Hand Pose',
    colour: '#D43D41',
    icon: '✋',
    blocks: handPoseBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
