/**
 * ObjectDetection — COCO-SSD real-time detection. (Pure Tailwind)
 */
import { useState, useRef, useEffect } from 'react';
import ClassifierLayout from '../../components/ClassifierLayout';
import type { ClassifierBaseProps, Detection } from '../../types';

interface CocoSsdModel {
  detect: (video: HTMLVideoElement) => Promise<Array<{ bbox: [number, number, number, number]; class: string; score: number }>>;
}

declare global {
  interface Window {
    _tfLoaded?: boolean;
    cocoSsd?: { load: () => Promise<CocoSsdModel> };
  }
}

export default function ObjectDetection({ project, onBack }: ClassifierBaseProps): React.JSX.Element {
  const [modelReady, setModelReady] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [running, setRunning] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<CocoSsdModel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const loadModel = async (): Promise<void> => {
    setLoading(true);
    try {
      const loadScript = (src: string): Promise<void> => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error(`Failed to load ${src}`)); document.head.appendChild(s); });
      if (!window._tfLoaded) { await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js'); window._tfLoaded = true; }
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js');
      modelRef.current = await window.cocoSsd!.load(); setModelReady(true);
    } catch (e) { console.error('COCO-SSD load failed:', e); }
    setLoading(false);
  };

  const startDetection = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setRunning(true);
      const detect = async (): Promise<void> => {
        const v = videoRef.current; const c = canvasRef.current;
        if (!v || !c || !streamRef.current || !modelRef.current) return;
        const preds = await modelRef.current.detect(v);
        setDetections(preds.map((p) => ({ bbox: p.bbox, class: p.class, score: p.score })));
        const ctx = c.getContext('2d')!; c.width = v.videoWidth; c.height = v.videoHeight;
        ctx.clearRect(0, 0, c.width, c.height);
        preds.forEach((pred) => {
          const [x, y, w, h] = pred.bbox;
          ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
          ctx.fillStyle = '#7c3aed'; ctx.fillRect(x, y - 20, w, 20);
          ctx.fillStyle = 'white'; ctx.font = '12px sans-serif';
          ctx.fillText(`${pred.class} ${Math.round(pred.score * 100)}%`, x + 4, y - 5);
        });
        rafRef.current = requestAnimationFrame(detect);
      };
      if (videoRef.current) { videoRef.current.onloadedmetadata = () => { detect(); }; }
    } catch { alert('Camera access denied.'); }
  };

  const stopDetection = (): void => { if (rafRef.current) cancelAnimationFrame(rafRef.current); streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop()); setRunning(false); setDetections([]); };
  useEffect(() => () => stopDetection(), []);

  return (
    <ClassifierLayout project={project} onBack={onBack}>
      <div className="max-w-3xl mx-auto space-y-5 p-6 overflow-y-auto h-full">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-neura-slide-up">
          <h3 className="text-sm font-bold text-green-800 mb-1">COCO-SSD Object Detection</h3>
          <p className="text-xs text-green-700 leading-relaxed">Detects 80+ common objects (person, car, cat, chair…) using a pre-trained model. No training needed.</p>
        </div>

        {!modelReady && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center animate-neura-scale">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-sm text-gray-500 mb-5">Load the COCO-SSD model (~10 MB) to start detecting objects.</p>
            <button onClick={loadModel} disabled={loading} className="flex items-center justify-center gap-2 mx-auto px-8 py-3 bg-gradient-to-r from-[#0a015a] to-[#15027a] text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-neura-spin" />}
              {loading ? 'Loading model…' : 'Load Detection Model'}
            </button>
          </div>
        )}

        {modelReady && (
          <>
            <div className="flex gap-3 items-center animate-neura-slide-up [animation-delay:100ms]">
              <button onClick={running ? stopDetection : startDetection} className={`flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0a015a] to-[#15027a] text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all ${running ? '!bg-red-500 hover:!bg-red-600' : ''}`}>
                {running ? '⏹ Stop Camera' : '▶ Start Detecting'}
              </button>
              {running && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-xs text-green-700 font-semibold animate-neura-fade">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {detections.length} object{detections.length !== 1 ? 's' : ''} detected
                </div>
              )}
            </div>

            <div className="relative bg-black rounded-2xl overflow-hidden ring-1 ring-gray-200 animate-neura-scale [animation-delay:200ms]" style={{ minHeight: 320 }}>
              <video ref={videoRef} autoPlay playsInline muted className="w-full" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />
            </div>

            {detections.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 animate-neura-slide-up">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Detected Objects</h4>
                <div className="flex flex-wrap gap-2">
                  {detections.map((d: Detection, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-3 py-1.5 animate-neura-bounce" style={{ animationDelay: `${i * 0.04}s` }}>
                      <span className="text-xs font-bold text-violet-800">{d.class}</span>
                      <span className="text-[10px] text-violet-500 font-semibold">{Math.round(d.score * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ClassifierLayout>
  );
}
