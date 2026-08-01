import { KNNClassifier, ensureTf } from '../KNNClassifier'
import { ensureYamNet } from '../loadScript'

export interface AudioPrediction {
    label: string
    confidences: Record<string, number>
}

const YAMNET_SAMPLE_RATE = 16000
const YAMNET_FRAME_LENGTH = 15600

export class AudioClassifier {
    private knn = new KNNClassifier()
    private audioContext: AudioContext | null = null

    private getAudioContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        return this.audioContext
    }

    private async extractEmbedding(audioBuffer: AudioBuffer): Promise<Float32Array> {
        const tf = await ensureTf()
        const yamnet = await ensureYamNet()

        const rawData = audioBuffer.getChannelData(0)
        const targetLength = YAMNET_FRAME_LENGTH
        const midStart = Math.max(0, Math.floor((rawData.length - targetLength) / 2))
        const samples = new Float32Array(targetLength)
        for (let i = 0; i < targetLength; i++) {
            samples[i] = rawData[Math.min(midStart + i, rawData.length - 1)] ?? 0
        }

        const inputTensor = tf.tensor1d(samples)
        const result = await yamnet.executeAsync(inputTensor)
        const emb = result[1] as any
        const meanEmb = tf.mean(emb, 0) as any
        inputTensor.dispose()
        tf.dispose(emb)

        const embData = Array.from(await meanEmb.data()) as number[]
        tf.dispose(meanEmb)

        const norm = Math.sqrt(embData.reduce((s, v) => s + v * v, 0))
        const normalized = new Float32Array(embData.map(v => v / Math.max(norm, 1e-10)))
        return normalized
    }

    async addSample(features: number[], label: string) {
        const tf = await ensureTf()
        const embedding = tf.tensor1d(new Float32Array(features))
        await this.knn.addExample(embedding, label)
        embedding.dispose()
    }

    async addSampleFromBuffer(audioBuffer: AudioBuffer, label: string) {
        const embedding = await this.extractEmbedding(audioBuffer)
        const tf = await ensureTf()
        const tensor = tf.tensor1d(embedding)
        await this.knn.addExample(tensor, label)
        tensor.dispose()
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
        const features = await this.extractEmbedding(audioBuffer)
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
        const features = await this.extractEmbedding(audioBuffer)
        const featuresArray = Array.from(features)

        await this.addSample(featuresArray, label)

        return featuresArray
    }

    async predict(features: number[], k = 5): Promise<AudioPrediction | null> {
        const tf = await ensureTf()
        const embedding = tf.tensor1d(new Float32Array(features))
        const result = await this.knn.predictClass(embedding, k)
        embedding.dispose()
        return result
    }

    async predictFromBuffer(audioBuffer: AudioBuffer, k = 5): Promise<AudioPrediction | null> {
        const features = await this.extractEmbedding(audioBuffer)
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
