import { KNNClassifier, ensureTf } from '../KNNClassifier'
import { ensureHandPose } from '../loadScript'

export interface HandPosePrediction {
    label: string
    confidences: Record<string, number>
}

export interface HandKeypoint {
    x: number
    y: number
    z?: number
    score: number
    name: string
}

// MediaPipe Hands 21 landmark names
const HAND_landmark_NAMES = [
    'WRIST',
    'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
    'INDEX_FINGER_MCP', 'INDEX_FINGER_PIP', 'INDEX_FINGER_DIP', 'INDEX_FINGER_TIP',
    'MIDDLE_FINGER_MCP', 'MIDDLE_FINGER_PIP', 'MIDDLE_FINGER_DIP', 'MIDDLE_FINGER_TIP',
    'RING_FINGER_MCP', 'RING_FINGER_PIP', 'RING_FINGER_DIP', 'RING_FINGER_TIP',
    'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP'
]

// Hand skeleton connections for drawing
const HAND_CONNECTIONS: [number, number][] = [
    // Wrist to thumb
    [0, 1], [1, 2], [2, 3], [3, 4],
    // Wrist to index
    [0, 5], [5, 6], [6, 7], [7, 8],
    // Wrist to middle
    [0, 9], [9, 10], [10, 11], [11, 12],
    // Wrist to ring
    [0, 13], [13, 14], [14, 15], [15, 16],
    // Wrist to pinky
    [0, 17], [17, 18], [18, 19], [19, 20],
    // Palm connections
    [5, 9], [9, 13], [13, 17]
]

const HAND_DRAW_COLOR = '#0ea5e9'
const HAND_DRAW_COLOR_LIGHT = '#7dd3fc'

export class HandPoseClassifier {
    private knn = new KNNClassifier()
    private handModel: any = null

    private async ensureModel() {
        if (this.handModel) return this.handModel
        const handPoseDetection = await ensureHandPose()
        await ensureTf()
        this.handModel = await handPoseDetection.createDetector(
            handPoseDetection.SupportedModels.MediaPipeHands,
            {
                runtime: 'tfjs',
                maxNumHands: 1,
                modelComplexity: 0
            }
        )
        return this.handModel
    }

    normalizeKeypoints(keypoints: HandKeypoint[]): Float32Array {
        const validKeypoints = keypoints.filter(kp => kp.score > 0.3)
        if (validKeypoints.length === 0) return new Float32Array(63)

        const minX = Math.min(...validKeypoints.map(kp => kp.x))
        const maxX = Math.max(...validKeypoints.map(kp => kp.x))
        const minY = Math.min(...validKeypoints.map(kp => kp.y))
        const maxY = Math.max(...validKeypoints.map(kp => kp.y))
        const rangeX = maxX - minX || 1
        const rangeY = maxY - minY || 1

        const normalized = new Float32Array(63)
        for (let i = 0; i < keypoints.length && i < 21; i++) {
            normalized[i * 3] = (keypoints[i].x - minX) / rangeX
            normalized[i * 3 + 1] = (keypoints[i].y - minY) / rangeY
            normalized[i * 3 + 2] = keypoints[i].z ?? 0
        }
        return normalized
    }

    async addSample(features: Float32Array, label: string) {
        const tf = await ensureTf()
        const embedding = tf.tensor1d(features)
        await this.knn.addExample(embedding, label)
        embedding.dispose()
    }

    async addSampleFromImage(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, label: string) {
        const detector = await this.ensureModel()
        const estimation = await detector.estimateHands(imageElement)
        if (estimation.length > 0) {
            const keypoints = estimation[0].keypoints as HandKeypoint[]
            const features = this.normalizeKeypoints(keypoints)
            const tf = await ensureTf()
            const embedding = tf.tensor1d(features)
            await this.knn.addExample(embedding, label)
            embedding.dispose()
        }
    }

    async addSampleFromKeypoints(keypoints: HandKeypoint[], label: string) {
        const tf = await ensureTf()
        const features = this.normalizeKeypoints(keypoints)
        const embedding = tf.tensor1d(features)
        await this.knn.addExample(embedding, label)
        embedding.dispose()
    }

    async detectHand(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<HandKeypoint[]> {
        const detector = await this.ensureModel()
        const estimation = await detector.estimateHands(imageElement)
        if (estimation.length > 0) {
            return estimation[0].keypoints as HandKeypoint[]
        }
        return []
    }

    async predict(features: Float32Array, k = 5): Promise<HandPosePrediction | null> {
        const tf = await ensureTf()
        const embedding = tf.tensor1d(features)
        const result = await this.knn.predictClass(embedding, k)
        embedding.dispose()
        return result
    }

    async predictFromImage(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, k = 5): Promise<HandPosePrediction | null> {
        const tf = await ensureTf()
        const keypoints = await this.detectHand(imageElement)
        if (keypoints.length === 0) return null
        const features = this.normalizeKeypoints(keypoints)
        const embedding = tf.tensor1d(features)
        const result = await this.knn.predictClass(embedding, k)
        embedding.dispose()
        return result
    }

    drawHand(canvas: HTMLCanvasElement, keypoints: HandKeypoint[], color?: string) {
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const drawColor = color || HAND_DRAW_COLOR

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.save()
        ctx.scale(-1, 1)
        ctx.translate(-canvas.width, 0)

        // Draw connections
        ctx.strokeStyle = drawColor
        ctx.lineWidth = 3
        ctx.shadowColor = `${drawColor}80`
        ctx.shadowBlur = 8

        for (const [i, j] of HAND_CONNECTIONS) {
            if (keypoints[i] && keypoints[j] && keypoints[i].score > 0.3 && keypoints[j].score > 0.3) {
                ctx.beginPath()
                ctx.moveTo(keypoints[i].x, keypoints[i].y)
                ctx.lineTo(keypoints[j].x, keypoints[j].y)
                ctx.stroke()
            }
        }

        // Draw keypoints
        ctx.shadowBlur = 0
        for (const kp of keypoints) {
            if (kp.score > 0.3) {
                ctx.beginPath()
                ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI)
                ctx.fillStyle = HAND_DRAW_COLOR_LIGHT
                ctx.fill()
                ctx.strokeStyle = drawColor
                ctx.lineWidth = 2
                ctx.stroke()
            }
        }

        // Draw fingertip labels
        const fingertips = [4, 8, 12, 16, 20]
        const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']
        ctx.font = 'bold 11px system-ui, sans-serif'
        ctx.textAlign = 'center'
        for (let i = 0; i < fingertips.length; i++) {
            const kp = keypoints[fingertips[i]]
            if (kp && kp.score > 0.3) {
                ctx.fillStyle = drawColor
                ctx.fillText(fingerNames[i], kp.x, kp.y - 12)
            }
        }

        ctx.restore()
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
        this.handModel = null
    }
}
