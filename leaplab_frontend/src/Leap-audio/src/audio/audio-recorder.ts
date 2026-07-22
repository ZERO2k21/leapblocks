import SharedAudioContext from './shared-audio-context'
import {computeRMS, computeChunkedRMS} from './audio-util'

interface RecordingResult {
  levels: number[]
  samples: Float32Array
  sampleRate: number
  trimStart: number
  trimEnd: number
  buffer: AudioBuffer
  blobUrl: string
}

class AudioRecorder {
  audioContext: AudioContext
  bufferLength: number
  userMediaStream: MediaStream | null
  mediaStreamSource: MediaStreamAudioSourceNode | null
  sourceNode: GainNode | null
  scriptProcessorNode: ScriptProcessorNode | null
  analyserNode: AnalyserNode | null
  recordedSamples: number
  recording: boolean
  started: boolean
  buffers: Float32Array[]
  disposed: boolean
  onComplete: ((result: RecordingResult) => void) | null

  constructor() {
    this.audioContext = new SharedAudioContext() as AudioContext
    this.bufferLength = 8192

    this.userMediaStream = null
    this.mediaStreamSource = null
    this.sourceNode = null
    this.scriptProcessorNode = null

    this.recordedSamples = 0
    this.recording = false
    this.started = false
    this.buffers = []

    this.disposed = false
    this.onComplete = null
  }

  requestDevice(): Promise<boolean> {
    return new Promise(resolve => {
      this.startListening(
        () => resolve(true),
        () => {},
        () => resolve(false)
      )
    })
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyserNode || null
  }

  startListening(onStarted: () => void, onUpdate: (rms: number) => void, onError: (e: any) => void): void {
    try {
      navigator.mediaDevices.getUserMedia({audio: true})
        .then(userMediaStream => {
          if (!this.disposed) {
            this.started = true
            onStarted()
            this.attachUserMediaStream(userMediaStream, onUpdate)
          }
        })
        .catch(e => {
          if (!this.disposed) {
            onError(e)
          }
        })
    } catch (e) {
      if (!this.disposed) {
        onError(e)
      }
    }
  }

  startRecording(): void {
    this.recording = true
  }

  start(): void {
    this.startRecording()
  }

  attachUserMediaStream(userMediaStream: MediaStream, onUpdate: (rms: number) => void): void {
    this.userMediaStream = userMediaStream
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(userMediaStream)
    this.sourceNode = this.audioContext.createGain()
    this.scriptProcessorNode = this.audioContext.createScriptProcessor(this.bufferLength, 1, 1)

    this.scriptProcessorNode.onaudioprocess = (processEvent: AudioProcessingEvent) => {
      if (this.recording && !this.disposed) {
        this.buffers.push(new Float32Array(processEvent.inputBuffer.getChannelData(0)))
      }
    }

    this.analyserNode = this.audioContext.createAnalyser()

    this.analyserNode.fftSize = 2048

    const bufferLength = this.analyserNode.frequencyBinCount
    const dataArray = new Float32Array(bufferLength)

    const update = () => {
      if (this.disposed) return
      this.analyserNode!.getFloatTimeDomainData(dataArray)
      onUpdate(computeRMS(dataArray))
      requestAnimationFrame(update)
    }

    requestAnimationFrame(update)

    this.mediaStreamSource.connect(this.sourceNode)
    this.sourceNode.connect(this.analyserNode)
    this.analyserNode.connect(this.scriptProcessorNode)
    this.scriptProcessorNode.connect(this.audioContext.destination)
  }

  stop(): RecordingResult {
    const buffer = new Float32Array(this.buffers.length * this.bufferLength)

    let offset = 0
    for (let i = 0; i < this.buffers.length; i++) {
      const bufferChunk = this.buffers[i]
      buffer.set(bufferChunk, offset)
      offset += bufferChunk.length
    }

    const chunkLevels = computeChunkedRMS(buffer)
    const maxRMS = Math.max.apply(null, chunkLevels)
    const threshold = maxRMS / 8

    let firstChunkAboveThreshold: number | null = null
    let lastChunkAboveThreshold: number | null = null
    for (let i = 0; i < chunkLevels.length; i++) {
      if (chunkLevels[i] > threshold) {
        if (firstChunkAboveThreshold === null) firstChunkAboveThreshold = i + 1
        lastChunkAboveThreshold = i + 1
      }
    }

    let trimStart = Math.max(2, firstChunkAboveThreshold! - 2) / this.buffers.length
    let trimEnd = Math.min(this.buffers.length - 2, lastChunkAboveThreshold! + 2) / this.buffers.length

    if (trimStart >= trimEnd) {
      trimStart = 0
      trimEnd = 1
    }

    const result: RecordingResult = {
      levels: chunkLevels,
      samples: buffer,
      sampleRate: this.audioContext.sampleRate,
      trimStart: trimStart,
      trimEnd: trimEnd,
      buffer: this._createAudioBuffer(buffer, this.audioContext.sampleRate),
      blobUrl: this._encodeWavBlobUrl(buffer, this.audioContext.sampleRate),
    }

    if (typeof this.onComplete === 'function') {
      this.onComplete(result)
    }

    return result
  }

  _createAudioBuffer(samples: Float32Array, sampleRate: number): AudioBuffer {
    const audioBuffer = new AudioBuffer({
      length: samples.length,
      numberOfChannels: 1,
      sampleRate: sampleRate,
    })
    audioBuffer.getChannelData(0).set(samples)
    return audioBuffer
  }

  _encodeWavBlobUrl(samples: Float32Array, sampleRate: number): string {
    const numChannels = 1
    const bitsPerSample = 16
    const bytesPerSample = bitsPerSample / 8
    const blockAlign = numChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = samples.length * bytesPerSample
    const headerSize = 44
    const totalSize = headerSize + dataSize

    const buffer = new ArrayBuffer(totalSize)
    const view = new DataView(buffer)

    this._writeString(view, 0, 'RIFF')
    view.setUint32(4, totalSize - 8, true)
    this._writeString(view, 8, 'WAVE')
    this._writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitsPerSample, true)
    this._writeString(view, 36, 'data')
    view.setUint32(40, dataSize, true)

    let offset = 44
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      offset += 2
    }

    const blob = new Blob([buffer], {type: 'audio/wav'})
    return URL.createObjectURL(blob)
  }

  _writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  dispose(): void {
    if (this.started) {
      if (this.scriptProcessorNode) {
        this.scriptProcessorNode.onaudioprocess = null
        this.scriptProcessorNode.disconnect()
      }
      if (this.analyserNode) this.analyserNode.disconnect()
      if (this.sourceNode) this.sourceNode.disconnect()
      if (this.mediaStreamSource) this.mediaStreamSource.disconnect()
      if (this.userMediaStream) {
        const tracks = this.userMediaStream.getAudioTracks()
        if (tracks[0]) tracks[0].stop()
      }
    }
    this.disposed = true
  }
}

export default AudioRecorder
