// MLMachineLearning.ts - Machine Learning environment for training and classification
//
// HOW IT WORKS:
// ─────────────────────────────────────────────────────────────────────────────
// 1. ml_add_sample:     Capture camera frame and add as training sample
// 2. ml_train:          Train the classifier with collected samples
// 3. ml_clear_all:      Remove all training samples
// 4. ml_clear_class:    Remove samples for a specific class
// 5. ml_analyze:        Start/stop live classification
// 6. ml_get_prediction: Get current classification prediction
// 7. ml_get_confidence: Get confidence of current prediction
// 8. ml_is_class:       Check if prediction matches a class
// 9. ml_get_class_count: Get number of trained classes
// 10. ml_get_sample_count: Get sample count for a class
// 11. ml_is_trained:    Check if model is trained

import Blockly from '@blockly-runtime';

type Sample = {
    label: string;
    embeddings: number[];
    thumbnail?: string;
};

export class MLMachineLearningRuntime {
    private _stream: MediaStream | null = null;
    private _video: HTMLVideoElement | null = null;
    private _samples: Sample[] = [];
    private _model: any = null;
    private _analyzing = false;
    private _prediction = 'none';
    private _confidence = 0;
    private _knnClassifier: any = null;
    private _mobilenet: any = null;

    async addSample(label: string): Promise<void> {
        if (!this._video) {
            await this.startCamera();
        }

        if (!this._video) {
            console.error('[ML] No video available');
            return;
        }

        try {
            // Load MobileNet for feature extraction
            if (!this._mobilenet) {
                const mobilenet = await import('@tensorflow-models/mobilenet');
                this._mobilenet = await mobilenet.load();
            }

            // Get embeddings from MobileNet
            const embeddings = this._mobilenet.infer(this._video, true);
            const embeddingArray = await embeddings.data();

            // Store sample
            this._samples.push({
                label,
                embeddings: Array.from(embeddingArray),
            });

            console.log(`[ML] Added sample for class: ${label} (Total: ${this._samples.length})`);
        } catch (err: any) {
            console.error('[ML] Failed to add sample:', err.message);
        }
    }

    train(): void {
        if (this._samples.length === 0) {
            console.warn('[ML] No samples to train');
            return;
        }

        // KNN classifier doesn't need explicit training
        // Just organize samples by class
        this._model = {};
        for (const sample of this._samples) {
            if (!this._model[sample.label]) {
                this._model[sample.label] = [];
            }
            this._model[sample.label].push(sample.embeddings);
        }

        console.log(`[ML] Model trained with ${this._samples.length} samples`);
    }

    clearAll(): void {
        this._samples = [];
        this._model = null;
        this._prediction = 'none';
        this._confidence = 0;
        console.log('[ML] All samples cleared');
    }

    clearClass(label: string): void {
        this._samples = this._samples.filter(s => s.label !== label);
        if (this._model && this._model[label]) {
            delete this._model[label];
        }
        console.log(`[ML] Cleared samples for class: ${label}`);
    }

    async analyse(action: string): Promise<void> {
        if (action === 'on') {
            await this.startClassification();
        } else if (action === 'off') {
            this.stopClassification();
        }
    }

    private async startClassification(): Promise<void> {
        if (this._analyzing || !this._model) return;

        if (!this._video) {
            await this.startCamera();
        }

        this._analyzing = true;
        this.classifyLoop();
        console.log('[ML] Classification started');
    }

    private classifyLoop(): void {
        if (!this._analyzing || !this._video || !this._mobilenet) return;

        // Get embeddings for current frame
        const embeddings = this._mobilenet.infer(this._video, true);
        
        // Classify using KNN
        this.classify(embeddings);

        setTimeout(() => this.classifyLoop(), 500);
    }

    private async classify(embeddings: any): Promise<void> {
        if (!this._model) return;

        const embeddingArray = await embeddings.data();
        let bestClass = 'none';
        let bestConfidence = 0;

        // Simple KNN classification
        for (const [label, samples] of Object.entries(this._model)) {
            const classSamples = samples as number[][];
            let minDist = Infinity;

            for (const sample of classSamples) {
                let dist = 0;
                for (let i = 0; i < embeddingArray.length; i++) {
                    dist += Math.pow(embeddingArray[i] - sample[i], 2);
                }
                dist = Math.sqrt(dist);
                if (dist < minDist) {
                    minDist = dist;
                }
            }

            // Convert distance to confidence (0-100)
            const confidence = Math.max(0, 100 - minDist * 10);
            if (confidence > bestConfidence) {
                bestConfidence = confidence;
                bestClass = label;
            }
        }

        this._prediction = bestClass;
        this._confidence = bestConfidence;
    }

    private async startCamera(): Promise<void> {
        try {
            this._stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });

            this._video = document.createElement('video');
            this._video.srcObject = this._stream;
            this._video.autoplay = true;
            await this._video.play();
        } catch (err: any) {
            console.error('[ML] Camera error:', err.message);
        }
    }

    stopClassification(): void {
        this._analyzing = false;
        console.log('[ML] Classification stopped');
    }

    getPrediction(): string {
        return this._prediction;
    }

    getConfidence(): number {
        return this._confidence;
    }

    isClass(cls: string): boolean {
        return this._prediction.toLowerCase() === cls.toLowerCase();
    }

    getClassCount(): number {
        if (!this._model) return 0;
        return Object.keys(this._model).length;
    }

    getSampleCount(label: string): number {
        return this._samples.filter(s => s.label === label).length;
    }

    isTrained(): boolean {
        return this._model !== null && this._samples.length > 0;
    }

    destroy(): void {
        this.stopClassification();
        if (this._stream) {
            this._stream.getTracks().forEach(track => track.stop());
        }
        this._samples = [];
        this._model = null;
    }
}

export const mlBlocks = [
    {
        type: 'ml_add_sample',
        message0: 'add camera sample as %1',
        args0: [{
            type: 'field_input',
            name: 'LABEL',
            text: 'class1'
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#D43D41',
        tooltip: 'Capture current camera frame and add as training sample for the given class label',
        helpUrl: ''
    },
    {
        type: 'ml_train',
        message0: 'train model',
        previousStatement: null,
        nextStatement: null,
        colour: '#D43D41',
        tooltip: 'Train the classifier with all collected samples',
        helpUrl: ''
    },
    {
        type: 'ml_clear_all',
        message0: 'clear all samples',
        previousStatement: null,
        nextStatement: null,
        colour: '#D43D41',
        tooltip: 'Remove all training samples and reset the model',
        helpUrl: ''
    },
    {
        type: 'ml_clear_class',
        message0: 'clear samples of %1',
        args0: [{
            type: 'field_input',
            name: 'LABEL',
            text: 'class1'
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#D43D41',
        tooltip: 'Remove all samples for the given class',
        helpUrl: ''
    },
    {
        type: 'ml_analyze',
        message0: '%1 classification',
        args0: [{
            type: 'field_dropdown',
            name: 'ACTION',
            options: [
                ['start', 'on'],
                ['stop', 'off']
            ]
        }],
        previousStatement: null,
        nextStatement: null,
        colour: '#D43D41',
        tooltip: 'Start or stop live classification from camera',
        helpUrl: ''
    },
    {
        type: 'ml_get_prediction',
        message0: 'prediction',
        output: 'String',
        colour: '#b71c1c',
        tooltip: 'Get the current classification prediction',
        helpUrl: ''
    },
    {
        type: 'ml_get_confidence',
        message0: 'confidence',
        output: 'Number',
        colour: '#b71c1c',
        tooltip: 'Get the confidence of the current prediction (0-100)',
        helpUrl: ''
    },
    {
        type: 'ml_is_class',
        message0: 'prediction is %1?',
        args0: [{
            type: 'field_input',
            name: 'CLASS',
            text: 'class1'
        }],
        output: 'Boolean',
        colour: '#b71c1c',
        tooltip: 'Check if the current prediction matches the given class',
        helpUrl: ''
    },
    {
        type: 'ml_get_class_count',
        message0: 'number of classes',
        output: 'Number',
        colour: '#b71c1c',
        tooltip: 'Get the number of trained classes',
        helpUrl: ''
    },
    {
        type: 'ml_get_sample_count',
        message0: 'sample count of %1',
        args0: [{
            type: 'field_input',
            name: 'LABEL',
            text: 'class1'
        }],
        output: 'Number',
        colour: '#b71c1c',
        tooltip: 'Get the number of samples collected for a class',
        helpUrl: ''
    },
    {
        type: 'ml_is_trained',
        message0: 'model trained?',
        output: 'Boolean',
        colour: '#b71c1c',
        tooltip: 'Check if the model has been trained',
        helpUrl: ''
    },
];

export function registerMLBlocks() {
    const newBlocks = mlBlocks.filter(block => !Blockly.Blocks[block.type]);
    if (newBlocks.length > 0) {
        Blockly.common.defineBlocks(Blockly.common.createBlockDefinitionsFromJsonArray(newBlocks));
    }
}

export const mlExtension = {
    id: 'ml_machine_learning',
    name: 'ML Environment',
    colour: '#D43D41',
    icon: '🤖',
    blocks: mlBlocks.map(block => ({
        kind: 'block',
        type: block.type
    }))
};
