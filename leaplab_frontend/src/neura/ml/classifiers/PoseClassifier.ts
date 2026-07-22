import { KNNClassifier, ensureTf } from '../KNNClassifier'
import { ensurePoseDetection } from '../loadScript'
import { calcAngle, normalizeAngle, midpoint, lineAngle } from '../utils/geometry'

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

// Feature vector size: 51 raw landmarks (17×3) + 10 derived angles = 61
const FEATURE_SIZE = 61
const LEGACY_FEATURE_SIZE = 51

// COCO 17-keypoint indices
const NOSE = 0
const L_SHOULDER = 5, R_SHOULDER = 6
const L_ELBOW = 7, R_ELBOW = 8
const L_WRIST = 9, R_WRIST = 10
const L_HIP = 11, R_HIP = 12
const L_KNEE = 13, R_KNEE = 14
const L_ANKLE = 15, R_ANKLE = 16

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
        if (validKeypoints.length === 0) return new Float32Array(FEATURE_SIZE)

        const minX = Math.min(...validKeypoints.map(kp => kp.x))
        const maxX = Math.max(...validKeypoints.map(kp => kp.x))
        const minY = Math.min(...validKeypoints.map(kp => kp.y))
        const maxY = Math.max(...validKeypoints.map(kp => kp.y))
        const rangeX = maxX - minX || 1
        const rangeY = maxY - minY || 1

        const features = new Float32Array(FEATURE_SIZE)

        // First 51 values: normalized landmark coordinates
        for (let i = 0; i < keypoints.length && i < 17; i++) {
            features[i * 3] = (keypoints[i].x - minX) / rangeX
            features[i * 3 + 1] = (keypoints[i].y - minY) / rangeY
            features[i * 3 + 2] = keypoints[i].score
        }

        // Additional 10 angle features (indices 51-60)
        const kp = (i: number) => ({ x: keypoints[i].x, y: keypoints[i].y })
        const shoulderMid = midpoint(kp(L_SHOULDER), kp(R_SHOULDER))
        const hipMid = midpoint(kp(L_HIP), kp(R_HIP))

        // Lower body angles (normalized 0-1)
        features[51] = normalizeAngle(calcAngle(kp(L_HIP), kp(L_KNEE), kp(L_ANKLE)))
        features[52] = normalizeAngle(calcAngle(kp(R_HIP), kp(R_KNEE), kp(R_ANKLE)))

        // Upper body angles
        features[53] = normalizeAngle(calcAngle(kp(L_SHOULDER), kp(L_ELBOW), kp(L_WRIST)))
        features[54] = normalizeAngle(calcAngle(kp(R_SHOULDER), kp(R_ELBOW), kp(R_WRIST)))

        // Tilt angles (horizontal reference)
        features[55] = normalizeAngle(lineAngle(kp(L_SHOULDER), kp(R_SHOULDER)))
        features[56] = normalizeAngle(lineAngle(kp(L_HIP), kp(R_HIP)))

        // Torso and neck angles
        features[57] = normalizeAngle(lineAngle(shoulderMid, hipMid))
        features[58] = normalizeAngle(calcAngle(kp(NOSE), shoulderMid, hipMid))

        // Elbow-to-hip connections
        features[59] = normalizeAngle(calcAngle(kp(L_ELBOW), kp(L_SHOULDER), kp(L_HIP)))
        features[60] = normalizeAngle(calcAngle(kp(R_ELBOW), kp(R_SHOULDER), kp(R_HIP)))

        return features
    }

    /**
     * Pad legacy 51-d feature vectors to 61-d with zero-padded angles.
     * Use when loading samples saved before angle feature upgrade.
     */
    static padLegacyFeatures(features: Float32Array): Float32Array {
        if (features.length >= FEATURE_SIZE) return features
        const padded = new Float32Array(FEATURE_SIZE)
        padded.set(features)
        // New angle features remain 0, which is a valid neutral value (0° = 90°/horizontal)
        return padded
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

    async predict(features: Float32Array, k = 5): Promise<PosePrediction | null> {
        const tf = await ensureTf()
        const embedding = tf.tensor1d(features)
        const result = await this.knn.predictClass(embedding, k)
        embedding.dispose()
        return result
    }

    async predictFromImage(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, k = 5): Promise<PosePrediction | null> {
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

        // COCO 17-keypoint body skeleton connections
        const connections: [number, number][] = [
            // Torso
            [5, 6], [5, 11], [6, 12], [11, 12],
            // Left arm
            [5, 7], [7, 9],
            // Right arm
            [6, 8], [8, 10],
            // Left leg
            [11, 13], [13, 15],
            // Right leg
            [12, 14], [14, 16],
            // Neck to shoulders
            [0, 5], [0, 6]
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
