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

        const result = await this.detector.trainFromAnnotations(
            allSamples,
            (progress) => {
                if (this.trainingAborted) return
                this.state.progress = Math.floor(progress * 100)
                this.notifyListeners()
            }
        )

        if (this.trainingAborted) return false

        if (!result.success) {
            this.state.isTraining = false
            this.state.isComplete = true
            this.state.progress = 100
            this.notifyListeners()
            return false
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

    async detect(input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<CustomDetectionResult> {
        return this.detector.detect(input)
    }

    async detectFromDataUrl(dataUrl: string): Promise<CustomDetectionResult> {
        return this.detector.detectFromDataUrl(dataUrl)
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
