/**
 * Shared KNN Classifier using TensorFlow.js cosine similarity.
 * Used by PoseClassifier, HandPoseClassifier, TextClassifier, and AudioClassifier.
 */

import { ensureTf } from './loadScript'

export interface KNNPrediction {
    label: string
    confidences: Record<string, number>
}

export class KNNClassifier {
    private examples: Record<string, any> = {}
    private disposed = false
    private minSimilarityThreshold = 0.1
    private plattScaleA = 1.0
    private plattScaleB = 0.0

    setOutlierThreshold(threshold: number): void {
        this.minSimilarityThreshold = Math.max(0, Math.min(1, threshold))
    }

    calibrateConfidence(scaleA: number, scaleB: number): void {
        this.plattScaleA = scaleA
        this.plattScaleB = scaleB
    }

    /**
     * Add an example embedding for a given class label.
     * @param embedding - A 1D tf.Tensor (the feature vector)
     * @param label - The class name/label
     */
    async addExample(embedding: any, label: string): Promise<void> {
        const tf = await ensureTf()
        const flat = embedding.reshape([embedding.size])
        const ex = flat.expandDims(0)
        flat.dispose()
        if (!this.examples[label]) {
            this.examples[label] = ex
        } else {
            const prev = this.examples[label]
            this.examples[label] = tf.concat([prev, ex], 0)
            prev.dispose()
            ex.dispose()
        }
    }

    /**
     * Add a raw Float32Array as an embedding for a given class label.
     */
    async addExampleFromData(data: Float32Array | number[], label: string): Promise<void> {
        const tf = await ensureTf()
        const embedding = tf.tensor1d(data)
        await this.addExample(embedding, label)
        embedding.dispose()
    }

    /**
     * Predict the class of an embedding using cosine similarity + distance-weighted top-k voting.
     * Automatically adjusts k based on the smallest class size for optimal accuracy.
     */
    async predictClass(embedding: any, k = 5): Promise<KNNPrediction | null> {
        const tf = await ensureTf()
        const labels = Object.keys(this.examples)
        if (!labels.length) return null

        const flat = embedding.reshape([embedding.size])
        const emb = flat.expandDims(0)
        flat.dispose()

        const minClassSize = Math.min(...labels.map(l => (this.examples[l] as any).shape[0]))
        const adaptiveK = Math.min(k, minClassSize, 7)
        const effectiveK = Math.max(1, adaptiveK)

        const weightedScores: Record<string, number> = {}
        let maxSimilarity = -Infinity

        for (const label of labels) {
            const examples = this.examples[label]
            const sim = tf.tidy(() => {
                const dot = tf.sum(tf.mul(emb, examples), 1)
                return dot.squeeze()
            })
            const vals = await sim.data() as Float32Array
            sim.dispose()

            const sorted = Array.from(vals).sort((a: number, b: number) => b - a)
            const topK = sorted.slice(0, effectiveK)

            if (topK.length > 0 && topK[0] > maxSimilarity) {
                maxSimilarity = topK[0]
            }

            const weightedSum = topK.reduce((s, v) => {
                const weight = Math.exp(v * 2)
                return s + v * weight
            }, 0)
            const weightTotal = topK.reduce((s, v) => s + Math.exp(v * 2), 0) || 1
            weightedScores[label] = weightedSum / weightTotal
        }

        emb.dispose()

        if (maxSimilarity < this.minSimilarityThreshold) {
            return null
        }

        const temperature = 0.8
        const scores = Object.values(weightedScores)
        const minScore = Math.min(...scores)
        const maxScore = Math.max(...scores)
        const range = maxScore - minScore || 1

        const expScores: Record<string, number> = {}
        for (const l of labels) {
            const normalized = (weightedScores[l] - minScore) / range
            expScores[l] = Math.exp(normalized / temperature)
        }
        const expTotal = Object.values(expScores).reduce((s, v) => s + v, 0) || 1

        const confidences: Record<string, number> = {}
        labels.forEach(l => { confidences[l] = expScores[l] / expTotal })

        if (this.plattScaleA !== 1.0 || this.plattScaleB !== 0.0) {
            for (const l of labels) {
                const logit = Math.log(confidences[l] / Math.max(1 - confidences[l], 1e-10))
                confidences[l] = 1 / (1 + Math.exp(-(this.plattScaleA * logit + this.plattScaleB)))
            }
        }

        const winner = labels.reduce((a, b) => confidences[a] > confidences[b] ? a : b)

        return { label: winner, confidences }
    }

    /**
     * Predict from raw Float32Array data.
     */
    async predictFromData(data: Float32Array | number[], k = 5): Promise<KNNPrediction | null> {
        const tf = await ensureTf()
        const embedding = tf.tensor1d(data)
        const result = await this.predictClass(embedding, k)
        embedding.dispose()
        return result
    }

    /**
     * Get the number of samples for each class.
     */
    getSampleCounts(): Record<string, number> {
        const out: Record<string, number> = {}
        for (const [k, v] of Object.entries(this.examples)) {
            out[k] = (v as any).shape[0]
        }
        return out
    }

    /**
     * Get the number of classes.
     */
    get classCount(): number {
        return Object.keys(this.examples).length
    }

    /**
     * Check if the classifier has enough data to train.
     * Requires at least 2 classes with at least 2 samples each for reliable KNN.
     */
    get canClassify(): boolean {
        const counts = this.getSampleCounts()
        const classLabels = Object.keys(counts)
        if (classLabels.length < 2) return false
        // Need at least 2 samples per class for meaningful leave-one-out and kNN
        return classLabels.every(l => counts[l] >= 2)
    }

    /**
     * Clear all examples for all classes.
     */
    clear(): void {
        Object.values(this.examples).forEach((t: any) => {
            if (t && typeof t.dispose === 'function') t.dispose()
        })
        this.examples = {}
    }

    /**
     * Clear examples for a specific class.
     */
    clearClass(label: string): void {
        if (this.examples[label]) {
            this.examples[label].dispose()
            delete this.examples[label]
        }
    }

    /**
     * Remove a specific example by index from a class (for leave-one-out CV).
     * Returns the removed embedding data for re-addition later.
     */
    async removeExampleByIndex(label: string, index: number): Promise<Float32Array | null> {
        const tf = await ensureTf()
        const examples = this.examples[label]
        if (!examples || examples.shape[0] <= index) return null

        // Extract the row data before removing
        const rowData = await examples.slice([index, 0], [1, -1]).data() as Float32Array
        const embedding = Array.from(rowData)

        // Remove the row by concatenating slices before and after
        const before = examples.slice([0, 0], [index, -1])
        const after = examples.slice([index + 1, 0], [-1, -1])
        const hasBefore = before.shape[0] > 0
        const hasAfter = after.shape[0] > 0

        if (hasBefore && hasAfter) {
            this.examples[label] = tf.concat([before, after], 0)
        } else if (hasBefore) {
            this.examples[label] = before
        } else if (hasAfter) {
            this.examples[label] = after
        } else {
            // Only one example existed, now empty
            this.examples[label].dispose()
            delete this.examples[label]
        }

        before.dispose()
        after.dispose()

        return new Float32Array(embedding)
    }

    /**
     * Re-add an example at the end of a class (after leave-one-out removal).
     */
    async addExampleFromDataArray(data: number[], label: string): Promise<void> {
        const tf = await ensureTf()
        const embedding = tf.tensor1d(data)
        await this.addExample(embedding, label)
        embedding.dispose()
    }

    /**
     * Dispose of all resources.
     */
    dispose(): void {
        if (this.disposed) return
        this.clear()
        this.disposed = true
    }
}

export { ensureTf } from './loadScript'
