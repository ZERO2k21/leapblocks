/**
 * Shared KNN Classifier using TensorFlow.js cosine similarity.
 * Used by PoseClassifier, HandPoseClassifier, TextClassifier, and AudioClassifier.
 */

import { ensureTf } from './loadScript'

export interface KNNPrediction {
    label: string
    confidences: Record<string, number>
    /** True cosine similarity to the closest training example (0-1). */
    similarity?: number
}

/** Predictions below this cosine similarity are treated as "not from the training samples". */
export const RELATEDNESS_THRESHOLD = 0.4

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
        try {
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
        let maxCosine = -Infinity

        for (const label of labels) {
            const examples = this.examples[label]
            const sim = tf.tidy(() => {
                const dot = tf.sum(tf.mul(emb, examples), 1)
                return dot.squeeze()
            })
            const vals = await sim.data() as Float32Array
            sim.dispose()

            const cos = tf.tidy(() => {
                const embNorm = tf.div(emb, tf.maximum(tf.norm(emb), 1e-10))
                const exNorm = tf.div(examples, tf.maximum(tf.norm(examples, 2, 1).expandDims(1), 1e-10))
                const dot = tf.sum(tf.mul(embNorm, exNorm), 1)
                return dot.squeeze()
            })
            const cosVals = await cos.data() as Float32Array
            cos.dispose()

            // After L2-normalizing combined embedding (ImageClassifier:1293-d), dot == cosine.
            // Use cosine for ranking — more stable for natural images (cat/dog) where
            // shape magnitude previously biased dot. Falls back to dot if embeddings
            // aren't normalized (other classifiers).
            const useCosine = true
            const rankingVals = useCosine ? cosVals : vals
            const sorted = Array.from(rankingVals).sort((a: number, b: number) => b - a)
            const topK = sorted.slice(0, effectiveK)

            if (topK.length > 0 && topK[0] > maxSimilarity) {
                maxSimilarity = topK[0]
            }
            const bestCos = Array.from(cosVals).reduce((m, v) => Math.max(m, v), -Infinity)
            if (bestCos > maxCosine) {
                maxCosine = bestCos
            }

            // keep original exp*2 weighting — stable for dot values
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

        // Softmax directly on weightedScores. For L2-normalized embeddings
        // cosine ∈ [0,1], temp 0.25 gives sharper separation: 0.85 vs 0.65 → 69/31,
        // 0.90 vs 0.70 → 73/27. Previously dot ~1-2 with temp 0.4.
        const temperature = 0.25
        const expScores: Record<string, number> = {}
        for (const l of labels) {
            expScores[l] = Math.exp(weightedScores[l] / temperature)
        }
        const expTotal = Object.values(expScores).reduce((s, v) => s + v, 0) || 1

        const rawConfidences: Record<string, number> = {}
        labels.forEach(l => { rawConfidences[l] = expScores[l] / expTotal })

        // Keep raw confidences directly — previous margin cap (0.85 on top when margin<0.12)
        // systematically favored the 2nd class on ties and caused 0% accuracy when
        // embeddings were near-identical (double-normalization bug). With fixed
        // embeddings the margin is usually >0.15, but we remove the bias entirely
        // to avoid flipping winners on genuine ties.
        const confidences: Record<string, number> = { ...rawConfidences }

        if (this.plattScaleA !== 1.0 || this.plattScaleB !== 0.0) {
            for (const l of labels) {
                const logit = Math.log(confidences[l] / Math.max(1 - confidences[l], 1e-10))
                confidences[l] = 1 / (1 + Math.exp(-(this.plattScaleA * logit + this.plattScaleB)))
            }
        }

        const winner = labels.reduce((a, b) => confidences[a] > confidences[b] ? a : b)

        return { label: winner, confidences, similarity: maxCosine }
        } catch (err) {
            // TF.js backend corruption (e.g. WebGL context loss) — return null instead of crashing
            return null
        }
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
            try {
                // Guard against disposed tensors (bug #disposed) — treat as 0
                if ((v as any).isDisposed) {
                    out[k] = 0
                    continue
                }
                out[k] = (v as any).shape[0]
            } catch {
                out[k] = 0
            }
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
        if (!examples || (examples as any).isDisposed) return null
        try {
            if (examples.shape[0] <= index) return null
        } catch {
            return null
        }

        // Extract the row data before removing — dispose slice after .data()
        const sliceForData = examples.slice([index, 0], [1, -1])
        const rowData = await sliceForData.data() as Float32Array
        sliceForData.dispose()
        const embedding = Array.from(rowData)

        // Remove the row by concatenating slices before and after
        const before = examples.slice([0, 0], [index, -1])
        const after = examples.slice([index + 1, 0], [-1, -1])
        const hasBefore = before.shape[0] > 0
        const hasAfter = after.shape[0] > 0

        if (hasBefore && hasAfter) {
            const concatenated = tf.concat([before, after], 0)
            this.examples[label] = concatenated
            before.dispose()
            after.dispose()
            examples.dispose()
        } else if (hasBefore) {
            this.examples[label] = before
            after.dispose()
            examples.dispose()
        } else if (hasAfter) {
            this.examples[label] = after
            before.dispose()
            examples.dispose()
        } else {
            // Only one example existed, now empty
            before.dispose()
            after.dispose()
            examples.dispose()
            delete this.examples[label]
        }

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
