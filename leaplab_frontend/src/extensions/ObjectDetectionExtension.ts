// ObjectDetectionExtension.ts - AI Object Detection using TensorFlow.js

import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import Blockly from '@blockly-runtime';
import type { ExtensionCategory } from './ExtensionManager';

// Block definitions
export const objectDetectionBlocks = [
    {
        type: 'object_detect',
        message0: 'detect objects in camera',
        previousStatement: null,
        nextStatement: null,
        colour: '#3dba7e',
        tooltip: 'Run object detection on the current camera frame',
        helpUrl: ''
    },
    {
        type: 'object_when_detected',
        message0: 'when %1 detected',
        args0: [{
            type: 'field_dropdown',
            name: 'OBJECT',
            options: [
                ['cat', 'cat'],
                ['dog', 'dog'],
                ['person', 'person'],
                ['car', 'car'],
                ['ball', 'ball']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#3dba7e',
        tooltip: 'Triggers when the specified object is detected',
        helpUrl: ''
    },
    {
        type: 'object_label',
        message0: 'label of object %1',
        args0: [{
            type: 'field_number',
            name: 'N',
            value: 1,
            min: 1
        }],
        output: 'String',
        colour: '#2e9e66',
        tooltip: 'Returns the label name of the nth detected object',
        helpUrl: ''
    },
    {
        type: 'object_confidence',
        message0: 'confidence of object %1',
        args0: [{
            type: 'field_number',
            name: 'N',
            value: 1,
            min: 1
        }],
        output: 'Number',
        colour: '#2e9e66',
        tooltip: 'Returns the confidence score (0-100) of the nth object',
        helpUrl: ''
    },
    {
        type: 'object_x',
        message0: 'x of object %1',
        args0: [{
            type: 'field_number',
            name: 'N',
            value: 1,
            min: 1
        }],
        output: 'Number',
        colour: '#1e7e50',
        tooltip: 'Returns the X coordinate of the nth detected object',
        helpUrl: ''
    },
    {
        type: 'object_y',
        message0: 'y of object %1',
        args0: [{
            type: 'field_number',
            name: 'N',
            value: 1,
            min: 1
        }],
        output: 'Number',
        colour: '#1e7e50',
        tooltip: 'Returns the Y coordinate of the nth detected object',
        helpUrl: ''
    },
    {
        type: 'object_count',
        message0: 'number of objects',
        output: 'Number',
        colour: '#1e7e50',
        tooltip: 'Returns total number of objects detected',
        helpUrl: ''
    }
];

// Runtime implementation
export class ObjectDetectionRuntime {
    private objects: Array<{
        label: string;
        confidence: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }> = [];

    private model: cocoSsd.ObjectDetection | null = null;
    private isModelLoaded = false;
    private videoEl: HTMLVideoElement | null = null;

    setVideoElement(video: HTMLVideoElement | null) {
        this.videoEl = video;
    }

    isVideoReady(): boolean {
        return !!(this.videoEl && this.videoEl.readyState >= 2);
    }

    async loadModel() {
        if (this.isModelLoaded || this.model) return;

        try {
            await tf.ready();
            this.model = await cocoSsd.load();
            this.isModelLoaded = true;
            console.log('🔍 Object Detection model loaded');
        } catch (error) {
            console.error('Failed to load object detection model:', error);
        }
    }

    async detectObjects(videoElement?: HTMLVideoElement) {
        const video = videoElement || this.videoEl;
        if (!this.isModelLoaded) {
            await this.loadModel();
        }

        if (this.model && video && video.readyState >= 2) {
            try {
                const predictions = await this.model.detect(video);
                
                const videoW = video.videoWidth || 480;
                const videoH = video.videoHeight || 360;

                this.objects = predictions.map((pred: any) => {
                    const rawX = pred.bbox[0];
                    const rawY = pred.bbox[1];
                    const rawW = pred.bbox[2];
                    const rawH = pred.bbox[3];
                    
                    const scaledX = (rawX / videoW) * 480;
                    const scaledY = (rawY / videoH) * 360;
                    const scaledW = (rawW / videoW) * 480;
                    const scaledH = (rawH / videoH) * 360;
                    
                    const stageX = Math.round(scaledX + scaledW / 2 - 240);
                    const stageY = Math.round(180 - (scaledY + scaledH / 2));
                    
                    let label = pred.class;
                    
                    // Map COCO-SSD labels to user-friendly requested synonyms
                    const labelMap: Record<string, string> = {
                        'cell phone': 'phone',
                        'potted plant': 'plant',
                        'backpack': 'bag',
                        'handbag': 'bag',
                        'suitcase': 'bag',
                        'bicycle': 'bike',
                        'motorcycle': 'bike',
                        'laptop': 'computer'
                    };
                    
                    if (labelMap[label]) {
                        label = labelMap[label];
                    }

                    return {
                        label: label,
                        confidence: Math.round(pred.score * 100),
                        x: stageX,
                        y: stageY,
                        width: scaledW,
                        height: scaledH
                    };
                });
            } catch (err) {
                console.error("Object detection error:", err);
            }
        }
    }

    getLabel(n: number): string {
        return this.objects[n - 1]?.label || '';
    }

    getConfidence(n: number): number {
        return this.objects[n - 1]?.confidence || 0;
    }

    getX(n: number): number {
        return this.objects[n - 1]?.x || 0;
    }

    getY(n: number): number {
        return this.objects[n - 1]?.y || 0;
    }

    getNumberOfObjects(): number {
        return this.objects.length;
    }

    isObjectDetected(label: string): boolean {
        return this.objects.some(obj => obj.label.toLowerCase() === label.toLowerCase());
    }
}

// Register blocks
export function registerObjectDetectionBlocks() {
    const newBlocks = objectDetectionBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.defineBlocksWithJsonArray(newBlocks);
    }
}

// JavaScript generators
export function registerObjectDetectionGenerators() {
    const jsGen = (window as any).Blockly?.JavaScript;
    if (!jsGen) return;

    jsGen['object_detect'] = () => 'await window.runtime.objectDetection.detectObjects();\n';
    jsGen['object_when_detected'] = (block: any) => {
        const object = block.getFieldValue('OBJECT');
        return `// when ${object} detected\n`;
    };
    jsGen['object_label'] = (block: any) => {
        const n = block.getFieldValue('N');
        return [`window.runtime.objectDetection.getLabel(${n})`, 0];
    };
    jsGen['object_confidence'] = (block: any) => {
        const n = block.getFieldValue('N');
        return [`window.runtime.objectDetection.getConfidence(${n})`, 0];
    };
    jsGen['object_x'] = (block: any) => {
        const n = block.getFieldValue('N');
        return [`window.runtime.objectDetection.getX(${n})`, 0];
    };
    jsGen['object_y'] = (block: any) => {
        const n = block.getFieldValue('N');
        return [`window.runtime.objectDetection.getY(${n})`, 0];
    };
    jsGen['object_count'] = () => ['window.runtime.objectDetection.getNumberOfObjects()', 0];
}

// Extension configuration
export const objectDetectionExtension: ExtensionCategory = {
    id: 'object_detection',
    name: 'Object Detection',
    colour: '#3dba7e',
    icon: '🐱',
    blocks: objectDetectionBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
