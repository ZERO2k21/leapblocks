// components/WebcamModal.jsx
import { useRef, useEffect, useState, useCallback } from 'react'

const COLORS = ['bg-red-500', 'bg-teal-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500', 'bg-blue-500']

export default function WebcamModal({ classLabel, colorIndex = 0, onCapture, onClose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [capturing, setCapturing] = useState(false)
  const [count, setCount] = useState(0)
  const [error, setError] = useState(null)
  const color = COLORS[colorIndex % COLORS.length]

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } })
      .then(stream => { streamRef.current = stream; if (videoRef.current) videoRef.current.srcObject = stream })
      .catch(() => setError('Camera access denied. Please allow camera permissions in your browser.'))
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [])

  const captureFrame = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current
    if (!v || !c) return
    c.width = 224; c.height = 224
    c.getContext('2d').drawImage(v, 0, 0, 224, 224)
    onCapture(c.toDataURL('image/jpeg', 0.8))
    setCount(n => n + 1)
  }, [onCapture])

  useEffect(() => {
    if (!capturing) return
    const id = setInterval(captureFrame, 150)
    return () => clearInterval(id)
  }, [capturing, captureFrame])

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden">
        {/* Header */}
        <div className={`${color} px-5 py-3 flex items-center justify-between`}>
          <div className="text-white font-bold text-sm">
            Capture for <span className="italic">"{classLabel}"</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {error ? (
            <div className="py-8 text-center">
              <div className="text-4xl mb-3">📷</div>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl overflow-hidden bg-black mb-4 relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{ transform: 'scaleX(-1)' }} />
                {capturing && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" />
                    REC
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />

              <div className="flex gap-2 mb-3">
                <button
                  onMouseDown={() => setCapturing(true)} onMouseUp={() => setCapturing(false)}
                  onMouseLeave={() => setCapturing(false)} onTouchStart={() => setCapturing(true)} onTouchEnd={() => setCapturing(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${capturing ? `${color} text-white scale-[0.98]` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {capturing ? '● Recording…' : 'Hold to Record'}
                </button>
                <button onClick={captureFrame} className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                </button>
              </div>

              {count > 0 && (
                <p className="text-center text-sm font-semibold text-gray-600">
                  {count} frame{count !== 1 ? 's' : ''} captured ✓
                </p>
              )}
            </>
          )}

          <button onClick={onClose} className="w-full mt-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
