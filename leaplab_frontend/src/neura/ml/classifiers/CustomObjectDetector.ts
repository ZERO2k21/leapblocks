/**
 * Custom Object Detection classifier using MobileNet feature extraction + KNN.
 * Unlike the pre-trained COCO-SSD ObjectDetector, this supports user-trained
 * custom classes via bounding-box annotated training data.
 *
 * Detection approach: multi-scale sliding window with KNN classification.
 */

import { KNNClassifier, ensureTf } from '../KNNClassifier'
import { ensureMobileNet } from '../loadScript'

export interface CustomDetection {
    label: string
    confidence: number
    bbox: [number, number, number, number] // [x, y, width, height] in pixels
}

export interface CustomDetectionResult {
    objects: CustomDetection[]
    timestamp: number
}

interface RegionProposal {
    x: number
    y: number
    width: number
    height: number
    scale: number
}

// WebGL context loss handling (singleton)
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
    private mobilenetModule: any = null
    private isTraining = false
    private trainingProgress = 0
    private totalRegionsProcessed = 0
    private onProgressCallback: ((progress: number, message: string) => void) | null = null

    // Detection parameters
    private readonly SCALES = [1.0]
    private readonly WINDOW_SIZES = [64, 96, 128, 176, 240, 320]
    private readonly ASPECT_RATIOS = [1.0, 1.8, 0.55]
    private readonly STEP_RATIO = 0.38
    private readonly CONFIDENCE_THRESHOLD = 0.22
    private readonly NMS_IOU_THRESHOLD = 0.32

    private async ensureModel() {
        if (this.mobilenetModel) return this.mobilenetModel
        setupContextLossListener()
        const mobilenet = await ensureMobileNet()
        this.mobilenetModule = mobilenet
        this.mobilenetModel = await mobilenet.load()
        return this.mobilenetModel
    }

    /**
     * Preprocess a cropped region for MobileNet embedding.
     * Resizes to 224x224 and normalizes to [-1, 1].
     */
    private async preprocessRegion(
        source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
        cropX: number,
        cropY: number,
        cropW: number,
        cropH: number
    ): Promise<any> {
        const tf = await ensureTf()
        return tf.tidy(() => {
            let tensor = tf.browser.fromPixels(source).toFloat()
            // Crop the region
            const clampedX = Math.max(0, Math.floor(cropX))
            const clampedY = Math.max(0, Math.floor(cropY))
            const clampedW = Math.min(Math.floor(cropW), tensor.shape[1] - clampedX)
            const clampedH = Math.min(Math.floor(cropH), tensor.shape[0] - clampedY)
            if (clampedW <= 0 || clampedH <= 0) return null
            tensor = tf.slice(tensor, [clampedY, clampedX, 0], [clampedH, clampedW, 3])
            // Resize to 224x224
            tensor = tf.image.resizeBilinear(tensor, [224, 224])
            return tensor.div(127.5).sub(1)
        })
    }

    /**
     * Extract MobileNet embedding for a cropped region.
     */
    private async extractRegionEmbedding(
        source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
        cropX: number,
        cropY: number,
        cropW: number,
        cropH: number
    ): Promise<any | null> {
        const tf = await ensureTf()
        const model = await this.ensureModel()
        const tensor = await this.preprocessRegion(source, cropX, cropY, cropW, cropH)
        if (!tensor) return null
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

    /**
     * Extract embedding from a full image (for whole-image classification).
     */
    private async extractFullEmbedding(
        input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
    ): Promise<any> {
        const tf = await ensureTf()
        const model = await this.ensureModel()
        return tf.tidy(() => {
            let tensor = tf.browser.fromPixels(input).toFloat()
            const [h, w] = tensor.shape
            const size = Math.min(h, w)
            const top = Math.floor((h - size) / 2)
            const left = Math.floor((w - size) / 2)
            tensor = tf.slice(tensor, [top, left, 0], [size, size, 3])
            tensor = tf.image.resizeBilinear(tensor, [224, 224])
            tensor = tensor.div(127.5).sub(1)
            const embedding = model.infer(tensor, true)
            tensor.dispose()
            const norm = tf.norm(embedding)
            const normalized = tf.div(embedding, tf.maximum(norm, 1e-10))
            embedding.dispose()
            return normalized
        })
    }

    /**
     * Generate region proposals using a multi-scale sliding window with multiple aspect ratios.
     */
    private generateRegionProposals(
        imageWidth: number,
        imageHeight: number
    ): RegionProposal[] {
        const proposals: RegionProposal[] = []
        const ASPECT_RATIOS = this.ASPECT_RATIOS || [1.0, 1.8, 0.55]

        for (const scale of this.SCALES) {
            const scaledW = Math.floor(imageWidth * scale)
            const scaledH = Math.floor(imageHeight * scale)

            for (const windowSize of this.WINDOW_SIZES) {
                for (const aspectRatio of ASPECT_RATIOS) {
                    const wFactor = Math.sqrt(aspectRatio)
                    const hFactor = 1 / wFactor

                    const winW = Math.round(windowSize * wFactor)
                    const winH = Math.round(windowSize * hFactor)

                    // Ensure window fits within the scaled image
                    if (winW > scaledW || winH > scaledH) continue

                    const stepX = Math.max(20, Math.floor(winW * this.STEP_RATIO))
                    const stepY = Math.max(20, Math.floor(winH * this.STEP_RATIO))

                    for (let y = 0; y + winH <= scaledH; y += stepY) {
                        for (let x = 0; x + winW <= scaledW; x += stepX) {
                            proposals.push({
                                x: x / scale,
                                y: y / scale,
                                width: winW / scale,
                                height: winH / scale,
                                scale
                            })
                        }
                    }
                }
            }
        }
        return proposals
    }

    /**
     * Non-Maximum Suppression to remove overlapping detections.
     */
    private nonMaxSuppression(detections: CustomDetection[], iouThreshold: number): CustomDetection[] {
        if (detections.length === 0) return []
        // Sort by confidence descending
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
                if (iou > iouThreshold) {
                    suppressed.add(j)
                }
            }
        }
        return result
    }

    /**
     * Calculate Intersection over Union (IoU) between two bounding boxes.
     */
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

    /**
     * Add a training sample: an image region with a known label.
     * Crops the region from the source image, extracts MobileNet features, and adds to KNN.
     */
    async addSample(
        source: HTMLImageElement | HTMLCanvasElement,
        label: string,
        bbox: { x: number; y: number; width: number; height: number },
        imageWidth: number,
        imageHeight: number
    ): Promise<boolean> {
        try {
            // Convert percentage-based bbox to pixel coordinates
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

    /**
     * Add a training sample from a data URL image.
     */
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

    /**
     * Train from annotated samples.
     * Each sample's data is a JSON string with { imageUrl, boxes: [{label, x, y, width, height}] }.
     */
    async trainFromAnnotations(
        samples: { data: string }[],
        onProgress?: (progress: number, message: string) => void
    ): Promise<{ success: boolean; totalRegions: number; classCounts: Record<string, number> }> {
        this.isTraining = true
        this.trainingProgress = 0
        this.onProgressCallback = onProgress || null
        this.totalRegionsProcessed = 0

        // Clear existing KNN data
        this.knn.clear()

        let totalRegions = 0
        const classCounts: Record<string, number> = {}

        try {
            // Count total regions first
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
                } catch {
                    // Raw image data URL — skip (no bounding box info)
                }
            }

            totalRegions = allRegions.length
            if (totalRegions === 0) {
                this.isTraining = false
                return { success: false, totalRegions: 0, classCounts: {} }
            }

            // Process regions in batches to allow browser breathing room
            const BATCH_SIZE = 5
            for (let i = 0; i < allRegions.length; i += BATCH_SIZE) {
                const batch = allRegions.slice(i, i + BATCH_SIZE)
                for (const region of batch) {
                    const success = await this.addSampleFromDataUrl(
                        region.dataUrl,
                        region.label,
                        region.bbox
                    )
                    if (success) {
                        classCounts[region.label] = (classCounts[region.label] || 0) + 1
                        this.totalRegionsProcessed++
                    }
                }
                this.trainingProgress = Math.floor(((i + batch.length) / allRegions.length) * 100)
                if (this.onProgressCallback) {
                    this.onProgressCallback(this.trainingProgress, `Processing region ${Math.min(i + BATCH_SIZE, allRegions.length)}/${totalRegions}`)
                }
                // Yield to browser
                await new Promise(r => setTimeout(r, 0))
            }

            this.trainingProgress = 100
            this.isTraining = false
            return { success: this.knn.canClassify, totalRegions, classCounts }
        } catch (err) {
            console.error('[CustomObjectDetector] Training failed:', err)
            this.isTraining = false
            return { success: false, totalRegions, classCounts }
        }
    }

    /**
     * Run detection on an image or video frame.
     * Uses multi-scale sliding window + KNN classification + NMS.
     */
    async detect(
        input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
        maxDetections = 20
    ): Promise<CustomDetectionResult> {
        if (!this.knn.canClassify) {
            return { objects: [], timestamp: Date.now() }
        }

        const tf = await ensureTf()
        const inputTensor = tf.browser.fromPixels(input)
        const [imageHeight, imageWidth] = inputTensor.shape
        inputTensor.dispose()

        // Generate region proposals
        const proposals = this.generateRegionProposals(imageWidth, imageHeight)

        // Create a canvas for cropping regions
        const cropCanvas = document.createElement('canvas')
        const cropCtx = cropCanvas.getContext('2d')!
        cropCanvas.width = imageWidth
        cropCanvas.height = imageHeight

        // Draw the full image onto the crop canvas
        if (input instanceof HTMLVideoElement) {
            cropCtx.drawImage(input, 0, 0, imageWidth, imageHeight)
        } else if (input instanceof HTMLImageElement) {
            cropCtx.drawImage(input, 0, 0, imageWidth, imageHeight)
        } else {
            cropCtx.drawImage(input, 0, 0, imageWidth, imageHeight)
        }

        const rawDetections: CustomDetection[] = []
        const CONFIDENCE_THRESHOLD = this.CONFIDENCE_THRESHOLD

        // Process proposals in batches
        const BATCH_SIZE = 10
        for (let i = 0; i < proposals.length; i += BATCH_SIZE) {
            const batch = proposals.slice(i, i + BATCH_SIZE)
            for (const proposal of batch) {
                try {
                    const embedding = await this.extractRegionEmbedding(
                        cropCanvas,
                        proposal.x,
                        proposal.y,
                        proposal.width,
                        proposal.height
                    )
                    if (!embedding) continue

                    const prediction = await this.knn.predictClass(embedding, 3)
                    embedding.dispose()

                    if (prediction && prediction.confidences[prediction.label] > CONFIDENCE_THRESHOLD) {
                        rawDetections.push({
                            label: prediction.label,
                            confidence: prediction.confidences[prediction.label],
                            bbox: [
                                Math.max(0, proposal.x),
                                Math.max(0, proposal.y),
                                Math.min(proposal.width, imageWidth - proposal.x),
                                Math.min(proposal.height, imageHeight - proposal.y)
                            ]
                        })
                    }
                } catch {
                    // Skip failed regions
                }
            }
            // Yield to browser every batch
            await new Promise(r => setTimeout(r, 0))
        }

        // Apply Non-Maximum Suppression
        const nmsDetections = this.nonMaxSuppression(rawDetections, this.NMS_IOU_THRESHOLD)

        // Limit total detections
        const result = nmsDetections.slice(0, maxDetections)

        return { objects: result, timestamp: Date.now() }
    }

    /**
     * Run detection on a static image from a data URL.
     */
    async detectFromDataUrl(dataUrl: string): Promise<CustomDetectionResult> {
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
        return this.detect(img)
    }

    /**
     * Draw detections on a canvas.
     */
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

            ctx.strokeStyle = color
            ctx.lineWidth = 3
            ctx.shadowColor = color
            ctx.shadowBlur = 8
            ctx.strokeRect(x * scaleX, y * scaleY, w * scaleX, h * scaleY)
            ctx.shadowBlur = 0

            const label = `${obj.label} ${Math.round(obj.confidence * 100)}%`
            ctx.font = 'bold 14px system-ui, sans-serif'
            const textWidth = ctx.measureText(label).width
            const labelHeight = 22
            const labelX = x * scaleX
            const labelY = Math.max(y * scaleY - labelHeight - 4, 0)

            ctx.fillStyle = color
            ctx.beginPath()
            ctx.roundRect(labelX, labelY, textWidth + 12, labelHeight, 6)
            ctx.fill()

            ctx.fillStyle = '#fff'
            ctx.textBaseline = 'middle'
            ctx.fillText(label, labelX + 6, labelY + labelHeight / 2)
        }
    }

    /**
     * Group detections by label and count objects per class.
     */
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

    dispose(): void {
        this.knn.dispose()
        this.mobilenetModel = null
        this.mobilenetModule = null
    }
}
