/**
 * Number/Digit Classifier using MobileNet feature extraction + KNN.
 * Produces far more accurate results than raw pixel comparison.
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
        console.error('[NumberClassifier] WebGL context lost — GPU memory exhausted')
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
    const origGetContext = HTMLCanvasElement.prototype.getContext as any
    HTMLCanvasElement.prototype.getContext = function (...args: any[]) {
        const ctx = origGetContext.apply(this, args)
        if (ctx && (args[0] === 'webgl' || args[0] === 'webgl2' || args[0] === 'experimental-webgl')) {
            const canvas = this as HTMLCanvasElement
            canvas.addEventListener('webglcontextlost', onContextLost, { once: true })
            canvas.addEventListener('webglcontextrestored', () => {
                const banner = document.getElementById('neura-context-loss-banner')
                if (banner) banner.remove()
                console.log('[NumberClassifier] WebGL context restored')
            }, { once: true })
        }
        return ctx
    }
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
     * Preprocess input to 224x224 for MobileNet.
     * Center-crops to square then resizes.
     */
    private async preprocessImage(
        input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
    ): Promise<any> {
        const tf = await ensureTf()
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

    async predict(input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, k = 5): Promise<NumberPrediction | null> {
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
     * Returns the number of successfully loaded samples.
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
     * Data augmentation: original + horizontal flip + brightness adjustment.
     * Generates 3 variants per source image for richer training data.
     */
    static augmentations = [
        // Original (no transform)
        (_ctx: CanvasRenderingContext2D, _w: number, _h: number) => { /* no-op */ },
        (ctx: CanvasRenderingContext2D, w: number, _h: number) => {
            ctx.translate(w, 0)
            ctx.scale(-1, 1)
        },
        (ctx: CanvasRenderingContext2D, _w: number, _h: number) => {
            ctx.filter = 'brightness(1.2)'
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
