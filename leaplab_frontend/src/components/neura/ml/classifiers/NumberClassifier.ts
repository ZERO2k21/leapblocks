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

        let sumX = 0, sumY = 0, count = 0
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const alpha = data[(y * size + x) * 4 + 3]
                if (alpha > 0) {
                    sumX += x
                    sumY += y
                    count++
                }
            }
        }

        const features = new Float32Array(784)
        if (count === 0) return features

        const cx = sumX / count
        const cy = sumY / count
        const maxDist = Math.sqrt(size * size + size * size)

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = y * size + x
                const alpha = data[idx * 4 + 3]
                const r = data[idx * 4]
                const g = data[idx * 4 + 1]
                const b = data[idx * 4 + 2]

                const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
                const distNorm = dist / maxDist
                const brightness = (r + g + b) / (3 * 255)
                const alphaNorm = alpha / 255

                features[idx] = brightness * alphaNorm * (1 - distNorm * 0.5)
            }
        }

        let max = 0
        for (let i = 0; i < features.length; i++) {
            if (features[i] > max) max = features[i]
        }
        if (max > 0) {
            for (let i = 0; i < features.length; i++) {
                features[i] /= max
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
