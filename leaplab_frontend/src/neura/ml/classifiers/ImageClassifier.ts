import { KNNClassifier, ensureTf } from '../KNNClassifier'
import { ensureMobileNet } from '../loadScript'

export interface ImagePrediction {
    label: string
    confidences: Record<string, number>
}

// Singleton listener for WebGL context loss — shows recovery banner
let contextLossHandled = false
function setupContextLossListener() {
    if (contextLossHandled || typeof document === 'undefined') return
    contextLossHandled = true
    const onContextLost = (e: Event) => {
        e.preventDefault()
        console.error('[Neura] WebGL context lost — GPU memory exhausted')
        // Show recovery banner
        if (!document.getElementById('neura-context-loss-banner')) {
            const banner = document.createElement('div')
            banner.id = 'neura-context-loss-banner'
            banner.innerHTML = `
                <div style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#dc2626;color:white;padding:12px 20px;text-align:center;font-family:system-ui;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:12px;">
                    <span>GPU memory exhausted. The page needs to reload to recover.</span>
                    <button onclick="location.reload()" style="background:white;color:#dc2626;border:none;padding:6px 16px;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px;">Reload Now</button>
                </div>
            `
            document.body.appendChild(banner)
        }
    }
    // Listen on the canvas element used by TF.js
    const origGetContext = HTMLCanvasElement.prototype.getContext as any
    HTMLCanvasElement.prototype.getContext = function (...args: any[]) {
        const ctx = origGetContext.apply(this, args)
        if (ctx && (args[0] === 'webgl' || args[0] === 'webgl2' || args[0] === 'experimental-webgl')) {
            const canvas = this as HTMLCanvasElement
            canvas.addEventListener('webglcontextlost', onContextLost, { once: true })
            canvas.addEventListener('webglcontextrestored', () => {
                const banner = document.getElementById('neura-context-loss-banner')
                if (banner) banner.remove()
                console.log('[Neura] WebGL context restored')
            }, { once: true })
        }
        return ctx
    }
}

export class ImageClassifier {
    private knn = new KNNClassifier()
    private mobilenetModel: any = null
    private mobilenetModule: any = null

    private async ensureModel() {
        if (this.mobilenetModel) return this.mobilenetModel
        setupContextLossListener()
        const mobilenet = await ensureMobileNet()
        this.mobilenetModule = mobilenet
        this.mobilenetModel = await mobilenet.load()
        return this.mobilenetModel
    }

    /**
     * Preprocess an image element to ensure consistent 224x224 input for MobileNet.
     * Center-crops to square then resizes, matching MobileNet's expected input.
     * Uses tf.tidy to auto-dispose all intermediate tensors and prevent GPU memory leaks.
     */
    private async preprocessImage(
        input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
    ): Promise<any> {
        const tf = await ensureTf()

        // Use tf.tidy to auto-dispose all intermediate tensors (slice, resize, div, sub)
        return tf.tidy(() => {
            let tensor = tf.browser.fromPixels(input).toFloat()
            const [h, w] = tensor.shape
            const size = Math.min(h, w)
            const top = Math.floor((h - size) / 2)
            const left = Math.floor((w - size) / 2)
            tensor = tf.slice(tensor, [top, left, 0], [size, size, 3])
            tensor = tf.image.resizeBilinear(tensor, [224, 224])
            return tensor.div(127.5).sub(1)
        })
    }

    /**
     * Extract a rich embedding by combining multiple layer outputs from MobileNet.
     * This produces more discriminative features than a single layer.
     * Uses tf.tidy to ensure no GPU tensors leak.
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

        // Yield to browser to allow GPU memory cleanup
        await new Promise(r => setTimeout(r, 0))

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

    async predict(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, k = 5): Promise<ImagePrediction | null> {
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

    async rebuildClass(label: string, imageDataUrls: string[], augment = false): Promise<number> {
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
                if (augment) {
                    await this.addSampleAugmented(img, label)
                } else {
                    await this.addSample(img, label)
                }
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
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {},
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.translate(w, 0)
            ctx.scale(-1, 1)
        },
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.filter = 'brightness(1.3)'
        },
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.filter = 'brightness(0.8)'
        },
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.translate(w / 2, h / 2)
            ctx.rotate(8 * Math.PI / 180)
            ctx.translate(-w / 2, -h / 2)
        },
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.translate(w / 2, h / 2)
            ctx.rotate(-8 * Math.PI / 180)
            ctx.translate(-w / 2, -h / 2)
        },
        (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            ctx.filter = 'contrast(1.3)'
        },
    ]

    /**
     * Add a sample with data augmentation for richer training data.
     * Each source image generates multiple augmented variants.
     * Yields to browser between iterations to prevent GPU memory buildup.
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

                // Yield to browser event loop to allow GPU memory cleanup between augmentations
                await new Promise(r => setTimeout(r, 0))
            } catch {
                // skip failed augmentation
            }
        }
        return added
    }

    dispose(): void {
        this.knn.dispose()
        this.mobilenetModel = null
        this.mobilenetModule = null
    }
}
