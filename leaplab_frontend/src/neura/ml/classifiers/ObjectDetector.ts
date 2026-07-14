import { ensureCocoSsd } from '../loadScript'

export interface DetectedObject {
    label: string
    confidence: number
    bbox: [number, number, number, number]
    class: string
}

export interface DetectionResult {
    objects: DetectedObject[]
    timestamp: number
}

const LABEL_MAP: Record<string, string> = {
    'cell phone': 'phone',
    'potted plant': 'plant',
    'backpack': 'bag',
    'handbag': 'bag',
    'suitcase': 'bag',
    'bicycle': 'bike',
    'motorcycle': 'bike',
    'laptop': 'computer',
    'sports ball': 'ball'
}

const OBJECT_COLORS: Record<string, string> = {
    person: '#7C3AED',
    car: '#3B82F6',
    cat: '#F97316',
    dog: '#10B981',
    bird: '#EC4899',
    chair: '#6366F1',
    bottle: '#06B6D4',
    phone: '#8B5CF6',
    keyboard: '#14B8A6',
    book: '#F59E0B'
}

const DEFAULT_COLOR = '#64748B'

export class ObjectDetector {
    private model: any = null
    private isDetecting = false
    private lastResult: DetectionResult | null = null
    private listeners: Set<(result: DetectionResult) => void> = new Set()

    async loadModel(): Promise<void> {
        if (this.model) return
        const cocoSsd = await ensureCocoSsd()
        this.model = await cocoSsd.load()
    }

    isModelLoaded(): boolean {
        return !!this.model
    }

    async detect(videoElement: HTMLVideoElement): Promise<DetectionResult> {
        if (!this.model) {
            await this.loadModel()
        }

        if (this.isDetecting) {
            return this.lastResult || { objects: [], timestamp: Date.now() }
        }

        this.isDetecting = true
        try {
            const predictions = await this.model.detect(videoElement)
            const objects: DetectedObject[] = predictions.map((pred: any) => ({
                label: LABEL_MAP[pred.class] || pred.class,
                confidence: pred.score,
                bbox: pred.bbox as [number, number, number, number],
                class: pred.class
            }))

            this.lastResult = { objects, timestamp: Date.now() }
            this.notifyListeners(this.lastResult)
            return this.lastResult
        } finally {
            this.isDetecting = false
        }
    }

    getColorForObject(label: string): string {
        return OBJECT_COLORS[label] || DEFAULT_COLOR
    }

    getFriendlyLabel(className: string): string {
        return LABEL_MAP[className] || className
    }

    onDetection(callback: (result: DetectionResult) => void): () => void {
        this.listeners.add(callback)
        return () => this.listeners.delete(callback)
    }

    private notifyListeners(result: DetectionResult) {
        this.listeners.forEach(cb => cb(result))
    }

    drawDetections(
        canvas: HTMLCanvasElement,
        result: DetectionResult,
        videoWidth: number,
        videoHeight: number
    ) {
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        const scaleX = canvas.width / videoWidth
        const scaleY = canvas.height / videoHeight

        for (const obj of result.objects) {
            const [x, y, w, h] = obj.bbox
            const color = this.getColorForObject(obj.label)

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
            const labelY = y * scaleY - labelHeight - 4

            ctx.fillStyle = color
            ctx.beginPath()
            ctx.roundRect(labelX, labelY, textWidth + 12, labelHeight, 6)
            ctx.fill()

            ctx.fillStyle = '#fff'
            ctx.textBaseline = 'middle'
            ctx.fillText(label, labelX + 6, labelY + labelHeight / 2)
        }
    }

    getObjectsByLabel(result: DetectionResult): Record<string, DetectedObject[]> {
        const grouped: Record<string, DetectedObject[]> = {}
        for (const obj of result.objects) {
            if (!grouped[obj.label]) grouped[obj.label] = []
            grouped[obj.label].push(obj)
        }
        return grouped
    }

    dispose(): void {
        this.model = null
        this.listeners.clear()
        this.lastResult = null
    }
}
