import { KNNClassifier, ensureTf } from '../KNNClassifier'
import { ensureMobileNet } from '../loadScript'

export interface NumberPrediction {
    label: string
    confidences: Record<string, number>
}

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

async function inputToIsolatedCanvas(
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<HTMLCanvasElement> {
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
    return isolateDigit(tempCanvas)
}

export class NumberClassifier {
    private knn = new KNNClassifier()
    private mobilenetModule: any = null
    private mobilenetModel: any = null

    private async ensureModel() {
        if (this.mobilenetModel) return this.mobilenetModel
        const mobilenet = await ensureMobileNet()
        const tf = await ensureTf()
        try {
            this.mobilenetModel = await mobilenet.load({
                version: 2,
                alpha: 1.0,
                modelUrl: 'https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json'
            })
        } catch (err) {
            console.warn('[NumberClassifier] mobilenet.load() failed, loading model directly:', err)
            const rawModel = await tf.loadGraphModel(
                'https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json'
            )
            rawModel.predict(tf.zeros([1, 224, 224, 3])).dispose()
            this.mobilenetModel = {
                infer: (img: any, embedding = false) => tf.tidy(() => {
                    if (!(img instanceof tf.Tensor)) img = tf.browser.fromPixels(img)
                    let input = tf.image.resizeBilinear(img, [224, 224]).toFloat()
                    input = input.div(127.5).sub(1)
                    input = tf.reshape(input, [-1, 224, 224, 3])
                    if (embedding) {
                        try {
                            const pool = rawModel.execute(input, 'module_apply_default/MobilenetV2/Logits/AvgPool')
                            return tf.squeeze(pool, [1, 2])
                        } catch {
                            return rawModel.predict(input)
                        }
                    }
                    const output = rawModel.predict(input)
                    return tf.slice(output, [0, 1], [-1, 1000])
                })
            }
        }
        return this.mobilenetModel
    }

    private async extractMobileNetEmbedding(isolatedCanvas: HTMLCanvasElement): Promise<any> {
        const tf = await ensureTf()
        const model = await this.ensureModel()
        return tf.tidy(() => {
            let tensor = tf.browser.fromPixels(isolatedCanvas).toFloat()
            tensor = tf.image.resizeBilinear(tensor, [224, 224])
            tensor = tensor.div(127.5).sub(1)
            const embedding = model.infer(tensor, true)
            const norm = tf.norm(embedding)
            return tf.div(embedding, tf.maximum(norm, 1e-10))
        })
    }

    async addSample(
        imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
        label: string
    ) {
        const isolated = await inputToIsolatedCanvas(imageElement)
        const embedding = await this.extractMobileNetEmbedding(isolated)
        await this.knn.addExample(embedding, label)
        embedding.dispose()
    }

    async predict(
        input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
        k = 3
    ): Promise<NumberPrediction | null> {
        try {
            const isolated = await inputToIsolatedCanvas(input)
            const embedding = await this.extractMobileNetEmbedding(isolated)
            const result = await this.knn.predictClass(embedding, k)
            embedding.dispose()
            return result
        } catch (err) {
            console.warn('[NumberClassifier] Prediction failed:', err)
            return null
        }
    }

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

    static augmentations = [
        (_ctx: CanvasRenderingContext2D, _w: number, _h: number) => {},
        (_ctx: CanvasRenderingContext2D, w: number, _h: number) => {
            _ctx.translate(w, 0)
            _ctx.scale(-1, 1)
        },
        (_ctx: CanvasRenderingContext2D, w: number, h: number) => {
            _ctx.translate(w / 2, h / 2)
            _ctx.rotate(6 * Math.PI / 180)
            _ctx.translate(-w / 2, -h / 2)
        },
        (_ctx: CanvasRenderingContext2D, _w: number, _h: number) => {
            _ctx.filter = 'brightness(1.3)'
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
            } catch {}
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
