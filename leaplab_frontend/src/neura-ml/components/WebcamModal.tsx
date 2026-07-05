/**
 * WebcamModal — Glassmorphism capture modal. (Pure Tailwind)
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import type { WebcamModalProps } from '../types';
import { WEBCAM_COLORS } from '../types';

export default function WebcamModal({
  classLabel,
  colorIndex = 0,
  onCapture,
  onClose,
}: WebcamModalProps): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturing, setCapturing] = useState<boolean>(false);
  const [count, setCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const color = WEBCAM_COLORS[colorIndex % WEBCAM_COLORS.length];

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } })
      .then((stream: MediaStream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError('Camera access denied. Please allow camera permissions.'));
    return () => { streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop()); };
  }, []);

  const captureFrame = useCallback((): void => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = 224;
    c.height = 224;
    c.getContext('2d')!.drawImage(v, 0, 0, 224, 224);
    onCapture(c.toDataURL('image/jpeg', 0.8));
    setCount((n: number) => n + 1);
  }, [onCapture]);

  useEffect(() => {
    if (!capturing) return;
    const id = setInterval(captureFrame, 150);
    return () => clearInterval(id);
  }, [capturing, captureFrame]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        {/* Header */}
        <div className={`${color} px-5 py-3.5 flex items-center justify-between`}>
          <div className="text-white font-bold text-sm">
            Capture for <span className="italic opacity-90">"{classLabel}"</span>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {error ? (
            <div className="py-8 text-center">
              <div className="text-4xl mb-3 opacity-40">📷</div>
              <p className="text-red-500 text-sm font-medium">{error}</p>
            </div>
          ) : (
            <>
              {/* Video */}
              <div className="rounded-xl overflow-hidden bg-black mb-4 relative ring-1 ring-gray-200">
                <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{ transform: 'scaleX(-1)' }} />
                {capturing && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    REC
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />

              {/* Controls */}
              <div className="flex gap-2 mb-3">
                <button
                  onMouseDown={() => setCapturing(true)}
                  onMouseUp={() => setCapturing(false)}
                  onMouseLeave={() => setCapturing(false)}
                  onTouchStart={() => setCapturing(true)}
                  onTouchEnd={() => setCapturing(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                    capturing ? `${color} text-white scale-[0.97] shadow-lg` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {capturing ? '● Recording…' : 'Hold to Record'}
                </button>
                <button onClick={captureFrame} className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors" title="Single capture">
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                </button>
              </div>

              {count > 0 && (
                <p className="text-center text-sm font-semibold text-violet-600 animate-neura-bounce">
                  {count} frame{count !== 1 ? 's' : ''} captured ✓
                </p>
              )}
            </>
          )}

          <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
