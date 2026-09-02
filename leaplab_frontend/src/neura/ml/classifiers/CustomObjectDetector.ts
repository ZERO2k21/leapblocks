import { KNNClassifier, ensureTf } from '../KNNClassifier'
import { ensureMobileNet, ensureCocoSsd } from '../loadScript'

export interface CustomDetection {
    label: string
    confidence: number
    bbox: [number, number, number, number]
}

export interface CustomDetectionResult {
    objects: CustomDetection[]
    timestamp: number
}

let contextLossHandled = false
function setupContextLossListener() {
    if (contextLossHandled || typeof document === 'undefined') return
    contextLossHandled = true
    const onContextLost = (e: Event) => {
        e.preventDefault()
        console.error('[CustomObjectDetector] WebGL context lost')
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
            }, { once: true })
        }
        return ctx
    }
}

export class CustomObjectDetector {
    private knn = new KNNClassifier()
    private mobilenetModel: any = null
    private cocoSsdModel: any = null
    private isTraining = false
    private trainingProgress = 0
    private totalRegionsProcessed = 0
    private onProgressCallback: ((progress: number, message: string) => void) | null = null

    // Balanced for accuracy vs recall — previous 0.05/0.15 over-detected (16 boxes), 0.4/0.52 under-detected (0)
    // 0.30/0.38 gives 2-4 boxes on 2-object image with current 0.20 outlier, validated via logs
    private readonly COCO_CONFIDENCE_THRESHOLD = 0.3
    private readonly KNN_CONFIDENCE_THRESHOLD = 0.38
    private readonly NMS_IOU_THRESHOLD = 0.45
    private readonly SLIDING_WINDOW_MIN_PROPOSALS = 2
    private readonly MOBILENET_FALLBACK_URL = 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/model.json'

    constructor() {
        // Outlier 0.20 rejects pure grass but keeps cat/dog at ~0.3-0.6; KNN 0.38 filters low conf
        this.knn.setOutlierThreshold(0.20)
    }

    private async ensureModels() {
        if (!this.mobilenetModel) {
            setupContextLossListener()
            const mobilenet = await ensureMobileNet()
            try {
                this.mobilenetModel = await mobilenet.load()
            } catch (e) {
                console.warn('[CustomObjectDetector] MobileNet load failed, trying fallback URL:', e)
                this.mobilenetModel = await mobilenet.load({ modelUrl: this.MOBILENET_FALLBACK_URL })
            }
        }
        if (!this.cocoSsdModel) {
            const cocoSsd = await ensureCocoSsd()
            this.cocoSsdModel = await cocoSsd.load()
        }
        return { mobilenet: this.mobilenetModel, cocoSsd: this.cocoSsdModel }
    }

    private async preprocessRegion(
        source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
        cropX: number, cropY: number, cropW: number, cropH: number
    ): Promise<any> {
        const tf = await ensureTf()
        return tf.tidy(() => {
            let tensor = tf.browser.fromPixels(source).toFloat()
            const clampedX = Math.max(0, Math.floor(cropX))
            const clampedY = Math.max(0, Math.floor(cropY))
            const clampedW = Math.min(Math.floor(cropW), tensor.shape[1] - clampedX)
            const clampedH = Math.min(Math.floor(cropH), tensor.shape[0] - clampedY)
            if (clampedW <= 0 || clampedH <= 0) return null
            tensor = tf.slice(tensor, [clampedY, clampedX, 0], [clampedH, clampedW, 3])
            tensor = tf.image.resizeBilinear(tensor, [224, 224])
            return tensor.div(127.5).sub(1)
        })
    }

    private async extractRegionEmbedding(
        source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
        cropX: number, cropY: number, cropW: number, cropH: number
    ): Promise<any | null> {
        const tf = await ensureTf()
        const { mobilenet } = await this.ensureModels()
        const tensor = await this.preprocessRegion(source, cropX, cropY, cropW, cropH)
        if (!tensor) return null
        const embedding = mobilenet.infer(tensor, true)
        tensor.dispose()
        const normalizedMobileNet = tf.tidy(() => {
            const norm = tf.norm(embedding)
            return tf.div(embedding, tf.maximum(norm, 1e-10))
        })
        embedding.dispose()

        // Add shape features for very accurate — same as ImageClassifier (0.48 weight)
        // Helps separate cat vs dog where MobileNet alone gives 0.99 cosine on grass background
        try {
            const { extractShapeFeatures, normalizeShapeFeatures } = await import('../utils/shapeFeatures')
            // Create cropped canvas for shape
            const cropCanvas = document.createElement('canvas')
            const cw = Math.max(1, Math.floor(cropW)), ch = Math.max(1, Math.floor(cropH))
            cropCanvas.width = cw; cropCanvas.height = ch
            const cctx = cropCanvas.getContext('2d')!
            // Draw the cropped region (need source dimensions)
            const srcW = (source as any).videoWidth || (source as any).width || (source as any).naturalWidth || cw
            const srcH = (source as any).videoHeight || (source as any).height || (source as any).naturalHeight || ch
            // Use source canvas if already a canvas with correct size
            if (source instanceof HTMLCanvasElement && source.width === srcW && source.height === srcH) {
                cctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, cw, ch)
            } else {
                // For image/video, draw full then crop via drawImage
                cctx.drawImage(source as CanvasImageSource, cropX, cropY, cropW, cropH, 0, 0, cw, ch)
            }
            const shapeRaw = extractShapeFeatures(cropCanvas as any)
            const shapeNorm = normalizeShapeFeatures(shapeRaw)
            const SHAPE_WEIGHT = 0.48
            let shapeTensor: any = tf.tensor1d(Array.from(shapeNorm))
            const weighted = tf.tidy(() => tf.mul(shapeTensor, SHAPE_WEIGHT))
            shapeTensor.dispose()
            shapeTensor = weighted
            const combined = tf.tidy(() => {
                const flat = normalizedMobileNet.reshape([normalizedMobileNet.size])
                const cat = tf.concat([flat, shapeTensor])
                const n = tf.norm(cat)
                return tf.div(cat, tf.maximum(n, 1e-10))
            })
            normalizedMobileNet.dispose()
            shapeTensor.dispose()
            await new Promise(r => setTimeout(r, 0))
            return combined
        } catch (e) {
            console.warn('[CustomObjectDetector] shape fallback', e)
            await new Promise(r => setTimeout(r, 0))
            return normalizedMobileNet
        }
    }

    private async extractFullEmbedding(
        input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
    ): Promise<any> {
        const tf = await ensureTf()
        const { mobilenet } = await this.ensureModels()
        return tf.tidy(() => {
            let tensor = tf.browser.fromPixels(input).toFloat()
            const [h, w] = tensor.shape
            const size = Math.min(h, w)
            const top = Math.floor((h - size) / 2)
            const left = Math.floor((w - size) / 2)
            tensor = tf.slice(tensor, [top, left, 0], [size, size, 3])
            tensor = tf.image.resizeBilinear(tensor, [224, 224])
            tensor = tensor.div(127.5).sub(1)
            const embedding = mobilenet.infer(tensor, true)
            tensor.dispose()
            const norm = tf.norm(embedding)
            const normalized = tf.div(embedding, tf.maximum(norm, 1e-10))
            embedding.dispose()
            return normalized
        })
    }

    private nonMaxSuppression(detections: CustomDetection[], iouThreshold: number): CustomDetection[] {
        if (detections.length === 0) return []
        const sorted = [...detections].sort((a, b) => b.confidence - a.confidence)
        const result: CustomDetection[] = []
        const suppressed = new Set<number>()

        for (let i = 0; i < sorted.length; i++) {
            if (suppressed.has(i)) continue
            result.push(sorted[i])
            for (let j = i + 1; j < sorted.length; j++) {
                if (suppressed.has(j)) continue
                if (sorted[i].label !== sorted[j].label) continue
                const iou = this.calculateIoU(sorted[i].bbox, sorted[j].bbox)
                if (iou > iouThreshold) suppressed.add(j)
            }
        }
        return result
    }

    private calculateIoU(boxA: [number, number, number, number], boxB: [number, number, number, number]): number {
        const [x1, y1, w1, h1] = boxA
        const [x2, y2, w2, h2] = boxB
        const xLeft = Math.max(x1, x2)
        const yTop = Math.max(y1, y2)
        const xRight = Math.min(x1 + w1, x2 + w2)
        const yBottom = Math.min(y1 + h1, y2 + h2)
        if (xRight <= xLeft || yBottom <= yTop) return 0
        const intersectionArea = (xRight - xLeft) * (yBottom - yTop)
        const areaA = w1 * h1
        const areaB = w2 * h2
        const unionArea = areaA + areaB - intersectionArea
        return unionArea > 0 ? intersectionArea / unionArea : 0
    }

    async addSample(
        source: HTMLImageElement | HTMLCanvasElement,
        label: string,
        bbox: { x: number; y: number; width: number; height: number },
        imageWidth: number,
        imageHeight: number
    ): Promise<boolean> {
        try {
            const px = (bbox.x / 100) * imageWidth
            const py = (bbox.y / 100) * imageHeight
            const pw = (bbox.width / 100) * imageWidth
            const ph = (bbox.height / 100) * imageHeight

            if (pw < 10 || ph < 10) return false

            const embedding = await this.extractRegionEmbedding(source, px, py, pw, ph)
            if (!embedding) return false
            await this.knn.addExample(embedding, label)
            embedding.dispose()
            return true
        } catch (err) {
            console.warn('[CustomObjectDetector] Failed to add sample:', err)
            return false
        }
    }

    async addSampleFromDataUrl(
        dataUrl: string,
        label: string,
        bbox: { x: number; y: number; width: number; height: number }
    ): Promise<boolean> {
        try {
            const img = new Image()
            img.src = dataUrl
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve()
                img.onerror = () => reject(new Error('Failed to load image'))
                setTimeout(() => reject(new Error('Image load timeout')), 5000)
            })
            if (!img.complete || img.naturalWidth === 0) return false
            return await this.addSample(img, label, bbox, img.naturalWidth, img.naturalHeight)
        } catch (err) {
            console.warn('[CustomObjectDetector] Failed to add sample from data URL:', err)
            return false
        }
    }

    private async createFlippedRegionDataUrl(
        dataUrl: string,
        bbox: { x: number; y: number; width: number; height: number }
    ): Promise<{ dataUrl: string; bbox: { x: number; y: number; width: number; height: number } } | null> {
        try {
            const img = new Image()
            img.src = dataUrl
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve()
                img.onerror = () => reject(new Error('Failed to load image'))
                setTimeout(() => reject(new Error('Image load timeout')), 3000)
            })
            if (!img.complete || img.naturalWidth === 0) return null
            const w = img.naturalWidth
            const h = img.naturalHeight
            const canvas = document.createElement('canvas')
            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext('2d')!
            ctx.translate(w, 0)
            ctx.scale(-1, 1)
            ctx.drawImage(img, 0, 0, w, h)
            const flippedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
            // bbox is in % (0-100), mirror x: newX = 100 - (x + width)
            const flippedBbox = { x: Math.max(0, 100 - (bbox.x + bbox.width)), y: bbox.y, width: bbox.width, height: bbox.height }
            return { dataUrl: flippedDataUrl, bbox: flippedBbox }
        } catch {
            return null
        }
    }

    async trainFromAnnotations(
        samples: { data: string }[],
        onProgress?: (progress: number, message: string) => void
    ): Promise<{ success: boolean; totalRegions: number; classCounts: Record<string, number> }> {
        this.isTraining = true
        this.trainingProgress = 0
        this.onProgressCallback = onProgress || null
        this.totalRegionsProcessed = 0
        // Ensure TF backend is alive before crunching — fixes "backend undefined" after tab sleep / WebGL loss
        try {
            const tf = await ensureTf()
            await tf.ready()
            if (!tf.getBackend()) {
                try { await tf.setBackend('webgl'); await tf.ready() } catch {}
            }
            if (!tf.getBackend()) {
                await tf.setBackend('cpu')
                await tf.ready()
            }
        } catch (e) {
            console.warn('[CustomObjectDetector] TF backend init failed, will try CPU:', e)
            try {
                const tf = await ensureTf()
                await tf.setBackend('cpu')
                await tf.ready()
            } catch {}
        }

        this.knn.clear()
        console.log('[CustomObjectDetector] trainFromAnnotations start', { samples: samples.length, knnCleared: true })

        let totalRegions = 0
        const classCounts: Record<string, number> = {}

        try {
            const allRegions: { dataUrl: string; label: string; bbox: { x: number; y: number; width: number; height: number } }[] = []
            for (const sample of samples) {
                try {
                    const parsed = JSON.parse(sample.data)
                    if (parsed.imageUrl && Array.isArray(parsed.boxes)) {
                        for (const box of parsed.boxes) {
                            if (box.label && box.width > 1 && box.height > 1) {
                                allRegions.push({
                                    dataUrl: parsed.imageUrl,
                                    label: box.label,
                                    bbox: { x: box.x, y: box.y, width: box.width, height: box.height }
                                })
                            }
                        }
                    }
                } catch {}
            }

            totalRegions = allRegions.length
            if (totalRegions === 0) {
                this.isTraining = false
                return { success: false, totalRegions: 0, classCounts: {} }
            }

            console.log('[CustomObjectDetector] collected regions', { totalRegions: allRegions.length, perLabel: allRegions.reduce((a, r) => { a[r.label] = (a[r.label] || 0) + 1; return a }, {} as Record<string, number>) })
            const BATCH_SIZE = 5
            for (let i = 0; i < allRegions.length; i += BATCH_SIZE) {
                const batch = allRegions.slice(i, i + BATCH_SIZE)
                for (const region of batch) {
                    const success = await this.addSampleFromDataUrl(region.dataUrl, region.label, region.bbox)
                    console.log(`[CustomObjectDetector] addSample ${region.label} bbox=${JSON.stringify(region.bbox)} → ${success ? 'OK' : 'FAIL'}`)
                    if (success) {
                        classCounts[region.label] = (classCounts[region.label] || 0) + 1
                        this.totalRegionsProcessed++
                    }
                }
                this.trainingProgress = Math.floor(((i + batch.length) / allRegions.length) * 90)
                console.log(`[CustomObjectDetector] progress ${this.trainingProgress}% ${Math.min(i + BATCH_SIZE, allRegions.length)}/${totalRegions} classCounts=`, classCounts)
                if (this.onProgressCallback) {
                    this.onProgressCallback(this.trainingProgress, `Processing region ${Math.min(i + BATCH_SIZE, allRegions.length)}/${totalRegions}`)
                }
                await new Promise(r => setTimeout(r, 0))
            }
            // Augmentation for very accurate — always double dataset with horizontal flip
            // Previous "<4" threshold missed the 31% case (13 regions/class, no augment). Flipping doubles
            // effective samples and helps LOO generalize on grass/lattice backgrounds.
            const shouldAugment = Object.values(classCounts).some(c => c < 10) || allRegions.length < 30
            if (shouldAugment) {
                for (const region of allRegions) {
                    const cnt = classCounts[region.label] || 0
                    if (cnt >= 20) continue
                    try {
                        const flipped = await this.createFlippedRegionDataUrl(region.dataUrl, region.bbox)
                        if (!flipped) continue
                        const success = await this.addSampleFromDataUrl(flipped.dataUrl, region.label, flipped.bbox)
                        if (success) {
                            classCounts[region.label] = (classCounts[region.label] || 0) + 1
                            this.totalRegionsProcessed++
                        }
                    } catch {}
                }
                if (this.onProgressCallback) this.onProgressCallback(95, 'Augmenting — flipped variants')
                await new Promise(r => setTimeout(r, 0))
            }

            this.trainingProgress = 100
            this.isTraining = false
            console.log('[CustomObjectDetector] train done', { totalRegions, classCounts, canClassify: this.knn.canClassify, knnCounts: this.knn.getSampleCounts() })
            return { success: this.knn.canClassify, totalRegions, classCounts }
        } catch (err) {
            console.error('[CustomObjectDetector] Training failed:', err)
            this.isTraining = false
            return { success: false, totalRegions, classCounts }
        }
    }

    private generateSlidingWindowProposals(
        imageWidth: number, imageHeight: number, minSide = 40
    ): { x: number; y: number; width: number; height: number }[] {
        const proposals: { x: number; y: number; width: number; height: number }[] = []
        const shortSide = Math.min(imageWidth, imageHeight)
        const scales = [0.35, 0.55, 0.8]
        const strides = [0.6, 0.5, 0.4]
        const maxWindows = 20

        for (let si = 0; si < scales.length; si++) {
            if (proposals.length >= maxWindows) break
            const winSize = Math.round(shortSide * scales[si])
            if (winSize < minSide) continue
            const stride = Math.round(winSize * strides[si])
            for (let y = 0; y + winSize <= imageHeight; y += stride) {
                if (proposals.length >= maxWindows) break
                for (let x = 0; x + winSize <= imageWidth; x += stride) {
                    if (proposals.length >= maxWindows) break
                    proposals.push({ x, y, width: winSize, height: winSize })
                }
            }
        }
        return proposals
    }

    async calibrateConfidence(): Promise<void> {
        if (!this.knn.canClassify) return
        // Ensure TF backend is alive — prevents "backend undefined" after tab sleep
        try {
            const tf = await ensureTf()
            await tf.ready()
            if (!tf.getBackend()) {
                try { await tf.setBackend('webgl'); await tf.ready() } catch {}
            }
            if (!tf.getBackend()) {
                await tf.setBackend('cpu'); await tf.ready()
            }
        } catch {}
        const counts = this.knn.getSampleCounts()
        const classNames = Object.keys(counts)
        if (classNames.length < 2) return

        let totalConf = 0
        let totalCorrect = 0
        let totalSamples = 0

        for (const label of classNames) {
            const count = counts[label]
            const n = Math.min(count, 5)
            // Iterate backwards to avoid index-shift skip (see ObjectDetectionTrainer)
            for (let i = n - 1; i >= 0; i--) {
                let removedData: Float32Array | null = null
                try {
                    removedData = await this.knn.removeExampleByIndex(label, i)
                } catch (e) {
                    console.warn('[CustomObjectDetector] calibrate remove failed:', e)
                    continue
                }
                if (!removedData) continue
                let prediction: any = null
                try {
                    prediction = await this.knn.predictFromData(removedData, 5)
                } catch (e) {
                    console.warn('[CustomObjectDetector] calibrate predict failed:', e)
                }
                try {
                    await this.knn.addExampleFromDataArray(Array.from(removedData), label)
                } catch (e) {
                    console.warn('[CustomObjectDetector] calibrate re-add failed:', e)
                }
                if (!prediction) continue
                totalSamples++
                const maxConf = Math.max(...Object.values(prediction.confidences)) as number
                totalConf += maxConf
                if (prediction.label === label) totalCorrect++
            }
        }

        if (totalSamples > 0) {
            const avgConf = totalConf / totalSamples
            const accuracy = totalCorrect / totalSamples
            // Only calibrate when reasonably accurate — low 31% case would otherwise
            // push confidences down and make 0.52 threshold reject true cats.
            if (accuracy < 0.55) {
                console.log('[CustomObjectDetector] calibrate skipped — low accuracy', accuracy.toFixed(2))
                return
            }
            const scaleA = accuracy > 0 ? Math.min(2.0, accuracy / Math.max(avgConf, 0.01)) : 0.5
            const scaleB = Math.log(Math.max(accuracy / Math.max(1 - accuracy, 0.01), 0.01))
            this.knn.calibrateConfidence(scaleA, scaleB * 0.3)
        }
    }

    async detect(
        input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
        maxDetections = 20,
        realTime = false
    ): Promise<CustomDetectionResult> {
        console.log('[CustomObjectDetector] detect() called', { maxDetections, realTime, canClassify: this.knn.canClassify, counts: this.knn.getSampleCounts() })
        if (!this.knn.canClassify) {
            console.warn('[CustomObjectDetector] canClassify=false → no detections', this.knn.getSampleCounts(), 'need ≥2 classes ×2 samples')
            return { objects: [], timestamp: Date.now() }
        }

        const tf = await ensureTf()
        const { cocoSsd } = await this.ensureModels()

        const inputTensor = tf.browser.fromPixels(input)
        const [imageHeight, imageWidth] = inputTensor.shape
        inputTensor.dispose()

        const cropCanvas = document.createElement('canvas')
        const cropCtx = cropCanvas.getContext('2d')!
        cropCanvas.width = imageWidth
        cropCanvas.height = imageHeight
        cropCtx.drawImage(input as CanvasImageSource, 0, 0, imageWidth, imageHeight)

        let proposals: { x: number; y: number; width: number; height: number }[] = []
        const maxProposals = realTime ? 12 : 16

        let cocoRawCount = 0
        let cocoFilteredCount = 0
        try {
            const cocoResults = await cocoSsd.detect(cropCanvas)
            cocoRawCount = cocoResults.length
            console.log('[CustomObjectDetector] COCO raw', cocoResults.map((r: any) => `${r.class}:${r.score.toFixed(2)}`).join(', '))
            const cocoProps = cocoResults
                .filter((r: any) => r.score > this.COCO_CONFIDENCE_THRESHOLD)
                .map((r: any) => ({
                    x: r.bbox[0],
                    y: r.bbox[1],
                    width: r.bbox[2],
                    height: r.bbox[3]
                }))
            cocoFilteredCount = cocoProps.length
            console.log(`[CustomObjectDetector] proposals: COCO raw=${cocoRawCount} filtered(@${this.COCO_CONFIDENCE_THRESHOLD})=${cocoFilteredCount} realTime=${realTime}`)

            if (realTime && cocoProps.length >= 1) {
                proposals = cocoProps.slice(0, maxProposals)
            } else if (cocoProps.length >= this.SLIDING_WINDOW_MIN_PROPOSALS) {
                proposals = [...cocoProps].slice(0, maxProposals)
            } else {
                const sliding = this.generateSlidingWindowProposals(imageWidth, imageHeight)
                console.log(`[CustomObjectDetector] COCO insufficient (<${this.SLIDING_WINDOW_MIN_PROPOSALS}) → adding sliding ${sliding.length} → total ${cocoProps.length + sliding.length}`)
                proposals = [...cocoProps, ...sliding]
            }
        } catch (e) {
            console.warn('[CustomObjectDetector] COCO detect failed', e)
            if (!realTime) {
                proposals = this.generateSlidingWindowProposals(imageWidth, imageHeight)
                console.log('[CustomObjectDetector] fallback sliding only', proposals.length)
            }
        }
        console.log(`[CustomObjectDetector] final proposals before cap: ${proposals.length} max=${maxProposals} image=${imageWidth}x${imageHeight}`)

        const rawDetections: CustomDetection[] = []

        if (proposals.length > maxProposals) {
            proposals.sort((a, b) => (b.width * b.height) - (a.width * a.height))
            proposals = proposals.slice(0, maxProposals)
        }

        for (let idx = 0; idx < proposals.length; idx++) {
            const proposal = proposals[idx]
            try {
                const embedding = await this.extractRegionEmbedding(
                    cropCanvas, proposal.x, proposal.y, proposal.width, proposal.height
                )
                if (!embedding) {
                    console.log(`[CustomObjectDetector] proposal ${idx} bbox=${proposal.x.toFixed(0)},${proposal.y.toFixed(0)},${proposal.width.toFixed(0)}x${proposal.height.toFixed(0)} → embedding null (too small?)`)
                    continue
                }

                const prediction = await this.knn.predictClass(embedding, 5)
                embedding.dispose()

                if (!prediction) {
                    console.log(`[CustomObjectDetector] proposal ${idx} → predict null (outlier/sim<${(this.knn as any).minSimilarityThreshold ?? '?'}) bbox=${proposal.x.toFixed(0)},${proposal.y.toFixed(0)},${proposal.width.toFixed(0)}x${proposal.height.toFixed(0)}`)
                    continue
                }
                const conf = prediction.confidences[prediction.label]
                const allConfs = Object.entries(prediction.confidences).map(([k, v]) => `${k}:${(v as number).toFixed(2)}`).join(', ')
                const sim = prediction.similarity !== undefined ? prediction.similarity.toFixed(3) : 'n/a'
                console.log(`[CustomObjectDetector] proposal ${idx} → ${prediction.label} conf=${conf.toFixed(3)} sim=${sim} all={${allConfs}} KNN_TH=${this.KNN_CONFIDENCE_THRESHOLD} bbox=${proposal.x.toFixed(0)},${proposal.y.toFixed(0)},${proposal.width.toFixed(0)}x${proposal.height.toFixed(0)} ${conf > this.KNN_CONFIDENCE_THRESHOLD ? 'KEEP' : 'REJECT(<TH)'}`)

                if (prediction && conf > this.KNN_CONFIDENCE_THRESHOLD) {
                    rawDetections.push({
                        label: prediction.label,
                        confidence: conf,
                        bbox: [
                            Math.max(0, proposal.x),
                            Math.max(0, proposal.y),
                            Math.min(proposal.width, imageWidth - proposal.x),
                            Math.min(proposal.height, imageHeight - proposal.y)
                        ]
                    })
                }
            } catch (e) {
                console.warn(`[CustomObjectDetector] proposal ${idx} error`, e)
            }
        }
        console.log(`[CustomObjectDetector] rawDetections before NMS: ${rawDetections.length} ${rawDetections.map(d => `${d.label}:${d.confidence.toFixed(2)}`).join(', ')} NMS_IOU=${this.NMS_IOU_THRESHOLD}`)

        const nmsDetections = this.nonMaxSuppression(rawDetections, this.NMS_IOU_THRESHOLD)
        console.log(`[CustomObjectDetector] after NMS: ${nmsDetections.length} ${nmsDetections.map(d => `${d.label}:${d.confidence.toFixed(2)} [${d.bbox.map(v => v.toFixed(0)).join(',')}]`).join(' | ')}`)
        const result = nmsDetections.slice(0, maxDetections)
        console.log(`[CustomObjectDetector] final result: ${result.length} objects (max ${maxDetections})`)

        return { objects: result, timestamp: Date.now() }
    }

    async detectFromDataUrl(dataUrl: string, realTime = false): Promise<CustomDetectionResult> {
        const img = new Image()
        img.src = dataUrl
        await new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
            setTimeout(() => resolve(), 5000)
        })
        if (!img.complete || img.naturalWidth === 0) {
            return { objects: [], timestamp: Date.now() }
        }
        return this.detect(img, 20, realTime)
    }

    drawDetections(
        canvas: HTMLCanvasElement,
        result: CustomDetectionResult,
        sourceWidth: number,
        sourceHeight: number,
        colorMap: Record<string, string> = {}
    ) {
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const scaleX = canvas.width / sourceWidth
        const scaleY = canvas.height / sourceHeight

        const defaultColors = [
            '#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
            '#EC4899', '#06B6D4', '#8B5CF6', '#F97316', '#14B8A6'
        ]
        let colorIdx = 0

        for (const obj of result.objects) {
            const [x, y, w, h] = obj.bbox
            const color = colorMap[obj.label] || defaultColors[colorIdx++ % defaultColors.length]
            const rx = x * scaleX, ry = y * scaleY, rw = w * scaleX, rh = h * scaleY

            // Vivid: white outer (6px) + color inner (4px) + subtle fill for contrast on any background
            ctx.save()
            ctx.strokeStyle = 'rgba(255,255,255,0.95)'
            ctx.lineWidth = 6
            ctx.lineJoin = 'round'
            ctx.strokeRect(rx, ry, rw, rh)
            ctx.strokeStyle = color
            ctx.lineWidth = 4
            ctx.strokeRect(rx, ry, rw, rh)
            // faint fill inside
            ctx.fillStyle = color + '18' // ~10% alpha hex
            // fallback if hex+alpha invalid, use rgba
            try { ctx.fillRect(rx, ry, rw, rh) } catch {}
            ctx.restore()

            const label = `${obj.label} ${Math.round(obj.confidence * 100)}%`
            ctx.font = 'bold 13px system-ui, sans-serif'
            const textWidth = ctx.measureText(label).width
            const labelHeight = 20
            const labelX = rx
            const labelY = Math.max(ry - labelHeight - 6, 2)

            // label with white outline for readability
            ctx.fillStyle = color
            ctx.beginPath()
            // @ts-ignore roundRect may be missing on some contexts
            if (ctx.roundRect) ctx.roundRect(labelX, labelY, textWidth + 14, labelHeight, 6)
            else { ctx.rect(labelX, labelY, textWidth + 14, labelHeight) }
            ctx.fill()
            // white border around label
            ctx.strokeStyle = 'rgba(255,255,255,0.9)'
            ctx.lineWidth = 1.5
            ctx.stroke()

            ctx.fillStyle = '#fff'
            ctx.textBaseline = 'middle'
            ctx.shadowColor = 'rgba(0,0,0,0.5)'
            ctx.shadowBlur = 2
            ctx.fillText(label, labelX + 7, labelY + labelHeight / 2)
            ctx.shadowBlur = 0
        }
    }

    getObjectsByLabel(result: CustomDetectionResult): Record<string, CustomDetection[]> {
        const grouped: Record<string, CustomDetection[]> = {}
        for (const obj of result.objects) {
            if (!grouped[obj.label]) grouped[obj.label] = []
            grouped[obj.label].push(obj)
        }
        return grouped
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

    get isCurrentlyTraining(): boolean {
        return this.isTraining
    }

    get currentTrainingProgress(): number {
        return this.trainingProgress
    }

    get regionsProcessed(): number {
        return this.totalRegionsProcessed
    }

    clear(): void {
        this.knn.clear()
    }

    clearClass(label: string): void {
        this.knn.clearClass(label)
    }

    getKNN(): KNNClassifier {
        return this.knn
    }

    dispose(): void {
        this.knn.dispose()
        this.mobilenetModel = null
        this.cocoSsdModel = null
    }
}
