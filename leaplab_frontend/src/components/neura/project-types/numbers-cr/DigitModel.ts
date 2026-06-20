/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * DigitModel — TensorFlow.js CNN for handwritten digit recognition (0-9)
 * Simple CNN trained on user-captured 28×28 grayscale images
 */

import * as tf from '@tensorflow/tfjs'

export interface PredictionResult {
    label: number
    confidences: Record<number, number>
}

export interface TrainingProgress {
    epoch: number
    loss: number
    accuracy: number
}

export class DigitModel {
    private model: tf.LayersModel | null = null
    private samples: Map<number, ImageData[]> = new Map()
    private _isTrained = false
    private _accuracy = 0

    constructor() {
        // Initialize sample storage for digits 0-9
        for (let i = 0; i < 10; i++) {
            this.samples.set(i, [])
        }
    }

    get isTrained() {
        return this._isTrained
    }

    get accuracy() {
        return this._accuracy
    }

    get totalSamples() {
        let total = 0
        this.samples.forEach(samples => { total += samples.length })
        return total
    }

    getSampleCounts(): Record<number, number> {
        const counts: Record<number, number> = {}
        this.samples.forEach((samples, digit) => {
            counts[digit] = samples.length
        })
        return counts
    }

    addSample(digit: number, imageData: ImageData): void {
        if (digit < 0 || digit > 9) return
        const existing = this.samples.get(digit) || []
        existing.push(imageData)
        this.samples.set(digit, existing)
    }

    removeSample(digit: number, index: number): void {
        const existing = this.samples.get(digit) || []
        existing.splice(index, 1)
        this.samples.set(digit, existing)
    }

    clearSamples(digit?: number): void {
        if (digit !== undefined) {
            this.samples.set(digit, [])
        } else {
            for (let i = 0; i < 10; i++) {
                this.samples.set(i, [])
            }
        }
    }

    /**
     * Build a simple CNN model for digit classification
     */
    private buildModel(): tf.LayersModel {
        const model = tf.sequential({
            layers: [
                // First conv block
                tf.layers.conv2d({
                    inputShape: [28, 28, 1],
                    filters: 16,
                    kernelSize: 3,
                    activation: 'relu',
                    padding: 'same',
                }),
                tf.layers.maxPooling2d({ poolSize: 2 }),

                // Second conv block
                tf.layers.conv2d({
                    filters: 32,
                    kernelSize: 3,
                    activation: 'relu',
                    padding: 'same',
                }),
                tf.layers.maxPooling2d({ poolSize: 2 }),

                // Third conv block
                tf.layers.conv2d({
                    filters: 64,
                    kernelSize: 3,
                    activation: 'relu',
                    padding: 'same',
                }),
                tf.layers.maxPooling2d({ poolSize: 2 }),

                // Dense layers
                tf.layers.flatten(),
                tf.layers.dense({ units: 128, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 10, activation: 'softmax' }),
            ],
        })

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy'],
        })

        return model
    }

    /**
     * Convert ImageData to normalized tensor
     */
    private imageDataToTensor(imageData: ImageData): tf.Tensor4D {
        const data = new Float32Array(28 * 28)
        for (let i = 0; i < 28 * 28; i++) {
            // Use red channel (grayscale), normalize to 0-1
            data[i] = imageData.data[i * 4] / 255.0
        }
        return tf.tensor4d(data, [1, 28, 28, 1])
    }

    /**
     * Prepare training data from collected samples
     */
    private prepareData(): { xs: tf.Tensor4D; ys: tf.Tensor2D } {
        const images: Float32Array[] = []
        const labels: number[] = []

        this.samples.forEach((samples, digit) => {
            samples.forEach(imageData => {
                const data = new Float32Array(28 * 28)
                for (let i = 0; i < 28 * 28; i++) {
                    data[i] = imageData.data[i * 4] / 255.0
                }
                images.push(data)
                labels.push(digit)
            })
        })

        // Create tensors
        const xsData = new Float32Array(images.length * 28 * 28)
        images.forEach((img, i) => {
            xsData.set(img, i * 28 * 28)
        })

        const xs = tf.tensor4d(xsData, [images.length, 28, 28, 1])

        // One-hot encode labels
        const ysData = new Float32Array(images.length * 10)
        labels.forEach((label, i) => {
            ysData[i * 10 + label] = 1
        })
        const ys = tf.tensor2d(ysData, [images.length, 10])

        return { xs, ys }
    }

    /**
     * Train the model on collected samples
     */
    async train(
        onProgress?: (progress: TrainingProgress) => void,
        epochs: number = 20
    ): Promise<number> {
        const totalSamples = this.totalSamples
        if (totalSamples < 2) {
            throw new Error('Need at least 2 samples to train')
        }

        // Check we have at least 2 classes with samples
        let classesWithSamples = 0
        this.samples.forEach(samples => {
            if (samples.length > 0) classesWithSamples++
        })
        if (classesWithSamples < 2) {
            throw new Error('Need samples from at least 2 different digits')
        }

        // Build model
        this.model = this.buildModel()

        // Prepare data
        const { xs, ys } = this.prepareData()

        // Data augmentation: add slight noise
        const noisyXs = tf.tidy(() => {
            const noise = tf.randomNormal(xs.shape, 0, 0.05)
            return tf.add(xs, noise).clipByValue(0, 1) as tf.Tensor4D
        })

        // Train
        let finalAccuracy = 0
        await this.model.fit(tf.concat([xs, noisyXs], 0), tf.concat([ys, ys], 0), {
            epochs,
            batchSize: 16,
            shuffle: true,
            validationSplit: 0.15,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    const accuracy = logs?.acc || logs?.accuracy || 0
                    finalAccuracy = accuracy
                    onProgress?.({
                        epoch: epoch + 1,
                        loss: logs?.loss || 0,
                        accuracy: accuracy,
                    })
                    // Yield to browser
                    await tf.nextFrame()
                },
            },
        })

        // Cleanup
        xs.dispose()
        ys.dispose()
        noisyXs.dispose()

        this._isTrained = true
        this._accuracy = finalAccuracy
        return finalAccuracy
    }

    /**
     * Predict digit from ImageData
     */
    async predict(imageData: ImageData): Promise<PredictionResult> {
        if (!this.model) {
            throw new Error('Model not trained yet')
        }

        const tensor = this.imageDataToTensor(imageData)
        const prediction = this.model.predict(tensor) as tf.Tensor
        const confidences = await prediction.data()

        tensor.dispose()
        prediction.dispose()

        // Build result
        const result: Record<number, number> = {}
        let maxConf = 0
        let maxDigit = 0

        for (let i = 0; i < 10; i++) {
            result[i] = confidences[i]
            if (confidences[i] > maxConf) {
                maxConf = confidences[i]
                maxDigit = i
            }
        }

        return { label: maxDigit, confidences: result }
    }

    /**
     * Dispose of model and free memory
     */
    dispose(): void {
        if (this.model) {
            this.model.dispose()
            this.model = null
        }
        this._isTrained = false
    }
}

// Singleton instance for the app
let instance: DigitModel | null = null

export function getDigitModel(): DigitModel {
    if (!instance) {
        instance = new DigitModel()
    }
    return instance
}
