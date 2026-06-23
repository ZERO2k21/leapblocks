/**
 * AudioModel — TensorFlow.js CNN for audio classification using mel spectrograms.
 * Converts recorded audio to mel spectrograms and trains a small CNN.
 */

import { ensureTf } from '../../ml/KNNClassifier'

export interface AudioPrediction {
    label: string
    confidences: Record<string, number>
}

const SAMPLE_RATE = 16000
const FFT_SIZE = 256
const MEL_BINS = 40
const MAX_FRAMES = 98

function createMelFilterbank(): Float32Array[] {
    const filters: Float32Array[] = []
    const fftBins = FFT_SIZE / 2 + 1
    for (let m = 0; m < MEL_BINS; m++) {
        const filter = new Float32Array(fftBins)
        const lowFreq = 0
        const highFreq = SAMPLE_RATE / 2
        const lowMel = 2595 * Math.log10(1 + lowFreq / 700)
        const highMel = 2595 * Math.log10(1 + highFreq / 700)
        const melPoints: number[] = []
        for (let i = 0; i <= MEL_BINS + 2; i++) {
            melPoints.push(lowMel + (highMel - lowMel) * i / (MEL_BINS + 2))
        }
        const freqPoints = melPoints.map(mel => 700 * (10 ** (mel / 2595) - 1))
        const binPoints = freqPoints.map(f => Math.floor((FFT_SIZE + 1) * f / SAMPLE_RATE))
        for (let i = m; i < m + 3 && i < binPoints.length - 1; i++) {
            const start = binPoints[i]
            const center = binPoints[i + 1]
            const end = binPoints[i + 2] || fftBins
            for (let j = start; j < center; j++) {
                if (j >= 0 && j < fftBins) filter[j] = (j - start) / (center - start || 1)
            }
            for (let j = center; j < end; j++) {
                if (j >= 0 && j < fftBins) filter[j] = (end - j) / (end - center || 1)
            }
        }
        filters.push(filter)
    }
    return filters
}

export function audioBufferToMelSpectrogram(audioBuffer: AudioBuffer): number[][] {
    const channelData = audioBuffer.getChannelData(0)
    const melFilters = createMelFilterbank()
    const spectrogram: number[][] = []
    const hopLength = 128
    const numFrames = Math.min(Math.floor((channelData.length - FFT_SIZE) / hopLength), MAX_FRAMES)

    for (let frame = 0; frame < numFrames; frame++) {
        const start = frame * hopLength
        const windowed = new Float32Array(FFT_SIZE)
        for (let i = 0; i < FFT_SIZE; i++) {
            const hann = 0.5 * (1 - Math.cos(2 * Math.PI * i / (FFT_SIZE - 1)))
            windowed[i] = (start + i < channelData.length ? channelData[start + i] : 0) * hann
        }
        const real = new Float32Array(FFT_SIZE / 2 + 1)
        const imag = new Float32Array(FFT_SIZE / 2 + 1)
        for (let k = 0; k < FFT_SIZE / 2 + 1; k++) {
            let re = 0, im = 0
            for (let n = 0; n < FFT_SIZE; n++) {
                const angle = -2 * Math.PI * k * n / FFT_SIZE
                re += windowed[n] * Math.cos(angle)
                im += windowed[n] * Math.sin(angle)
            }
            real[k] = re
            imag[k] = im
        }
        const powerSpectrum = new Float32Array(FFT_SIZE / 2 + 1)
        for (let k = 0; k < FFT_SIZE / 2 + 1; k++) {
            powerSpectrum[k] = (real[k] * real[k] + imag[k] * imag[k]) / FFT_SIZE
        }
        const melEnergies: number[] = []
        for (let m = 0; m < MEL_BINS; m++) {
            let energy = 0
            for (let k = 0; k < FFT_SIZE / 2 + 1; k++) {
                energy += powerSpectrum[k] * melFilters[m][k]
            }
            melEnergies.push(Math.log(Math.max(energy, 1e-10)))
        }
        spectrogram.push(melEnergies)
    }
    return spectrogram
}

export async function blobToMelSpectrogram(blob: Blob): Promise<number[][] | null> {
    try {
        const arrayBuffer = await blob.arrayBuffer()
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE })
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        audioContext.close()
        return audioBufferToMelSpectrogram(audioBuffer)
    } catch (e) {
        console.error('Failed to decode audio:', e)
        return null
    }
}

export class AudioModel {
    private model: any = null
    private classes: Map<string, number[][][]> = new Map()
    private _isTrained = false
    private _accuracy = 0
    private classLabels: string[] = []

    get isTrained() { return this._isTrained }
    get accuracy() { return this._accuracy }

    addSample(className: string, spectrogram: number[][]): void {
        if (!this.classes.has(className)) this.classes.set(className, [])
        this.classes.get(className)!.push(spectrogram)
    }

    clearSamples(className?: string): void {
        if (className) this.classes.delete(className)
        else this.classes.clear()
    }

    getSampleCounts(): Record<string, number> {
        const counts: Record<string, number> = {}
        this.classes.forEach((samples, name) => { counts[name] = samples.length })
        return counts
    }

    private async buildModel(numClasses: number): Promise<any> {
        const tf = await ensureTf()
        const model = tf.sequential({
            layers: [
                tf.layers.conv2d({ inputShape: [MAX_FRAMES, MEL_BINS, 1], filters: 16, kernelSize: 3, activation: 'relu', padding: 'same' }),
                tf.layers.maxPooling2d({ poolSize: 2 }),
                tf.layers.conv2d({ filters: 32, kernelSize: 3, activation: 'relu', padding: 'same' }),
                tf.layers.maxPooling2d({ poolSize: 2 }),
                tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu', padding: 'same' }),
                tf.layers.maxPooling2d({ poolSize: 2 }),
                tf.layers.flatten(),
                tf.layers.dense({ units: 64, activation: 'relu' }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({ units: numClasses, activation: 'softmax' }),
            ],
        })
        model.compile({ optimizer: tf.train.adam(0.001), loss: 'categoricalCrossentropy', metrics: ['accuracy'] })
        return model
    }

    private padSpectrogram(spec: number[][]): number[][] {
        const padded: number[][] = []
        for (let i = 0; i < MAX_FRAMES; i++) {
            if (i < spec.length) {
                const frame = spec[i].slice()
                while (frame.length < MEL_BINS) frame.push(0)
                padded.push(frame.slice(0, MEL_BINS))
            } else {
                padded.push(new Array(MEL_BINS).fill(0))
            }
        }
        return padded
    }

    async train(onProgress?: (p: number) => void, epochs = 20): Promise<number> {
        const tf = await ensureTf()
        this.classLabels = Array.from(this.classes.keys())
        if (this.classLabels.length < 2) throw new Error('Need at least 2 classes')
        let totalSamples = 0
        this.classes.forEach(s => { totalSamples += s.length })
        if (totalSamples < 2) throw new Error('Need at least 2 samples')

        this.model = await this.buildModel(this.classLabels.length)
        const xs: any[] = []
        const ys: any[] = []
        let idx = 0
        for (let ci = 0; ci < this.classLabels.length; ci++) {
            const samples = this.classes.get(this.classLabels[ci]) || []
            for (const spec of samples) {
                const padded = this.padSpectrogram(spec)
                const tensor = tf.tensor4d(padded.flat(), [1, MAX_FRAMES, MEL_BINS, 1])
                xs.push(tensor)
                const labelTensor = tf.tidy(() => tf.oneHot(tf.tensor1d([ci], 'int32'), this.classLabels.length))
                ys.push(labelTensor)
                idx++
                onProgress?.(Math.round((idx / totalSamples) * 30))
            }
        }

        const xBatch = tf.concat(xs, 0)
        const yBatch = tf.concat(ys, 0)
        xs.forEach((t: any) => t.dispose())
        ys.forEach((t: any) => t.dispose())

        onProgress?.(35)
        let finalAcc = 0
        await this.model.fit(xBatch, yBatch, {
            epochs,
            batchSize: 8,
            shuffle: true,
            validationSplit: totalSamples > 4 ? 0.15 : 0,
            callbacks: {
                onEpochEnd: async (epoch: number, logs: any) => {
                    finalAcc = logs?.acc || logs?.accuracy || 0
                    onProgress?.(35 + Math.round(((epoch + 1) / epochs) * 65))
                    await tf.nextFrame()
                }
            }
        })
        xBatch.dispose()
        yBatch.dispose()

        this._isTrained = true
        this._accuracy = finalAcc
        return finalAcc
    }

    async predict(spectrogram: number[][]): Promise<AudioPrediction | null> {
        if (!this.model) return null
        const tf = await ensureTf()
        const padded = this.padSpectrogram(spectrogram)
        const tensor = tf.tensor4d(padded.flat(), [1, MAX_FRAMES, MEL_BINS, 1])
        const pred = this.model.predict(tensor) as any
        const confidences = await pred.data()
        tensor.dispose()
        pred.dispose()

        const result: Record<string, number> = {}
        let maxConf = 0, maxLabel = this.classLabels[0] || ''
        for (let i = 0; i < this.classLabels.length; i++) {
            result[this.classLabels[i]] = confidences[i]
            if (confidences[i] > maxConf) {
                maxConf = confidences[i]
                maxLabel = this.classLabels[i]
            }
        }
        return { label: maxLabel, confidences: result }
    }

    dispose(): void {
        if (this.model) { this.model.dispose(); this.model = null }
        this._isTrained = false
    }
}
