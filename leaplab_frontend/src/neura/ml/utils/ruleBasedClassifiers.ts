/**
 * Rule-based classifiers for pose projects.
 * These replace KNN classification where deterministic rules are more appropriate.
 */

export interface ClassificationResult {
    label: string
    confidence: number
    details: Record<string, number>
}

/**
 * M1-1: Rule-based finger counting.
 * Uses HandPoseClassifier features[63-67] (finger extension flags).
 * Returns count of extended fingers (0-5).
 */
export function classifyFingerCount(features: Float32Array): ClassificationResult {
    // features[63]=index, [64]=middle, [65]=ring, [66]=pinky, [67]=thumb
    const fingerNames = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five']
    const flags = features.length >= 68 ? [
        features[67], // thumb
        features[63], // index
        features[64], // middle
        features[65], // ring
        features[66]  // pinky
    ] : [0, 0, 0, 0, 0]

    const count = flags.reduce((sum, f) => sum + (f > 0.5 ? 1 : 0), 0)

    return {
        label: fingerNames[count] || 'Zero',
        confidence: 0.95,
        details: {
            'Zero': count === 0 ? 1 : 0,
            'One': count === 1 ? 1 : 0,
            'Two': count === 2 ? 1 : 0,
            'Three': count === 3 ? 1 : 0,
            'Four': count === 4 ? 1 : 0,
            'Five': count === 5 ? 1 : 0
        }
    }
}

/**
 * M1-4: Rule-based drawing mode detection.
 * Detects 4 gestures: draw, erase, move, color-select.
 * - Draw: only index finger extended (pointing)
 * - Erase: closed fist (no fingers extended)
 * - Move: peace sign (index + middle extended)
 * - Color Select: open hand (3+ fingers extended)
 */
export function classifyDrawErase(features: Float32Array): ClassificationResult {
    const indexExtended = features.length > 63 && features[63] > 0.5
    const middleExtended = features.length > 64 && features[64] > 0.5
    const ringExtended = features.length > 65 && features[65] > 0.5
    const pinkyExtended = features.length > 66 && features[66] > 0.5
    const thumbExtended = features.length > 67 && features[67] > 0.5

    const fingerCount = [indexExtended, middleExtended, ringExtended, pinkyExtended, thumbExtended].filter(Boolean).length

    let label: string
    if (fingerCount === 0) {
        label = 'erase'
    } else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
        label = 'move'
    } else if (fingerCount >= 3) {
        label = 'color-select'
    } else if (indexExtended && !middleExtended) {
        label = 'draw'
    } else {
        label = 'erase'
    }

    return {
        label,
        confidence: 0.9,
        details: {
            'draw': label === 'draw' ? 1 : 0,
            'erase': label === 'erase' ? 1 : 0,
            'move': label === 'move' ? 1 : 0,
            'color-select': label === 'color-select' ? 1 : 0,
        }
    }
}

/**
 * M1-2: Rule-based virtual piano key detection.
 * Maps fingertip position to piano key zone.
 * @param features HandPoseClassifier 78-d features
 * @param videoWidth Width of video frame
 * @param videoHeight Height of video frame
 * @param numKeys Number of piano keys (default 7)
 */
const PIANO_NOTE_NAMES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si']

export function classifyPianoKey(
    features: Float32Array,
    videoWidth: number,
    videoHeight: number,
    numKeys: number = 7
): ClassificationResult {
    // Index fingertip is landmark 8, normalized coordinates are in features[24-25] (index tip x,y)
    // features[24] = index_tip.x normalized, features[25] = index_tip.y normalized
    if (features.length < 26) {
        return { label: 'none', confidence: 0, details: {} }
    }

    const tipX = features[24] // index fingertip x (0-1)
    const tipY = features[25] // index fingertip y (0-1)

    // Only trigger if index finger is extended
    const indexExtended = features.length > 63 && features[63] > 0.5
    if (!indexExtended) {
        return { label: 'none', confidence: 0, details: {} }
    }

    // Map x position to key index (0 to numKeys-1)
    const keyIndex = Math.min(numKeys - 1, Math.max(0, Math.floor(tipX * numKeys)))
    const keyName = PIANO_NOTE_NAMES[keyIndex] || `key_${keyIndex}`

    const details: Record<string, number> = {}
    for (let i = 0; i < numKeys; i++) {
        const name = PIANO_NOTE_NAMES[i] || `key_${i}`
        details[name] = i === keyIndex ? 1 : 0
    }

    return {
        label: keyName,
        confidence: 0.85,
        details
    }
}

/**
 * M2-2: Rule-based rep counter for exercises.
 * Uses PoseClassifier angle features to detect squat/standing positions.
 * @param features PoseClassifier 61-d features
 * @param exerciseType 'squat' | 'bicep' | 'jumpingjack'
 */
export function classifyRepState(
    features: Float32Array,
    exerciseType: string = 'squat'
): ClassificationResult {
    // features[51]=left_knee_angle, features[52]=right_knee_angle (normalized 0-1)
    if (features.length < 53) {
        return { label: 'unknown', confidence: 0, details: {} }
    }

    const leftKnee = features[51]
    const rightKnee = features[52]
    const avgKnee = (leftKnee + rightKnee) / 2

    if (exerciseType === 'squat') {
        // Squat: knee angle < 0.4 = down, > 0.6 = up
        const isDown = avgKnee < 0.4
        const isUp = avgKnee > 0.6
        return {
            label: isDown ? 'down' : isUp ? 'up' : 'transition',
            confidence: isDown || isUp ? 0.9 : 0.5,
            details: { down: isDown ? 1 : 0, up: isUp ? 1 : 0, transition: (!isDown && !isUp) ? 1 : 0 }
        }
    }

    return { label: 'unknown', confidence: 0, details: {} }
}

/**
 * M2-4: Rule-based sitting posture monitor.
 * Uses PoseClassifier angle features to assess posture quality.
 * Returns 'good', 'slouching', 'leaning_left', or 'leaning_right'.
 */
export function classifyPosture(features: Float32Array): ClassificationResult {
    // features[55]=shoulder_tilt, features[56]=hip_tilt, features[57]=torso_angle, features[58]=neck_angle
    if (features.length < 59) {
        return { label: 'unknown', confidence: 0, details: {} }
    }

    const shoulderTilt = features[55]
    const hipTilt = features[56]
    const torsoAngle = features[57]
    const neckAngle = features[58]

    // Good posture: shoulders level (0.4-0.6), torso upright (0.4-0.6)
    const shouldersLevel = shoulderTilt > 0.35 && shoulderTilt < 0.65
    const torsoUpright = torsoAngle > 0.35 && torsoAngle < 0.65

    if (shouldersLevel && torsoUpright) {
        return { label: 'good', confidence: 0.9, details: { good: 1 } }
    }

    // Leaning left or right based on shoulder tilt
    if (shoulderTilt <= 0.35) {
        return { label: 'leaning_left', confidence: 0.8, details: { leaning_left: 1 } }
    }
    if (shoulderTilt >= 0.65) {
        return { label: 'leaning_right', confidence: 0.8, details: { leaning_right: 1 } }
    }

    // Slouching: torso not upright
    return { label: 'slouching', confidence: 0.7, details: { slouching: 1 } }
}

/**
 * Majority Vote smoothing for classification labels.
 * Returns the most frequent label in the buffer.
 */
export class MajorityVoteBuffer {
    private buffer: string[] = []
    private bufferSize: number

    constructor(bufferSize: number = 5) {
        this.bufferSize = bufferSize
    }

    add(label: string): string {
        this.buffer.push(label)
        if (this.buffer.length > this.bufferSize) {
            this.buffer.shift()
        }
        return this.getMostFrequent()
    }

    getMostFrequent(): string {
        if (this.buffer.length === 0) return ''
        const counts: Record<string, number> = {}
        for (const label of this.buffer) {
            counts[label] = (counts[label] || 0) + 1
        }
        let maxCount = 0
        let mostFrequent = this.buffer[0]
        for (const [label, count] of Object.entries(counts)) {
            if (count > maxCount) {
                maxCount = count
                mostFrequent = label
            }
        }
        return mostFrequent
    }

    clear(): void {
        this.buffer = []
    }
}

/**
 * State Machine smoothing for mode changes.
 * Requires N consecutive consistent frames before switching states.
 */
export class StateMachineBuffer {
    private currentState: string = ''
    private candidateState: string = ''
    private candidateCount: number = 0
    private requiredCount: number

    constructor(requiredCount: number = 3) {
        this.requiredCount = requiredCount
    }

    update(label: string): string {
        if (label === this.candidateState) {
            this.candidateCount++
            if (this.candidateCount >= this.requiredCount) {
                this.currentState = label
            }
        } else {
            this.candidateState = label
            this.candidateCount = 1
        }
        return this.currentState
    }

    getCurrentState(): string {
        return this.currentState
    }

    clear(): void {
        this.currentState = ''
        this.candidateState = ''
        this.candidateCount = 0
    }
}

/**
 * Hold Time buffer.
 * Only returns label if held for minimum duration.
 */
export class HoldTimeBuffer {
    private currentLabel: string = ''
    private holdStartTime: number = 0
    private minHoldTimeMs: number

    constructor(minHoldTimeMs: number = 2000) {
        this.minHoldTimeMs = minHoldTimeMs
    }

    update(label: string): string | null {
        const now = Date.now()
        if (label !== this.currentLabel) {
            this.currentLabel = label
            this.holdStartTime = now
            return null
        }
        if (now - this.holdStartTime >= this.minHoldTimeMs) {
            return label
        }
        return null
    }

    clear(): void {
        this.currentLabel = ''
        this.holdStartTime = 0
    }
}

/**
 * Zone Debounce buffer for piano keys.
 * Only triggers once per zone entry.
 */
export class ZoneDebounceBuffer {
    private lastZone: string = ''
    private triggered: boolean = false

    update(zone: string): string | null {
        if (zone !== this.lastZone) {
            this.lastZone = zone
            this.triggered = false
        }
        if (!this.triggered && zone !== 'none') {
            this.triggered = true
            return zone
        }
        return null
    }

    clear(): void {
        this.lastZone = ''
        this.triggered = false
    }
}
