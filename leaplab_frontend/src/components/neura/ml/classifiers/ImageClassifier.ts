import { KNNClassifier, ensureTf } from '../KNNClassifier'
import { ensureMobileNet } from '../loadScript'

export interface ImagePrediction {
    label: string
    confidences: Record<string, number>
}

export class ImageClassifier {
    private knn = new KNNClassifier()
    private mobilenetModel: any = null

    private async ensureModel() {
        if (this.mobilenetModel) return this.mobilenetModel
        const mobilenet = await ensureMobileNet()
        this.mobilenetModel = await mobilenet.load()
        return this.mobilenetModel
    }

    async addSample(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, label: string) {
        const model = await this.ensureModel()
        const embedding = model.infer(imageElement, true)
        await this.knn.addExample(embedding, label)
        embedding.dispose()
    }

    async addSampleFromData(imageData: ImageData, label: string) {
        const tf = await ensureTf()
        const tensor = tf.browser.fromPixels(imageData).toFloat()
        const model = await this.ensureModel()
        const embedding = model.infer(tensor, true)
        await this.knn.addExample(embedding, label)
        tensor.dispose()
        embedding.dispose()
    }

    async predict(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, k = 3): Promise<ImagePrediction | null> {
        const model = await this.ensureModel()
        const embedding = model.infer(imageElement, true)
        const result = await this.knn.predictClass(embedding, k)
        embedding.dispose()
        return result
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

    async rebuildClass(label: string, imageDataUrls: string[]): Promise<void> {
        this.knn.clearClass(label)
        for (const dataUrl of imageDataUrls) {
            try {
                const img = new Image()
                img.src = dataUrl
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve()
                    img.onerror = () => reject(new Error('Failed to load image'))
                    setTimeout(() => resolve(), 2000)
                })
                await this.addSample(img, label)
            } catch {
                // Skip failed images
            }
        }
    }

    dispose(): void {
        this.knn.dispose()
        this.mobilenetModel = null
    }
}
