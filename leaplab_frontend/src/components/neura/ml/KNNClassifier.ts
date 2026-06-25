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
        const ex = embedding.expandDims(0)
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
     */
    async predictClass(embedding: any, k = 3): Promise<KNNPrediction | null> {
        const tf = await ensureTf()
        const labels = Object.keys(this.examples)
        if (!labels.length) return null

        const emb = embedding.expandDims(0)
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
            const sorted = Array.from(vals).sort((a: number, b: number) => b - a)
            scores[label] = sorted.slice(0, k).reduce((s: number, v: number) => s + v, 0) / Math.min(k, sorted.length)
        }

        emb.dispose()

        const total = Object.values(scores).reduce((s, v) => s + Math.max(0, v), 0) || 1
        const confidences: Record<string, number> = {}
        labels.forEach(l => { confidences[l] = Math.max(0, scores[l]) / total })
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
     * Dispose of all resources.
     */
    dispose(): void {
        if (this.disposed) return
        this.clear()
        this.disposed = true
    }
}

export { ensureTf } from './loadScript'
