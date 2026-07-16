/**
 * Number/Digit Classifier using MobileNet feature extraction + KNN.
 * Optimized for digit recognition with strong augmentation and smart preprocessing.
 */

import { KNNClassifier, ensureTf } from '../KNNClassifier'
import { ensureMobileNet } from '../loadScript'

export interface NumberPrediction {
    label: string
    confidences: Record<string, number>
}

let contextLossHandled = false
function setupContextLossListener() {
    if (contextLossHandled || typeof document === 'undefined') return
    contextLossHandled = true
    const onContextLost = (e: Event) => {
        e.preventDefault()
        console.error('[NumberClassifier] WebGL context lost')
    }
    const origGetContext = HTMLCanvasElement.prototype.getContext as any
    HTMLCanvasElement.prototype.getContext = function (...args: any[]) {
        const ctx = origGetContext.apply(this, args)
        if (ctx && (args[0] === 'webgl' || args[0] === 'webgl2' || args[0] === 'experimental-webgl')) {
            const canvas = this as HTMLCanvasElement
            canvas.addEventListener('webglcontextlost', onContextLost, { once: true })
        }
        return ctx
    }
}

/**
 * Isolate the digit from background by detecting the bounding box of dark pixels,
 * centering the digit, and adding padding. Returns a clean canvas with the digit
 * centered on a white background.
 */
function isolateDigit(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = sourceCanvas.getContext('2d')
    if (!ctx) return sourceCanvas

    const { width, height } = sourceCanvas
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // Find bounding box of non-white pixels (the digit)
    let minX = width, maxX = 0, minY = height, maxY = 0
    let hasContent = false

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            const r = data[idx], g = data[idx + 1], b = data[idx + 2]
            // Consider pixel as "digit" if it's darker than threshold
            const brightness = (r * 0.299 + g * 0.587 + b * 0.114)
            if (brightness < 200) {
                hasContent = true
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
        }
    }

    // If no digit found, return original
    if (!hasContent || maxX < minX || maxY < minY) return sourceCanvas

    // Add 20% padding around the digit
    const digitW = maxX - minX + 1
    const digitH = maxY - minY + 1
    const padX = Math.floor(digitW * 0.2)
    const padY = Math.floor(digitH * 0.2)
    const cropX = Math.max(0, minX - padX)
    const cropY = Math.max(0, minY - padY)
    const cropW = Math.min(width - cropX, digitW + padX * 2)
    const cropH = Math.min(height - cropY, digitH + padY * 2)

    // Create a square canvas with the digit centered
    const outCanvas = document.createElement('canvas')
    outCanvas.width = 224
    outCanvas.height = 224
    const outCtx = outCanvas.getContext('2d')!

    // Fill white background
    outCtx.fillStyle = '#ffffff'
    outCtx.fillRect(0, 0, 224, 224)

    // Draw the cropped digit centered and scaled to fit
    const scale = Math.min(200 / cropW, 200 / cropH)
    const drawW = cropW * scale
    const drawH = cropH * scale
    const drawX = (224 - drawW) / 2
    const drawY = (224 - drawH) / 2

    outCtx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, drawX, drawY, drawW, drawH)

    return outCanvas
}

export class NumberClassifier {
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
     * Smart preprocessing: isolate digit from background, center it, then
     * prepare for MobileNet (224x224 with normalization).
     */
    private async preprocessImage(
        input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
    ): Promise<any> {
        const tf = await ensureTf()

        // First, draw input to a temp canvas for digit isolation
        const tempCanvas = document.createElement('canvas')
        const w = input instanceof HTMLCanvasElement
            ? input.width
            : (input as HTMLImageElement).naturalWidth || (input as HTMLVideoElement).videoWidth || 224
        const h = input instanceof HTMLCanvasElement
            ? input.height
            : (input as HTMLImageElement).naturalHeight || (input as HTMLVideoElement).videoHeight || 224
        tempCanvas.width = w
        tempCanvas.height = h
        const tempCtx = tempCanvas.getContext('2d')!
        tempCtx.drawImage(input as CanvasImageSource, 0, 0, w, h)

        // Isolate the digit (center, crop, pad)
        const isolated = isolateDigit(tempCanvas)

        return tf.tidy(() => {
            let tensor = tf.browser.fromPixels(isolated).toFloat()
            tensor = tf.image.resizeBilinear(tensor, [224, 224])
            return tensor.div(127.5).sub(1)
        })
    }

    /**
     * Extract MobileNet embedding (1024-d vector) for an input.
     */
    private async extractEmbedding(input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<any> {
        const tf = await ensureTf()
        const model = await this.ensureModel()
        const tensor = await this.preprocessImage(input)
        const embedding = model.infer(tensor, true)
        tensor.dispose()
        const normalized = tf.tidy(() => {
            const norm = tf.norm(embedding)
            return tf.div(embedding, tf.maximum(norm, 1e-10))
        })
        embedding.dispose()
        await new Promise(r => setTimeout(r, 0))
        return normalized
    }

    async addSample(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, label: string) {
        const embedding = await this.extractEmbedding(imageElement)
        await this.knn.addExample(embedding, label)
        embedding.dispose()
    }

    /**
     * Predict with k=3 (better for small datasets of 5-10 samples per class).
     */
    async predict(input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, k = 3): Promise<NumberPrediction | null> {
        try {
            const embedding = await this.extractEmbedding(input)
            try {
                const result = await this.knn.predictClass(embedding, k)
                return result
            } finally {
                embedding.dispose()
            }
        } catch (err) {
            console.warn('[NumberClassifier] Prediction failed:', err)
            return null
        }
    }

    /**
     * Rebuild a class from an array of image data URLs.
     */
    async rebuildClass(label: string, imageDataUrls: string[], augment = false): Promise<number> {
        this.knn.clearClass(label)
        let loaded = 0
        for (const dataUrl of imageDataUrls) {
            try {
                if (!dataUrl || !dataUrl.startsWith('data:image/')) continue
                const img = new Image()
                img.src = dataUrl
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve()
                    img.onerror = () => reject(new Error('Failed to load image'))
                    setTimeout(() => reject(new Error('Image load timeout')), 5000)
                })
                if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) continue
                if (augment) {
                    await this.addSampleAugmented(img, label)
                } else {
                    await this.addSample(img, label)
                }
                loaded++
            } catch (err) {
                console.warn(`[NumberClassifier] Failed to load sample for "${label}":`, err)
            }
        }
        return loaded
    }

    /**
     * Strong data augmentation for digits:
     * - Original
     * - Horizontal flip
     * - Slight rotation (-8 to +8 degrees)
     * - Brightness variation
     * - Scale variation (0.9x to 1.1x)
     * - Translation shift
     */
    static augmentations = [
        // Original
        (_ctx: CanvasRenderingContext2D, _w: number, _h: number) => { /* no-op */ },
        // Horizontal flip (some digits are symmetric)
        (_ctx: CanvasRenderingContext2D, w: number, _h: number) => {
            _ctx.translate(w, 0)
            _ctx.scale(-1, 1)
        },
        // Slight clockwise rotation
        (_ctx: CanvasRenderingContext2D, w: number, h: number) => {
            _ctx.translate(w / 2, h / 2)
            _ctx.rotate(6 * Math.PI / 180)
            _ctx.translate(-w / 2, -h / 2)
        },
        // Slight counter-clockwise rotation
        (_ctx: CanvasRenderingContext2D, w: number, h: number) => {
            _ctx.translate(w / 2, h / 2)
            _ctx.rotate(-6 * Math.PI / 180)
            _ctx.translate(-w / 2, -h / 2)
        },
        // Brightness up
        (_ctx: CanvasRenderingContext2D, _w: number, _h: number) => {
            _ctx.filter = 'brightness(1.3)'
        },
        // Brightness down
        (_ctx: CanvasRenderingContext2D, _w: number, _h: number) => {
            _ctx.filter = 'brightness(0.8)'
        },
        // Scale up slightly
        (_ctx: CanvasRenderingContext2D, w: number, h: number) => {
            _ctx.translate(w / 2, h / 2)
            _ctx.scale(1.1, 1.1)
            _ctx.translate(-w / 2, -h / 2)
        },
        // Scale down slightly
        (_ctx: CanvasRenderingContext2D, w: number, h: number) => {
            _ctx.translate(w / 2, h / 2)
            _ctx.scale(0.9, 0.9)
            _ctx.translate(-w / 2, -h / 2)
        },
    ]

    async addSampleAugmented(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, label: string): Promise<number> {
        let added = 0
        for (const transform of NumberClassifier.augmentations) {
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
                await new Promise(r => setTimeout(r, 0))
            } catch { /* skip failed augmentation */ }
        }
        return added
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
        this.mobilenetModel = null
        this.mobilenetModule = null
    }
}
