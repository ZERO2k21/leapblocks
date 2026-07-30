import { KNNClassifier } from '../KNNClassifier'
import { ensureUSE } from '../loadScript'

export interface TextPrediction {
    label: string
    confidences: Record<string, number>
}

const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'can', 'could', 'shall', 'should', 'may', 'might', 'it',
    'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
    'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
    'his', 'their', 'our', 'not', 'no', 'nor', 'so', 'very', 'just',
    'about', 'up', 'down', 'out', 'over', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'only', 'own', 'same', 'too', 'very', 's', 't',
    're', 've', 'll', 'don', 'didn', 'isn', 'aren', 'won', 'can',
])

function preprocessText(text: string): string {
    let cleaned = text.toLowerCase()
    cleaned = cleaned.replace(/<[^>]*>/g, ' ')
    cleaned = cleaned.replace(/[^a-z0-9\s']/g, ' ')
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    const words = cleaned.split(' ')
        .filter(w => w.length > 0 && !STOP_WORDS.has(w))
        .slice(0, 50)
    return words.join(' ')
}

export class TextClassifier {
    private knn = new KNNClassifier()
    private useModel: any = null

    private async ensureModel() {
        if (this.useModel) return this.useModel
        const use = await ensureUSE()
        this.useModel = await use.load()
        return this.useModel
    }

    private async embedText(text: string) {
        const use = await this.ensureModel()
        const cleaned = preprocessText(text)
        const embeddings = await use.embed([cleaned || ' '])
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
        const cleanedTexts = texts.map(t => preprocessText(t) || ' ')
        const embeddings = await use.embed(cleanedTexts)
        const numSamples = texts.length
        for (let i = 0; i < numSamples; i++) {
            const singleEmbedding = embeddings.slice([i, 0], [1, -1]).squeeze([0])
            await this.knn.addExample(singleEmbedding, label)
            singleEmbedding.dispose()
        }
        embeddings.dispose()
    }

    async predict(text: string, k = 5): Promise<TextPrediction | null> {
        const embedding = await this.embedText(text)
        const reshaped = embedding.squeeze([0])
        const result = await this.knn.predictClass(reshaped, k)
        reshaped.dispose()
        embedding.dispose()
        return result
    }

    async predictBatch(texts: string[], k = 5): Promise<(TextPrediction | null)[]> {
        const use = await this.ensureModel()
        const cleanedTexts = texts.map(t => preprocessText(t) || ' ')
        const embeddings = await use.embed(cleanedTexts)
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
