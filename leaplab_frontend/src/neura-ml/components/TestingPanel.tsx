/**
 * TestingPanel — Live testing with webcam or file upload. (Pure Tailwind)
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import type { TestingPanelProps, PredictionResult } from '../types';
import { BAR_COLORS } from '../types';

export default function TestingPanel({
  trained,
  predict,
  classes = [],
  model,
  onPredict,
}: TestingPanelProps): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'idle' | 'webcam' | 'upload'>('idle');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [testImg, setTestImg] = useState<string | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);

  const actualTrained = trained !== undefined ? trained : model;
  const actualPredict = predict || onPredict;

  const stopCam = useCallback((): void => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    rafRef.current = null;
    streamRef.current = null;
  }, []);

  const startCam = useCallback(async (): Promise<void> => {
    setCamErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setMode('webcam');

      const loop = async (): Promise<void> => {
        const v = videoRef.current;
        const c = canvasRef.current;
        if (!v || !c || !streamRef.current) return;
        c.width = 224;
        c.height = 224;
        c.getContext('2d')!.drawImage(v, 0, 0, 224, 224);
        try {
          const res = await actualPredict!(c);
          if (res) setResult(res);
        } catch (err) {
          console.error('Prediction error:', err);
        }
        rafRef.current = requestAnimationFrame(() => setTimeout(loop, 300));
      };
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = () => { loop(); };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCamErr('Camera access denied.');
    }
  }, [actualPredict]);

  useEffect(() => () => stopCam(), [stopCam]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev: ProgressEvent<FileReader>) => {
      const dataUrl = ev.target?.result as string;
      setTestImg(dataUrl);
      setMode('upload');
      const img = new Image();
      img.src = dataUrl;
      img.onload = async () => {
        const c = canvasRef.current;
        if (!c) return;
        c.width = 224;
        c.height = 224;
        c.getContext('2d')!.drawImage(img, 0, 0, 224, 224);
        try {
          const res = await actualPredict!(c);
          if (res) setResult(res);
        } catch (err) {
          console.error('Prediction error:', err);
        }
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sorted: [string, number][] = result
    ? Object.entries(result.confidences).sort((a, b) => b[1] - a[1])
    : [];
  const topResult = sorted[0];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm animate-neura-slide-up [animation-delay:300ms]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white text-xs font-bold">
        <span>Testing</span>
      </div>

      {!actualTrained ? (
        <div className="p-6 text-center">
          <div className="text-3xl mb-2 opacity-25">🧠</div>
          <p className="text-[11px] text-gray-400 leading-relaxed">Train a model first to start testing.</p>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-3">
          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => { stopCam(); setMode('idle'); setResult(null); setTestImg(null); fileRef.current?.click(); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                mode === 'upload' ? 'border-violet-400 bg-violet-50 text-violet-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              Upload
            </button>
            <button
              onClick={() => mode === 'webcam' ? (stopCam(), setMode('idle'), setResult(null)) : startCam()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                mode === 'webcam' ? 'border-violet-400 bg-violet-50 text-violet-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600'
              }`}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
              {mode === 'webcam' ? 'Stop' : 'Webcam'}
            </button>
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          {camErr && <p className="text-red-500 text-xs">{camErr}</p>}

          {/* Preview */}
          {mode === 'webcam' && (
            <div className="rounded-lg overflow-hidden bg-black ring-2 ring-violet-500/20">
              <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{ transform: 'scaleX(-1)' }} />
            </div>
          )}
          {mode === 'upload' && testImg && (
            <div className="rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-2 ring-1 ring-gray-200">
              <img src={testImg} alt="test" className="max-w-full max-h-28 object-contain rounded" />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Results */}
          {result && (
            <div className="space-y-2 animate-neura-fade">
              {topResult && (
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="text-[11px] text-violet-600 font-semibold">Prediction</span>
                  <span className="text-xs font-bold text-violet-900">{topResult[0]}</span>
                </div>
              )}
              {sorted.map(([label, conf]: [string, number], i: number) => (
                <div key={label} className="animate-neura-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-gray-600 truncate mr-2">{label}</span>
                    <span className="font-bold text-gray-700 shrink-0">{Math.round(conf * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[i % BAR_COLORS.length]}`} style={{ width: `${conf * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
