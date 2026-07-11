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
     * Predict the class of an embedding using cosine similarity + top-k voting.
     * Enhanced with softmax temperature scaling for higher confidence values.
     */
    async predictClass(embedding: any, k = 5): Promise<KNNPrediction | null> {
        const tf = await ensureTf()
        const labels = Object.keys(this.examples)
        if (!labels.length) return null

        const flat = embedding.reshape([embedding.size])
        const emb = flat.expandDims(0)
        flat.dispose()
        const scores: Record<string, number> = {}

        for (const label of labels) {
            const examples = this.examples[label]
            const sim = tf.tidy(() => {
                const normEmb = tf.div(emb, tf.norm(emb))
                const normEx = tf.div(examples, tf.norm(examples, 2, 1, true))
                return normEmb.matMul(normEx.transpose()).squeeze()
            })
            const vals = await sim.data() as Float32Array
            sim.dispose()
            // Use top-k similarities and average them for more stable scores
            const sorted = Array.from(vals).sort((a: number, b: number) => b - a)
            const topK = sorted.slice(0, Math.min(k, sorted.length))
            // Weighted average: give more weight to closer neighbors
            const weightedSum = topK.reduce((s, v, i) => s + v * (1 - i * 0.1), 0)
            const weightDivisor = topK.reduce((s, _, i) => s + (1 - i * 0.1), 0)
            scores[label] = weightDivisor > 0 ? weightedSum / weightDivisor : 0
        }

        emb.dispose()

        // Apply softmax with temperature scaling for higher confidence
        const temperature = 0.3 // Lower temperature = sharper distribution = higher confidence
        const maxScore = Math.max(...Object.values(scores))
        const expScores: Record<string, number> = {}
        let expSum = 0
        
        for (const label of labels) {
            // Shift scores and apply exponential
            expScores[label] = Math.exp((scores[label] - maxScore) / temperature)
            expSum += expScores[label]
        }

        // Normalize to get confidence values
        const confidences: Record<string, number> = {}
        for (const label of labels) {
            confidences[label] = expScores[label] / expSum
        }

        // Boost confidence: apply power scaling to further increase high-confidence predictions
        const boostFactor = 1.5
        let boostedSum = 0
        for (const label of labels) {
            confidences[label] = Math.pow(confidences[label], 1 / boostFactor)
            boostedSum += confidences[label]
        }
        // Re-normalize after boosting
        for (const label of labels) {
            confidences[label] = confidences[label] / boostedSum
        }

        const winner = labels.reduce((a, b) => confidences[a] > confidences[b] ? a : b)

        return { label: winner, confidences }
    }

    /**
     * Predict from raw Float32Array data.
     */
    async predictFromData(data: Float32Array | number[], k = 3): Promise<KNNPrediction | null> {
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
     * Requires at least 2 classes with at least 1 sample each.
     */
    get canClassify(): boolean {
        const counts = this.getSampleCounts()
        return Object.keys(counts).length >= 2
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
