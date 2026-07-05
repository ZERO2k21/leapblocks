import { KNNClassifier } from '../KNNClassifier'
import { ensureUSE } from '../loadScript'

export interface TextPrediction {
    label: string
    confidences: Record<string, number>
}

export class TextClassifier {
    private knn = new KNNClassifier()
    private useModel: any = null

    private async ensureModel() {
        if (this.useModel) return this.useModel
        this.useModel = await ensureUSE()
        return this.useModel
    }

    private async embedText(text: string) {
        const use = await this.ensureModel()
        const embeddings = await use.embed([text])
        return embeddings
    }

    async addSample(text: string, label: string) {
        const embedding = await this.embedText(text)
        const reshaped = embedding.squeeze([0])
        await this.knn.addExample(reshaped, label)
        reshaped.dispose()
        embedding.dispose()
    }

    async addSampleBatch(texts: string[], label: string) {
        const use = await this.ensureModel()
        const embeddings = await use.embed(texts)
        const numSamples = texts.length
        for (let i = 0; i < numSamples; i++) {
            const singleEmbedding = embeddings.slice([i, 0], [1, -1]).squeeze([0])
            await this.knn.addExample(singleEmbedding, label)
            singleEmbedding.dispose()
        }
        embeddings.dispose()
    }

    async predict(text: string, k = 3): Promise<TextPrediction | null> {
        const embedding = await this.embedText(text)
        const reshaped = embedding.squeeze([0])
        const result = await this.knn.predictClass(reshaped, k)
        reshaped.dispose()
        embedding.dispose()
        return result
    }

    async predictBatch(texts: string[], k = 3): Promise<(TextPrediction | null)[]> {
        const use = await this.ensureModel()
        const embeddings = await use.embed(texts)
        const results: (TextPrediction | null)[] = []
        for (let i = 0; i < texts.length; i++) {
            const singleEmbedding = embeddings.slice([i, 0], [1, -1]).squeeze([0])
            const result = await this.knn.predictClass(singleEmbedding, k)
            results.push(result)
            singleEmbedding.dispose()
        }
        embeddings.dispose()
        return results
    }

    getSampleCounts(): Record<string, number> {
        return this.knn.getSampleCounts()
    }

    get classCount(): number {
        return this.knn.classCount
    }

    get canClassify(): boolean {
        return this.knn.canClassify
    }

    clear(): void {
        this.knn.clear()
    }

    clearClass(label: string): void {
        this.knn.clearClass(label)
    }

    dispose(): void {
        this.knn.dispose()
        this.useModel = null
    }
}
