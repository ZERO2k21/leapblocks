import React, { useRef, useState, useEffect, useCallback } from 'react'
import type { UseNeuraProjectReturn } from '../../hooks/useNeuraProject'
import { ObjectDetector } from '../../ml/classifiers/ObjectDetector'
import { ObjectDetectionTrainer } from '../../ml/ObjectDetectionTrainer'
import type { DetectionTrainingState } from '../../ml/ObjectDetectionTrainer'
import { MAX_SAMPLES_PER_CLASS } from '../../types/neura.types'
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
import { exportJSON, exportTFJS, exportONNX, exportTFLite, getExportSizeEstimate } from '../../ml/ModelExporter'

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

const DETECT_THROTTLE_MS = 500

export default function ObjectDetectorPanel({ mode }: ObjectDetectorPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraOffUploadRef = useRef<HTMLInputElement>(null)
    const classifierRef = useRef(new ObjectDetector())
    const trainerRef = useRef(new ObjectDetectionTrainer())
    const streamRef = useRef<MediaStream | null>(null)
    const animFrameRef = useRef<number>(0)
    const isPredictingRef = useRef(false)
    const rebuildAbortRef = useRef(0)
    const testCameraStartedRef = useRef(false)
    const removeDebounceRef = useRef<NodeJS.Timeout | null>(null)
    const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastDetectTimeRef = useRef(0)

    const [isLoadingModel, setIsLoadingModel] = useState(true)
    const [cameraOn, setCameraOn] = useState(false)
    const cameraOnRef = useRef(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const streamStateRef = useRef<MediaStream | null>(null)
    const [detections, setDetections] = useState<{ class: string; score: number; bbox: [number, number, number, number] }[]>([])
    const [uploadedImage, setUploadedImage] = useState<{ originalUrl: string; annotatedUrl: string | null; width: number; height: number } | null>(null)
    const [uploadedDetections, setUploadedDetections] = useState<{ class: string; score: number; bbox: [number, number, number, number] }[]>([])
    const [realtimeEnabled, setRealtimeEnabled] = useState(true)
    const [showOriginal, setShowOriginal] = useState(true)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [captureFlash, setCaptureFlash] = useState(false)
    const [savedMessage, setSavedMessage] = useState<string | null>(null)
    const [isDetecting, setIsDetecting] = useState(false)
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return !localStorage.getItem('neura-objectdetect-onboarding-seen')
    })
    const [inferenceTime, setInferenceTime] = useState(0)
    const [modelLoadError, setModelLoadError] = useState<string | null>(null)
    const [customModelTrained, setCustomModelTrained] = useState(false)
    const [useCustomModel, setUseCustomModel] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isCapturing, setIsCapturing] = useState(false)
    const [collectTab, setCollectTab] = useState<'camera' | 'upload' | 'download'>('camera')
    const [downloadSource, setDownloadSource] = useState<'local' | 'kaggle'>('local')
    const [kaggleCredentials, setKaggleCredentials] = useState<KaggleCredentials | null>(() => getStoredCredentials())

    const startCamera = useCallback(async () => {
        setCameraError(null)
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            })
            streamRef.current = mediaStream
            setStream(mediaStream)
            setCameraOn(true)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                await videoRef.current.play()
            }
        } catch (err) {
            console.error('[ObjectDetector] Camera access denied:', err)
            setCameraError('Camera access is needed for object detection. Please allow camera access in your browser settings and try again.')
            setCameraOn(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        const s = streamRef.current
        if (s) { s.getTracks().forEach(t => t.stop()); streamRef.current = null }
        setStream(null)
        setCameraOn(false)
    }, [])

    const toggleCamera = useCallback(() => {
        if (cameraOn) { stopCamera() } else { startCamera() }
    }, [cameraOn, startCamera, stopCamera])

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

    // Keep refs in sync
    useEffect(() => { cameraOnRef.current = cameraOn }, [cameraOn])
    useEffect(() => { streamStateRef.current = stream }, [stream])

    // Sync stream to video element when stream changes (handles test mode timing)
    useEffect(() => {
        if (stream && videoRef.current && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => undefined)
        }
    }, [stream])

    // Re-sync when cameraOn changes (video element may mount after stream is set)
    useEffect(() => {
        if (cameraOn && stream && videoRef.current && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => undefined)
        }
    }, [cameraOn])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera()
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
            stopCamera()
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
    const detectFrame = useCallback(async (): Promise<{ class: string; score: number; bbox: [number, number, number, number] }[]> => {
        if (!videoRef.current || !videoRef.current.srcObject) return []
        const video = videoRef.current
        if (video.readyState < 2) return []
        try {
            const start = performance.now()
            let result: { class: string; score: number; bbox: [number, number, number, number] }[] = []

            if (useCustomModel && customModelTrained && trainerRef.current.canClassify) {
                // Use custom trained model
                const customResult = await trainerRef.current.detect(video)
                result = customResult.objects.map(o => ({ class: o.label, score: o.confidence, bbox: o.bbox }))
            } else {
                // Fall back to COCO-SSD
                const cocoResult = await classifierRef.current.detect(video)
                result = cocoResult.objects.map(o => ({ class: o.class, score: o.confidence, bbox: o.bbox }))
            }

            const elapsed = Math.round(performance.now() - start)
            setInferenceTime(elapsed)
            return result
        } catch (e) {
            console.warn('[ObjectDetector] Detection error:', e)
            return []
        }
    }, [useCustomModel, customModelTrained])

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
        if (!cameraOn || !realtimeEnabled || isLoadingModel) {
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
                    if (canvasRef.current && videoRef.current) drawDetections(dets, canvasRef.current, videoRef.current)
                    isPredictingRef.current = false
                })
            }
            animFrameRef.current = requestAnimationFrame(tick)
        }
        animFrameRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(animFrameRef.current)
    }, [cameraOn, realtimeEnabled, isLoadingModel, detectFrame, drawDetections])

    // Test mode: auto-start camera
    useEffect(() => {
        if (mode.mode !== 'test' || isLoadingModel) return
        if (!cameraOnRef.current && !streamStateRef.current && !testCameraStartedRef.current) {
            testCameraStartedRef.current = true
            startCamera()
        }
    }, [mode.mode, isLoadingModel, startCamera])

    const handleManualDetect = async () => {
        if (isLoadingModel || !videoRef.current || !canvasRef.current) return
        setIsDetecting(true)
        const dets = await detectFrame()
        setDetections(dets)
        if (canvasRef.current && videoRef.current) drawDetections(dets, canvasRef.current, videoRef.current)
        setIsDetecting(false)
    }

    const handleCapture = async () => {
        if (!videoRef.current || !mode.selectedClassId || !cameraOn || isCapturing) return
        const selectedClass = mode.getSelectedClass()
        if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            showSaved('⚠️ Sample limit reached! (20 per class)')
            return
        }
        setIsCapturing(true)
        try {
            const video = videoRef.current
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
                if (fileInputRef.current) fileInputRef.current.value = ''
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
            if (fileInputRef.current) fileInputRef.current.value = ''
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
                if (fileInputRef.current) fileInputRef.current.value = ''
                return
            }
            const selectedClass = mode.getSelectedClass()
            if (selectedClass && selectedClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
                showSaved('⚠️ Sample limit reached! (20 per class)')
                if (fileInputRef.current) fileInputRef.current.value = ''
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
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        // In test mode: run detection on the uploaded image
        setCameraOn(false)
        stopCamera()
        const img = new Image()
        img.src = dataUrl
        await new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
            setTimeout(() => resolve(), 5000)
        })
        if (img.complete && img.naturalWidth > 0) {
            try {
                const start = performance.now()
                let dets: { class: string; score: number; bbox: [number, number, number, number] }[] = []

                if (useCustomModel && customModelTrained && trainerRef.current.canClassify) {
                    const customResult = await trainerRef.current.detect(img)
                    dets = customResult.objects.map(o => ({ class: o.label, score: o.confidence, bbox: o.bbox }))
                } else {
                    const result = await classifierRef.current.detect(img as any)
                    dets = result.objects.map(o => ({ class: o.class, score: o.confidence, bbox: o.bbox }))
                }

                const elapsed = Math.round(performance.now() - start)
                setInferenceTime(elapsed)
                setUploadedDetections(dets)
                const canvas = document.createElement('canvas')
                canvas.width = img.naturalWidth
                canvas.height = img.naturalHeight
                const ctx = canvas.getContext('2d')!
                ctx.drawImage(img, 0, 0)
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
                setUploadedImage({ originalUrl: dataUrl, annotatedUrl: canvas.toDataURL('image/png'), width: img.naturalWidth, height: img.naturalHeight })
            } catch (err) {
                console.error('[ObjectDetector] Upload detection failed:', err)
                setUploadedImage({ originalUrl: dataUrl, annotatedUrl: null, width: img.naturalWidth, height: img.naturalHeight })
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

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

    const handleResetUpload = () => { setUploadedImage(null); setUploadedDetections([]); setShowOriginal(true); startCamera() }

    const handleRemoveSample = useCallback((classId: string, sampleId: string) => {
        mode.removeSample(classId, sampleId)
        if (removeDebounceRef.current) clearTimeout(removeDebounceRef.current)
        removeDebounceRef.current = setTimeout(() => {
            // No KNN rebuild needed for object detection — COCO-SSD is pre-trained
        }, 300)
    }, [mode.removeSample])

    const selectedClass = mode.getSelectedClass()
    const hasUploadedImage = !!uploadedImage
    const currentDetections = hasUploadedImage ? uploadedDetections : detections
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', padding: '12px 20px 8px', flexShrink: 0 }} className="animate-fade-in">
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#630ed4', marginBottom: '2px' }}>🔍 Object Finder!</h2>
                <p style={{ fontSize: '11px', color: '#6b7280' }}>Point your camera at things — AI will find and name them! 🎯</p>
            </div>

            <div style={{ padding: '0 20px', flexShrink: 0 }}>
                <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={totalSamples >= 4} />
            </div>

            {/* Horizontal Split Layout */}
            <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0, padding: '10px 20px', overflow: 'hidden' }}>
                {/* Left - Camera / Canvas */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
                    {/* Camera / Upload tab content */}
                    {collectTab !== 'download' && (
                        <>
                            {/* Camera error */}
                            {cameraError && !cameraOn && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '20px', border: '1px solid #e5e7eb' }}>
                                    <span style={{ fontSize: '36px', marginBottom: '8px' }}>🚫</span>
                                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#131b2e', marginBottom: '6px' }}>Camera Access Needed</h3>
                                    <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '12px' }}>{cameraError}</p>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={startCamera} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', color: '#fff', borderRadius: '10px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Try Again</button>
                                        <button onClick={() => { setCameraError(null); fileInputRef.current?.click() }} style={{ padding: '8px 16px', background: '#f5f3ff', color: '#630ed4', borderRadius: '10px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Upload Only</button>
                                    </div>
                                </div>
                            )}

                            {/* Camera feed */}
                            <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', background: '#1e1b4b', width: '100%', flex: 1, minHeight: 0, display: cameraOn ? 'flex' : 'none' }}>
                                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', transform: 'scaleX(-1)' }} />
                                {captureFlash && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)', animation: 'flash 0.3s ease-out' }} />}
                                <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', borderRadius: '6px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)', animation: 'pulse 2s infinite' }} />
                                    <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700 }}>🔍 LIVE</span>
                                </div>
                                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                                    <button onClick={toggleCamera} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: 700, background: '#d1fae5', color: '#006c44', border: 'none', cursor: 'pointer' }}>📷 On</button>
                                </div>
                                {selectedClass && (
                                    <div style={{ position: 'absolute', bottom: '60px', left: '8px', padding: '5px 10px', borderRadius: '6px', color: '#fff', fontSize: '10px', fontWeight: 700, background: `${selectedClass.color}CC` }}>{selectedClass.name}</div>
                                )}
                                {currentDetections.length > 0 && (
                                    <div style={{ position: 'absolute', bottom: '60px', right: '8px', padding: '4px 8px', background: 'rgba(0,0,0,0.5)', borderRadius: '6px' }}>
                                        <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700 }}>🎯 {currentDetections.length} found</span>
                                    </div>
                                )}
                                {/* Capture button */}
                                <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
                                    <CaptureButton
                                        onClick={handleCapture}
                                        disabled={!canAddSamples || isCapturing}
                                        label={isCapturing ? '📸 Captured!' : atSampleLimit ? 'Max Reached' : 'Capture 📸'}
                                        icon="camera"
                                        color={selectedClass?.color || '#630ed4'}
                                        pulse={!isCapturing && !!canAddSamples}
                                        size="md"
                                    />
                                </div>
                            </div>

                            {/* Camera off placeholder */}
                            {!cameraOn && !cameraError && (
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
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${isDragging ? '#630ed4' : '#e5e7eb'}`, borderRadius: '14px', padding: '30px 20px', textAlign: 'center', background: isDragging ? 'linear-gradient(135deg, #f5f3ff, #ede9fe)' : 'rgba(255,255,255,0.7)', flex: 1, minHeight: 0, transition: 'all 0.2s ease' }}
                                >
                                    <span style={{ fontSize: '36px', marginBottom: '8px', transition: 'transform 0.2s', transform: isDragging ? 'scale(1.2)' : 'scale(1)' }}>{isDragging ? '📥' : '🔍'}</span>
                                    <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#131b2e', marginBottom: '4px' }}>{isDragging ? 'Drop Image Files Here!' : 'Camera is off'}</h2>
                                    <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '12px' }}>{isDragging ? 'Release to upload as samples' : 'Start camera or drag images to collect samples'}</p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={startCamera} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', color: '#fff', borderRadius: '10px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>📷 Turn On Camera</button>
                                        <button onClick={() => cameraOffUploadRef.current?.click()} style={{ padding: '8px 16px', background: '#fff', color: '#630ed4', borderRadius: '10px', fontSize: '11px', fontWeight: 700, border: '2px solid #630ed4', cursor: 'pointer', transition: 'all 0.2s' }}>📂 Upload</button>
                                    </div>
                                    <input ref={cameraOffUploadRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                                </div>
                            )}

                            {/* Controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', flexShrink: 0 }}>
                                <button onClick={toggleCamera} disabled={isLoadingModel} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, background: cameraOn ? '#d1fae5' : '#f5f3ff', color: cameraOn ? '#006c44' : '#4a4455', border: 'none', cursor: 'pointer' }}>
                                    {cameraOn ? '📷 Stop' : '📷 Start'}
                                </button>
                                {cameraOn && !realtimeEnabled && (
                                    <button onClick={handleManualDetect} disabled={isLoadingModel || isDetecting} style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', color: '#fff', borderRadius: '8px', fontSize: '10px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                                        {isDetecting ? '⏳...' : '🔍 Scan'}
                                    </button>
                                )}
                                <button onClick={() => fileInputRef.current?.click()} disabled={isLoadingModel} style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', color: '#fff', borderRadius: '8px', fontSize: '10px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>📂 Upload</button>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                            </div>
                        </>
                    )}

                    {/* Download tab content */}
                    {collectTab === 'download' && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>
                            <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '12px', padding: '4px', flexShrink: 0 }}>
                                <button onClick={() => setDownloadSource('local')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, background: downloadSource === 'local' ? 'white' : 'transparent', color: downloadSource === 'local' ? '#630ed4' : '#6b7280', border: 'none', cursor: 'pointer', boxShadow: downloadSource === 'local' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s ease' }}>📁 Local</button>
                                <button onClick={() => setDownloadSource('kaggle')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, background: downloadSource === 'kaggle' ? 'white' : 'transparent', color: downloadSource === 'kaggle' ? '#630ed4' : '#6b7280', border: 'none', cursor: 'pointer', boxShadow: downloadSource === 'kaggle' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s ease' }}>🔍 Kaggle</button>
                            </div>
                            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                                {downloadSource === 'local' ? (
                                    <ImageDatasetBrowser mode={mode} onImagesAdded={(count) => showSaved(`📥 Added ${count} images!`)} />
                                ) : kaggleCredentials ? (
                                    <KaggleDatasetBrowser mode={mode} credentials={kaggleCredentials} onImagesAdded={(count) => showSaved(`📥 Added ${count} images from Kaggle!`)} />
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', textAlign: 'center' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg, #f3f0ff, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', border: '1px solid rgba(224,213,255,0.6)' }}>
                                            <span style={{ fontSize: '36px' }}>🔍</span>
                                        </div>
                                        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Connect Kaggle</h3>
                                        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, maxWidth: '260px', marginBottom: '28px' }}>Search and download real images from Kaggle's free public datasets</p>
                                        <KaggleSettings compact onCredentialsSaved={() => setKaggleCredentials(getStoredCredentials())} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right - Tabs, Tips, Stats, Detections, Samples */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden', overflowY: 'auto', padding: '0 4px' }}>
                    {/* Collect sub-tabs */}
                    <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '12px', padding: '4px', flexShrink: 0 }}>
                        {[
                            { id: 'camera' as const, label: 'Camera', emoji: '📷' },
                            { id: 'upload' as const, label: 'Upload', emoji: '📂' },
                            { id: 'download' as const, label: 'Download', emoji: '📥' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setCollectTab(tab.id)
                                    if (tab.id === 'camera' && !cameraOn) startCamera()
                                    if (tab.id !== 'camera' && cameraOn) stopCamera()
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, flex: 1,
                                    background: collectTab === tab.id ? 'white' : 'transparent',
                                    color: collectTab === tab.id ? '#630ed4' : '#6b7280',
                                    border: 'none', cursor: 'pointer',
                                    boxShadow: collectTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span>{tab.emoji}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tips */}
                    <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(99,14,212,0.1)', flexShrink: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#630ed4', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💡 TIPS</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '13px', color: '#4a4455' }}>• Point camera at objects</span>
                            <span style={{ fontSize: '13px', color: '#4a4455' }}>• Good lighting helps</span>
                            <span style={{ fontSize: '13px', color: '#4a4455' }}>• Capture to save detections</span>
                        </div>
                    </div>

                    {/* Detected objects */}
                    {currentDetections.length > 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#131b2e' }}>🎯 Detected</h3>
                                <span style={{ fontSize: '12px', fontWeight: 700, background: '#f5f3ff', padding: '4px 10px', borderRadius: '6px', color: '#630ed4' }}>{currentDetections.length}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                                {currentDetections.map((det, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', background: '#faf9ff' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getColorForObject(det.class) }} />
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#131b2e', flex: 1, textTransform: 'capitalize' }}>{det.class}</span>
                                        <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', color: '#fff', background: getColorForObject(det.class) }}>{Math.round(det.score * 100)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <StatsBar compact totalClasses={mode.project?.classes.length || 0} totalImages={mode.getTotalSamples()} imagesPerClass={(mode.project?.classes.length || 0) > 0 ? Math.round(mode.getTotalSamples() / (mode.project?.classes.length || 1)) : 0} recommended={10} />

                    {/* Collected samples */}
                    {selectedClass && selectedClass.samples.length > 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb', flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: selectedClass.color }} />
                                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#131b2e' }}>{selectedClass.name}</h3>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: atSampleLimit ? '#fef3c7' : '#f5f3ff', color: atSampleLimit ? '#c32c00' : '#4a4455' }}>{selectedClass.samples.length}/{MAX_SAMPLES_PER_CLASS}</span>
                            </div>
                            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', padding: '12px 20px 8px', flexShrink: 0 }} className="animate-fade-in">
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#630ed4', marginBottom: '2px' }}>🧪 Test Your Finder!</h2>
                <p style={{ fontSize: '11px', color: '#6b7280' }}>Try different objects and see what AI can find! 🕵️</p>
            </div>

            <div style={{ padding: '0 20px', flexShrink: 0 }}>
                <WorkflowIndicator mode={mode.mode} onModeChange={mode.setMode} canTrain={totalSamples >= 4} />
            </div>

            {/* Model status */}
            {isLoadingModel && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f5f3ff', borderRadius: '10px', border: '1px solid rgba(99,14,212,0.15)', margin: '8px 20px 0', flexShrink: 0 }}>
                    <div style={{ width: '14px', height: '14px', border: '2px solid #630ed4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#630ed4' }}>Loading model... ⏳</span>
                </div>
            )}
            {modelLoadError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca', margin: '8px 20px 0', flexShrink: 0 }}>
                    <span style={{ fontSize: '14px' }}>❌</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#991b1b' }}>{modelLoadError}</span>
                </div>
            )}

            {/* Horizontal Split Layout */}
            <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0, padding: '10px 20px', overflow: 'hidden' }}>
                {/* Left - Camera */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
                    {/* Camera feed */}
                    <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#1e1b4b', width: '100%', flex: 1, minHeight: 0 }}>
                        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: cameraOn ? 'block' : 'none' }} />
                        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', transform: 'scaleX(-1)' }} />
                        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', borderRadius: '8px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cameraOn ? '#ef4444' : '#6b7280', boxShadow: cameraOn ? '0 0 6px rgba(239,68,68,0.6)' : 'none', animation: cameraOn ? 'pulse 2s infinite' : 'none' }} />
                            <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700 }}>{cameraOn ? '🔍 LIVE' : '📷 OFF'}</span>
                        </div>
                        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                            <button onClick={toggleCamera} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, background: cameraOn ? '#d1fae5' : '#fff', color: cameraOn ? '#006c44' : '#4a4455', border: 'none', cursor: 'pointer' }}>
                                📷 {cameraOn ? 'On' : 'Start'}
                            </button>
                        </div>
                        {currentDetections.length > 0 && (
                            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', padding: '6px 12px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px' }}>
                                <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>🎯 {currentDetections.length} objects</span>
                            </div>
                        )}
                        {!cameraOn && !isLoadingModel && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '32px', marginBottom: '6px' }}>📷</span>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 700 }}>Camera is off</span>
                                <button onClick={startCamera} style={{ marginTop: '8px', padding: '6px 12px', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', color: '#fff', borderRadius: '8px', fontSize: '10px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>📷 Start Camera</button>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', flexShrink: 0 }}>
                        <button onClick={toggleCamera} disabled={isLoadingModel} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, background: cameraOn ? '#d1fae5' : '#f5f3ff', color: cameraOn ? '#006c44' : '#4a4455', border: 'none', cursor: 'pointer' }}>
                            {cameraOn ? '📷 Stop' : '📷 Start'}
                        </button>
                        {cameraOn && (
                            <button onClick={handleManualDetect} disabled={isLoadingModel || isDetecting} style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', color: '#fff', borderRadius: '8px', fontSize: '10px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                                {isDetecting ? '⏳...' : '🔍 Scan'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Right - Status, Detections, Export */}
                <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
                    {/* Custom model status */}
                    {customModelTrained && (
                        <div style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', borderRadius: '10px', padding: '10px 12px', border: '1px solid rgba(0,108,68,0.15)', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '14px' }}>🧠</span>
                                    <div>
                                        <p style={{ fontSize: '9px', fontWeight: 700, color: '#006c44' }}>Custom Model Trained!</p>
                                        <p style={{ fontSize: '8px', color: 'rgba(0,108,68,0.7)' }}>{Object.keys(trainerRef.current.getState().classCounts).length} classes</p>
                                    </div>
                                </div>
                                <button onClick={() => setUseCustomModel(!useCustomModel)} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '8px', fontWeight: 700, background: useCustomModel ? '#006c44' : '#fff', color: useCustomModel ? '#fff' : '#006c44', border: useCustomModel ? 'none' : '1px solid rgba(0,108,68,0.3)', cursor: 'pointer' }}>
                                    {useCustomModel ? '🧠 Custom' : '📦 COCO'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Speed & Detection stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flexShrink: 0 }}>
                        <div style={{ background: '#f5f3ff', borderRadius: '10px', padding: '10px', border: '1px solid #ede9fe' }}>
                            <p style={{ fontSize: '8px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>⚡ Speed</p>
                            <p style={{ fontSize: '16px', fontWeight: 800, color: '#131b2e' }}>{inferenceTime}ms</p>
                        </div>
                        <div style={{ background: '#f5f3ff', borderRadius: '10px', padding: '10px', border: '1px solid #ede9fe' }}>
                            <p style={{ fontSize: '8px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>🎯 Found</p>
                            <p style={{ fontSize: '16px', fontWeight: 800, color: '#131b2e' }}>{currentDetections.length}</p>
                        </div>
                    </div>

                    {/* Detected objects */}
                    {currentDetections.length > 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '12px', padding: '12px', border: '1px solid #e5e7eb', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#131b2e' }}>🎯 Detected</h3>
                                <span style={{ fontSize: '8px', fontWeight: 700, background: '#f5f3ff', padding: '2px 6px', borderRadius: '4px', color: '#630ed4' }}>{currentDetections.length}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                                {currentDetections.map((det, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 6px', borderRadius: '6px', background: '#faf9ff' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: getColorForObject(det.class) }} />
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#131b2e', flex: 1, textTransform: 'capitalize' }}>{det.class}</span>
                                        <span style={{ fontSize: '8px', fontWeight: 700, padding: '1px 4px', borderRadius: '3px', color: '#fff', background: getColorForObject(det.class) }}>{Math.round(det.score * 100)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Model Export */}
                    {customModelTrained && mode.project && (
                        <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '12px', padding: '12px', border: '1px solid #e5e7eb', flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
                                <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#131b2e' }}>📦 Export</h3>
                                <span style={{ fontSize: '8px', fontWeight: 700, background: '#f5f3ff', color: '#630ed4', padding: '2px 6px', borderRadius: '4px' }}>Trained</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                {[
                                    { label: 'JSON', emoji: '📄', format: 'json' },
                                    { label: 'TF.js', emoji: '🌐', format: 'tfjs' },
                                    { label: 'ONNX', emoji: '⚡', format: 'onnx' },
                                    { label: 'TFLite', emoji: '📱', format: 'tflite' }
                                ].map(exp => {
                                    const sizes = getExportSizeEstimate(mode.project!)
                                    return (
                                        <button key={exp.format} onClick={() => {
                                            const state = trainerRef.current.getState()
                                            if (exp.format === 'json') exportJSON(mode.project!, state)
                                            else if (exp.format === 'tfjs') exportTFJS(mode.project!, state)
                                            else if (exp.format === 'onnx') exportONNX(mode.project!, state)
                                            else if (exp.format === 'tflite') exportTFLite(mode.project!, state)
                                        }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', textAlign: 'left' }}>
                                            <span style={{ fontSize: '14px' }}>{exp.emoji}</span>
                                            <div>
                                                <p style={{ fontSize: '9px', fontWeight: 700, color: '#131b2e' }}>{exp.label}</p>
                                                <p style={{ fontSize: '7px', color: '#6b7280' }}>{sizes[exp.label]}</p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col h-full relative">
            {/* Onboarding */}
            {showOnboarding && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ animation: 'onbFadeIn 0.3s ease-out' }}>
                    <div className="absolute inset-0 bg-[#0a0128]/70 backdrop-blur-lg" />
                    <div className="relative w-full max-w-[440px] overflow-hidden" style={{ animation: 'onbSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <div className="absolute -inset-[2px] rounded-[34px] bg-gradient-to-br from-[#c084fc]/50 via-[#a855f7]/30 to-[#630ed4]/50 blur-md" />
                        <div className="relative bg-white rounded-[32px] shadow-[0_30px_70px_-15px_rgba(99,14,212,0.3)] overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#c084fc] via-[#630ed4] to-[#a855f7]" />
                            <div style={{ padding: '40px 40px 24px' }}>
                                <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 24px' }}>
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: '20px', transform: 'rotate(6deg)', boxShadow: '0 8px 24px rgba(99,14,212,0.15)' }} />
                                    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#fff', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(245,243,255,0.5)' }}>
                                        <span style={{ fontSize: '40px' }}>🔍</span>
                                    </div>
                                </div>
                                <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#131b2e', marginBottom: '10px', textAlign: 'center', letterSpacing: '-0.02em', lineHeight: 1.3 }}>Welcome to Object Detector!</h3>
                                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6, textAlign: 'center', maxWidth: '300px', margin: '0 auto' }}>AI will find and identify objects in your camera! 🚀</p>
                            </div>
                            <div style={{ margin: '0 40px', height: '1px', background: 'linear-gradient(to right, transparent, #ede9fe, transparent)' }} />
                            <div style={{ padding: '24px 40px 32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px', borderRadius: '14px', background: '#faf9ff', border: '1px solid #ede9fe' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 700, color: '#630ed4', boxShadow: '0 2px 8px rgba(99,14,212,0.1)' }}>1</div>
                                        <div style={{ paddingTop: '2px' }}>
                                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#131b2e', marginBottom: '2px' }}>Create Classes</p>
                                            <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>Click "+" in the sidebar to add object categories!</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px', borderRadius: '14px', background: '#faf9ff', border: '1px solid #ede9fe' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 700, color: '#630ed4', boxShadow: '0 2px 8px rgba(99,14,212,0.1)' }}>2</div>
                                        <div style={{ paddingTop: '2px' }}>
                                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#131b2e', marginBottom: '2px' }}>Detect & Capture</p>
                                            <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>AI auto-detects objects — capture to save!</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px', borderRadius: '14px', background: '#f0fdf4', border: '1px solid #d1fae5' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', fontWeight: 700, color: '#006c44', boxShadow: '0 2px 8px rgba(0,108,68,0.1)' }}>3</div>
                                        <div style={{ paddingTop: '2px' }}>
                                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#131b2e', marginBottom: '2px' }}>Train & Test</p>
                                            <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>Label your captures, then test the detector!</p>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => { setShowOnboarding(false); localStorage.setItem('neura-objectdetect-onboarding-seen', 'true') }} style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #630ed4, #7c3aed)', color: '#fff', boxShadow: '0 8px 24px rgba(99,14,212,0.3)', position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}>
                                    <span style={{ position: 'relative', zIndex: 10 }}>Let's Go! 🚀</span>
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
                <EvaluatePanel mode={mode} metrics={trainerRef.current.getState().metrics} />
            ) : mode.mode === 'test' ? (
                renderTestMode()
            ) : (
                renderCollectMode()
            )}
        </div>
    )
}
