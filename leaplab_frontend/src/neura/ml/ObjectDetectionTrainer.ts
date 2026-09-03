import { CustomObjectDetector, CustomDetectionResult } from './classifiers/CustomObjectDetector'
import type { NeuraProject } from '../types/neura.types'

export interface DetectionTrainingMetrics {
    totalRegions: number
    totalClasses: number
    classCounts: Record<string, number>
}

export interface DetectionTrainingState {
    isTraining: boolean
    isComplete: boolean
    progress: number
    metrics: DetectionTrainingMetrics
}

type ProgressCallback = (state: DetectionTrainingState) => void

export class ObjectDetectionTrainer {
    private detector: CustomObjectDetector
    private state: DetectionTrainingState
    private listeners: Set<ProgressCallback> = new Set()
    private trainingAborted = false

    constructor() {
        this.detector = new CustomObjectDetector()
        this.state = this.createInitialState()
    }

    private createInitialState(): DetectionTrainingState {
        return {
            isTraining: false,
            isComplete: false,
            progress: 0,
            metrics: {
                totalRegions: 0,
                totalClasses: 0,
                classCounts: {}
            }
        }
    }

    onProgress(callback: ProgressCallback): () => void {
        this.listeners.add(callback)
        return () => this.listeners.delete(callback)
    }

    private notifyListeners() {
        this.listeners.forEach(cb => {
            try { cb({ ...this.state }) } catch (e) { console.warn('[ObjectDetectionTrainer] Listener error:', e) }
        })
    }

    async startTraining(project: NeuraProject): Promise<boolean> {
        if (this.state.isTraining) return false

        this.trainingAborted = false
        this.state = this.createInitialState()
        this.state.isTraining = true
        this.notifyListeners()

        // Pre-validate: single Dataset + palette OR multi-folder — count per BOX label, not per folder
        let annotatedImages = 0
        let totalBoxes = 0
        const validClassNames = new Set(project.classes.map(c => c.name.toLowerCase()))
        const labelToImageCount: Record<string, number> = {}
        const labelToBoxCount: Record<string, number> = {}

        for (const cls of project.classes) {
            for (const sample of cls.samples) {
                if (sample.type !== 'image') continue
                try {
                    const parsed = JSON.parse(sample.data)
                    if (parsed && Array.isArray(parsed.boxes) && parsed.boxes.length > 0) {
                        const validBoxes = parsed.boxes.filter((b: any) => b.label && validClassNames.has(String(b.label).toLowerCase()) && b.width > 1 && b.height > 1)
                        if (validBoxes.length > 0) {
                            annotatedImages++
                            totalBoxes += validBoxes.length
                            const seenInImage = new Set<string>()
                            for (const b of validBoxes) {
                                const low = String(b.label).toLowerCase()
                                labelToBoxCount[low] = (labelToBoxCount[low] || 0) + 1
                                if (!seenInImage.has(low)) {
                                    seenInImage.add(low)
                                    labelToImageCount[low] = (labelToImageCount[low] || 0) + 1
                                }
                            }
                        }
                    }
                } catch {}
            }
        }

        if (annotatedImages === 0) {
            console.warn('[ObjectDetectionTrainer] No annotated images — training blocked')
            this.state.isTraining = false
            this.state.isComplete = false
            this.notifyListeners()
            return false
        }
        const distinctLabels = Object.keys(labelToBoxCount)
        if (distinctLabels.length < 2) {
            console.warn(`[ObjectDetectionTrainer] Need 2 distinct labels, have ${distinctLabels.length} —`, distinctLabels)
            this.state.isTraining = false
            this.state.isComplete = false
            this.notifyListeners()
            return false
        }
        for (const low of distinctLabels) {
            const imgCount = labelToImageCount[low] || 0
            if (imgCount < 2) {
                const pretty = project.classes.find(c => c.name.toLowerCase() === low)?.name || low
                console.warn(`[ObjectDetectionTrainer] Label "${pretty}" needs 2 images, has ${imgCount}`)
                this.state.isTraining = false
                this.state.isComplete = false
                this.notifyListeners()
                return false
            }
        }
        if (totalBoxes < distinctLabels.length * 2) {
            this.state.isTraining = false
            this.notifyListeners()
            return false
        }

        const allSamples: { data: string }[] = []
        for (const cls of project.classes) {
            for (const sample of cls.samples) {
                if (sample.type === 'image') {
                    allSamples.push({ data: sample.data })
                }
            }
        }

        if (allSamples.length === 0) {
            this.state.isTraining = false
            this.notifyListeners()
            return false
        }

        let result: any
        try {
            result = await this.detector.trainFromAnnotations(
                allSamples,
                (progress) => {
                    if (this.trainingAborted) return
                    this.state.progress = Math.floor(progress * 100)
                    this.notifyListeners()
                }
            )
        } catch (e: any) {
            const msg = String(e?.message || e || '')
            const isBackend = msg.includes('backend') || String(e?.stack || '').includes('backend') || msg.includes('moveData')
            console.warn('[ObjectDetectionTrainer] trainFromAnnotations threw, treating as failed:', e)
            this.state.isTraining = false
            this.state.isComplete = false
            this.state.progress = 0
            this.notifyListeners()
            // surface a backend hint for the panel to show friendly message
            if (isBackend) throw new Error('backend: ' + msg)
            return false
        }

        if (this.trainingAborted) return false

        if (!result || !result.success) {
            this.state.isTraining = false
            this.state.isComplete = false
            this.state.progress = 0
            this.notifyListeners()
            return false
        }

        try {
            await this.detector.calibrateConfidence()
        } catch (e) {
            console.warn('[ObjectDetectionTrainer] calibrateConfidence failed (backend busy), continuing without calibration:', e)
        }

        this.state.metrics = {
            totalRegions: result.totalRegions,
            totalClasses: Object.keys(result.classCounts).length,
            classCounts: result.classCounts
        }
        this.state.isTraining = false
        this.state.isComplete = true
        this.state.progress = 100
        this.notifyListeners()
        return true
    }

    stopTraining(): void {
        this.trainingAborted = true
        this.state.isTraining = false
        this.notifyListeners()
    }

    reset(): void {
        this.stopTraining()
        this.state = this.createInitialState()
        this.notifyListeners()
    }

    getSampleCounts(): Record<string, number> {
        return this.detector.getSampleCounts()
    }

    async detect(input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, maxDetections = 20, realTime = false): Promise<CustomDetectionResult> {
        return this.detector.detect(input, maxDetections, realTime)
    }

    async detectFromDataUrl(dataUrl: string, realTime = false): Promise<CustomDetectionResult> {
        return this.detector.detectFromDataUrl(dataUrl, realTime)
    }

    drawDetections(
        canvas: HTMLCanvasElement,
        result: CustomDetectionResult,
        sourceWidth: number,
        sourceHeight: number,
        colorMap: Record<string, string> = {}
    ) {
        this.detector.drawDetections(canvas, result, sourceWidth, sourceHeight, colorMap)
    }

    getObjectsByLabel(result: CustomDetectionResult): Record<string, any[]> {
        return this.detector.getObjectsByLabel(result)
    }

    async evaluateLOO(): Promise<{
        overallAccuracy: number
        classMetrics: { name: string; tp: number; fp: number; fn: number; precision: number; recall: number; f1: number; sampleCount: number }[]
    }> {
        // Ensure TF backend ready before heavy LOO (same as train)
        try {
            const { ensureTf } = await import('./loadScript')
            const tf = await ensureTf()
            await tf.ready()
            if (!tf.getBackend()) {
                try { await tf.setBackend('webgl'); await tf.ready() } catch {}
            }
            if (!tf.getBackend()) {
                await tf.setBackend('cpu'); await tf.ready()
            }
        } catch {}
        const knn = this.detector.getKNN()
        const counts = knn.getSampleCounts()
        const classNames = Object.keys(counts)
        const classConfusion: Record<string, { tp: number; fp: number; fn: number }> = {}
        for (const name of classNames) {
            classConfusion[name] = { tp: 0, fp: 0, fn: 0 }
        }

        let totalCorrect = 0
        let totalSamples = 0

        for (const label of classNames) {
            const count = counts[label]
            // Iterate backwards — forward iteration with remove+append-at-end
            // shifts indices and skips samples (e.g. removing 0 then appending
            // makes original index 1 move to 0). Backwards avoids the skip.
            for (let i = count - 1; i >= 0; i--) {
                const removedData = await knn.removeExampleByIndex(label, i)
                if (!removedData) continue

                let prediction: any = null
                try {
                    prediction = await knn.predictFromData(removedData, 5)
                } catch (e) {
                    console.warn('[ObjectDetectionTrainer] LOO predict failed:', e)
                }

                try {
                    await knn.addExampleFromDataArray(Array.from(removedData), label)
                } catch (e) {
                    console.warn('[ObjectDetectionTrainer] LOO re-add failed:', e)
                }

                if (!prediction) {
                    // Count as evaluated sample but incorrect (no prediction = miss)
                    totalSamples++
                    classConfusion[label].fn++
                    continue
                }

                totalSamples++
                if (prediction.label === label) {
                    totalCorrect++
                    classConfusion[label].tp++
                } else {
                    classConfusion[label].fn++
                    if (classConfusion[prediction.label]) {
                        classConfusion[prediction.label].fp++
                    }
                }
            }
        }

        const classMetrics = classNames.map(name => {
            const { tp, fp, fn } = classConfusion[name]
            const precision = tp + fp > 0 ? tp / (tp + fp) : 0
            const recall = tp + fn > 0 ? tp / (tp + fn) : 0
            const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0
            return { name, tp, fp, fn, precision, recall, f1, sampleCount: counts[name] }
        })

        return {
            overallAccuracy: totalSamples > 0 ? totalCorrect / totalSamples : 0,
            classMetrics
        }
    }

    getState(): DetectionTrainingState {
        return { ...this.state }
    }

    get canClassify(): boolean {
        return this.detector.canClassify
    }

    get trainedDetector(): CustomObjectDetector {
        return this.detector
    }

    dispose(): void {
        this.stopTraining()
        this.detector.dispose()
        this.listeners.clear()
    }
}
