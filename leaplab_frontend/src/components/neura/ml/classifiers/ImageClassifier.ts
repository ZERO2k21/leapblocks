import { KNNClassifier, ensureTf } from '../KNNClassifier'
import { ensureMobileNet } from '../loadScript'

export interface ImagePrediction {
    label: string
    confidences: Record<string, number>
}

export class ImageClassifier {
    private knn = new KNNClassifier()
    private mobilenetModel: any = null
    private mobilenetModule: any = null

    private async ensureModel() {
        if (this.mobilenetModel) return this.mobilenetModel
        const mobilenet = await ensureMobileNet()
        this.mobilenetModule = mobilenet
        this.mobilenetModel = await mobilenet.load()
        return this.mobilenetModel
    }

    /**
     * Preprocess an image element to ensure consistent 224x224 input for MobileNet.
     * Center-crops to square then resizes, matching MobileNet's expected input.
     */
    private async preprocessImage(
        input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
    ): Promise<any> {
        const tf = await ensureTf()

        // Convert to tensor
        let tensor = tf.browser.fromPixels(input).toFloat()

        // Get dimensions
        const [h, w] = tensor.shape

        // Center crop to square
        const size = Math.min(h, w)
        const top = Math.floor((h - size) / 2)
        const left = Math.floor((w - size) / 2)
        tensor = tf.slice(tensor, [top, left, 0], [size, size, 3])

        // Resize to 224x224 with bilinear interpolation
        tensor = tf.image.resizeBilinear(tensor, [224, 224])

        // MobileNet expects [-1, 1] normalization
        tensor = tensor.div(127.5).sub(1)

        return tensor
    }

    /**
     * Extract a rich embedding by combining multiple layer outputs from MobileNet.
     * This produces more discriminative features than a single layer.
     */
    private async extractEmbedding(input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<any> {
        const tf = await ensureTf()
        const model = await this.ensureModel()

        // Preprocess the image
        const tensor = await this.preprocessImage(input)

        // Get embedding from MobileNet (internal infer with embedding=true returns 1024-d vector)
        const embedding = model.infer(tensor, true)
        tensor.dispose()

        // L2-normalize the embedding for better cosine similarity behavior
        const normalized = tf.tidy(() => {
            const norm = tf.norm(embedding)
            return tf.div(embedding, tf.maximum(norm, 1e-10))
        })
        embedding.dispose()

        return normalized
    }

    async addSample(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, label: string) {
        const embedding = await this.extractEmbedding(imageElement)
        await this.knn.addExample(embedding, label)
        embedding.dispose()
    }

    async addSampleFromData(imageData: ImageData, label: string) {
        const tf = await ensureTf()
        const tensor = tf.browser.fromPixels(imageData).toFloat()
        const embedding = await this.extractEmbedding(tensor as any)
        await this.knn.addExample(embedding, label)
        tensor.dispose()
        embedding.dispose()
    }

    async predict(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, k = 3): Promise<ImagePrediction | null> {
        try {
            const embedding = await this.extractEmbedding(imageElement)
            try {
                const result = await this.knn.predictClass(embedding, k)
                return result
            } finally {
                embedding.dispose()
            }
        } catch (err) {
            console.warn('[ImageClassifier] Prediction failed:', err)
            return null
        }
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

    /**
     * Remove a specific example by index (for leave-one-out CV).
     */
    async removeExampleByIndex(label: string, index: number): Promise<number[] | null> {
        const data = await this.knn.removeExampleByIndex(label, index)
        return data ? Array.from(data) : null
    }

    /**
     * Re-add an example from data array (for leave-one-out CV).
     */
    async addExampleFromDataArray(data: number[], label: string): Promise<void> {
        await this.knn.addExampleFromDataArray(data, label)
    }

    async rebuildClass(label: string, imageDataUrls: string[]): Promise<number> {
        this.knn.clearClass(label)
        let loaded = 0
        for (const dataUrl of imageDataUrls) {
            try {
                if (!dataUrl || !dataUrl.startsWith('data:image/')) {
                    console.warn(`[ImageClassifier] Skipping invalid data URL for class "${label}"`)
                    continue
                }
                const img = new Image()
                img.src = dataUrl
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve()
                    img.onerror = () => reject(new Error('Failed to load image'))
                    setTimeout(() => reject(new Error('Image load timeout')), 5000)
                })
                if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
                    console.warn(`[ImageClassifier] Image has zero dimensions for class "${label}", skipping`)
                    continue
                }
                await this.addSample(img, label)
                loaded++
            } catch (err) {
                console.warn(`[ImageClassifier] Failed to load sample for class "${label}":`, err)
            }
        }
        return loaded
    }

    /**
     * Generate augmented versions of an image for training data diversity.
     * Returns an array of canvas elements with random transforms applied.
     */
    static augmentations = [
        // Original (no transform)
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {},
        // Horizontal flip
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.translate(w, 0)
            ctx.scale(-1, 1)
        },
        // Slight rotation (+15deg)
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.translate(w / 2, h / 2)
            ctx.rotate(15 * Math.PI / 180)
            ctx.translate(-w / 2, -h / 2)
        },
        // Slight rotation (-15deg)
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.translate(w / 2, h / 2)
            ctx.rotate(-15 * Math.PI / 180)
            ctx.translate(-w / 2, -h / 2)
        },
        // Brightness up
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.filter = 'brightness(1.3)'
        },
        // Brightness down
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.filter = 'brightness(0.7)'
        },
    ]

    /**
     * Add a sample with data augmentation for richer training data.
     * Each source image generates multiple augmented variants.
     */
    async addSampleAugmented(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, label: string): Promise<number> {
        const tf = await ensureTf()
        let added = 0

        for (const transform of ImageClassifier.augmentations) {
            try {
                const canvas = document.createElement('canvas')
                const w = imageElement instanceof HTMLCanvasElement
                    ? imageElement.width
                    : (imageElement as HTMLImageElement).naturalWidth || (imageElement as HTMLVideoElement).videoWidth || 224
                const h = imageElement instanceof HTMLCanvasElement
                    ? imageElement.height
                    : (imageElement as HTMLImageElement).naturalHeight || (imageElement as HTMLVideoElement).videoHeight || 224
                canvas.width = w
                canvas.height = h
                const ctx = canvas.getContext('2d')!
                ctx.save()
                transform(ctx, w, h)
                ctx.drawImage(imageElement as CanvasImageSource, 0, 0, w, h)
                ctx.restore()

                // Create image from canvas
                const augImg = new Image()
                augImg.src = canvas.toDataURL('image/png')
                await new Promise<void>((resolve) => {
                    augImg.onload = () => resolve()
                    augImg.onerror = () => resolve()
                    setTimeout(() => resolve(), 2000)
                })

                if (augImg.complete && augImg.naturalWidth > 0) {
                    await this.addSample(augImg, label)
                    added++
                }
            } catch {
                // skip failed augmentation
            }
        }
        return added
    }

    dispose(): void {
        this.knn.dispose()
        this.mobilenetModel = null
    }
}
