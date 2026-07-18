/**
 * Number/Digit Classifier using raw 28x28 grayscale pixel features + KNN.
 * Uses isolateDigit preprocessing to center and normalize the digit,
 * producing MNIST-style 784-d feature vectors for reliable classification
 * even with only 5-10 samples per class.
 */

import { KNNClassifier, ensureTf } from '../KNNClassifier'

export interface NumberPrediction {
    label: string
    confidences: Record<string, number>
}

/**
 * Isolate the digit from background by detecting the bounding box of dark pixels,
 * centering the digit, and adding padding. Returns a clean canvas with the digit
 * centered on a white background at 224x224.
 */
function isolateDigit(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = sourceCanvas.getContext('2d')
    if (!ctx) return sourceCanvas

    const { width, height } = sourceCanvas
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    let minX = width, maxX = 0, minY = height, maxY = 0
    let hasContent = false

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            const brightness = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114
            if (brightness < 230) {
                hasContent = true
                if (x < minX) minX = x
                if (x > maxX) maxX = x
                if (y < minY) minY = y
                if (y > maxY) maxY = y
            }
        }
    }

    if (!hasContent || maxX < minX || maxY < minY) return sourceCanvas

    const digitW = maxX - minX + 1
    const digitH = maxY - minY + 1
    const padX = Math.floor(digitW * 0.2)
    const padY = Math.floor(digitH * 0.2)
    const cropX = Math.max(0, minX - padX)
    const cropY = Math.max(0, minY - padY)
    const cropW = Math.min(width - cropX, digitW + padX * 2)
    const cropH = Math.min(height - cropY, digitH + padY * 2)

    const outCanvas = document.createElement('canvas')
    outCanvas.width = 224
    outCanvas.height = 224
    const outCtx = outCanvas.getContext('2d')!

    outCtx.fillStyle = '#ffffff'
    outCtx.fillRect(0, 0, 224, 224)

    const scale = Math.min(200 / cropW, 200 / cropH)
    const drawW = cropW * scale
    const drawH = cropH * scale
    const drawX = (224 - drawW) / 2
    const drawY = (224 - drawH) / 2

    outCtx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, drawX, drawY, drawW, drawH)

    return outCanvas
}

/**
 * Convert a canvas to a normalized 28x28 grayscale feature vector (784-d).
 * The digit is isolated, resized to 28x28, converted to grayscale,
 * and normalized to [0, 1] range.
 */
async function canvasToFeatureVector(sourceCanvas: HTMLCanvasElement): Promise<number[]> {
    const tf = await ensureTf()

    const isolated = isolateDigit(sourceCanvas)

    return tf.tidy(() => {
        // Convert to tensor and resize to 28x28 (MNIST standard)
        let tensor = tf.browser.fromPixels(isolated, 1) // grayscale
        tensor = tf.image.resizeBilinear(tensor, [28, 28])
        // Normalize to [0, 1]
        const normalized = tensor.toFloat().div(255.0)
        return Array.from(normalized.dataSync())
    })
}

/**
 * Convert an input element to a feature vector.
 */
async function inputToFeatureVector(
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<number[]> {
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
    return canvasToFeatureVector(tempCanvas)
}

export class NumberClassifier {
    private knn = new KNNClassifier()

    /**
     * Add a single sample to the classifier.
     */
    async addSample(
        imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
        label: string
    ) {
        const fv = await inputToFeatureVector(imageElement)
        await this.knn.addExampleFromData(fv, label)
    }

    /**
     * Predict the class of an input using KNN with k neighbors.
     */
    async predict(
        input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
        k = 3
    ): Promise<NumberPrediction | null> {
        try {
            const fv = await inputToFeatureVector(input)
            return await this.knn.predictFromData(fv, k)
        } catch (err) {
            console.warn('[NumberClassifier] Prediction failed:', err)
            return null
        }
    }

    /**
     * Rebuild a class from an array of image data URLs.
     */
    async rebuildClass(
        label: string,
        imageDataUrls: string[],
        augment = false
    ): Promise<number> {
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
     * Data augmentation for digits — operates in pixel space before feature extraction:
     * - Original
     * - Horizontal flip (some digits are symmetric)
     * - Slight rotation (-6 to +6 degrees)
     * - Brightness variation
     * - Scale variation (0.9x to 1.1x)
     */
    static augmentations = [
        (_ctx: CanvasRenderingContext2D, _w: number, _h: number) => { /* no-op */ },
        (_ctx: CanvasRenderingContext2D, w: number, _h: number) => {
            _ctx.translate(w, 0)
            _ctx.scale(-1, 1)
        },
        (_ctx: CanvasRenderingContext2D, w: number, h: number) => {
            _ctx.translate(w / 2, h / 2)
            _ctx.rotate(6 * Math.PI / 180)
            _ctx.translate(-w / 2, -h / 2)
        },
        (_ctx: CanvasRenderingContext2D, w: number, h: number) => {
            _ctx.translate(w / 2, h / 2)
            _ctx.rotate(-6 * Math.PI / 180)
            _ctx.translate(-w / 2, -h / 2)
        },
        (_ctx: CanvasRenderingContext2D, _w: number, _h: number) => {
            _ctx.filter = 'brightness(1.3)'
        },
        (_ctx: CanvasRenderingContext2D, _w: number, _h: number) => {
            _ctx.filter = 'brightness(0.8)'
        },
        (_ctx: CanvasRenderingContext2D, w: number, h: number) => {
            _ctx.translate(w / 2, h / 2)
            _ctx.scale(1.1, 1.1)
            _ctx.translate(-w / 2, -h / 2)
        },
        (_ctx: CanvasRenderingContext2D, w: number, h: number) => {
            _ctx.translate(w / 2, h / 2)
            _ctx.scale(0.9, 0.9)
            _ctx.translate(-w / 2, -h / 2)
        },
    ]

    async addSampleAugmented(
        imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
        label: string
    ): Promise<number> {
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

                await this.addSample(canvas, label)
                added++
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
    }
}
