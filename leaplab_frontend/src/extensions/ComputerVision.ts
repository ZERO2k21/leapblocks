// ComputerVision.ts - Unified computer vision blocks for face & object detection

import Blockly from '@blockly-runtime';
import type { ExtensionCategory } from './ExtensionManager';

// Block definitions
export const computerVisionBlocks = [
    {
        type: 'vision_camera_on',
        message0: 'camera on',
        previousStatement: null,
        nextStatement: null,
        colour: '#00897B',
        tooltip: 'Turn on the camera feed',
        helpUrl: ''
    },
    {
        type: 'vision_camera_off',
        message0: 'camera off',
        previousStatement: null,
        nextStatement: null,
        colour: '#00897B',
        tooltip: 'Turn off the camera feed',
        helpUrl: ''
    },
    {
        type: 'vision_analyze',
        message0: 'analyze frame',
        previousStatement: null,
        nextStatement: null,
        colour: '#00897B',
        tooltip: 'Run face and object detection on the current frame',
        helpUrl: ''
    },
    {
        type: 'vision_detect_objects',
        message0: 'detect objects',
        previousStatement: null,
        nextStatement: null,
        colour: '#00897B',
        tooltip: 'Run object detection (COCO-SSD model)',
        helpUrl: ''
    },
    {
        type: 'vision_get_object_count',
        message0: 'object count',
        output: 'Number',
        colour: '#00695C',
        tooltip: 'Returns number of detected objects',
        helpUrl: ''
    },
    {
        type: 'vision_get_object_name',
        message0: 'name of object %1',
        args0: [{ type: 'field_number', name: 'INDEX', value: 1, min: 1 }],
        output: 'String',
        colour: '#00695C',
        tooltip: 'Returns the label of the detected object at index',
        helpUrl: ''
    },
    {
        type: 'vision_get_object_confidence',
        message0: 'confidence of object %1',
        args0: [{ type: 'field_number', name: 'INDEX', value: 1, min: 1 }],
        output: 'Number',
        colour: '#00695C',
        tooltip: 'Returns the confidence (0-100) of the object at index',
        helpUrl: ''
    },
    {
        type: 'vision_get_object_x',
        message0: 'x of object %1',
        args0: [{ type: 'field_number', name: 'INDEX', value: 1, min: 1 }],
        output: 'Number',
        colour: '#00695C',
        tooltip: 'Returns the X position of the object at index',
        helpUrl: ''
    },
    {
        type: 'vision_get_object_y',
        message0: 'y of object %1',
        args0: [{ type: 'field_number', name: 'INDEX', value: 1, min: 1 }],
        output: 'Number',
        colour: '#00695C',
        tooltip: 'Returns the Y position of the object at index',
        helpUrl: ''
    },
    {
        type: 'vision_is_object_present',
        message0: 'is %1 present',
        args0: [{ type: 'field_input', name: 'NAME', text: 'person' }],
        output: 'Boolean',
        colour: '#00695C',
        tooltip: 'Returns true if the named object is detected',
        helpUrl: ''
    },
    {
        type: 'vision_draw_bounding_boxes',
        message0: 'bounding boxes %1',
        args0: [{
            type: 'field_dropdown',
            name: 'STATE',
            options: [['on', 'on'], ['off', 'off']]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#00897B',
        tooltip: 'Show or hide bounding boxes overlay',
        helpUrl: ''
    },
    {
        type: 'vision_get_face_count',
        message0: 'face count',
        output: 'Number',
        colour: '#00695C',
        tooltip: 'Returns number of detected faces',
        helpUrl: ''
    },
    {
        type: 'vision_get_emotion',
        message0: 'emotion of face %1',
        args0: [{ type: 'field_number', name: 'INDEX', value: 1, min: 1 }],
        output: 'String',
        colour: '#00695C',
        tooltip: 'Returns the emotion of the detected face',
        helpUrl: ''
    }
];

// Detected object interface
interface DetectedObject {
    label: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

// Runtime implementation
export class VisionRuntime {
    private videoEl: HTMLVideoElement | null = null;
    private overlayCanvas: HTMLCanvasElement | null = null;
    private objects: DetectedObject[] = [];
    private faceCount = 0;
    private emotions: string[] = [];
    private showBoundingBoxes = false;
    private isAnalyzing = false;
    private cameraOn = false;

    // Lazy-loaded models
    private cocoModel: any = null;
    private faceApi: any = null;
    private modelsLoaded = false;
    private modelsLoading = false;

    setVideoElement(video: HTMLVideoElement | null) {
        this.videoEl = video;
    }

    // ── Camera Control ──────────────────────────────────────────────────────

    cameraOn_() {
        this.cameraOn = true;
        this._ensureOverlay();
    }

    cameraOff() {
        this.cameraOn = false;
        this.showBoundingBoxes = false;
        this.objects = [];
        this.faceCount = 0;
        this.emotions = [];
        this._clearOverlay();
    }

    private _ensureOverlay() {
        if (this.overlayCanvas) return;
        const stage = document.querySelector('.stage-container, #stage, [class*="stage"]');
        if (stage) {
            this.overlayCanvas = document.createElement('canvas');
            this.overlayCanvas.style.position = 'absolute';
            this.overlayCanvas.style.top = '0';
            this.overlayCanvas.style.left = '0';
            this.overlayCanvas.style.width = '100%';
            this.overlayCanvas.style.height = '100%';
            this.overlayCanvas.style.pointerEvents = 'none';
            this.overlayCanvas.style.zIndex = '1000';
            (stage as HTMLElement).appendChild(this.overlayCanvas);
        }
    }

    private _clearOverlay() {
        if (this.overlayCanvas) {
            const ctx = this.overlayCanvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        }
    }

    // ── Model Loading ───────────────────────────────────────────────────────

    private async _loadCocoModel() {
        if (this.cocoModel) return;
        try {
            const tf = await import('@tensorflow/tfjs');
            const cocoSsd = await import('@tensorflow-models/coco-ssd');
            await tf.ready();
            this.cocoModel = await cocoSsd.load();
            console.log('[Vision] COCO-SSD model loaded');
        } catch (err) {
            console.warn('[Vision] Could not load COCO-SSD:', err);
        }
    }

    private async _loadFaceApi() {
        if (this.faceApi) return;
        if (this.modelsLoading) return;
        this.modelsLoading = true;
        try {
            this.faceApi = await import('@vladmandic/face-api');
            const MODEL_URL = '/models';
            await Promise.all([
                this.faceApi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                this.faceApi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
            ]);
            this.modelsLoaded = true;
            console.log('[Vision] Face-api.js models loaded');
        } catch (err) {
            console.warn('[Vision] Could not load face-api models:', err);
        } finally {
            this.modelsLoading = false;
        }
    }

    // ── Analysis ────────────────────────────────────────────────────────────

    async analyze() {
        if (!this.videoEl || this.videoEl.readyState < 2) {
            console.warn('[Vision] Camera not ready');
            return;
        }
        this.isAnalyzing = true;
        this.cameraOn_();

        // Run both face and object detection in parallel
        await Promise.all([
            this._detectFaces(),
            this._detectObjects(),
        ]);

        this.isAnalyzing = false;

        if (this.showBoundingBoxes) {
            this._drawBoxes();
        }
    }

    async detectObjects() {
        if (!this.videoEl || this.videoEl.readyState < 2) {
            console.warn('[Vision] Camera not ready');
            return;
        }
        this.cameraOn_();
        await this._detectObjects();
        if (this.showBoundingBoxes) this._drawBoxes();
    }

    private async _detectObjects() {
        if (!this.cocoModel) await this._loadCocoModel();
        if (!this.cocoModel || !this.videoEl) return;

        try {
            const predictions = await this.cocoModel.detect(this.videoEl);
            const vw = this.videoEl.videoWidth || 640;
            const vh = this.videoEl.videoHeight || 480;

            this.objects = predictions.map((pred: any) => ({
                label: pred.class,
                confidence: Math.round(pred.score * 100),
                x: Math.round(((pred.bbox[0] + pred.bbox[2] / 2) / vw) * 480 - 240),
                y: Math.round(180 - ((pred.bbox[1] + pred.bbox[3] / 2) / vh) * 360),
                width: Math.round((pred.bbox[2] / vw) * 480),
                height: Math.round((pred.bbox[3] / vh) * 360),
            }));
        } catch (err) {
            console.error('[Vision] Object detection error:', err);
        }
    }

    private async _detectFaces() {
        if (!this.faceApi) await this._loadFaceApi();
        if (!this.faceApi || !this.videoEl) return;
        if (this.videoEl.readyState < 2) return;

        try {
            const options = new this.faceApi.TinyFaceDetectorOptions({
                inputSize: 320,
                scoreThreshold: 0.5,
            });
            const detections = await this.faceApi
                .detectAllFaces(this.videoEl, options)
                .withFaceExpressions();

            this.faceCount = detections.length;
            this.emotions = detections.map((d: any) => {
                const exprs = d.expressions;
                let best = 'neutral';
                let bestScore = 0;
                for (const [name, score] of Object.entries(exprs)) {
                    if ((score as number) > bestScore) {
                        bestScore = score as number;
                        best = name;
                    }
                }
                return best;
            });
        } catch (err) {
            /* ignore per-frame errors */
        }
    }

    // ── Bounding Box Overlay ────────────────────────────────────────────────

    private _drawBoxes() {
        if (!this.overlayCanvas) return;
        const vw = this.videoEl?.videoWidth || 640;
        const vh = this.videoEl?.videoHeight || 480;
        this.overlayCanvas.width = vw;
        this.overlayCanvas.height = vh;
        const ctx = this.overlayCanvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, vw, vh);

        // Draw object boxes
        this.objects.forEach(obj => {
            // Convert stage coords back to video coords
            const vx = ((obj.x + 240) / 480) * vw - obj.width / 2;
            const vy = (180 - obj.y) / 360 * vh - obj.height / 2;
            const vw2 = (obj.width / 480) * vw;
            const vh2 = (obj.height / 360) * vh;

            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 2;
            ctx.strokeRect(vx, vy, vw2, vh2);
            ctx.fillStyle = '#00FF00';
            ctx.font = '14px monospace';
            ctx.fillText(`${obj.label} ${obj.confidence}%`, vx, vy - 5);
        });
    }

    // ── Reporters ───────────────────────────────────────────────────────────

    getObjectCount(): number { return this.objects.length; }
    getObjectName(index: number): string { return this.objects[index - 1]?.label || ''; }
    getObjectConfidence(index: number): number { return this.objects[index - 1]?.confidence || 0; }
    getObjectX(index: number): number { return this.objects[index - 1]?.x || 0; }
    getObjectY(index: number): number { return this.objects[index - 1]?.y || 0; }

    isObjectPresent(name: string): boolean {
        return this.objects.some(obj => obj.label.toLowerCase() === name.toLowerCase());
    }

    getFaceCount(): number { return this.faceCount; }
    getEmotion(index: number): string { return this.emotions[index - 1] || 'neutral'; }
    isCameraOn(): boolean { return this.cameraOn; }
    isAnalyzing_(): boolean { return this.isAnalyzing; }

    setBoundingBoxes(state: string) {
        this.showBoundingBoxes = state === 'on';
        if (!this.showBoundingBoxes) this._clearOverlay();
    }
}

// Register blocks
export function registerComputerVisionBlocks() {
    const newBlocks = computerVisionBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

// JavaScript generators
export function registerComputerVisionGenerators() {
    const jsGen = (window as any).Blockly?.JavaScript;
    if (!jsGen) return;

    jsGen['vision_camera_on'] = () =>
        'if(window.runtime?.vision) window.runtime.vision.cameraOn_();\n';
    jsGen['vision_camera_off'] = () =>
        'if(window.runtime?.vision) window.runtime.vision.cameraOff();\n';
    jsGen['vision_analyze'] = () =>
        'if(window.runtime?.vision) await window.runtime.vision.analyze();\n';
    jsGen['vision_detect_objects'] = () =>
        'if(window.runtime?.vision) await window.runtime.vision.detectObjects();\n';
    jsGen['vision_get_object_count'] = () =>
        ['window.runtime?.vision?.getObjectCount()||0', 0];
    jsGen['vision_get_object_name'] = (block: any) =>
        [`window.runtime?.vision?.getObjectName(${block.getFieldValue('INDEX')})||""`, 0];
    jsGen['vision_get_object_confidence'] = (block: any) =>
        [`window.runtime?.vision?.getObjectConfidence(${block.getFieldValue('INDEX')})||0`, 0];
    jsGen['vision_get_object_x'] = (block: any) =>
        [`window.runtime?.vision?.getObjectX(${block.getFieldValue('INDEX')})||0`, 0];
    jsGen['vision_get_object_y'] = (block: any) =>
        [`window.runtime?.vision?.getObjectY(${block.getFieldValue('INDEX')})||0`, 0];
    jsGen['vision_is_object_present'] = (block: any) => {
        const name = block.getFieldValue('NAME') || '';
        return [`window.runtime?.vision?.isObjectPresent('${name.replace(/'/g, "\\'")}')||false`, 0];
    };
    jsGen['vision_draw_bounding_boxes'] = (block: any) => {
        const state = block.getFieldValue('STATE') || 'off';
        return `if(window.runtime?.vision) window.runtime.vision.setBoundingBoxes('${state}');\n`;
    };
    jsGen['vision_get_face_count'] = () =>
        ['window.runtime?.vision?.getFaceCount()||0', 0];
    jsGen['vision_get_emotion'] = (block: any) =>
        [`window.runtime?.vision?.getEmotion(${block.getFieldValue('INDEX')})||"neutral"`, 0];
}

// Extension configuration
export const computerVisionExtension: ExtensionCategory = {
    id: 'computer_vision',
    name: 'Computer Vision',
    colour: '#00897B',
    icon: '👁️',
    blocks: computerVisionBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
