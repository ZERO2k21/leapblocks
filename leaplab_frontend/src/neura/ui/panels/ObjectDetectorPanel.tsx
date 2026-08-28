import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { useCamera } from '../../hooks/useCamera'
import { ObjectDetector } from '../../ml/classifiers/ObjectDetector'
import { ObjectDetectionTrainer } from '../../ml/ObjectDetectionTrainer'
import type { DetectionTrainingState } from '../../ml/ObjectDetectionTrainer'
import { MAX_SAMPLES_PER_CLASS, type ClassData } from '../../types/neura.types'
import { useIsMobile } from '../../hooks/useResponsive'
import WorkflowIndicator from '../components/WorkflowIndicator'
import StatsBar from '../components/StatsBar'
import CaptureButton from '../components/CaptureButton'
import SampleGrid from '../components/SampleGrid'
import TrainPanel from './TrainPanel'
import AnnotatePanel from './AnnotatePanel'
import ImageDatasetBrowser from '../components/ImageDatasetBrowser'
import KaggleDatasetBrowser from '../components/KaggleDatasetBrowser'
import KaggleSettings from '../components/KaggleSettings'
import { getStoredCredentials, hasCredentials, type KaggleCredentials } from '../../ml/KaggleDatasetProvider'
import EvaluatePanel from './EvaluatePanel'
import { exportJSON, getExportSizeEstimate } from '../../ml/ModelExporter'

interface ObjectDetectorPanelProps {
    mode: UseNeuraProjectReturn
}

const OBJECT_COLORS: Record<string, string> = {
    person: '#7C3AED', car: '#3B82F6', cat: '#F97316', dog: '#10B981',
    bird: '#EC4899', chair: '#6366F1', bottle: '#06B6D4', keyboard: '#14B8A6',
    book: '#F59E0B', laptop: '#8B5CF6', 'cell phone': '#A855F7', tv: '#EF4444',
    sofa: '#0EA5E9', bed: '#D946EF', 'dining table': '#F59E0B', 'potted plant': '#22C55E',
    backpack: '#F97316', handbag: '#EC4899', suitcase: '#8B5CF6', umbrella: '#06B6D4',
    cup: '#14B8A6', bowl: '#A855F7', mouse: '#6366F1',
    remote: '#EF4444', microwave: '#F59E0B', refrigerator: '#06B6D4', oven: '#8B5CF6',
    toaster: '#EC4899', sink: '#14B8A6', toilet: '#22C55E', vase: '#F97316',
    clock: '#3B82F6', scissors: '#EF4444', 'teddy bear': '#F59E0B', 'hair drier': '#EC4899',
    toothbrush: '#A855F7', bicycle: '#10B981', motorcycle: '#F97316',
    bus: '#6366F1', truck: '#EF4444', train: '#06B6D4', boat: '#14B8A6',
    airplane: '#8B5CF6', 'traffic light': '#F59E0B', 'fire hydrant': '#EC4899',
    'stop sign': '#EF4444', 'parking meter': '#22C55E', bench: '#F97316',
    horse: '#8B5CF6', sheep: '#06B6D4', cow: '#14B8A6', elephant: '#6366F1',
    bear: '#3B82F6', zebra: '#10B981', giraffe: '#F59E0B',
    frisbee: '#EC4899', skis: '#A855F7', snowboard: '#F97316',
    'sports ball': '#EF4444', kite: '#8B5CF6', 'baseball bat': '#06B6D4',
    'baseball glove': '#14B8A6', skateboard: '#22C55E', surfboard: '#3B82F6',
    'tennis racket': '#F59E0B', 'wine glass': '#EC4899', fork: '#F97316',
    knife: '#EF4444', spoon: '#A855F7', banana: '#F59E0B',
    apple: '#EC4899', sandwich: '#10B981', orange: '#F97316',
    broccoli: '#22C55E', carrot: '#F97316', 'hot dog': '#EF4444',
    pizza: '#F59E0B', donut: '#EC4899', cake: '#A855F7',
}
const DEFAULT_COLOR = '#64748B'

function getColorForObject(label: string): string {
    return OBJECT_COLORS[label.toLowerCase()] || DEFAULT_COLOR
}

const COCO_TO_FRIENDLY: Record<string, string> = {
    'cell phone': 'phone',
    'potted plant': 'plant',
    'backpack': 'bag',
    'handbag': 'bag',
    'suitcase': 'bag',
    'bicycle': 'bike',
    'motorcycle': 'bike',
    'laptop': 'computer',
    'sports ball': 'ball',
    'dining table': 'table',
    'traffic light': 'light',
    'fire hydrant': 'hydrant',
    'stop sign': 'sign',
    'parking meter': 'meter',
    'teddy bear': 'teddy',
    'hair drier': 'dryer',
    'baseball bat': 'bat',
    'baseball glove': 'glove',
    'tennis racket': 'racket',
    'wine glass': 'glass',
    'hot dog': 'hotdog',
    'tv': 'tv',
    'remote': 'remote',
    'mouse': 'mouse',
    'keyboard': 'keyboard',
    'bed': 'bed',
    'couch': 'couch',
    'toilet': 'toilet',
    'sink': 'sink',
    'refrigerator': 'fridge',
    'microwave': 'microwave',
    'oven': 'oven',
    'toaster': 'toaster',
    'vase': 'vase',
    'scissors': 'scissors',
    'toothbrush': 'toothbrush',
}

function mapToUserClass(cocoLabel: string, userClasses: ClassData[]): string {
    if (!userClasses.length) return cocoLabel
    const lower = cocoLabel.toLowerCase()
    const friendly = COCO_TO_FRIENDLY[lower] || lower
    const match = userClasses.find(c => c.name.toLowerCase() === lower || c.name.toLowerCase() === friendly)
    return match ? match.name : cocoLabel
}

const DETECT_THROTTLE_MS = 300

export default function ObjectDetectorPanel({ mode }: ObjectDetectorPanelProps) {
    const isMobile = useIsMobile(768)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const testFileInputRef = useRef<HTMLInputElement>(null)
    const cameraOffUploadRef = useRef<HTMLInputElement>(null)
    const classifierRef = useRef(new ObjectDetector())
    const trainerRef = useRef(new ObjectDetectionTrainer())
    const animFrameRef = useRef<number>(0)
    const isPredictingRef = useRef(false)
    const rebuildAbortRef = useRef(0)
    const testCameraStartedRef = useRef(false)
    const removeDebounceRef = useRef<NodeJS.Timeout | null>(null)
    const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastDetectTimeRef = useRef(0)

    const [isLoadingModel, setIsLoadingModel] = useState(true)
    const [detections, setDetections] = useState<{ class: string; score: number; bbox: [number, number, number, number] }[]>([])
    const [uploadedImage, setUploadedImage] = useState<{ originalUrl: string; annotatedUrl: string | null; width: number; height: number } | null>(null)
    const [uploadedDetections, setUploadedDetections] = useState<{ class: string; score: number; bbox: [number, number, number, number] }[]>([])
    const [captureFps, setCaptureFps] = useState(15)
    const burstIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const handleCaptureRef = useRef<() => Promise<void>>(null)
    const [realtimeEnabled, setRealtimeEnabled] = useState(true)
    const [showBoxes, setShowBoxes] = useState(true)
    const [showOriginal, setShowOriginal] = useState(true)
    const [captureFlash, setCaptureFlash] = useState(false)
    const [savedMessage, setSavedMessage] = useState<string | null>(null)
    const [isDetecting, setIsDetecting] = useState(false)
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return !localStorage.getItem('neura-objectdetect-onboarding-seen')
    })
    const [inferenceTime, setInferenceTime] = useState(0)
    const [modelLoadError, setModelLoadError] = useState<string | null>(null)
    const [customModelTrained, setCustomModelTrained] = useState(() => mode.project?.modelTrained ?? false)
    const [useCustomModel, setUseCustomModel] = useState(() => mode.project?.modelTrained ?? false)
    const [isDragging, setIsDragging] = useState(false)

    // Sync model state when project changes (e.g., navigating back to test mode)
    useEffect(() => {
        if (mode.project?.modelTrained) {
            setCustomModelTrained(true)
            setUseCustomModel(true)
        }
    }, [mode.project?.modelTrained])
    const [isCapturing, setIsCapturing] = useState(false)
    const [collectTab, setCollectTab] = useState<'camera' | 'upload' | 'download'>('camera')
    const [downloadSource, setDownloadSource] = useState<'local' | 'kaggle'>('local')
    const [kaggleCredentials, setKaggleCredentials] = useState<KaggleCredentials | null>(() => getStoredCredentials())
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.5)
    const [scannedFrameUrl, setScannedFrameUrl] = useState<string | null>(null)

    const camera = useCamera({
        videoConstraints: { width: 640, height: 480, facingMode: 'user' }
    })

    const showFlash = useCallback(() => {
        setCaptureFlash(true)
        if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
        flashTimeoutRef.current = setTimeout(() => setCaptureFlash(false), 300)
    }, [])

    const showSaved = useCallback((msg: string) => {
        setSavedMessage(msg)
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSavedMessage(null), 2000)
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            camera.stopCamera()
            cancelAnimationFrame(animFrameRef.current)
            classifierRef.current.dispose()
            trainerRef.current.dispose()
            if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current)
            if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        }
    }, [])

    // Stop camera when leaving collect/test modes
    useEffect(() => {
        if (mode.mode !== 'collect' && mode.mode !== 'test') {
            camera.stopCamera()
            setDetections([])
        }
    }, [mode.mode])

    // Reset test camera ref when leaving test mode
    useEffect(() => {
        if (mode.mode !== 'test') testCameraStartedRef.current = false
    }, [mode.mode])

    // Load COCO-SSD model (with abort pattern)
    useEffect(() => {
        const thisBuild = ++rebuildAbortRef.current
        let cancelled = false
        setIsLoadingModel(true)
        setModelLoadError(null)
        classifierRef.current.loadModel()
            .then(() => {
                if (!cancelled && thisBuild === rebuildAbortRef.current) setIsLoadingModel(false)
            })
            .catch((e) => {
                console.error('[ObjectDetector] Failed to load COCO-SSD:', e)
                if (!cancelled && thisBuild === rebuildAbortRef.current) {
                    setIsLoadingModel(false)
                    setModelLoadError('Failed to load AI model. Please refresh and try again.')
                }
            })
        return () => { cancelled = true }
    }, [])

    // Detect from video frame
    const detectFrame = useCallback(async (manualScan = false): Promise<{ class: string; score: number; bbox: [number, number, number, number] }[]> => {
        if (!camera.videoRef.current || !camera.videoRef.current.srcObject) return []
        const video = camera.videoRef.current
        if (video.readyState < 2) return []
        try {
            const start = performance.now()
            let result: { class: string; score: number; bbox: [number, number, number, number] }[] = []

            // Prioritize canClassify (actual KNN state) over UI flags
            if (trainerRef.current.canClassify) {
                const customResult = await trainerRef.current.detect(video, 20, !manualScan)
                result = customResult.objects.map(o => ({ class: o.label, score: o.confidence, bbox: o.bbox }))
            } else if (useCustomModel && customModelTrained) {
                // Model was trained but KNN not ready (e.g., not enough samples per class)
                // Show empty rather than misleading COCO labels
                result = []
            } else {
                // Fall back to COCO-SSD — map labels to user classes, filter unmapped
                const cocoResult = await classifierRef.current.detect(video)
                const userClasses = mode.project?.classes || []
                result = cocoResult.objects
                    .map(o => ({ class: mapToUserClass(o.class, userClasses), score: o.confidence, bbox: o.bbox }))
                    .filter(o => userClasses.length === 0 || userClasses.some(c => c.name === o.class))
            }

            const elapsed = Math.round(performance.now() - start)
            setInferenceTime(elapsed)
            return result
        } catch (e) {
            console.warn('[ObjectDetector] Detection error:', e)
            return []
        }
    }, [useCustomModel, customModelTrained, mode.project?.classes])

    const drawDetections = useCallback((dets: { class: string; score: number; bbox: [number, number, number, number] }[], canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()
        ctx.scale(-1, 1)
        ctx.translate(-canvas.width, 0)
        dets.forEach((det) => {
            const [x, y, w, h] = det.bbox
            const color = getColorForObject(det.class)
            ctx.strokeStyle = color
            ctx.lineWidth = 3
            ctx.shadowColor = color
            ctx.shadowBlur = 8
            ctx.strokeRect(x, y, w, h)
            ctx.shadowBlur = 0
            const label = `${det.class} ${Math.round(det.score * 100)}%`
            ctx.font = 'bold 14px system-ui, sans-serif'
            const textWidth = ctx.measureText(label).width
            const labelY = Math.max(y - 8, 22)
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.roundRect(x, labelY - 20, textWidth + 16, 22, 6)
            ctx.fill()
            ctx.fillStyle = '#fff'
            ctx.textBaseline = 'middle'
            ctx.fillText(label, x + 8, labelY - 9)
        })
        ctx.restore()
    }, [])

    // Real-time detection loop (throttled)
    useEffect(() => {
        if (!camera.cameraOn || !realtimeEnabled || isLoadingModel) {
            cancelAnimationFrame(animFrameRef.current)
            return
        }
        lastDetectTimeRef.current = performance.now()
        const tick = () => {
            const now = performance.now()
            if (now - lastDetectTimeRef.current >= DETECT_THROTTLE_MS && !isPredictingRef.current) {
                lastDetectTimeRef.current = now
                isPredictingRef.current = true
                detectFrame().then(dets => {
                    setDetections(dets)
                    const filteredDets = dets.filter(det => det.score >= confidenceThreshold)
                    if (showBoxes && canvasRef.current && camera.videoRef.current) drawDetections(filteredDets, canvasRef.current, camera.videoRef.current)
                    else if (canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d')
                        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                    }
                    isPredictingRef.current = false
                })
            }
            animFrameRef.current = requestAnimationFrame(tick)
        }
        animFrameRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animFrameRef.current)
    }, [camera.cameraOn, realtimeEnabled, isLoadingModel, detectFrame, drawDetections, confidenceThreshold, showBoxes])

    // Test mode: enable real-time detection by default
    useEffect(() => {
        if (mode.mode !== 'test') {
            setScannedFrameUrl(null)
            setRealtimeEnabled(true)
            return
        }
        setRealtimeEnabled(true)
        setScannedFrameUrl(null)
        setUploadedImage(null)
        setUploadedDetections([])
    }, [mode.mode])

    const captureFrameFromVideo = useCallback((video: HTMLVideoElement): string => {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = video.videoWidth
        tempCanvas.height = video.videoHeight
        const ctx = tempCanvas.getContext('2d')!
        ctx.scale(-1, 1)
        ctx.translate(-tempCanvas.width, 0)
        ctx.drawImage(video, 0, 0)
        return tempCanvas.toDataURL('image/jpeg', 0.92)
    }, [])

    const annotateImage = useCallback(async (imageUrl: string, dets: { class: string; score: number; bbox: [number, number, number, number] }[], imgWidth: number, imgHeight: number): Promise<string> => {
        const canvas = document.createElement('canvas')
        canvas.width = imgWidth
        canvas.height = imgHeight
        const ctx = canvas.getContext('2d')!
        const img = new Image()
        img.src = imageUrl
        if (!img.complete) await new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve() })
        ctx.drawImage(img, 0, 0, imgWidth, imgHeight)
        dets.filter(d => d.score >= confidenceThreshold).forEach((det) => {
            const [x, y, w, h] = det.bbox
            const color = getColorForObject(det.class)
            ctx.strokeStyle = color
            ctx.lineWidth = 3
            ctx.shadowColor = color
            ctx.shadowBlur = 8
            ctx.strokeRect(x, y, w, h)
            ctx.shadowBlur = 0
            const label = `${det.class} ${Math.round(det.score * 100)}%`
            ctx.font = 'bold 14px system-ui, sans-serif'
            const textWidth = ctx.measureText(label).width
            const labelY = Math.max(y - 8, 22)
            ctx.fillStyle = color
            ctx.beginPath()
            ctx.roundRect(x, labelY - 20, textWidth + 16, 22, 6)
            ctx.fill()
            ctx.fillStyle = '#fff'
            ctx.textBaseline = 'middle'
            ctx.fillText(label, x + 8, labelY - 9)
        })
        return canvas.toDataURL('image/png')
    }, [confidenceThreshold])

    const runDetectionOnImage = useCallback(async (imageUrl: string, width: number, height: number): Promise<{ class: string; score: number; bbox: [number, number, number, number] }[]> => {
        const img = new Image()
        img.src = imageUrl
        if (!img.complete) await new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve() })
        if (!img.naturalWidth) return []
        const imgCanvas = document.createElement('canvas')
        imgCanvas.width = width
        imgCanvas.height = height
        imgCanvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        try {
            const start = performance.now()
            let result: { class: string; score: number; bbox: [number, number, number, number] }[] = []
            if (trainerRef.current.canClassify) {
                const customResult = await trainerRef.current.detect(img, 20, false)
                result = customResult.objects.map(o => ({ class: o.label, score: o.confidence, bbox: o.bbox }))
            } else if (useCustomModel && customModelTrained) {
                result = []
            } else {
                const cocoResult = await classifierRef.current.detect(imgCanvas as any)
                const userClasses = mode.project?.classes || []
                result = cocoResult.objects
                    .map(o => ({ class: mapToUserClass(o.class, userClasses), score: o.confidence, bbox: o.bbox }))
                    .filter(o => userClasses.length === 0 || userClasses.some(c => c.name === o.class))
            }
            setInferenceTime(Math.round(performance.now() - start))
            return result
        } catch {
            return []
        }
    }, [useCustomModel, customModelTrained, mode.project?.classes])

    const handleScan = useCallback(async () => {
        if (isLoadingModel || isDetecting) return
        setIsDetecting(true)
        try {
            if (camera.cameraOn && camera.videoRef.current && camera.videoRef.current.readyState >= 2) {
                const frameUrl = captureFrameFromVideo(camera.videoRef.current)
                setScannedFrameUrl(frameUrl)
                const dets = await runDetectionOnImage(frameUrl, camera.videoRef.current.videoWidth, camera.videoRef.current.videoHeight)
                setDetections(dets)
                const annotatedUrl = await annotateImage(frameUrl, dets, camera.videoRef.current.videoWidth, camera.videoRef.current.videoHeight)
                setUploadedImage({ originalUrl: frameUrl, annotatedUrl, width: camera.videoRef.current.videoWidth, height: camera.videoRef.current.videoHeight })
                setUploadedDetections(dets)
                setShowOriginal(true)
            } else if (scannedFrameUrl) {
                const dets = await runDetectionOnImage(scannedFrameUrl, uploadedImage?.width || 640, uploadedImage?.height || 480)
                setDetections(dets)
                setUploadedDetections(dets)
                if (uploadedImage) {
                    const annotatedUrl = await annotateImage(scannedFrameUrl, dets, uploadedImage.width, uploadedImage.height)
                    setUploadedImage({ ...uploadedImage, annotatedUrl })
                }
            }
            showFlash()
        } catch (e) {
            console.warn('[ObjectDetector] Scan error:', e)
            showSaved('⚠️ Detection failed. Please try again.')
        }
        setIsDetecting(false)
    }, [isLoadingModel, isDetecting, camera.cameraOn, isLoadingModel, scannedFrameUrl, uploadedImage, captureFrameFromVideo, runDetectionOnImage, annotateImage, showFlash, showSaved])

    const resetScan = useCallback(() => {
        setScannedFrameUrl(null)
        setDetections([])
        setUploadedImage(null)
        setUploadedDetections([])
        setShowOriginal(true)
    }, [])

    const handleCapture = async () => {
        if (!camera.videoRef.current || !mode.selectedClassId || !camera.cameraOn || isCapturing) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            showSaved('⚠️ Sample limit reached! (20 per class)')
            return
        }
        setIsCapturing(true)
        try {
            const video = camera.videoRef.current
            const tempCanvas = document.createElement('canvas')
            // Resize to max 640px on longest side for smaller file size
            const maxDim = 640
            const scale = Math.min(maxDim / video.videoWidth, maxDim / video.videoHeight, 1)
            tempCanvas.width = Math.floor(video.videoWidth * scale)
            tempCanvas.height = Math.floor(video.videoHeight * scale)
            const ctx = tempCanvas.getContext('2d')!
            ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height)
            // Use JPEG with 0.7 quality for much smaller file size
            const imageData = tempCanvas.toDataURL('image/jpeg', 0.7)
            const added = mode.addSample(mode.selectedClassId, { type: 'image', data: imageData })
            if (!added) {
                showSaved('⚠️ Sample limit reached! (20 per class)')
                return
            }
            showFlash()
            const className = mode.getSelectedClass()?.name || 'class'
            showSaved(`📸 Saved to ${className}! (${mode.getSelectedClass()?.samples.length || 0} total)`)
        } finally {
            setIsCapturing(false)
        }
    }

    handleCaptureRef.current = handleCapture

    const startBurstCapture = useCallback(() => {
        if (!mode.selectedClassId || !camera.cameraOn) return
        burstIntervalRef.current = setInterval(() => {
            handleCaptureRef.current?.()
        }, 1000 / captureFps)
    }, [captureFps, mode.selectedClassId, camera.cameraOn])

    const stopBurstCapture = useCallback(() => {
        if (burstIntervalRef.current) {
            clearInterval(burstIntervalRef.current)
            burstIntervalRef.current = null
        }
    }, [])

    useEffect(() => {
        return () => { stopBurstCapture() }
    }, [])

    const handleUpload = async (eOrFiles: React.ChangeEvent<HTMLInputElement> | FileList | File[]) => {
        let files: FileList | File[] | null = null
        if (eOrFiles instanceof FileList || Array.isArray(eOrFiles)) {
            files = eOrFiles
        } else if (eOrFiles && 'target' in eOrFiles) {
            files = eOrFiles.target.files
        }
        if (!files || files.length === 0) return
        if (isLoadingModel) { alert('Model is still loading. Please wait.'); return }

        // Auto-select first class if none selected
        if (!mode.selectedClassId && mode.project && mode.project.classes.length > 0) {
            mode.setSelectedClassId(mode.project.classes[0].id)
        }

        // If multiple files are uploaded/dragged, bulk save them directly as samples to the selected class
        if (files.length > 1) {
            if (!mode.selectedClassId) {
                alert('Please create a class first before uploading images.')
                return
            }
            const selectedClass = mode.getSelectedClass()
            if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
                showSaved('⚠️ Sample limit reached! (20 per class)')
                if (fileInputRef.current) fileInputRef.current.value = ''; if (testFileInputRef.current) testFileInputRef.current.value = ''
                return
            }
            let successCount = 0
            let limitReached = false

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                if (!file || !file.type.startsWith('image/')) continue

                const currentClass = mode.getSelectedClass()
                if (currentClass && currentClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
                    limitReached = true
                    break
                }

                const dataUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.readAsDataURL(file)
                })

                // Resize image before saving
                const img = new Image()
                img.src = dataUrl
                await new Promise<void>((resolve) => { img.onload = () => resolve(); setTimeout(resolve, 3000) })
                
                if (img.complete && img.naturalWidth > 0) {
                    const maxDim = 640
                    const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1)
                    const canvas = document.createElement('canvas')
                    canvas.width = Math.floor(img.naturalWidth * scale)
                    canvas.height = Math.floor(img.naturalHeight * scale)
                    const ctx = canvas.getContext('2d')!
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                    const resizedUrl = canvas.toDataURL('image/jpeg', 0.7)
                    
                    const saved = mode.addSample(mode.selectedClassId, { type: 'image', data: resizedUrl })
                    if (saved) {
                        successCount++
                    } else {
                        limitReached = true
                        break
                    }
                }
            }
            
            const className = mode.getSelectedClass()?.name || 'class'
            if (successCount > 0) {
                showSaved(`📂 Saved ${successCount} image(s) to ${className}! (${mode.getSelectedClass()?.samples.length || 0} total)`)
            }
            if (limitReached) {
                showSaved('⚠️ Sample limit reached! (20 per class)')
            }
            if (fileInputRef.current) fileInputRef.current.value = ''; if (testFileInputRef.current) testFileInputRef.current.value = ''
            return
        }
        const file = files[0]
        if (!file || !file.type.startsWith('image/')) return
        const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
        })

        // In collect mode: save directly as a training sample (like multi-file upload)
        if (mode.mode === 'collect') {
            if (!mode.selectedClassId) {
                showSaved('⚠️ Create a class first, then upload images')
                if (fileInputRef.current) fileInputRef.current.value = ''; if (testFileInputRef.current) testFileInputRef.current.value = ''; if (cameraOffUploadRef.current) cameraOffUploadRef.current.value = ''
                return
            }
            const selectedClass = mode.getSelectedClass()
            if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
                showSaved('⚠️ Sample limit reached! (20 per class)')
                if (fileInputRef.current) fileInputRef.current.value = ''; if (testFileInputRef.current) testFileInputRef.current.value = ''; if (cameraOffUploadRef.current) cameraOffUploadRef.current.value = ''
                return
            }
            const img = new Image()
            img.src = dataUrl
            await new Promise<void>((resolve) => { img.onload = () => resolve(); setTimeout(resolve, 3000) })
            if (img.complete && img.naturalWidth > 0) {
                const maxDim = 640
                const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1)
                const canvas = document.createElement('canvas')
                canvas.width = Math.floor(img.naturalWidth * scale)
                canvas.height = Math.floor(img.naturalHeight * scale)
                const ctx = canvas.getContext('2d')!
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                const resizedUrl = canvas.toDataURL('image/jpeg', 0.7)
                const saved = mode.addSample(mode.selectedClassId, { type: 'image', data: resizedUrl })
                if (saved) {
                    const className = mode.getSelectedClass()?.name || 'class'
                    showSaved(`📂 Saved to ${className}! (${mode.getSelectedClass()?.samples.length || 0} total)`)
                } else {
                    showSaved('⚠️ Sample limit reached! (20 per class)')
                }
            }
            if (fileInputRef.current) fileInputRef.current.value = ''; if (testFileInputRef.current) testFileInputRef.current.value = ''; if (cameraOffUploadRef.current) cameraOffUploadRef.current.value = ''
            return
        }

        // In test mode: store uploaded image, wait for user to click Scan
        camera.stopCamera()
        const img = new Image()
        img.src = dataUrl
        await new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
            setTimeout(() => resolve(), 5000)
        })
        if (img.complete && img.naturalWidth > 0) {
            setScannedFrameUrl(dataUrl)
            setUploadedImage({ originalUrl: dataUrl, annotatedUrl: null, width: img.naturalWidth, height: img.naturalHeight })
            setShowOriginal(true)
        }
        if (fileInputRef.current) fileInputRef.current.value = ''; if (testFileInputRef.current) testFileInputRef.current.value = ''
    }

    // Register global window drag-and-drop upload handler
    useEffect(() => {
        if (mode.mode === 'collect') {
            const selectedClass = mode.getSelectedClass();
            (window as any).__activeUpload = {
                handler: (files: FileList) => {
                    if (!mode.selectedClassId && mode.project && mode.project.classes.length > 0) {
                        mode.setSelectedClassId(mode.project.classes[0].id)
                    }
                    handleUpload(files)
                },
                label: selectedClass ? `Class: ${selectedClass.name}` : 'Training Images'
            }
        } else if (mode.mode === 'test') {
            (window as any).__activeUpload = {
                handler: (files: FileList) => {
                    handleUpload(files)
                },
                label: 'Test Image'
            }
        } else {
            (window as any).__activeUpload = null
        }
        return () => { (window as any).__activeUpload = null }
    }, [mode.mode, mode.selectedClassId, mode.project])

    const handleSaveUploadedImage = useCallback(async () => {
        if (!uploadedImage || !mode.selectedClassId) return
        // Resize image before saving for smaller file size
        const img = new Image()
        img.src = uploadedImage.originalUrl
        await new Promise<void>((resolve) => { img.onload = () => resolve(); setTimeout(resolve, 3000) })
        const maxDim = 640
        const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(img.naturalWidth * scale)
        canvas.height = Math.floor(img.naturalHeight * scale)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const resizedUrl = canvas.toDataURL('image/jpeg', 0.7)
        const saved = mode.addSample(mode.selectedClassId, { type: 'image', data: resizedUrl })
        if (!saved) { showSaved('⚠️ Sample limit reached! (20 per class)'); return }
        const className = mode.getSelectedClass()?.name || 'class'
        showSaved(`📂 Saved to ${className}! (${mode.getSelectedClass()?.samples.length || 0} total)`)
    }, [uploadedImage, mode, showSaved])

    const handleResetUpload = () => { setUploadedImage(null); setUploadedDetections([]); setShowOriginal(true); camera.startCamera() }

    const handleRemoveSample = useCallback((classId: string, sampleId: string) => {
        mode.removeSample(classId, sampleId)
        if (removeDebounceRef.current) clearTimeout(removeDebounceRef.current)
        removeDebounceRef.current = setTimeout(() => {
            // No KNN rebuild needed for object detection — COCO-SSD is pre-trained
        }, 300)
    }, [mode.removeSample])

    const selectedClass = mode.getSelectedClass()
    const hasUploadedImage = !!uploadedImage
    const allDetections = hasUploadedImage ? uploadedDetections : detections
    const currentDetections = allDetections.filter(det => det.score >= confidenceThreshold)
    const totalSamples = mode.getTotalSamples()
    const atSampleLimit = selectedClass ? selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS : false
    const canAddSamples = selectedClass && !atSampleLimit

    const handleExportTestReport = useCallback(() => {
        const report = {
            projectName: mode.project?.name || 'Untitled',
            projectType: 'object-detection',
            exportedAt: new Date().toISOString(),
            testResults: {
                detections: currentDetections.map(d => ({ class: d.class, confidence: d.score, bbox: d.bbox })),
                totalObjectsFound: currentDetections.length,
                inferenceTime
            },
            projectSummary: {
                totalSamples: mode.getTotalSamples(),
                totalClasses: mode.project?.classes.length || 0,
                classes: mode.project?.classes.map(c => ({ name: c.name, sampleCount: c.samples.length })),
                accuracy: mode.accuracy
            }
        }
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${(mode.project?.name || 'report').replace(/[^a-z0-9]/gi, '_')}_test_report.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }, [mode, currentDetections, inferenceTime])

    // Collect mode
    const renderCollectMode = () => (
        <div className="flex-1 flex flex-col overflow-auto">
            {/* Header */}
            <div className="text-center px-5 pt-3 pb-2 shrink-0 animate-fade-in">
                <h2 className="text-[20px] font-extrabold text-[#630ed4] mb-[2px]">🔍 Object Finder!</h2>
                <p className="text-[11px] text-gray-500">Point your camera at things — AI will find and name them! 🎯</p>
            </div>

            <div className="px-5 shrink-0">
                <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={totalSamples >= 4} />
            </div>

            {/* Horizontal Split Layout */}
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4 flex-1 min-h-0 ${isMobile ? 'py-2.5 px-3' : 'py-2.5 px-5'} overflow-auto`}>
                {/* Left - Camera / Canvas */}
                <div className={`flex-1 flex flex-col gap-2.5 min-w-0 ${isMobile ? 'min-h-[40vh]' : 'min-h-0'}`}>
                    {/* Camera tab content */}
                    {collectTab === 'camera' && (
                        <>
                            {/* Camera error */}
                            {camera.cameraError && !camera.cameraOn && (
                                <div className="flex flex-col items-center justify-center bg-white/85 backdrop-blur-md rounded-2xl p-5 border border-gray-200">
                                    <span className="text-[36px] mb-2">🚫</span>
                                    <h3 className="text-sm font-bold text-[#131b2e] mb-1.5">Camera Access Needed</h3>
                                    <p className="text-[11px] text-gray-500 mb-3">{camera.cameraError}</p>
                                    <div className="flex gap-2.5">
                                        <button onClick={camera.startCamera} className="px-4 py-2 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-[11px] font-bold border-none cursor-pointer">Try Again</button>
                                        <button onClick={() => { camera.setCameraError(null); fileInputRef.current?.click() }} className="px-4 py-2 bg-[#f5f3ff] text-[#630ed4] rounded-xl text-[11px] font-bold border-none cursor-pointer">Upload Only</button>
                                    </div>
                                </div>
                            )}

                            {/* Camera feed */}
                            <div className={`relative rounded-2xl overflow-hidden bg-[#1e1b4b] w-full flex-1 min-h-0 ${camera.cameraOn ? 'flex' : 'hidden'}`}>
                                <video ref={camera.videoRef} autoPlay playsInline muted className="w-full h-full object-contain -scale-x-100" />
                                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none -scale-x-100" />
                                {captureFlash && <div className="absolute inset-0 bg-white/50 animate-fade-in" />}
                                <div className="absolute top-2 left-2 flex items-center gap-1.25 px-2 py-1 bg-black/40 backdrop-blur-md rounded-md">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse" />
                                    <span className="text-white text-[9px] font-bold">🔍 LIVE</span>
                                </div>
                                <div className="absolute top-2 right-2">
                                    <button onClick={camera.toggleCamera} className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold bg-[#d1fae5] text-[#006c44] border-none cursor-pointer">📷 On</button>
                                </div>
                                {selectedClass && (
                                    <div className="absolute bottom-[60px] left-2 px-2.5 py-1.25 rounded-md text-white text-[10px] font-bold" style={{ background: `${selectedClass.color}CC` }}>{selectedClass.name}</div>
                                )}
                                {currentDetections.length > 0 && (
                                    <div className="absolute bottom-[60px] right-2 px-2 py-1 bg-black/50 rounded-md">
                                        <span className="text-white text-[9px] font-bold">🎯 {currentDetections.length} found</span>
                                    </div>
                                )}
                                {/* Capture button */}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-1.5 py-1 px-2.5 bg-black/40 backdrop-blur-md rounded-lg">
                                        <span className="text-[9px] font-bold text-white/70">FPS</span>
                                        <input
                                            type="range"
                                            min={5}
                                            max={30}
                                            step={1}
                                            value={captureFps}
                                            onChange={(e) => setCaptureFps(Number(e.target.value))}
                                            className="w-14 h-1 accent-white"
                                        />
                                        <span className="text-[10px] font-bold text-white w-4 text-center">{captureFps}</span>
                                    </div>
                                    <CaptureButton
                                        onClick={handleCapture}
                                        onMouseDown={startBurstCapture}
                                        onMouseUp={stopBurstCapture}
                                        onMouseLeave={stopBurstCapture}
                                        onTouchStart={startBurstCapture}
                                        onTouchEnd={stopBurstCapture}
                                        disabled={!canAddSamples || isCapturing}
                                        label={isCapturing ? '📸 Captured!' : atSampleLimit ? 'Max Reached' : 'Hold to Record 📸'}
                                        icon="camera"
                                        color={selectedClass?.color || '#630ed4'}
                                        pulse={!isCapturing && !!canAddSamples}
                                        size="md"
                                    />
                                </div>
                            </div>

                            {/* Camera off placeholder */}
                            {!camera.cameraOn && !camera.cameraError && (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                                    onDrop={async (e) => {
                                        e.preventDefault()
                                        setIsDragging(false)
                                        if (!mode.selectedClassId) {
                                            showSaved('⚠️ Select a class first, then drop images')
                                            return
                                        }
                                        if (e.dataTransfer.files.length > 0) await handleUpload(e.dataTransfer.files)
                                    }}
                                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-7 px-5 text-center flex-1 min-h-0 transition-all duration-200 ${isDragging ? 'border-[#630ed4] bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe]' : 'border-gray-200 bg-white/70'}`}
                                >
                                    <div className={`${isDragging ? 'pointer-events-none' : 'pointer-events-auto'} contents`}>
                                        <span className={`text-[36px] mb-2 transition-transform duration-200 block ${isDragging ? 'scale-125' : 'scale-100'}`}>{isDragging ? '📥' : '🔍'}</span>
                                        <h2 className="text-[15px] font-extrabold text-[#131b2e] mb-1">{isDragging ? 'Drop Image Files Here!' : 'Camera is off'}</h2>
                                        <p className="text-[11px] text-gray-500 mb-3">{isDragging ? 'Release to upload as samples' : 'Start camera or drag images to collect samples'}</p>
                                        <div className="flex gap-2">
                                            <button onClick={camera.startCamera} className="px-4 py-2 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-[11px] font-bold border-none cursor-pointer">📷 Turn On Camera</button>
                                            <button onClick={() => cameraOffUploadRef.current?.click()} className="px-4 py-2 bg-white text-[#630ed4] rounded-xl text-[11px] font-bold border-2 border-[#630ed4] cursor-pointer transition-all duration-200">📂 Upload</button>
                                        </div>
                                    </div>
                                    <input ref={cameraOffUploadRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                                </div>
                            )}

                            {/* Controls */}
                            <div className="flex items-center gap-1.5 flex-wrap justify-center shrink-0">
                                <button onClick={camera.toggleCamera} disabled={isLoadingModel} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border-none cursor-pointer ${camera.cameraOn ? 'bg-[#d1fae5] text-[#006c44]' : 'bg-[#f5f3ff] text-[#4a4455]'}`}>
                                    {camera.cameraOn ? '📷 Stop' : '📷 Start'}
                                </button>
                                {camera.cameraOn && !realtimeEnabled && (
                                    <button onClick={handleScan} disabled={isLoadingModel || isDetecting} className="px-3 py-1.5 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-lg text-[10px] font-bold border-none cursor-pointer">
                                        {isDetecting ? '⏳...' : '🔍 Scan'}
                                    </button>
                                )}
                                <button onClick={() => fileInputRef.current?.click()} disabled={isLoadingModel} className="px-3 py-1.5 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-lg text-[10px] font-bold border-none cursor-pointer">📂 Upload</button>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                            </div>
                        </>
                    )}

                    {/* Upload tab content - dedicated upload area for collect mode */}
                    {collectTab === 'upload' && (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                            onDrop={async (e) => {
                                e.preventDefault()
                                setIsDragging(false)
                                if (!mode.selectedClassId) {
                                    showSaved('⚠️ Select a class first, then drop images')
                                    return
                                }
                                if (e.dataTransfer.files.length > 0) await handleUpload(e.dataTransfer.files)
                            }}
                            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-7 px-5 text-center flex-1 min-h-0 transition-all duration-200 cursor-pointer ${isDragging ? 'border-[#630ed4] bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe]' : 'border-gray-200 bg-white/70'}`}
                            onClick={() => { if (!isDragging) cameraOffUploadRef.current?.click() }}
                        >
                            <div className="pointer-events-none flex flex-col items-center">
                                <span className={`text-[36px] mb-2 transition-transform duration-200 block ${isDragging ? 'scale-125' : 'scale-100'}`}>{isDragging ? '📥' : '📂'}</span>
                                <h2 className="text-[15px] font-extrabold text-[#131b2e] mb-1">{isDragging ? 'Drop Images Here!' : 'Upload Training Images'}</h2>
                                <p className="text-[11px] text-gray-500 mb-3">{isDragging ? 'Release to save as samples' : `Click or drag images to save as ${selectedClass?.name || 'class'} samples`}</p>
                                <div className="px-4 py-2 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-[11px] font-bold">
                                    📂 Choose Images
                                </div>
                                {selectedClass && (
                                    <p className="text-[10px] text-[#630ed4] mt-2.5 font-semibold">
                                        Saving to: {selectedClass.name} ({selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS})
                                    </p>
                                )}
                            </div>
                            <input ref={cameraOffUploadRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" onClick={(e) => e.stopPropagation()} />
                        </div>
                    )}

                    {/* Download tab content */}
                    {collectTab === 'download' && (
                        <div className="flex-1 flex flex-col gap-2.5 min-h-0">
                            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 shrink-0">
                                <button onClick={() => setDownloadSource('local')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-[13px] font-semibold border-none cursor-pointer transition-all duration-200 ${downloadSource === 'local' ? 'bg-white text-[#630ed4] shadow-sm' : 'bg-transparent text-gray-500'}`}>📁 Local</button>
                                <button onClick={() => setDownloadSource('kaggle')} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-[13px] font-semibold border-none cursor-pointer transition-all duration-200 ${downloadSource === 'kaggle' ? 'bg-white text-[#630ed4] shadow-sm' : 'bg-transparent text-gray-500'}`}>🔍 Kaggle</button>
                            </div>
                            <div className="flex-1 min-h-0 overflow-hidden">
                                {downloadSource === 'local' ? (
                                    <ImageDatasetBrowser mode={mode} onImagesAdded={(count) => showSaved(`📥 Added ${count} images!`)} />
                                ) : kaggleCredentials ? (
                                    <KaggleDatasetBrowser mode={mode} credentials={kaggleCredentials} onImagesAdded={(count) => showSaved(`📥 Added ${count} images from Kaggle!`)} />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center py-10 px-8 text-center">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f3f0ff] to-[#ede9fe] flex items-center justify-center mb-6 border border-[#e0d5ff]/60">
                                            <span className="text-[36px]">🔍</span>
                                        </div>
                                        <h3 className="text-[20px] font-bold text-gray-900 mb-2">Connect Kaggle</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed max-w-[260px] mb-7">Search and download real images from Kaggle's free public datasets</p>
                                        <KaggleSettings compact onCredentialsSaved={() => setKaggleCredentials(getStoredCredentials())} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right - Tabs, Tips, Stats, Detections, Samples */}
                <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-y-auto px-1">
                    {/* Collect sub-tabs */}
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 shrink-0">
                        {[
                            { id: 'camera' as const, label: 'Camera', emoji: '📷' },
                            { id: 'upload' as const, label: 'Upload', emoji: '📂' },
                            { id: 'download' as const, label: 'Download', emoji: '📥' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setCollectTab(tab.id)
                                    if (tab.id === 'camera' && !camera.cameraOn) camera.startCamera()
                                    if (tab.id !== 'camera' && camera.cameraOn) camera.stopCamera()
                                    if (tab.id === 'upload') setDetections([])
                                }}
                                className={`flex items-center justify-center gap-1.5 py-3 px-4 rounded-lg text-[13px] font-semibold flex-1 border-none cursor-pointer transition-all duration-200 ${
                                    collectTab === tab.id ? 'bg-white text-[#630ed4] shadow-sm' : 'bg-transparent text-gray-500'
                                }`}
                            >
                                <span>{tab.emoji}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tips */}
                    <div className="bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-xl p-4 border border-[#630ed4]/10 shrink-0">
                        <p className="text-xs font-bold text-[#630ed4] mb-2.5 uppercase tracking-wider">💡 TIPS</p>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[13px] text-[#4a4455]">• Point camera at objects</span>
                            <span className="text-[13px] text-[#4a4455]">• Good lighting helps</span>
                            <span className="text-[13px] text-[#4a4455]">• Capture to save detections</span>
                        </div>
                    </div>

                    {/* Detected objects */}
                    {currentDetections.length > 0 && (
                        <div className="bg-white/85 rounded-xl p-4 border border-gray-200 shrink-0">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-[#131b2e]">🎯 Detected</h3>
                                <span className="text-xs font-bold bg-[#f5f3ff] py-1 px-2.5 rounded-md text-[#630ed4]">{currentDetections.length}</span>
                            </div>
                            <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
                                {currentDetections.map((det, i) => (
                                    <div key={i} className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-[#faf9ff]">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getColorForObject(det.class) }} />
                                        <span className="text-[13px] font-semibold text-[#131b2e] flex-1 capitalize">{det.class}</span>
                                        <span className="text-xs font-bold py-0.5 px-2 rounded-md text-white" style={{ background: getColorForObject(det.class) }}>{Math.round(det.score * 100)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <StatsBar compact totalClasses={mode.project?.classes.length || 0} totalImages={mode.getTotalSamples()} imagesPerClass={(mode.project?.classes.length || 0) > 0 ? Math.round(mode.getTotalSamples() / (mode.project?.classes.length || 1)) : 0} recommended={10} />

                    {/* Collected samples */}
                    {selectedClass && selectedClass.samples.length > 0 && (
                        <div className="bg-white/85 rounded-xl p-4 border border-gray-200 flex-1 min-h-0 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-3 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: selectedClass.color }} />
                                    <h3 className="text-sm font-bold text-[#131b2e]">{selectedClass.name}</h3>
                                </div>
                                <span className={`text-xs font-bold py-1 px-2.5 rounded-md ${atSampleLimit ? 'bg-[#fef3c7] text-[#c32c00]' : 'bg-[#f5f3ff] text-[#4a4455]'}`}>{selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}</span>
                            </div>
                            <div className="flex-1 min-h-0 overflow-hidden">
                                <SampleGrid samples={selectedClass.samples} type="image" onRemove={(id) => handleRemoveSample(selectedClass.id, id)} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    // Test mode
    const renderTestMode = () => (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="text-center px-5 pt-3 pb-2 shrink-0 animate-fade-in">
                <h2 className="text-[20px] font-extrabold text-[#630ed4] mb-[2px]">🧪 Test Your Finder!</h2>
                <p className="text-[11px] text-gray-500">Try different objects and see what AI can find! 🕵️</p>
            </div>

            <div className="px-5 shrink-0">
                <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={totalSamples >= 4} />
            </div>

            {/* Model status */}
            {isLoadingModel && (
                <div className="flex items-center gap-2 py-2 px-3 bg-[#f5f3ff] rounded-xl border border-[#630ed4]/15 mx-5 mt-2 shrink-0">
                    <div className="w-3.5 h-3.5 border-2 border-[#630ed4] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[11px] font-bold text-[#630ed4]">Loading model... ⏳</span>
                </div>
            )}
            {modelLoadError && (
                <div className="flex items-center gap-2 py-2 px-3 bg-red-50 rounded-xl border border-red-200 mx-5 mt-2 shrink-0">
                    <span className="text-sm">❌</span>
                    <span className="text-[11px] font-bold text-red-900">{modelLoadError}</span>
                </div>
            )}

            {/* Horizontal Split Layout */}
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4 flex-1 min-h-0 ${isMobile ? 'py-2.5 px-3' : 'py-2.5 px-5'} overflow-hidden`}>
                {/* Left - Camera / Uploaded Image */}
                <div className={`flex-1 flex flex-col gap-2.5 min-w-0 ${isMobile ? 'min-h-[40vh]' : 'min-h-0'}`}>
                    {/* Camera / Image feed */}
                    <div className="relative rounded-2xl overflow-hidden bg-[#1e1b4b] w-full flex-1 min-h-0">
                        {/* Live camera feed (shown only when camera on and no scan yet) */}
                        <video ref={camera.videoRef} autoPlay playsInline muted className={`w-full h-full object-contain -scale-x-100 ${camera.cameraOn && !scannedFrameUrl ? 'block' : 'hidden'}`} />

                        {/* Scanned/Uploaded image with annotations (shown after scan or upload) */}
                        {uploadedImage && scannedFrameUrl && (
                            <div className="relative w-full h-full">
                                <img src={showOriginal ? uploadedImage.originalUrl : (uploadedImage.annotatedUrl || uploadedImage.originalUrl)} alt="Scanned" className="w-full h-full object-contain" />
                                {uploadedImage.annotatedUrl && (
                                    <button onClick={() => setShowOriginal(!showOriginal)} className="absolute top-2.5 right-2.5 py-1.25 px-2.5 rounded-lg text-[10px] font-bold bg-white text-[#4a4455] border-none cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                                        {showOriginal ? '🎯 Show Detections' : '📷 Original'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Uploaded image waiting for scan (no annotatedUrl yet) */}
                        {uploadedImage && !uploadedImage.annotatedUrl && !camera.cameraOn && (
                            <div className="relative w-full h-full">
                                <img src={uploadedImage.originalUrl} alt="Uploaded test" className="w-full h-full object-contain" />
                                <div className="absolute top-2.5 right-2.5 py-1.25 px-2.5 rounded-lg text-[10px] font-bold bg-amber-500 text-white border-none shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                                    ⏳ Tap Scan to detect
                                </div>
                            </div>
                        )}

                        {/* Status badge */}
                        <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 py-1.25 px-2.5 bg-black/40 backdrop-blur-md rounded-lg ${camera.cameraOn || uploadedImage ? 'visible' : 'invisible'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${uploadedImage?.annotatedUrl ? 'bg-emerald-500' : scannedFrameUrl ? 'bg-amber-500' : camera.cameraOn ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-gray-500'}`} />
                            <span className="text-white text-[9px] font-bold">
                                {uploadedImage?.annotatedUrl ? '🎯 SCANNED' : scannedFrameUrl ? '📸 CAPTURED' : camera.cameraOn ? '🔍 LIVE' : '📷 OFF'}
                            </span>
                        </div>

                        {/* Detection count badge */}
                        {currentDetections.length > 0 && (
                            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 py-1.5 px-3 bg-black/50 rounded-lg">
                                <span className="text-white text-[10px] font-bold">🎯 {currentDetections.length} objects</span>
                            </div>
                        )}

                        {/* Camera off / no image placeholder */}
                        {!camera.cameraOn && !uploadedImage && !isLoadingModel && (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                                onDrop={async (e) => {
                                    e.preventDefault()
                                    setIsDragging(false)
                                    if (e.dataTransfer.files.length > 0) await handleUpload(e.dataTransfer.files)
                                }}
                                className={`absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all duration-200 bg-[#1e1b4b]/40 ${isDragging ? 'border-[#630ed4]' : 'border-transparent'}`}
                            >
                                <div className={`flex flex-col items-center justify-center animate-fade-in ${isDragging ? 'pointer-events-none' : 'pointer-events-auto'}`}>
                                    <span className={`text-[36px] mb-2 transition-transform duration-200 block ${isDragging ? 'scale-125' : 'scale-100'}`}>{isDragging ? '📥' : '📷'}</span>
                                    <h3 className="text-white text-sm font-extrabold mb-1">Camera is off</h3>
                                    <p className="text-white/60 text-[10px] font-semibold mb-4 max-w-[240px] text-center">{isDragging ? 'Drop your image here' : 'Turn on camera or upload an image to test'}</p>
                                    <div className="flex gap-2">
                                        <button onClick={camera.startCamera} className="px-4 py-2 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-[11px] font-bold border-none cursor-pointer shadow-[0_4px_12px_rgba(99,14,212,0.25)]">📷 Start Camera</button>
                                        <button onClick={() => testFileInputRef.current?.click()} className="px-4 py-2 bg-white text-[#630ed4] rounded-xl text-[11px] font-bold border-2 border-[#630ed4] cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.05)]">📂 Upload Image</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <input ref={testFileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />

                    {/* Controls */}
                    <div className="flex items-center gap-2 flex-wrap justify-center shrink-0">
                        {scannedFrameUrl || (uploadedImage && !camera.cameraOn) ? (
                            <>
                                <button onClick={handleScan} disabled={isLoadingModel || isDetecting} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[11px] font-bold bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white border-none cursor-pointer shadow-[0_4px_12px_rgba(99,14,212,0.25)]">
                                    {isDetecting ? '⏳ Scanning...' : uploadedImage?.annotatedUrl ? '🔍 Re-scan' : '🔍 Scan'}
                                </button>
                                <button onClick={resetScan} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold bg-[#f5f3ff] text-[#4a4455] border-none cursor-pointer">🔄 Try Again</button>
                                <button onClick={() => testFileInputRef.current?.click()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold bg-white text-[#630ed4] border-2 border-[#630ed4] cursor-pointer">📂 New Image</button>
                            </>
                        ) : (
                            <>
                                <button onClick={camera.toggleCamera} disabled={isLoadingModel} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold border-none cursor-pointer ${camera.cameraOn ? 'bg-[#d1fae5] text-[#006c44]' : 'bg-[#f5f3ff] text-[#4a4455]'}`}>
                                    {camera.cameraOn ? '📷 Stop Camera' : '📷 Start Camera'}
                                </button>
                                {camera.cameraOn && (
                                    <button onClick={handleScan} disabled={isLoadingModel || isDetecting} className="px-5 py-2.5 bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white rounded-xl text-[11px] font-bold border-none cursor-pointer shadow-[0_4px_12px_rgba(99,14,212,0.3)]">
                                        {isDetecting ? '⏳ Scanning...' : '🔍 Scan'}
                                    </button>
                                )}
                                <button onClick={() => testFileInputRef.current?.click()} disabled={isLoadingModel} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold bg-white text-[#630ed4] border-2 border-[#630ed4] cursor-pointer">📂 Upload Image</button>
                            </>
                        )}
                    </div>
                </div>

                {/* Right - Status, Detections, Export */}
                <div className={`${isMobile ? 'w-full' : 'w-[260px]'} shrink-0 flex flex-col gap-2.5 overflow-hidden`}>
                    {/* Custom model status */}
                    {customModelTrained && (
                        <div className="bg-gradient-to-br from-[#d1fae5] to-[#a7f3d0] rounded-xl p-2.5 border border-[#006c44]/15 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm">🧠</span>
                                    <div>
                                        <p className="text-[9px] font-bold text-[#006c44]">Custom Model Trained!</p>
                                        <p className="text-[8px] text-[#006c44]/70">{trainerRef.current.getState().metrics.totalClasses} classes</p>
                                    </div>
                                </div>
                                <button onClick={() => setUseCustomModel(!useCustomModel)} className={`py-1 px-2 rounded-md text-[8px] font-bold cursor-pointer ${useCustomModel ? 'bg-[#006c44] text-white border-none' : 'bg-white text-[#006c44] border border-[#006c44]/30'}`}>
                                    {useCustomModel ? '🧠 Custom' : '📦 COCO'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Confidence Threshold Control */}
                    <div className="bg-white/85 rounded-xl p-3 border border-gray-200 shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[11px] font-bold text-[#131b2e]">🎚️ Confidence Threshold</h3>
                            <span className="text-xs font-extrabold text-[#630ed4] bg-[#f5f3ff] py-0.5 px-2 rounded-md">
                                {Math.round(confidenceThreshold * 100)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={Math.round(confidenceThreshold * 100)}
                            onChange={(e) => setConfidenceThreshold(Number(e.target.value) / 100)}
                            className="w-full h-1.5 rounded-full outline-none cursor-pointer"
                            style={{
                                background: `linear-gradient(to right, #630ed4 ${Math.round(confidenceThreshold * 100)}%, #e5e7eb ${Math.round(confidenceThreshold * 100)}%)`,
                            }}
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-[8px] text-gray-500">More detections</span>
                            <span className="text-[8px] text-gray-500">Higher accuracy</span>
                        </div>
                        {allDetections.length !== currentDetections.length && (
                            <div className="mt-1.5 py-1 px-2 bg-amber-100 rounded-md text-[9px] text-amber-800 font-semibold">
                                ⚠️ {allDetections.length - currentDetections.length} low-confidence detection(s) hidden
                            </div>
                        )}
                    </div>

                    {/* Bounding Box Toggle */}
                    <div className="bg-white/85 rounded-xl p-3 border border-gray-200 shrink-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-bold text-[#131b2e]">🔲 Bounding Boxes</h3>
                            <button
                                onClick={() => setShowBoxes(!showBoxes)}
                                className={`relative w-10 h-5 rounded-full transition-colors duration-200 border-none cursor-pointer ${showBoxes ? 'bg-[#630ed4]' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${showBoxes ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                        <p className="text-[8px] text-gray-500 mt-1">{showBoxes ? 'Boxes visible on camera' : 'Boxes hidden — showing raw feed'}</p>
                    </div>

                    {/* Detection Quality Metrics */}
                    {allDetections.length > 0 && (
                        <div className="bg-white/85 rounded-xl p-3 border border-gray-200 shrink-0">
                            <h3 className="text-[11px] font-bold text-[#131b2e] mb-2">📊 Detection Quality</h3>
                            
                            {/* Coverage bar */}
                            <div className="mb-2">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[9px] text-gray-500 font-semibold">Detection Coverage</span>
                                    <span className={`text-[9px] font-bold ${allDetections.length > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                                        {allDetections.length > 0 ? Math.round((currentDetections.length / allDetections.length) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-[width] duration-300 ease-in-out"
                                        style={{
                                            width: `${allDetections.length > 0 ? (currentDetections.length / allDetections.length) * 100 : 0}%`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Average confidence */}
                            <div className="flex justify-between mb-1.5">
                                <span className="text-[9px] text-gray-500 font-semibold">Avg Confidence</span>
                                <span className="text-[9px] font-bold text-[#131b2e]">
                                    {currentDetections.length > 0 
                                        ? Math.round((currentDetections.reduce((sum, d) => sum + d.score, 0) / currentDetections.length) * 100)
                                        : 0}%
                                </span>
                            </div>

                            {/* Confidence breakdown */}
                            <div className="flex gap-1 flex-wrap">
                                {[
                                    { label: 'High (>70%)', count: currentDetections.filter(d => d.score > 0.7).length, color: '#10b981' },
                                    { label: 'Med (50-70%)', count: currentDetections.filter(d => d.score >= 0.5 && d.score <= 0.7).length, color: '#f59e0b' },
                                    { label: 'Low (<50%)', count: currentDetections.filter(d => d.score < 0.5).length, color: '#ef4444' }
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-1 py-0.5 px-1.5 rounded border" style={{ background: `${item.color}10`, borderColor: `${item.color}30` }}>
                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color }} />
                                        <span className="text-[8px] text-gray-600 font-semibold">{item.label}: {item.count}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Class breakdown */}
                            {currentDetections.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                    <span className="text-[9px] text-gray-500 font-semibold block mb-1">By Class</span>
                                    {Object.entries(currentDetections.reduce((acc, d) => {
                                        acc[d.class] = (acc[d.class] || 0) + 1
                                        return acc
                                    }, {} as Record<string, number>)).map(([cls, count]) => (
                                        <div key={cls} className="flex justify-between mb-0.5">
                                            <span className="text-[9px] text-gray-700 capitalize">{cls}</span>
                                            <span className="text-[9px] font-bold text-[#630ed4]">{count as number}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Speed & Detection stats */}
                    <div className="grid grid-cols-2 gap-2 shrink-0">
                        <div className="bg-[#f5f3ff] rounded-xl p-2.5 border border-[#ede9fe]">
                            <p className="text-[8px] text-gray-500 font-bold uppercase mb-0.5">⚡ Speed</p>
                            <p className="text-base font-extrabold text-[#131b2e]">{inferenceTime}ms</p>
                        </div>
                        <div className="bg-[#f5f3ff] rounded-xl p-2.5 border border-[#ede9fe]">
                            <p className="text-[8px] text-gray-500 font-bold uppercase mb-0.5">🎯 Found</p>
                            <p className="text-base font-extrabold text-[#131b2e]">{currentDetections.length}</p>
                        </div>
                    </div>

                    {/* Detected objects */}
                    {currentDetections.length > 0 ? (
                        <div className="bg-white/85 rounded-xl p-3 border border-gray-200 shrink-0">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-[11px] font-bold text-[#131b2e]">🎯 Detected</h3>
                                <span className="text-[8px] font-bold bg-[#f5f3ff] py-0.5 px-1.5 rounded text-[#630ed4]">{currentDetections.length}</span>
                            </div>
                            <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto">
                                {currentDetections.map((det, i) => (
                                    <div key={i} className="py-1.5 px-2 rounded-md bg-[#faf9ff]">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: getColorForObject(det.class) }} />
                                            <span className="text-[9px] font-bold text-[#131b2e] flex-1 capitalize">{det.class}</span>
                                            <span className="text-[8px] font-bold py-0.5 px-1 rounded text-white" style={{ background: getColorForObject(det.class) }}>{Math.round(det.score * 100)}%</span>
                                        </div>
                                        <div className="flex gap-2 mt-1 ml-3">
                                            <span className="text-[7px] text-gray-400">x:{Math.round(det.bbox[0])}</span>
                                            <span className="text-[7px] text-gray-400">y:{Math.round(det.bbox[1])}</span>
                                            <span className="text-[7px] text-gray-400">w:{Math.round(det.bbox[2])}</span>
                                            <span className="text-[7px] text-gray-400">h:{Math.round(det.bbox[3])}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (camera.cameraOn || uploadedImage) && !isLoadingModel ? (
                        <div className="bg-white/85 rounded-xl p-4 border border-gray-200 shrink-0 text-center">
                            <div className="text-2xl mb-2">🔍</div>
                            <p className="text-[11px] font-bold text-[#131b2e] mb-1">No objects detected yet</p>
                            <p className="text-[9px] text-gray-500">
                                {camera.cameraOn ? 'Point your camera at objects — AI will find them!' : 'Click Scan to detect objects in this image'}
                            </p>
                            {!customModelTrained && (
                                <p className="text-[8px] text-amber-600 mt-1.5 font-semibold">Using pre-trained COCO-SSD (80 classes). Train a custom model for your own objects.</p>
                            )}
                            {customModelTrained && useCustomModel && (
                                <p className="text-[8px] text-blue-600 mt-1.5 font-semibold">Your custom model is active. Make sure objects match your trained classes.</p>
                            )}
                            {realtimeEnabled && (
                                <p className="text-[8px] text-gray-400 mt-1">Detection runs automatically — try moving objects into frame.</p>
                            )}
                        </div>
                    ) : null}

                    {/* Model Export */}
                    {customModelTrained && mode.project && (
                        <div className="bg-white/85 rounded-xl p-3 border border-gray-200 flex-1 min-h-0 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-2 shrink-0">
                                <h3 className="text-[11px] font-bold text-[#131b2e]">📦 Export</h3>
                                <span className="text-[8px] font-bold bg-[#f5f3ff] text-[#630ed4] py-0.5 px-1.5 rounded">Trained</span>
                            </div>
                            <div className="grid gap-1.5">
                                {(() => {
                                    const sizes = getExportSizeEstimate(mode.project!)
                                    return (
                                        <button onClick={() => { const state = trainerRef.current.getState(); exportJSON(mode.project!, state) }} className="flex items-center gap-1.5 p-2 rounded-lg border border-gray-200 bg-white cursor-pointer text-left">
                                            <span className="text-sm">📄</span>
                                            <div>
                                                <p className="text-[9px] font-bold text-[#131b2e]">JSON</p>
                                                <p className="text-[7px] text-gray-500">{sizes['JSON']}</p>
                                            </div>
                                        </button>
                                    )
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col h-full relative overflow-y-auto neura-scrollbar">
            {/* Onboarding */}
            {showOnboarding && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-[#0a0128]/70 backdrop-blur-lg" />
                    <div className="relative w-full max-w-[440px] overflow-hidden" style={{ animation: 'onbSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div className="absolute -inset-[2px] rounded-[34px] bg-gradient-to-br from-[#c084fc]/50 via-[#a855f7]/30 to-[#630ed4]/50 blur-md" />
                        <div className="relative bg-white rounded-[32px] shadow-[0_30px_70px_-15px_rgba(99,14,212,0.3)] overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#c084fc] via-[#630ed4] to-[#a855f7]" />
                            <div className="p-10 pb-6">
                                <div className="relative w-20 h-20 mx-auto mb-6">
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] rounded-2xl rotate-6 shadow-[0_8px_24px_rgba(99,14,212,0.15)]" />
                                    <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-[#f5f3ff]/50">
                                        <span className="text-[40px]">🔍</span>
                                    </div>
                                </div>
                                <h3 className="text-[22px] font-extrabold text-[#131b2e] mb-2.5 text-center tracking-tight leading-snug">Welcome to Object Detector!</h3>
                                <p className="text-sm text-gray-500 leading-relaxed text-center max-w-[300px] mx-auto">AI will find and identify objects in your camera! 🚀</p>
                            </div>
                            <div className="mx-10 h-px bg-gradient-to-r from-transparent via-[#ede9fe] to-transparent" />
                            <div className="py-6 px-10 pb-8">
                                <div className="flex flex-col gap-3 mb-6">
                                    <div className="flex items-start gap-3.5 py-3.5 px-4 rounded-2xl bg-[#faf9ff] border border-[#ede9fe]">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] flex items-center justify-center shrink-0 text-sm font-bold text-[#630ed4] shadow-[0_2px_8px_rgba(99,14,212,0.1)]">1</div>
                                        <div className="pt-0.5">
                                            <p className="text-sm font-bold text-[#131b2e] mb-0.5">Create Classes</p>
                                            <p className="text-xs text-gray-500 leading-normal">Click "+" in the sidebar to add object categories!</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3.5 py-3.5 px-4 rounded-2xl bg-[#faf9ff] border border-[#ede9fe]">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] flex items-center justify-center shrink-0 text-sm font-bold text-[#630ed4] shadow-[0_2px_8px_rgba(99,14,212,0.1)]">2</div>
                                        <div className="pt-0.5">
                                            <p className="text-sm font-bold text-[#131b2e] mb-0.5">Detect & Capture</p>
                                            <p className="text-xs text-gray-500 leading-normal">AI auto-detects objects — capture to save!</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3.5 py-3.5 px-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shrink-0 text-sm font-bold text-[#006c44] shadow-[0_2px_8px_rgba(0,108,68,0.1)]">3</div>
                                        <div className="pt-0.5">
                                            <p className="text-sm font-bold text-[#131b2e] mb-0.5">Train & Test</p>
                                            <p className="text-xs text-gray-500 leading-normal">Label your captures, then test the detector!</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => { setShowOnboarding(false); localStorage.setItem('neura-objectdetect-onboarding-seen', 'true') }} className="w-full py-4 rounded-2xl text-sm font-bold border-none cursor-pointer bg-gradient-to-br from-[#630ed4] to-[#7c3aed] text-white shadow-[0_8px_24px_rgba(99,14,212,0.3)] relative overflow-hidden transition-all duration-200">
                                    <span className="relative z-10">Let's Go! 🚀</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <style>{`@keyframes onbFadeIn{from{opacity:0}to{opacity:1}}@keyframes onbSlideIn{from{opacity:0;transform:translateY(12px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
                </div>
            )}

            {/* Toast messages */}
            {captureFlash && <div className="fixed inset-0 bg-white/40 z-50 pointer-events-none animate-fade-in" />}
            {savedMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#006c44] text-white rounded-xl text-xs font-bold shadow-lg animate-fade-in">
                    {savedMessage}
                </div>
            )}

            {/* Mode routing */}
            {mode.mode === 'train' ? (
                <TrainPanel mode={mode} trainer={trainerRef.current} onTrained={() => { setCustomModelTrained(true); setUseCustomModel(true) }} />
            ) : mode.mode === 'annotate' ? (
                <AnnotatePanel mode={mode} />
            ) : mode.mode === 'evaluate' ? (
                <EvaluatePanel mode={mode} trainer={trainerRef.current} />
            ) : mode.mode === 'test' ? (
                renderTestMode()
            ) : (
                renderCollectMode()
            )}
        </div>
    )
}
