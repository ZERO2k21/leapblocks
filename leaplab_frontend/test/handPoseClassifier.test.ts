import { describe, it, expect, vi } from 'vitest'
import { HandPoseClassifier, type HandKeypoint } from '../src/neura/ml/classifiers/HandPoseClassifier'

describe('HandPoseClassifier.detectHand guard', () => {
    const classifier = new HandPoseClassifier()

    it('returns [] for a video with no frame yet (videoWidth === 0) without touching MediaPipe', async () => {
        // ensureModel must never be reached — it would try to import MediaPipe/wasm.
        const spy = vi.spyOn(classifier as any, 'ensureModel')
        const video = { videoWidth: 0, videoHeight: 0, readyState: 0 } as unknown as HTMLVideoElement
        const result = await classifier.detectHand(video)
        expect(result).toEqual([])
        expect(spy).not.toHaveBeenCalled()
        spy.mockRestore()
    })

    it('returns [] when only metadata is loaded (readyState 1) but no decoded frame exists', async () => {
        const spy = vi.spyOn(classifier as any, 'ensureModel')
        // This is the exact failure from the console: videoWidth > 0 but texImage2D gets no data.
        const video = { videoWidth: 640, videoHeight: 480, readyState: 1 } as unknown as HTMLVideoElement
        const result = await classifier.detectHand(video)
        expect(result).toEqual([])
        expect(spy).not.toHaveBeenCalled()
        spy.mockRestore()
    })
})

describe('HandPoseClassifier.extractFeatures finger scoring', () => {
    const classifier = new HandPoseClassifier()

    // Build a synthetic 21-landmark hand. Each finger is a polyline through
    // mcp -> pip -> dip -> tip. `extend` (0..1) interpolates the tip toward the
    // palm so the PIP angle shrinks (finger curls). Thumb is posed straight + abducted.
    function makeHand(opts: {
        indexExtend?: number
        middleExtend?: number
        ringExtend?: number
        pinkyExtend?: number
        thumbExtend?: number
    }): HandKeypoint[] {
        const { indexExtend = 1, middleExtend = 1, ringExtend = 1, pinkyExtend = 1, thumbExtend = 1 } = opts
        const kp: HandKeypoint[] = []
        const add = (name: string, x: number, y: number) => kp.push({ name, x, y, score: 1 })

        const finger = (name: string, x: number, length: number, extend: number) => {
            const mcpY = 0.5
            const pipY = mcpY - 0.2 * length
            const dipY = pipY - 0.2 * length
            // Fully curled (extend=0): tip folds right back onto the PIP joint so the
            // angle at the PIP collapses toward 0°. Fully extended (extend=1): tip is
            // straight past the DIP.
            const tipY = dipY - (0.3 * length) * extend
            const tipX = x + (0.35 * length) * (1 - extend)
            add(`${name}_mcp`, x, mcpY)
            add(`${name}_pip`, x, pipY)
            add(`${name}_dip`, x, dipY)
            add(`${name}_tip`, tipX, tipY)
        }

        add('wrist', 0.5, 0.6)
        // Thumb: straight + abducted when extended; curled toward the palm when folded.
        // Curling bends the IP joint toward the index mcp (small angle) and brings the
        // tip close to the index -> fails BOTH straightness and abduction checks.
        add('thumb_cmc', 0.5, 0.52)
        add('thumb_mcp', 0.4, 0.5)
        add('thumb_ip', 0.3, 0.48)
        add('thumb_tip', 0.2 - 0.05 * (1 - thumbExtend), 0.46) // straight out
        if (thumbExtend < 1) {
            // Re-pose as a curled thumb folded into the palm.
            kp[4] = {
                name: 'thumb_tip',
                x: 0.38,
                y: 0.5, // next to the index mcp, curled
                score: 1,
            }
            kp[3] = { name: 'thumb_ip', x: 0.36, y: 0.44, score: 1 }
        }

        finger('index', 0.5, 1, indexExtend)
        finger('middle', 0.62, 1.1, middleExtend)
        finger('ring', 0.72, 1.05, ringExtend)
        finger('pinky', 0.82, 0.9, pinkyExtend)

        return kp
    }

    it('marks all four fingers extended when straight', () => {
        const f = classifier.extractFeatures(makeHand({}))
        expect(f[63]).toBeGreaterThan(0.9) // index
        expect(f[64]).toBeGreaterThan(0.9) // middle
        expect(f[65]).toBeGreaterThan(0.9) // ring
        expect(f[66]).toBeGreaterThan(0.9) // pinky
    })

    it('marks fingers curled when bent', () => {
        const f = classifier.extractFeatures(makeHand({ indexExtend: 0.1, middleExtend: 0.2 }))
        expect(f[63]).toBeLessThan(0.3)
        expect(f[64]).toBeLessThan(0.3)
        // Uncurled fingers in the same pose must still read as extended.
        expect(f[65]).toBeGreaterThan(0.8)
        expect(f[66]).toBeGreaterThan(0.8)
    })

    it('scores an extended thumb high (straight AND abducted)', () => {
        const f = classifier.extractFeatures(makeHand({ thumbExtend: 1 }))
        expect(f[67]).toBeGreaterThan(0.7)
    })

    it('scores a folded thumb low', () => {
        const f = classifier.extractFeatures(makeHand({ thumbExtend: 0 }))
        expect(f[67]).toBeLessThan(0.4)
    })

    it('feature vector is 78-d and flags stay in [0,1]', () => {
        const f = classifier.extractFeatures(makeHand({}))
        expect(f.length).toBe(78)
        for (let i = 63; i <= 67; i++) {
            expect(f[i]).toBeGreaterThanOrEqual(0)
            expect(f[i]).toBeLessThanOrEqual(1)
        }
    })
})
