import { KNNClassifier, ensureTf } from '../KNNClassifier'

export interface AudioPrediction {
    label: string
    confidences: Record<string, number>
}

export class AudioClassifier {
    private knn = new KNNClassifier()
    private audioContext: AudioContext | null = null

    private getAudioContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        return this.audioContext
    }

    private async extractFeatures(audioBuffer: AudioBuffer): Promise<Float32Array> {
        const rawData = audioBuffer.getChannelData(0)
        const targetLength = 22050
        let samples: Float32Array
        if (rawData.length > targetLength) {
            samples = rawData.slice(0, targetLength)
        } else {
            samples = new Float32Array(targetLength)
            samples.set(rawData)
        }

        const fftSize = 1024
        const numFrames = Math.floor((samples.length - fftSize) / (fftSize / 2))
        const numMelBands = 13
        const melFeatures: number[] = []

        for (let i = 0; i < Math.min(numFrames, 40); i++) {
            const start = i * (fftSize / 2)
            const frame = samples.slice(start, start + fftSize)

            const windowed = new Float32Array(fftSize)
            for (let j = 0; j < fftSize; j++) {
                windowed[j] = frame[j] * (0.54 - 0.46 * Math.cos(2 * Math.PI * j / (fftSize - 1)))
            }

            const magnitudes: number[] = []
            for (let k = 0; k < fftSize / 2; k++) {
                let real = 0, imag = 0
                for (let n = 0; n < fftSize; n++) {
                    const angle = (2 * Math.PI * k * n) / fftSize
                    real += windowed[n] * Math.cos(angle)
                    imag -= windowed[n] * Math.sin(angle)
                }
                magnitudes.push(Math.sqrt(real * real + imag * imag))
            }

            const energies: number[] = []
            for (let m = 0; m < numMelBands; m++) {
                const lowFreq = Math.floor(m * (fftSize / 2) / numMelBands)
                const highFreq = Math.floor((m + 1) * (fftSize / 2) / numMelBands)
                let energy = 0
                for (let f = lowFreq; f < highFreq; f++) {
                    energy += magnitudes[f] * magnitudes[f]
                }
                energies.push(Math.log(energy + 1e-10))
            }

            melFeatures.push(...energies)
        }

        const featureVector = new Float32Array(numMelBands)
        for (let i = 0; i < numMelBands; i++) {
            let sum = 0
            for (let j = 0; j < Math.min(melFeatures.length / numMelBands, 40); j++) {
                sum += melFeatures[j * numMelBands + i]
            }
            featureVector[i] = sum / Math.min(melFeatures.length / numMelBands, 40)
        }

        return featureVector
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
        if (this.audioContext) {
            this.audioContext.close()
            this.audioContext = null
        }
    }
}
