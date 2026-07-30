import { KNNClassifier, ensureTf } from '../KNNClassifier'
import { ensureSpeechCommands } from '../loadScript'

export interface AudioPrediction {
    label: string
    confidences: Record<string, number>
}

export class AudioClassifier {
    private knn = new KNNClassifier()
    private audioContext: AudioContext | null = null
    private recognizer: any = null
    private recognizerLoaded = false

    private getAudioContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        return this.audioContext
    }

    private async ensureRecognizer(): Promise<any> {
        if (this.recognizerLoaded && this.recognizer) return this.recognizer
        const sc = await ensureSpeechCommands()
        this.recognizer = sc.create('BROWSER_FFT')
        await this.recognizer.ensureModelLoaded()
        this.recognizerLoaded = true
        return this.recognizer
    }

    private async extractFeatures(audioBuffer: AudioBuffer): Promise<Float32Array> {
        const rawData = audioBuffer.getChannelData(0)
        const recognizer = await this.ensureRecognizer()
        const fftSize = recognizer.params().fftSize || 1024
        const numFrames = recognizer.params().spectrogramLength || 232
        const numFreqBins = fftSize / 2 + 1
        const targetLength = numFrames * fftSize

        let samples: Float32Array
        if (rawData.length > targetLength) {
            samples = rawData.slice(0, targetLength)
        } else {
            samples = new Float32Array(targetLength)
            samples.set(rawData)
        }

        const hann = new Float32Array(fftSize)
        for (let i = 0; i < fftSize; i++) {
            hann[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)))
        }

        const features = new Float32Array(numFreqBins)
        for (let i = 0; i < numFrames; i++) {
            const start = i * (fftSize / 2)
            const real = new Float64Array(fftSize)
            const imag = new Float64Array(fftSize)
            for (let j = 0; j < fftSize; j++) {
                real[j] = (samples[start + j] ?? 0) * hann[j]
            }

            const n = fftSize
            for (let len = 2; len <= n; len *= 2) {
                const halfLen = len / 2
                const angleStep = -2 * Math.PI / len
                for (let i2 = 0; i2 < n; i2 += len) {
                    for (let j2 = 0; j2 < halfLen; j2++) {
                        const wRe = Math.cos(angleStep * j2)
                        const wIm = Math.sin(angleStep * j2)
                        const tRe = real[i2 + j2 + halfLen] * wRe - imag[i2 + j2 + halfLen] * wIm
                        const tIm = real[i2 + j2 + halfLen] * wIm + imag[i2 + j2 + halfLen] * wRe
                        real[i2 + j2 + halfLen] = real[i2 + j2] - tRe
                        imag[i2 + j2 + halfLen] = imag[i2 + j2] - tIm
                        real[i2 + j2] = real[i2 + j2] + tRe
                        imag[i2 + j2] = imag[i2 + j2] + tIm
                    }
                }
            }

            for (let j = 0; j < numFreqBins; j++) {
                features[j] += Math.sqrt(real[j] * real[j] + imag[j] * imag[j])
            }
        }

        for (let j = 0; j < numFreqBins; j++) {
            features[j] = Math.log(features[j] / numFrames + 1e-10)
        }

        return features
    }

    async addSample(features: number[], label: string) {
        const tf = await ensureTf()
        const embedding = tf.tensor1d(new Float32Array(features))
        await this.knn.addExample(embedding, label)
        embedding.dispose()
    }

    async addSampleFromBuffer(audioBuffer: AudioBuffer, label: string) {
        const features = await this.extractFeatures(audioBuffer)
        const tf = await ensureTf()
        const embedding = tf.tensor1d(features)
        await this.knn.addExample(embedding, label)
        embedding.dispose()
    }

    async addSampleFromRecording(audioBlob: Blob, label: string) {
        const ctx = this.getAudioContext()
        const arrayBuffer = await audioBlob.arrayBuffer()
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        await this.addSampleFromBuffer(audioBuffer, label)
    }

    async extractFeaturesFromRecording(audioBlob: Blob): Promise<number[]> {
        const ctx = this.getAudioContext()
        const arrayBuffer = await audioBlob.arrayBuffer()
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        const features = await this.extractFeatures(audioBuffer)
        return Array.from(features)
    }

    async captureFromStream(stream: MediaStream, durationMs = 2000): Promise<Blob> {
        const ctx = this.getAudioContext()
        if (ctx.state === 'suspended') await ctx.resume()
        const source = ctx.createMediaStreamSource(stream)
        const processor = ctx.createScriptProcessor(4096, 1, 1)

        const chunks: Float32Array[] = []
        processor.onaudioprocess = (e) => {
            const data = new Float32Array(e.inputBuffer.getChannelData(0))
            chunks.push(data)
        }

        source.connect(processor)
        processor.connect(ctx.destination)

        return new Promise((resolve) => {
            setTimeout(() => {
                processor.disconnect()
                source.disconnect()

                const totalLength = chunks.reduce((acc, c) => acc + c.length, 0)
                const merged = new Float32Array(totalLength)
                let offset = 0
                for (const chunk of chunks) {
                    merged.set(chunk, offset)
                    offset += chunk.length
                }

                const buffer = ctx.createBuffer(1, merged.length, ctx.sampleRate)
                buffer.getChannelData(0).set(merged)

                const wavBlob = this.audioBufferToWav(buffer)
                resolve(wavBlob)
            }, durationMs)
        })
    }

    async importFromFile(file: File, label: string): Promise<number[]> {
        const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/wave', 'audio/x-wav']
        const validExtensions = ['.wav', '.mp3']
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()

        if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
            throw new Error('Unsupported file format. Please use .wav or .mp3 files.')
        }

        if (file.size > 10 * 1024 * 1024) {
            throw new Error('File too large. Maximum size is 10MB.')
        }

        const ctx = this.getAudioContext()
        const arrayBuffer = await file.arrayBuffer()
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        const features = await this.extractFeatures(audioBuffer)
        const featuresArray = Array.from(features)

        await this.addSample(featuresArray, label)

        return featuresArray
    }

    async predictFromFile(file: File, k = 5): Promise<AudioPrediction | null> {
        const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/wave', 'audio/x-wav']
        const validExtensions = ['.wav', '.mp3']
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()

        if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
            throw new Error('Unsupported file format. Please use .wav or .mp3 files.')
        }

        const ctx = this.getAudioContext()
        const arrayBuffer = await file.arrayBuffer()
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        const features = await this.extractFeatures(audioBuffer)
        const featuresArray = Array.from(features)

        return this.predict(featuresArray, k)
    }

    async predict(features: number[], k = 5): Promise<AudioPrediction | null> {
        const tf = await ensureTf()
        const embedding = tf.tensor1d(new Float32Array(features))
        const result = await this.knn.predictClass(embedding, k)
        embedding.dispose()
        return result
    }

    async predictFromBuffer(audioBuffer: AudioBuffer, k = 5): Promise<AudioPrediction | null> {
        const features = await this.extractFeatures(audioBuffer)
        const tf = await ensureTf()
        const embedding = tf.tensor1d(features)
        const result = await this.knn.predictClass(embedding, k)
        embedding.dispose()
        return result
    }

    async predictFromRecording(audioBlob: Blob, k = 5): Promise<AudioPrediction | null> {
        const ctx = this.getAudioContext()
        const arrayBuffer = await audioBlob.arrayBuffer()
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        return this.predictFromBuffer(audioBuffer, k)
    }

    async recordMicrophone(durationMs = 2000): Promise<Blob> {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const ctx = this.getAudioContext()
        const source = ctx.createMediaStreamSource(stream)
        const processor = ctx.createScriptProcessor(4096, 1, 1)

        const chunks: Float32Array[] = []
        processor.onaudioprocess = (e) => {
            const data = new Float32Array(e.inputBuffer.getChannelData(0))
            chunks.push(data)
        }

        source.connect(processor)
        processor.connect(ctx.destination)

        return new Promise((resolve) => {
            setTimeout(() => {
                processor.disconnect()
                source.disconnect()
                stream.getTracks().forEach(t => t.stop())

                const totalLength = chunks.reduce((acc, c) => acc + c.length, 0)
                const merged = new Float32Array(totalLength)
                let offset = 0
                for (const chunk of chunks) {
                    merged.set(chunk, offset)
                    offset += chunk.length
                }

                const buffer = ctx.createBuffer(1, merged.length, ctx.sampleRate)
                buffer.getChannelData(0).set(merged)

                const wavBlob = this.audioBufferToWav(buffer)
                resolve(wavBlob)
            }, durationMs)
        })
    }

    private audioBufferToWav(buffer: AudioBuffer): Blob {
        const numChannels = 1
        const sampleRate = buffer.sampleRate
        const format = 1
        const bitDepth = 16
        const data = buffer.getChannelData(0)
        const dataLength = data.length * 2
        const headerLength = 44
        const arrayBuffer = new ArrayBuffer(headerLength + dataLength)
        const view = new DataView(arrayBuffer)

        const writeString = (offset: number, str: string) => {
            for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
        }

        writeString(0, 'RIFF')
        view.setUint32(4, 36 + dataLength, true)
        writeString(8, 'WAVE')
        writeString(12, 'fmt ')
        view.setUint32(16, 16, true)
        view.setUint16(20, format, true)
        view.setUint16(22, numChannels, true)
        view.setUint32(24, sampleRate, true)
        view.setUint32(28, sampleRate * numChannels * bitDepth / 8, true)
        view.setUint16(32, numChannels * bitDepth / 8, true)
        view.setUint16(34, bitDepth, true)
        writeString(36, 'data')
        view.setUint32(40, dataLength, true)

        let offset = 44
        for (let i = 0; i < data.length; i++) {
            const sample = Math.max(-1, Math.min(1, data[i]))
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
            offset += 2
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' })
    }

    getSampleCounts(): Record<string, number> {
        return this.knn.getSampleCounts()
    }

    get classCount(): number {
        return this.knn.classCount
    }

    get canClassify(): boolean {
        return this.knn.canClassify
    }

    clear(): void {
        this.knn.clear()
    }

    clearClass(label: string): void {
        this.knn.clearClass(label)
    }

    dispose(): void {
        this.knn.dispose()
        if (this.recognizer && this.recognizer.dispose) {
            try { this.recognizer.dispose() } catch {}
        }
        if (this.audioContext) {
            this.audioContext.close()
            this.audioContext = null
        }
    }
}
