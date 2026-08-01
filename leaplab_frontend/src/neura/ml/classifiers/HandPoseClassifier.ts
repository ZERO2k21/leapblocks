import { KNNClassifier, ensureTf } from '../KNNClassifier'
import { ensureMediaPipeVision, MEDIAPIPE_WASM_URL, HAND_LANDMARKER_MODEL_URL } from '../loadScript'

export interface HandPosePrediction {
    label: string
    confidences: Record<string, number>
    /** True cosine similarity to the closest training sample (0-1). */
    similarity?: number
}

export interface HandKeypoint {
    x: number
    y: number
    z?: number
    score: number
    name: string
}

// MediaPipe Hands 21 landmark names

// Hand skeleton connections for drawing
const HAND_CONNECTIONS: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20],
    [5, 9], [9, 13], [13, 17]
]

const HAND_DRAW_COLOR = '#0ea5e9'
const HAND_DRAW_COLOR_LIGHT = '#7dd3fc'

// MediaPipe Hands 21 landmark names (must match hand-pose-detection ordering)
const LANDMARK_NAMES = [
    'wrist',
    'thumb_cmc', 'thumb_mcp', 'thumb_ip', 'thumb_tip',
    'index_mcp', 'index_pip', 'index_dip', 'index_tip',
    'middle_mcp', 'middle_pip', 'middle_dip', 'middle_tip',
    'ring_mcp', 'ring_pip', 'ring_dip', 'ring_tip',
    'pinky_mcp', 'pinky_pip', 'pinky_dip', 'pinky_tip'
]

// Feature vector size: 63 raw landmarks + 5 finger flags + 5 tip-wrist distances + 5 inter-finger distances = 78
const FEATURE_SIZE = 78
const LEGACY_FEATURE_SIZE = 63

// Landmark indices
const WRIST = 0
const THUMB_TIP = 4, THUMB_IP = 3
const INDEX_MCP = 5, INDEX_PIP = 6, INDEX_TIP = 8
const MIDDLE_MCP = 9, MIDDLE_PIP = 10, MIDDLE_TIP = 12
const RING_PIP = 14, RING_TIP = 16
const PINKY_PIP = 18, PINKY_TIP = 20

function euclidean(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.sqrt(dx * dx + dy * dy)
}

export class HandPoseClassifier {
    private knn = new KNNClassifier()
    private handModel: any = null
    private modelPromise: Promise<any> | null = null
    private webglLostHandler: (() => void) | null = null
    private webglRestoredHandler: (() => void) | null = null

    private async ensureModel() {
        if (this.handModel) return this.handModel
        if (this.modelPromise) return this.modelPromise

        this.modelPromise = (async () => {
            try {
                const { HandLandmarker, FilesetResolver } = await ensureMediaPipeVision()
                const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL)
                // GPU delegate = fast native MediaPipe runtime (not tfjs).
                // runningMode 'VIDEO' + detectForVideo keeps tracking smooth (~5-10ms/frame).
                const landmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: HAND_LANDMARKER_MODEL_URL,
                        delegate: 'GPU',
                    },
                    runningMode: 'VIDEO',
                    numHands: 1,
                    minHandDetectionConfidence: 0.4,
                    minHandPresenceConfidence: 0.4,
                    minTrackingConfidence: 0.4,
                })
                this.handModel = landmarker
                this.modelPromise = null
                return landmarker
            } catch (firstErr) {
                console.warn('[HandPose] MediaPipe GPU init failed, trying CPU delegate:', firstErr)
                try {
                    const { HandLandmarker, FilesetResolver } = await ensureMediaPipeVision()
                    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL)
                    const landmarker = await HandLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: HAND_LANDMARKER_MODEL_URL,
                            delegate: 'CPU',
                        },
                        runningMode: 'VIDEO',
                        numHands: 1,
                    })
                    this.handModel = landmarker
                    this.modelPromise = null
                    return landmarker
                } catch (cpuErr) {
                    console.warn('[HandPose] CPU delegate also failed:', cpuErr)
                    this.modelPromise = null
                    this.handModel = null
                    throw firstErr
                }
            }
        })()

        return this.modelPromise
    }

    attachWebGLHandlers(canvas: HTMLCanvasElement) {
        this.detachWebGLHandlers()
        this.webglLostHandler = () => {
            console.warn('[HandPose] WebGL context lost — disposing model')
            this.dispose()
        }
        this.webglRestoredHandler = () => {
            console.warn('[HandPose] WebGL context restored — model will re-initialize on next use')
        }
        canvas.addEventListener('webglcontextlost', this.webglLostHandler)
        canvas.addEventListener('webglcontextrestored', this.webglRestoredHandler)
    }

    detachWebGLHandlers() {
        if (this.webglLostHandler) {
            document.querySelector('canvas')?.removeEventListener('webglcontextlost', this.webglLostHandler)
            this.webglLostHandler = null
        }
        if (this.webglRestoredHandler) {
            document.querySelector('canvas')?.removeEventListener('webglcontextrestored', this.webglRestoredHandler)
            this.webglRestoredHandler = null
        }
    }

    /**
     * Normalize raw landmark coordinates to [0,1] relative to hand bounding box.
     * Returns a63-d Float32Array (21 keypoints × 3).
     */
    normalizeKeypoints(keypoints: HandKeypoint[]): Float32Array {
        const validKeypoints = keypoints.filter(kp => kp.score > 0.3)
        if (validKeypoints.length === 0) return new Float32Array(LEGACY_FEATURE_SIZE)

        const minX = Math.min(...validKeypoints.map(kp => kp.x))
        const maxX = Math.max(...validKeypoints.map(kp => kp.x))
        const minY = Math.min(...validKeypoints.map(kp => kp.y))
        const maxY = Math.max(...validKeypoints.map(kp => kp.y))
        const rangeX = maxX - minX || 1
        const rangeY = maxY - minY || 1

        const normalized = new Float32Array(LEGACY_FEATURE_SIZE)
        for (let i = 0; i < keypoints.length && i < 21; i++) {
            normalized[i * 3] = Math.max(0, Math.min(1, (keypoints[i].x - minX) / rangeX))
            normalized[i * 3 + 1] = Math.max(0, Math.min(1, (keypoints[i].y - minY) / rangeY))
            normalized[i * 3 + 2] = Math.max(-1, Math.min(1, (keypoints[i].z ?? 0)))
        }
        return normalized
    }

    /**
     * Extract 78-d feature vector from raw keypoints:
     * - 63 values: normalized x, y, z for 21 landmarks
     * - 5 values: binary finger extension flags (1=extended, 0=curled)
     * - 5 values: normalized Euclidean distance from each fingertip to wrist
     * - 5 values: normalized Euclidean distances between adjacent fingertips
     */
    extractFeatures(keypoints: HandKeypoint[]): Float32Array {
        const raw = this.normalizeKeypoints(keypoints)
        const features = new Float32Array(FEATURE_SIZE)

        // Copy raw 63-d landmarks
        features.set(raw, 0)

        // Compute derived features only if we have valid landmarks
        if (keypoints.length < 21) return features

        const kp = keypoints
        const wrist = kp[WRIST]

        // --- Finger extension flags (indices 63-67) ---
        // For Index, Middle, Ring, Pinky, we check if the tip is farther from the MCP (knuckle)
        // than the PIP (first joint), and also farther from the wrist than the PIP.
        // This makes the extension checks fully rotation-invariant.
        const isFingerExtended = (tip: number, pip: number, mcp: number) => {
            const distTipMcp = euclidean(kp[tip], kp[mcp])
            const distPipMcp = euclidean(kp[pip], kp[mcp])
            const distTipWrist = euclidean(kp[tip], wrist)
            const distPipWrist = euclidean(kp[pip], wrist)
            const ratioMcp = distTipMcp / (distPipMcp * 1.2 || 1)
            const ratioWrist = distTipWrist / (distPipWrist || 1)
            return Math.min(1.0, Math.max(0.0, (ratioMcp + ratioWrist) / 2))
        }

        const RING_MCP = 13
        const PINKY_MCP = 17

        features[63] = isFingerExtended(INDEX_TIP, INDEX_PIP, INDEX_MCP)
        features[64] = isFingerExtended(MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP)
        features[65] = isFingerExtended(RING_TIP, RING_PIP, RING_MCP)
        features[66] = isFingerExtended(PINKY_TIP, PINKY_PIP, PINKY_MCP)
        
        // Thumb: Check if the distance from thumb tip to index MCP is greater than thumb IP to index MCP,
        // and also thumb tip is farther from the wrist than thumb IP.
        const thumbOutward = euclidean(kp[THUMB_TIP], kp[INDEX_MCP]) / (euclidean(kp[THUMB_IP], kp[INDEX_MCP]) * 1.05 || 1)
        const thumbRatioWrist = euclidean(kp[THUMB_TIP], wrist) / (euclidean(kp[THUMB_IP], wrist) || 1)
        const thumbScore = Math.min(1.0, Math.max(0.0, (thumbOutward + thumbRatioWrist) / 2))
        features[67] = thumbScore

        // --- Tip-to-wrist distances (indices 68-72), normalized by hand size ---
        const handSize = euclidean(kp[WRIST], kp[MIDDLE_MCP]) || 1
        features[68] = euclidean(kp[THUMB_TIP], kp[WRIST]) / handSize
        features[69] = euclidean(kp[INDEX_TIP], kp[WRIST]) / handSize
        features[70] = euclidean(kp[MIDDLE_TIP], kp[WRIST]) / handSize
        features[71] = euclidean(kp[RING_TIP], kp[WRIST]) / handSize
        features[72] = euclidean(kp[PINKY_TIP], kp[WRIST]) / handSize

        // --- Inter-finger distances (indices 73-77), normalized by hand size ---
        features[73] = euclidean(kp[THUMB_TIP], kp[INDEX_TIP]) / handSize
        features[74] = euclidean(kp[INDEX_TIP], kp[MIDDLE_TIP]) / handSize
        features[75] = euclidean(kp[MIDDLE_TIP], kp[RING_TIP]) / handSize
        features[76] = euclidean(kp[RING_TIP], kp[PINKY_TIP]) / handSize
        features[77] = euclidean(kp[INDEX_TIP], kp[PINKY_TIP]) / handSize

        return features
    }

    /**
     * Pad a legacy63-d feature vector to78-d by appending zeros for the derived features.
     * This allows old samples to still classify (with reduced accuracy for new features).
     */
    private padLegacyFeatures(data: number[] | Float32Array): Float32Array {
        if (data.length >= FEATURE_SIZE) return new Float32Array(data)
        const padded = new Float32Array(FEATURE_SIZE)
        padded.set(data, 0)
        return padded
    }

    async addSample(features: Float32Array, label: string) {
        const tf = await ensureTf()
        const embedding = tf.tensor1d(features)
        await this.knn.addExample(embedding, label)
        embedding.dispose()
    }

    async addSampleFromImage(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, label: string) {
        const keypoints = await this.detectHand(imageElement)
        if (keypoints.length > 0) {
            const features = this.extractFeatures(keypoints)
            const tf = await ensureTf()
            const embedding = tf.tensor1d(features)
            await this.knn.addExample(embedding, label)
            embedding.dispose()
        }
    }

    async addSampleFromKeypoints(keypoints: HandKeypoint[], label: string) {
        const features = this.extractFeatures(keypoints)
        const tf = await ensureTf()
        const embedding = tf.tensor1d(features)
        await this.knn.addExample(embedding, label)
        embedding.dispose()
    }

    async detectHand(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<HandKeypoint[]> {
        const landmarker = await this.ensureModel()
        // Video mode needs monotonically increasing timestamps for smooth tracking.
        const timestamp = typeof performance !== 'undefined' ? performance.now() : Date.now()
        const width =
            (imageElement as HTMLVideoElement).videoWidth ||
            (imageElement as HTMLCanvasElement).width ||
            (imageElement as HTMLImageElement).naturalWidth ||
            640
        const height =
            (imageElement as HTMLVideoElement).videoHeight ||
            (imageElement as HTMLCanvasElement).height ||
            (imageElement as HTMLImageElement).naturalHeight ||
            480
        const result = await landmarker.detectForVideo(imageElement, timestamp)
        if (result && result.landmarks && result.landmarks.length > 0) {
            const hand = result.landmarks[0]
            return hand.map((lm: any, i: number) => ({
                x: lm.x * width,
                y: lm.y * height,
                z: typeof lm.z === 'number' ? lm.z : 0,
                score: 1,
                name: LANDMARK_NAMES[i] || `landmark_${i}`,
            }))
        }
        return []
    }

    async predict(features: Float32Array, k = 3): Promise<HandPosePrediction | null> {
        const tf = await ensureTf()
        const embedding = tf.tensor1d(features)
        const result = await this.knn.predictClass(embedding, k)
        embedding.dispose()
        return result
    }

    async predictFromImage(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement, k = 3): Promise<HandPosePrediction | null> {
        const keypoints = await this.detectHand(imageElement)
        if (keypoints.length === 0) return null
        const features = this.extractFeatures(keypoints)
        const tf = await ensureTf()
        const embedding = tf.tensor1d(features)
        const result = await this.knn.predictClass(embedding, k)
        embedding.dispose()
        return result
    }

    /**
     * Rebuild a class from stored sample data (JSON-stringified number arrays).
     * Automatically pads legacy63-d vectors to78-d.
     */
    async rebuildClass(label: string, sampleDataStrings: string[], augment = false): Promise<number> {
        this.knn.clearClass(label)
        let loaded = 0
        for (const dataStr of sampleDataStrings) {
            try {
                if (!dataStr) continue
                const data = JSON.parse(dataStr) as number[]
                const features = this.padLegacyFeatures(data)
                if (augment) {
                    loaded += await this.addSampleAugmented(features, label)
                } else {
                    await this.addSample(features, label)
                    loaded++
                }
            } catch { /* skip bad sample */ }
        }
        return loaded
    }

    /**
     * Hand-pose augmentation — applies realistic variations to the feature vector:
     * 1. Original
     * 2. Wrist shift X (±5% of range)
     * 3. Wrist shift Y (±5% of range)
     * 4. Scale variation (0.95x — 1.05x)
     * 5. Joint jitter (±2% noise on all coordinates)
     */
    async addSampleAugmented(features: Float32Array, label: string): Promise<number> {
        let added = 0

        // 1. Original
        await this.addSample(features, label)
        added++

        // 2. Wrist shift X
        const shiftX = (Math.random() * 0.1 - 0.05)
        const shiftedX = new Float32Array(features)
        for (let i = 0; i < 63; i += 3) {
            shiftedX[i] = Math.max(0, Math.min(1, shiftedX[i] + shiftX))
        }
        await this.addSample(shiftedX, label)
        added++

        // 3. Wrist shift Y
        const shiftY = (Math.random() * 0.1 - 0.05)
        const shiftedY = new Float32Array(features)
        for (let i = 1; i < 63; i += 3) {
            shiftedY[i] = Math.max(0, Math.min(1, shiftedY[i] + shiftY))
        }
        await this.addSample(shiftedY, label)
        added++

        // 4. Scale variation
        const scale = 0.95 + Math.random() * 0.1
        const scaled = new Float32Array(features)
        for (let i = 0; i < 63; i += 3) {
            scaled[i] = Math.max(0, Math.min(1, (scaled[i] - 0.5) * scale + 0.5))
            scaled[i + 1] = Math.max(0, Math.min(1, (scaled[i + 1] - 0.5) * scale + 0.5))
        }
        await this.addSample(scaled, label)
        added++

        // 5. Joint jitter
        const jittered = new Float32Array(features)
        for (let i = 0; i < 63; i++) {
            jittered[i] = Math.max(0, Math.min(1, jittered[i] + (Math.random() * 0.04 - 0.02)))
        }
        // Copy derived features (extension flags, distances) — jitter the distances but not the binary flags
        for (let i = 68; i < 78; i++) {
            jittered[i] = Math.max(0, jittered[i] + (Math.random() * 0.06 - 0.03))
        }
        await this.addSample(jittered, label)
        added++

        return added
    }

    drawHand(canvas: HTMLCanvasElement, keypoints: HandKeypoint[], color?: string, options?: { readableLabels?: boolean }) {
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const drawColor = color || HAND_DRAW_COLOR
        const readableLabels = !!options?.readableLabels

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

        // Fingertip labels. For CSS-mirrored consumers (e.g. HandPoseClassifierPanel)
        // draw them inside the mirror transform as before so the double-mirror keeps them readable.
        // For unmirrored overlays (e.g. Drawing Canvas) use readableLabels to draw after the
        // transform at the mirrored x position so text stays right-reading.
        if (!readableLabels) {
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
        }

        ctx.restore()

        if (readableLabels) {
            const fingertips = [4, 8, 12, 16, 20]
            const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']
            ctx.font = 'bold 11px system-ui, sans-serif'
            ctx.textAlign = 'center'
            for (let i = 0; i < fingertips.length; i++) {
                const kp = keypoints[fingertips[i]]
                if (kp && kp.score > 0.3) {
                    const lx = canvas.width - kp.x
                    ctx.fillStyle = drawColor
                    ctx.fillText(fingerNames[i], lx, kp.y - 12)
                }
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
        this.detachWebGLHandlers()
        this.knn.dispose()
        if (this.handModel) {
            try {
                if (typeof this.handModel.close === 'function') this.handModel.close()
                else if (typeof this.handModel.dispose === 'function') this.handModel.dispose()
            } catch { /* ignore */ }
            this.handModel = null
        }
        this.modelPromise = null
    }
}
