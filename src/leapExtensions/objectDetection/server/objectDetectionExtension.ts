/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * Object Detection Extension - Server (block definitions + runtime + generators)
 */

import { javascriptGenerator } from '../../server/blockly/runtime';
import type { ExtensionDef } from '../../shared/extensionTypes';

// ─── Colors ───────────────────────────────────────────────────────────────────

const OD_COLOR_STATEMENT = '#3dba7e';
const OD_COLOR_REPORTER = '#2e9e66';
const OD_COLOR_REPORTER2 = '#1e7e50';

// ─── Block Definitions ────────────────────────────────────────────────────────

export const objectDetectionBlockDefs = [
    {
        type: 'object_detect',
        message0: 'detect objects in camera',
        previousStatement: null, nextStatement: null, colour: OD_COLOR_STATEMENT,
        tooltip: 'Run object detection on the current camera frame',
    },
    {
        type: 'object_when_detected',
        message0: 'when %1 detected',
        args0: [{ type: 'field_dropdown', name: 'OBJECT', options: [['cat', 'cat'], ['dog', 'dog'], ['person', 'person'], ['car', 'car'], ['ball', 'ball']] }],
        previousStatement: null, nextStatement: null, colour: OD_COLOR_STATEMENT,
        tooltip: 'Triggers when the specified object is detected',
    },
    {
        type: 'object_label',
        message0: 'label of object %1',
        args0: [{ type: 'field_number', name: 'N', value: 1, min: 1 }],
        output: 'String', colour: OD_COLOR_REPORTER,
        tooltip: 'Returns the label name of the nth detected object',
    },
    {
        type: 'object_confidence',
        message0: 'confidence of object %1',
        args0: [{ type: 'field_number', name: 'N', value: 1, min: 1 }],
        output: 'Number', colour: OD_COLOR_REPORTER,
        tooltip: 'Returns the confidence score (0-100) of the nth object',
    },
    {
        type: 'object_x',
        message0: 'x of object %1',
        args0: [{ type: 'field_number', name: 'N', value: 1, min: 1 }],
        output: 'Number', colour: OD_COLOR_REPORTER2,
        tooltip: 'Returns the X coordinate of the nth detected object',
    },
    {
        type: 'object_y',
        message0: 'y of object %1',
        args0: [{ type: 'field_number', name: 'N', value: 1, min: 1 }],
        output: 'Number', colour: OD_COLOR_REPORTER2,
        tooltip: 'Returns the Y coordinate of the nth detected object',
    },
    {
        type: 'object_count',
        message0: 'number of objects',
        output: 'Number', colour: OD_COLOR_REPORTER2,
        tooltip: 'Returns total number of objects detected',
    },
];

// ─── Runtime ──────────────────────────────────────────────────────────────────

interface DetectedObject {
    label: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export class ObjectDetectionRuntime {
    private objects: DetectedObject[] = [];
    private model: any = null;
    private isModelLoaded = false;

    async loadModel(): Promise<void> {
        if (this.isModelLoaded) return;
        try {
            // TODO: Load TensorFlow.js COCO-SSD model
            // const cocoSsd = await import('@tensorflow-models/coco-ssd');
            // this.model = await cocoSsd.load();
            this.isModelLoaded = true;
            console.log('Object Detection model loaded');
        } catch (error) {
            console.error('Failed to load object detection model:', error);
        }
    }

    async detectObjects(videoElement?: HTMLVideoElement): Promise<void> {
        if (!this.isModelLoaded) await this.loadModel();

        // Simulate detection for now
        this.objects = [
            { label: 'cat', confidence: 92, x: 180, y: 220, width: 100, height: 100 },
            { label: 'ball', confidence: 85, x: 420, y: 150, width: 50, height: 50 },
        ];

        // TODO: Real detection with TensorFlow.js
        // if (this.model && videoElement) {
        //     const predictions = await this.model.detect(videoElement);
        //     this.objects = predictions.map((pred: any) => ({
        //         label: pred.class,
        //         confidence: Math.round(pred.score * 100),
        //         x: pred.bbox[0], y: pred.bbox[1],
        //         width: pred.bbox[2], height: pred.bbox[3],
        //     }));
        // }
    }

    getLabel(n: number): string { return this.objects[n - 1]?.label || ''; }
    getConfidence(n: number): number { return this.objects[n - 1]?.confidence || 0; }
    getX(n: number): number { return this.objects[n - 1]?.x || 0; }
    getY(n: number): number { return this.objects[n - 1]?.y || 0; }
    getNumberOfObjects(): number { return this.objects.length; }
    isObjectDetected(label: string): boolean {
        return this.objects.some(obj => obj.label.toLowerCase() === label.toLowerCase());
    }
}

// ─── Register Blocks ──────────────────────────────────────────────────────────

export function registerObjectDetectionBlocks(Blockly: any): void {
    const newDefs = objectDetectionBlockDefs.filter((d: any) => !Blockly.Blocks[d.type]);
    if (newDefs.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newDefs));
    }
}

// ─── Register Generators ──────────────────────────────────────────────────────

export function registerObjectDetectionGenerators(_Blockly: any): void {
    const jsGen = javascriptGenerator;
    if (!jsGen) return;

    jsGen.forBlock['object_detect'] = () => 'if(window.runtime?.objectDetection) await window.runtime.objectDetection.detectObjects();\n';
    jsGen.forBlock['object_when_detected'] = (b: any) => `// when ${b.getFieldValue('OBJECT')} detected\n`;
    jsGen.forBlock['object_label'] = (b: any) => [`window.runtime?.objectDetection?.getLabel(${b.getFieldValue('N')})||''`, 0];
    jsGen.forBlock['object_confidence'] = (b: any) => [`window.runtime?.objectDetection?.getConfidence(${b.getFieldValue('N')})||0`, 0];
    jsGen.forBlock['object_x'] = (b: any) => [`window.runtime?.objectDetection?.getX(${b.getFieldValue('N')})||0`, 0];
    jsGen.forBlock['object_y'] = (b: any) => [`window.runtime?.objectDetection?.getY(${b.getFieldValue('N')})||0`, 0];
    jsGen.forBlock['object_count'] = () => [`window.runtime?.objectDetection?.getNumberOfObjects()||0`, 0];
}

// ─── Toolbox ──────────────────────────────────────────────────────────────────

export function getObjectDetectionToolbox(): any[] {
    return [
        { kind: 'block', type: 'object_detect' },
        { kind: 'block', type: 'object_when_detected' },
        { kind: 'block', type: 'object_count' },
        { kind: 'block', type: 'object_label' },
        { kind: 'block', type: 'object_confidence' },
        { kind: 'block', type: 'object_x' },
        { kind: 'block', type: 'object_y' },
    ];
}

// ─── Extension Definition ─────────────────────────────────────────────────────

export const objectDetectionExtension: ExtensionDef = {
    id: 'object_detection',
    name: 'Object Detection',
    color: OD_COLOR_STATEMENT,
    icon: '📷',
    registerBlocks: registerObjectDetectionBlocks,
    registerGenerators: registerObjectDetectionGenerators,
    getToolbox: getObjectDetectionToolbox,
};
