/**
 * Centralized CDN script loader for Neura ML modules.
 * Ensures each library is loaded exactly once, with consistent deduplication.
 */

declare const window: Window & {
    tf?: any
    _tfLoaded?: boolean
    mobilenet?: any
    cocoSsd?: any
    poseDetection?: any
    handPoseDetection?: any
    use?: any
    speechCommands?: any
    yamnet?: any
}

const TF_VERSION = '4.20.0'
const MOBILENET_VERSION = '2.1.1'
const COCO_SSD_VERSION = '2.2.3'
const POSE_DETECTION_VERSION = '2.1.3'
const HAND_POSE_VERSION = '2.0.1'
const USE_VERSION = '1.3.3'
const SPEECH_COMMANDS_VERSION = '0.6.0'

function loadScript(src: string, retries = 2): Promise<void> {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`)
        if (existing) { resolve(); return }
        if (!navigator.onLine) {
            reject(new Error(`Failed to load: ${src} (no internet connection)`))
            return
        }
        const s = document.createElement('script')
        s.src = src
        s.onload = () => resolve()
        s.onerror = () => {
            s.remove()
            if (retries > 0) {
                setTimeout(() => {
                    loadScript(src, retries - 1).then(resolve, reject)
                }, 1000)
            } else {
                reject(new Error(`Failed to load: ${src}`))
            }
        }
        document.head.appendChild(s)
    })
}

let tfPromise: Promise<any> | null = null

export async function ensureTf(): Promise<any> {
    if (window.tf) return window.tf
    if (tfPromise) return tfPromise

    tfPromise = (async () => {
        try {
            await loadScript(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@${TF_VERSION}/dist/tf.min.js`)
            // Initialize the default backend (webgl) so inference works immediately
            await window.tf.ready()
            window._tfLoaded = true
            return window.tf
        } catch (e) {
            tfPromise = null
            throw e
        }
    })()

    return tfPromise
}

let mobilenetPromise: Promise<any> | null = null

export async function ensureMobileNet(): Promise<any> {
    await ensureTf()
    if (window.mobilenet) return window.mobilenet
    if (mobilenetPromise) return mobilenetPromise

    mobilenetPromise = (async () => {
        try {
            await loadScript(`https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@${MOBILENET_VERSION}/dist/mobilenet.min.js`)
            return window.mobilenet
        } catch (e) {
            mobilenetPromise = null
            throw e
        }
    })()

    return mobilenetPromise
}

let cocoSsdPromise: Promise<any> | null = null

export async function ensureCocoSsd(): Promise<any> {
    await ensureTf()
    if (window.cocoSsd) return window.cocoSsd
    if (cocoSsdPromise) return cocoSsdPromise

    cocoSsdPromise = (async () => {
        try {
            await loadScript(`https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@${COCO_SSD_VERSION}/dist/coco-ssd.min.js`)
            return window.cocoSsd
        } catch (e) {
            cocoSsdPromise = null
            throw e
        }
    })()

    return cocoSsdPromise
}

let poseDetectionPromise: Promise<any> | null = null

export async function ensurePoseDetection(): Promise<any> {
    await ensureTf()
    if (window.poseDetection) return window.poseDetection
    if (poseDetectionPromise) return poseDetectionPromise

    poseDetectionPromise = (async () => {
        try {
            await loadScript(`https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@${POSE_DETECTION_VERSION}/dist/pose-detection.min.js`)
            return window.poseDetection
        } catch (e) {
            poseDetectionPromise = null
            throw e
        }
    })()

    return poseDetectionPromise
}

let handPosePromise: Promise<any> | null = null

export async function ensureHandPose(): Promise<any> {
    await ensureTf()
    if (window.handPoseDetection) return window.handPoseDetection
    if (handPosePromise) return handPosePromise

    handPosePromise = (async () => {
        try {
            await loadScript(`https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose-detection@${HAND_POSE_VERSION}/dist/hand-pose-detection.min.js`)
            return window.handPoseDetection
        } catch (e) {
            handPosePromise = null
            throw e
        }
    })()

    return handPosePromise
}

let usePromise: Promise<any> | null = null

export async function ensureUSE(): Promise<any> {
    await ensureTf()
    if (window.use) return window.use
    if (usePromise) return usePromise

    usePromise = (async () => {
        try {
            await loadScript(`https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder@${USE_VERSION}/dist/universal-sentence-encoder.min.js`)
            return window.use
        } catch (e) {
            usePromise = null
            throw e
        }
    })()

    return usePromise
}

let speechCommandsPromise: Promise<any> | null = null

export async function ensureSpeechCommands(): Promise<any> {
    await ensureTf()
    if (window.speechCommands) return window.speechCommands
    if (speechCommandsPromise) return speechCommandsPromise

    speechCommandsPromise = (async () => {
        try {
            await loadScript(`https://cdn.jsdelivr.net/npm/@tensorflow-models/speech-commands@${SPEECH_COMMANDS_VERSION}/dist/speech-commands.min.js`)
            return window.speechCommands
        } catch (e) {
            speechCommandsPromise = null
            throw e
        }
    })()

    return speechCommandsPromise
}

let yamnetModelPromise: Promise<any> | null = null

export async function ensureYamNet(): Promise<any> {
    const tf = await ensureTf()
    if (window.yamnet) return window.yamnet
    if (yamnetModelPromise) return yamnetModelPromise

    yamnetModelPromise = (async () => {
        try {
            const model = await tf.loadGraphModel(
                'https://tfhub.dev/google/tfjs-model/yamnet/1/default/1',
                { fromTFHub: true }
            )
            window.yamnet = model
            return model
        } catch (e) {
            yamnetModelPromise = null
            throw e
        }
    })()

    return yamnetModelPromise
}
