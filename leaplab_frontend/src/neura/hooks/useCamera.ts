import { useRef, useState, useEffect, useCallback } from 'react'

export interface UseCameraOptions {
    videoConstraints?: MediaTrackConstraints
    onStreamAcquired?: (stream: MediaStream) => void
}

export interface UseCameraReturn {
    videoRef: React.RefObject<HTMLVideoElement | null>
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    streamRef: React.RefObject<MediaStream | null>
    cameraOnRef: React.RefObject<boolean>
    streamStateRef: React.RefObject<MediaStream | null>
    stream: MediaStream | null
    cameraOn: boolean
    cameraError: string | null
    startCamera: () => Promise<void>
    stopCamera: () => void
    toggleCamera: () => void
    clearError: () => void
    setCameraError: (err: string | null) => void
}

function getCameraErrorMessage(err: unknown): string {
    if (!(err instanceof DOMException)) {
        return 'An unexpected error occurred while accessing the camera.'
    }

    const name = err.name
    const message = err.message.toLowerCase()

    switch (name) {
        case 'NotAllowedError':
            return 'Camera permission was denied. Please allow camera access in your browser settings and try again.'

        case 'NotFoundError':
        case 'DevicesNotFoundError':
            return 'No camera found. Please connect a camera and try again.'

        case 'NotReadableError':
        case 'TrackStartError':
            if (message.includes('could not start') || message.includes('could not request') || message.includes('device in use')) {
                return 'Camera is already in use by another application or browser tab. Please close other apps using the camera (video calls, other browser tabs, etc.) and try again.'
            }
            return 'Camera is not accessible. It may be in use by another application. Please close other apps using the camera and try again.'

        case 'OverconstrainedError':
            return 'Camera does not support the requested settings. Please try with a different camera.'

        case 'AbortError':
            return 'Camera access was interrupted. Please try again.'

        case 'SecurityError':
            return 'Camera access is blocked due to security restrictions. Please use HTTPS or allow camera access for this site.'

        default:
            if (message.includes('in use') || message.includes('could not start') || message.includes('could not request')) {
                return 'Camera is already in use by another application or browser tab. Please close other apps using the camera and try again.'
            }
            return `Camera access failed (${name}). Please check your camera settings and try again.`
    }
}

const DEFAULT_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: 'user',
}

export function useCamera(options?: UseCameraOptions): UseCameraReturn {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const cameraOnRef = useRef(false)
    const streamStateRef = useRef<MediaStream | null>(null)

    const [stream, setStream] = useState<MediaStream | null>(null)
    const [cameraOn, setCameraOn] = useState(false)
    const [cameraError, setCameraError] = useState<string | null>(null)

    const videoConstraints = options?.videoConstraints ?? DEFAULT_VIDEO_CONSTRAINTS

    const stopCamera = useCallback(() => {
        const s = streamRef.current
        if (s) {
            s.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        setStream(null)
        setCameraOn(false)
        streamStateRef.current = null
    }, [])

    const startCamera = useCallback(async () => {
        setCameraError(null)
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: videoConstraints,
            })
            streamRef.current = mediaStream
            streamStateRef.current = mediaStream
            setStream(mediaStream)
            setCameraOn(true)
            options?.onStreamAcquired?.(mediaStream)
        } catch (err) {
            console.error('[useCamera] Camera access error:', err)
            setCameraError(getCameraErrorMessage(err))
            setCameraOn(false)
        }
    }, [videoConstraints, options])

    const toggleCamera = useCallback(() => {
        if (cameraOn) {
            stopCamera()
        } else {
            startCamera()
        }
    }, [cameraOn, startCamera, stopCamera])

    const clearError = useCallback(() => {
        setCameraError(null)
    }, [])

    // Keep refs in sync
    useEffect(() => { cameraOnRef.current = cameraOn }, [cameraOn])
    useEffect(() => { streamStateRef.current = stream }, [stream])

    // Sync stream to video element when stream changes
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
            const s = streamRef.current
            if (s) {
                s.getTracks().forEach(t => t.stop())
            }
        }
    }, [])

    return {
        videoRef,
        canvasRef,
        streamRef,
        cameraOnRef,
        streamStateRef,
        stream,
        cameraOn,
        cameraError,
        startCamera,
        stopCamera,
        toggleCamera,
        clearError,
        setCameraError,
    }
}
