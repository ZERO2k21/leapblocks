// classifiers/object-detection/ObjectDetection.jsx
import { useState, useRef, useEffect } from 'react'
import ClassifierLayout from '../../components/ClassifierLayout'

export default function ObjectDetection({ project, onBack }) {
    const [modelReady, setModelReady] = useState(false)
    const [loading, setLoading] = useState(false)
    const [detections, setDetections] = useState([])
    const [running, setRunning] = useState(false)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const modelRef = useRef(null)
    const streamRef = useRef(null)
    const rafRef = useRef(null)

    const loadModel = async () => {
        setLoading(true)
        try {
            const loadScript = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s) })
            if (!window._tfLoaded) {
                await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js')
                window._tfLoaded = true
            }
            await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js')
            modelRef.current = await window.cocoSsd.load()
            setModelReady(true)
        } catch (e) { console.error('COCO-SSD load failed:', e) }
        setLoading(false)
    }

    const startDetection = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
            streamRef.current = stream
            if (videoRef.current) videoRef.current.srcObject = stream
            setRunning(true)
            const detect = async () => {
                const v = videoRef.current, c = canvasRef.current
                if (!v || !c || !streamRef.current) return
                const preds = await modelRef.current.detect(v)
                setDetections(preds)
                // Draw bounding boxes
                const ctx = c.getContext('2d')
                c.width = v.videoWidth; c.height = v.videoHeight
                ctx.clearRect(0, 0, c.width, c.height)
                preds.forEach(pred => {
                    const [x, y, w, h] = pred.bbox
                    ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2
                    ctx.strokeRect(x, y, w, h)
                    ctx.fillStyle = '#7c3aed'
                    ctx.fillRect(x, y - 20, w, 20)
                    ctx.fillStyle = 'white'; ctx.font = '12px sans-serif'
                    ctx.fillText(`${pred.class} ${Math.round(pred.score * 100)}%`, x + 4, y - 5)
                })
                rafRef.current = requestAnimationFrame(detect)
            }
            videoRef.current.onloadedmetadata = detect
        } catch { alert('Camera access denied.') }
    }

    const stopDetection = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        streamRef.current?.getTracks().forEach(t => t.stop())
        setRunning(false); setDetections([])
    }

    useEffect(() => () => stopDetection(), [])

    return (
        <ClassifierLayout project={project} onBack={onBack}>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Info banner */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-green-800 mb-1">COCO-SSD Object Detection</h3>
                    <p className="text-xs text-green-700">Detects 80+ common objects (person, car, cat, chair…) using a pre-trained COCO-SSD model. No training needed — load the model and point your camera!</p>
                </div>

                {/* Load model */}
                {!modelReady && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="text-sm text-gray-500 mb-4">Load the COCO-SSD model (~10 MB) to start detecting objects.</p>
                        <button onClick={loadModel} disabled={loading}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white font-bold text-sm rounded-xl transition-colors">
                            {loading ? 'Loading model…' : 'Load Detection Model'}
                        </button>
                    </div>
                )}

                {modelReady && (
                    <>
                        <div className="flex gap-3">
                            <button onClick={running ? stopDetection : startDetection}
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${running ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                                {running ? '⏹ Stop Camera' : '▶ Start Camera & Detect'}
                            </button>
                            {running && (
                                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 text-xs text-green-700 font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    {detections.length} object{detections.length !== 1 ? 's' : ''} detected
                                </div>
                            )}
                        </div>

                        <div className="relative bg-black rounded-2xl overflow-hidden" style={{ minHeight: 320 }}>
                            <video ref={videoRef} autoPlay playsInline muted className="w-full" />
                            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />
                        </div>

                        {detections.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Detected Objects</h4>
                                <div className="flex flex-wrap gap-2">
                                    {detections.map((d, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-3 py-1">
                                            <span className="text-xs font-bold text-purple-800">{d.class}</span>
                                            <span className="text-xs text-purple-500">{Math.round(d.score * 100)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </ClassifierLayout>
    )
}
