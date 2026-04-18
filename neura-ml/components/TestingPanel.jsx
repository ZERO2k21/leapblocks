import { useRef, useState, useCallback, useEffect } from 'react'

/**
 * Enhanced TestingPanel with modern Tailwind styling
 * Features: Live webcam testing, file upload, real-time predictions, confidence bars
 * 
 * Props:
 * - trained: boolean (whether model is trained)
 * - predict: (canvas) => Promise<{ confidences: { [className]: number } }>
 * - classes: Array<{ id, name }> (optional, for display)
 * - model: boolean (legacy alias for trained)
 * - onPredict: function (legacy alias for predict)
 */
export default function TestingPanel({
    trained,
    predict,
    classes = [],
    // Legacy props for backward compatibility
    model,
    onPredict
}) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const rafRef = useRef(null)
    const fileRef = useRef(null)

    const [mode, setMode] = useState('idle')
    const [result, setResult] = useState(null)
    const [testImg, setTestImg] = useState(null)
    const [camErr, setCamErr] = useState(null)

    // Backward compatibility
    const actualTrained = trained !== undefined ? trained : model
    const actualPredict = predict || onPredict

    const stopCam = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        streamRef.current?.getTracks().forEach(t => t.stop())
        rafRef.current = null
        streamRef.current = null
    }, [])

    const startCam = useCallback(async () => {
        setCamErr(null)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240 }
            })
            streamRef.current = stream
            if (videoRef.current) videoRef.current.srcObject = stream
            setMode('webcam')

            const loop = async () => {
                const v = videoRef.current
                const c = canvasRef.current
                if (!v || !c || !streamRef.current) return

                c.width = 224
                c.height = 224
                c.getContext('2d').drawImage(v, 0, 0, 224, 224)

                try {
                    const res = await actualPredict(c)
                    if (res) setResult(res)
                } catch (err) {
                    console.error('Prediction error:', err)
                }

                rafRef.current = requestAnimationFrame(() => setTimeout(loop, 300))
            }

            videoRef.current.onloadedmetadata = loop
        } catch (err) {
            console.error('Camera error:', err)
            setCamErr('Camera access denied.')
        }
    }, [actualPredict])

    useEffect(() => () => stopCam(), [stopCam])

    const handleFile = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async ev => {
            setTestImg(ev.target.result)
            setMode('upload')

            const img = new Image()
            img.src = ev.target.result
            img.onload = async () => {
                const c = canvasRef.current
                if (!c) return

                c.width = 224
                c.height = 224
                c.getContext('2d').drawImage(img, 0, 0, 224, 224)

                try {
                    const res = await actualPredict(c)
                    if (res) setResult(res)
                } catch (err) {
                    console.error('Prediction error:', err)
                }
            }
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const topResult = result ? Object.entries(result.confidences).sort((a, b) => b[1] - a[1])[0] : null
    const sorted = result ? Object.entries(result.confidences).sort((a, b) => b[1] - a[1]) : []

    const CONFIDENCE_COLORS = [
        'bg-purple-500',
        'bg-teal-500',
        'bg-orange-400',
        'bg-pink-500',
        'bg-blue-500',
        'bg-green-500'
    ]

    return (
        <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden w-64 shrink-0">
            <div className="bg-purple-700 px-4 py-3">
                <span className="text-white font-bold text-sm">Testing</span>
            </div>

            {!actualTrained ? (
                <div className="p-5 text-center">
                    <div className="text-3xl mb-2 opacity-30">🧠</div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        You must train a model on the left before you can test it here.
                    </p>
                </div>
            ) : (
                <div className="p-4 flex flex-col gap-3">
                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                stopCam()
                                setMode('idle')
                                setResult(null)
                                setTestImg(null)
                                fileRef.current?.click()
                            }}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-all ${mode === 'upload'
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 text-gray-500 hover:border-purple-300'
                                }`}
                        >
                            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                            </svg>
                            Upload
                        </button>

                        <button
                            onClick={() => mode === 'webcam' ? (stopCam(), setMode('idle'), setResult(null)) : startCam()}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-all ${mode === 'webcam'
                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                    : 'border-gray-200 text-gray-500 hover:border-purple-300'
                                }`}
                        >
                            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                            </svg>
                            {mode === 'webcam' ? 'Stop' : 'Webcam'}
                        </button>
                    </div>

                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFile}
                    />

                    {camErr && <p className="text-red-500 text-xs">{camErr}</p>}

                    {/* Video preview */}
                    {mode === 'webcam' && (
                        <div className="rounded-lg overflow-hidden bg-black">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                        </div>
                    )}

                    {/* Image preview */}
                    {mode === 'upload' && testImg && (
                        <div className="rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                            <img
                                src={testImg}
                                alt="test"
                                className="max-w-full max-h-32 object-contain"
                            />
                        </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />

                    {/* Results */}
                    {result && (
                        <div className="space-y-2">
                            {topResult && (
                                <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 flex items-center justify-between">
                                    <span className="text-xs text-purple-600 font-semibold">Prediction</span>
                                    <span className="text-xs font-bold text-purple-900">{topResult[0]}</span>
                                </div>
                            )}

                            {sorted.map(([label, conf], i) => (
                                <div key={label}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-600">{label}</span>
                                        <span className="font-bold text-gray-700">{Math.round(conf * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div
                                            className={`${CONFIDENCE_COLORS[i % CONFIDENCE_COLORS.length]} h-1.5 rounded-full transition-all duration-300`}
                                            style={{ width: `${conf * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
