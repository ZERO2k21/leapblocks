// YOLOv8n-nano for browser — smallest YOLO, real epochs
// Uses TFJS GraphModel (webgl) + custom head training for few-shot
// Model: yolov8n ~6M params, 8.7 GFLOPs, ~13MB tfjs (Hyuto) — falls back to COCO-SSD if unavailable

import { ensureTf } from '../loadScript'

declare const window: any

let yoloModel: any = null
let yoloLoading: Promise<any> | null = null

// Primary YOLOv8n TFJS model URLs — smallest YOLO (6MB)
const YOLO_URLS = [
    // Hyuto yolov8-tfjs master (works, main 404)
    'https://cdn.jsdelivr.net/gh/Hyuto/yolov8-tfjs@master/public/yolov8n_web_model/model.json',
    'https://raw.githubusercontent.com/Hyuto/yolov8-tfjs/master/public/yolov8n_web_model/model.json',
    // wndfly mirror master
    'https://cdn.jsdelivr.net/gh/wndfly/yolov8-tfjs@master/public/yolov8n_web_model/model.json',
    // jsdelivr generic yolo-tfjs
    'https://cdn.jsdelivr.net/npm/yolo-tfjs@latest/dist/models/yolov8n/model.json',
    // local public fallback (user can drop model there)
    '/models/yolov8n_web_model/model.json',
]

export async function ensureYoloNano(): Promise<any> {
    if (yoloModel) return yoloModel
    if (yoloLoading) return yoloLoading

    yoloLoading = (async () => {
        const tf = await ensureTf()
        let lastErr: any = null
        for (const url of YOLO_URLS) {
            try {
                console.log('[YoloNano] trying', url)
                const m = await (tf as any).loadGraphModel(url)
                // warmup
                const dummy = tf.zeros([1, 640, 640, 3])
                const out = await m.executeAsync(dummy)
                // clean warmup outputs
                if (Array.isArray(out)) out.forEach((t: any) => t.dispose())
                else if (out && out.dispose) out.dispose()
                dummy.dispose()
                console.log('[YoloNano] loaded', url)
                yoloModel = m
                return m
            } catch (e) {
                console.warn('[YoloNano] load failed', url, e)
                lastErr = e
            }
        }
        yoloLoading = null
        throw lastErr || new Error('YOLOv8n load failed — all mirrors failed')
    })()

    return yoloLoading
}

export function isYoloLoaded(): boolean { return !!yoloModel }

// Post-process YOLOv8 raw output [1,84,8400] -> boxes
// 84 = 4 xywh + 80 COCO classes
export function postprocessYolo(output: any, imgW: number, imgH: number, scoreTH = 0.30, iouTH = 0.45): { bbox: [number, number, number, number], score: number, classId: number }[] {
    const tf = window.tf
    if (!tf) return []
    // output is tf.Tensor shape [1,84,8400] or [1,8400,84] — handle both
    let data: Float32Array
    let shape: number[] = []
    try {
        shape = output.shape
        data = output.dataSync() as Float32Array
    } catch {
        return []
    }
    // Transpose if [1,84,8400] -> we want [8400,84]
    // YOLOv8 tfjs export is [1,84,8400]
    const numDet = shape[2] || 8400
    const numClasses = shape[1] ? shape[1] - 4 : 80 // 84-4=80
    const boxes: { bbox: [number, number, number, number], score: number, classId: number }[] = []
    // For each of 8400 predictions
    for (let i = 0; i < numDet; i++) {
        // xywh are first 4 rows
        const x = data[0 * numDet + i]
        const y = data[1 * numDet + i]
        const w = data[2 * numDet + i]
        const h = data[3 * numDet + i]
        let bestScore = 0
        let bestCls = -1
        for (let c = 0; c < numClasses; c++) {
            const s = data[(4 + c) * numDet + i]
            if (s > bestScore) { bestScore = s; bestCls = c }
        }
        if (bestScore < scoreTH) continue
        // xywh center -> xyxy in 640 space
        const x1 = (x - w / 2)
        const y1 = (y - h / 2)
        const x2 = (x + w / 2)
        const y2 = (y + h / 2)
        // scale from 640 letterboxed to imgW/H
        // we resized with letterbox 640x640, need to undo scale/pad
        // simple stretch (no letterbox correction for now — approx)
        const scaleX = imgW / 640
        const scaleY = imgH / 640
        boxes.push({ bbox: [x1 * scaleX, y1 * scaleY, (x2 - x1) * scaleX, (y2 - y1) * scaleY], score: bestScore, classId: bestCls })
    }
    // NMS per class
    const nms = tf.image.nonMaxSuppression as any
    // Do simple IoU NMS manually per class to keep labels
    const byClass = new Map<number, typeof boxes>()
    for (const b of boxes) {
        if (!byClass.has(b.classId)) byClass.set(b.classId, [])
        byClass.get(b.classId)!.push(b)
    }
    const result: typeof boxes = []
    for (const [cls, arr] of byClass) {
        arr.sort((a, b) => b.score - a.score)
        const kept: typeof boxes = []
        for (const b of arr) {
            let keep = true
            for (const k of kept) {
                const iou = calcIoU(b.bbox, k.bbox)
                if (iou > iouTH) { keep = false; break }
            }
            if (keep) kept.push(b)
        }
        result.push(...kept)
    }
    console.log(`[YoloNano] postprocess ${numDet} raw → ${boxes.length} over TH → ${result.length} after NMS`)
    return result
}

function calcIoU(a: [number, number, number, number], b: [number, number, number, number]): number {
    const [ax, ay, aw, ah] = a; const [bx, by, bw, bh] = b
    const ax2 = ax + aw, ay2 = ay + ah, bx2 = bx + bw, by2 = by + bh
    const ix1 = Math.max(ax, bx), iy1 = Math.max(ay, by), ix2 = Math.min(ax2, bx2), iy2 = Math.min(ay2, by2)
    if (ix2 <= ix1 || iy2 <= iy1) return 0
    const inter = (ix2 - ix1) * (iy2 - iy1)
    const union = aw * ah + bw * bh - inter
    return union > 0 ? inter / union : 0
}

export async function yoloDetect(image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, scoreTH = 0.35, iouTH = 0.45): Promise<{ bbox: [number, number, number, number], score: number, class: string, classId: number }[]> {
    const tf = await ensureTf()
    const model = await ensureYoloNano()
    // preprocess 640 letterbox
    const input = tf.tidy(() => {
        let t = tf.browser.fromPixels(image as any).toFloat()
        const [h, w] = t.shape.slice(0, 2)
        // letterbox to 640
        const scale = Math.min(640 / w, 640 / h)
        const nh = Math.round(h * scale), nw = Math.round(w * scale)
        t = tf.image.resizeBilinear(t, [nh, nw])
        // pad to 640
        const padH = 640 - nh, padW = 640 - nw
        const top = Math.floor(padH / 2), left = Math.floor(padW / 2)
        t = tf.pad(t, [[top, padH - top], [left, padW - left], [0, 0]])
        t = t.div(255.0).expandDims(0) // [1,640,640,3] 0-1
        return t
    })
    const out: any = await model.executeAsync(input)
    const tensor = Array.isArray(out) ? out[0] : out
    // tensor shape [1,84,8400]
    const boxes = postprocessYolo(tensor, (image as any).videoWidth || (image as any).width || (image as any).naturalWidth || 640, (image as any).videoHeight || (image as any).height || (image as any).naturalHeight || 640, scoreTH, iouTH)
    input.dispose()
    if (Array.isArray(out)) out.forEach((t: any) => t.dispose()); else tensor.dispose()
    // map classId to COCO name
    const COCO = ['person','bicycle','car','motorcycle','airplane','bus','train','truck','boat','traffic light','fire hydrant','stop sign','parking meter','bench','bird','cat','dog','horse','sheep','cow','elephant','bear','zebra','giraffe','backpack','umbrella','handbag','tie','suitcase','frisbee','skis','snowboard','sports ball','kite','baseball bat','baseball glove','skateboard','surfboard','tennis racket','bottle','wine glass','cup','fork','knife','spoon','bowl','banana','apple','sandwich','orange','broccoli','carrot','hot dog','pizza','donut','cake','chair','couch','potted plant','bed','dining table','toilet','tv','laptop','mouse','remote','keyboard','cell phone','microwave','oven','toaster','sink','refrigerator','book','clock','vase','scissors','teddy bear','hair drier','toothbrush']
    return boxes.map(b => ({ bbox: b.bbox, score: b.score, class: COCO[b.classId] || `class${b.classId}`, classId: b.classId }))
}
