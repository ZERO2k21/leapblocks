import { KNNClassifier, ensureTf } from '../KNNClassifier'
import { ensurePoseDetection } from '../loadScript'

export interface PosePrediction {
    label: string
    confidences: Record<string, number>
}

export interface Keypoint {
    x: number
    y: number
    score: number
    name: string
}

export class PoseClassifier {
    private knn = new KNNClassifier()
    private poseModel: any = null

    private async ensureModel() {
        if (this.poseModel) return this.poseModel
        const poseDetection = await ensurePoseDetection()
        await ensureTf()
        try {
            // Try with default CDN first
            this.poseModel = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
            })
        } catch (err) {
            console.warn('[PoseClassifier] Default CDN failed, trying TFHub fallback:', err)
            // Fallback to alternative CDN
            this.poseModel = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
                modelUrl: 'https://storage.googleapis.com/tfjs-models/savedmodel/posenet/lightning/manifest.json'
            })
        }
        return this.poseModel
    }

    private normalizeKeypoints(keypoints: Keypoint[]): Float32Array {
        const validKeypoints = keypoints.filter(kp => kp.score > 0.3)
        if (validKeypoints.length === 0) return new Float32Array(51)

        const minX = Math.min(...validKeypoints.map(kp => kp.x))
        const maxX = Math.max(...validKeypoints.map(kp => kp.x))
        const minY = Math.min(...validKeypoints.map(kp => kp.y))
        const maxY = Math.max(...validKeypoints.map(kp => kp.y))
        const rangeX = maxX - minX || 1
        const rangeY = maxY - minY || 1

        const normalized = new Float32Array(51)
        for (let i = 0; i < keypoints.length && i < 17; i++) {
            normalized[i * 3] = (keypoints[i].x - minX) / rangeX
            normalized[i * 3 + 1] = (keypoints[i].y - minY) / rangeY
            normalized[i * 3 + 2] = keypoints[i].score
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
        const estimation = await detector.estimatePoses(imageElement)
        if (estimation.length > 0) {
            const keypoints = estimation[0].keypoints as Keypoint[]
            const features = this.normalizeKeypoints(keypoints)
            const tf = await ensureTf()
            const embedding = tf.tensor1d(features)
            await this.knn.addExample(embedding, label)
            embedding.dispose()
        }
    }

    async addSampleFromKeypoints(keypoints: Keypoint[], label: string) {
        const tf = await ensureTf()
        const features = this.normalizeKeypoints(keypoints)
        const embedding = tf.tensor1d(features)
        await this.knn.addExample(embedding, label)
        embedding.dispose()
    }

    async detectPose(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<Keypoint[]> {
        const detector = await this.ensureModel()
        const estimation = await detector.estimatePoses(imageElement)
        if (estimation.length > 0) {
            return estimation[0].keypoints as Keypoint[]
        }
        return []
    }

    async predict(features: Float32Array, k = 3): Promise<PosePrediction | null> {
        const tf = await ensureTf()
        const embedding = tf.tensor1d(features)
        const result = await this.knn.predictClass(embedding, k)
        embedding.dispose()
        return result
    }

    async predictFromImage(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, k = 3): Promise<PosePrediction | null> {
        const tf = await ensureTf()
        const keypoints = await this.detectPose(imageElement)
        if (keypoints.length === 0) return null
        const features = this.normalizeKeypoints(keypoints)
        const embedding = tf.tensor1d(features)
        const result = await this.knn.predictClass(embedding, k)
        embedding.dispose()
        return result
    }

    drawPose(canvas: HTMLCanvasElement, keypoints: Keypoint[]) {
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20]
        ]

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.strokeStyle = '#7C3AED'
        ctx.lineWidth = 3
        ctx.shadowColor = 'rgba(124, 58, 237, 0.5)'
        ctx.shadowBlur = 8

        for (const [i, j] of connections) {
            if (keypoints[i] && keypoints[j] && keypoints[i].score > 0.3 && keypoints[j].score > 0.3) {
                ctx.beginPath()
                ctx.moveTo(keypoints[i].x, keypoints[i].y)
                ctx.lineTo(keypoints[j].x, keypoints[j].y)
                ctx.stroke()
            }
        }

        ctx.shadowBlur = 0
        for (const kp of keypoints) {
            if (kp.score > 0.3) {
                ctx.beginPath()
                ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI)
                ctx.fillStyle = '#A78BFA'
                ctx.fill()
                ctx.strokeStyle = '#fff'
                ctx.lineWidth = 2
                ctx.stroke()
            }
        }
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
        this.poseModel = null
    }
}
