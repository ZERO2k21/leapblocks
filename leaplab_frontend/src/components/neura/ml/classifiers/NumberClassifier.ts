import { KNNClassifier, ensureTf } from '../KNNClassifier'

export interface NumberPrediction {
    label: string
    confidences: Record<string, number>
}

export class NumberClassifier {
    private knn = new KNNClassifier()

    private processCanvas(canvas: HTMLCanvasElement): Float32Array {
        const ctx = canvas.getContext('2d')
        if (!ctx) return new Float32Array(784)

        const size = 28
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = size
        tempCanvas.height = size
        const tempCtx = tempCanvas.getContext('2d')!

        tempCtx.fillStyle = '#000'
        tempCtx.fillRect(0, 0, size, size)
        tempCtx.drawImage(canvas, 0, 0, size, size)

        const imageData = tempCtx.getImageData(0, 0, size, size)
        const data = imageData.data

        const features = new Float32Array(784)
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = y * size + x
                const r = data[idx * 4]
                const g = data[idx * 4 + 1]
                const b = data[idx * 4 + 2]
                const alpha = data[idx * 4 + 3]

                // Grayscale conversion (standard luminance formula)
                const gray = (r * 0.299 + g * 0.587 + b * 0.114) / 255
                const alphaNorm = alpha / 255

                // Raw grayscale * alpha — simple, effective MNIST-style features
                features[idx] = gray * alphaNorm
            }
        }

        return features
    }

    async addSample(canvas: HTMLCanvasElement, label: string) {
        const tf = await ensureTf()
        const features = this.processCanvas(canvas)
        const embedding = tf.tensor1d(features)
        await this.knn.addExample(embedding, label)
        embedding.dispose()
    }

    async addSampleFromImageData(imageData: ImageData, label: string) {
        const tf = await ensureTf()
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = imageData.width
        tempCanvas.height = imageData.height
        const tempCtx = tempCanvas.getContext('2d')!
        tempCtx.putImageData(imageData, 0, 0)
        const features = this.processCanvas(tempCanvas)
        const embedding = tf.tensor1d(features)
        await this.knn.addExample(embedding, label)
        embedding.dispose()
    }

    async predict(canvas: HTMLCanvasElement, k = 3): Promise<NumberPrediction | null> {
        const tf = await ensureTf()
        const features = this.processCanvas(canvas)
        const embedding = tf.tensor1d(features)
        const result = await this.knn.predictClass(embedding, k)
        embedding.dispose()
        return result
    }

    processCanvasToImage(canvas: HTMLCanvasElement): string {
        return canvas.toDataURL('image/png')
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
    }
}
