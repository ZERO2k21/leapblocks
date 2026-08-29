import { ensureTf } from '../loadScript'
import type { TabularConfig, TabularTrainMetrics, TabularColumnInfo, TabularModelExport } from '../../types/neura.types'
import { encodeRows, encodeSingleInput } from '../utils/encoding'

export interface TabularPrediction {
    value: string | number
    confidence?: number
    probabilities?: Record<string, number>
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
    const result = [...arr]
    let s = seed
    for (let i = result.length - 1; i > 0; i--) {
        s = (s * 16807 + 0) % 2147483647
        const j = s % (i + 1)
        ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

export class TabularClassifier {
    private model: any = null
    private featureMin: number[] = []
    private featureMax: number[] = []
    private classLabels: string[] = []
    private labelMaps: Record<string, Record<string, number>> = {}
    private trained = false
    private columnInfos: TabularColumnInfo[] = []

    async train(
        encodedData: number[][],
        targetIndex: number,
        featureIndices: number[],
        config: TabularConfig,
        columnInfos: TabularColumnInfo[],
        onEpochEnd?: (metrics: TabularTrainMetrics) => void
    ): Promise<{ trainLoss: number; valAccuracy: number }> {
        const tf = await ensureTf()
        this.columnInfos = columnInfos
        this.trained = false

        const targetInfo = columnInfos[targetIndex]
        if (targetInfo.type === 'text' && targetInfo.labelMap) {
            this.classLabels = Object.keys(targetInfo.labelMap).sort()
            this.labelMaps[targetInfo.name] = targetInfo.labelMap
        }

        let indices = encodedData.map((_, i) => i)
        if (config.seed !== undefined) {
            indices = seededShuffle(indices, config.seed)
        } else {
            indices = seededShuffle(indices, Date.now() % 100000)
        }

        const splitIdx = Math.floor(indices.length * (1 - config.valSplit))
        const trainIndices = indices.slice(0, splitIdx)
        const valIndices = indices.slice(splitIdx)

        const trainFeatures = trainIndices.map(i => featureIndices.map(fi => encodedData[i][fi]))
        const valFeatures = valIndices.map(i => featureIndices.map(fi => encodedData[i][fi]))
        const trainTargets = trainIndices.map(i => encodedData[i][targetIndex])
        const valTargets = valIndices.map(i => encodedData[i][targetIndex])

        this.featureMin = new Array(featureIndices.length).fill(Infinity)
        this.featureMax = new Array(featureIndices.length).fill(-Infinity)
        for (const row of trainFeatures) {
            for (let i = 0; i < row.length; i++) {
                if (row[i] < this.featureMin[i]) this.featureMin[i] = row[i]
                if (row[i] > this.featureMax[i]) this.featureMax[i] = row[i]
            }
        }

        const normTrain = this.normalizeFeatures(trainFeatures)
        const normVal = this.normalizeFeatures(valFeatures)

        const numFeatures = featureIndices.length
        const isClassification = config.taskType === 'classification'
        const numClasses = isClassification ? this.classLabels.length || new Set(trainTargets.map(t => Math.round(t))).size : 0

        this.model = tf.sequential()

        if (numFeatures <= 10) {
            this.model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [numFeatures] }))
        } else if (numFeatures <= 50) {
            this.model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [numFeatures] }))
            this.model.add(tf.layers.dense({ units: 16, activation: 'relu' }))
        } else {
            this.model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [numFeatures] }))
            this.model.add(tf.layers.dense({ units: 32, activation: 'relu' }))
            this.model.add(tf.layers.dense({ units: 16, activation: 'relu' }))
        }

        if (isClassification && numClasses > 2) {
            this.model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }))
        } else if (isClassification && numClasses === 2) {
            this.model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))
        } else {
            this.model.add(tf.layers.dense({ units: 1 }))
        }

        const loss = isClassification
            ? numClasses > 2 ? 'categoricalCrossentropy' : 'binaryCrossentropy'
            : 'meanSquaredError'

        const metrics = isClassification ? ['accuracy'] : ['mse']

        this.model.compile({
            optimizer: tf.train.adam(config.learningRate),
            loss,
            metrics
        })

        const trainX = tf.tensor2d(normTrain)
        let trainY: any
        if (isClassification && numClasses > 2) {
            trainY = tf.tidy(() => {
                const targets = tf.tensor1d(trainTargets, 'int32')
                return tf.oneHot(targets, numClasses).toFloat()
            })
        } else if (isClassification && numClasses === 2) {
            trainY = tf.tensor1d(trainTargets.map(t => t > 0.5 ? 1 : 0), 'float32')
        } else {
            trainY = tf.tensor1d(trainTargets, 'float32')
        }

        const valX = tf.tensor2d(normVal)
        let valY: any
        if (isClassification && numClasses > 2) {
            valY = tf.tidy(() => {
                const targets = tf.tensor1d(valTargets, 'int32')
                return tf.oneHot(targets, numClasses).toFloat()
            })
        } else if (isClassification && numClasses === 2) {
            valY = tf.tensor1d(valTargets.map(t => t > 0.5 ? 1 : 0), 'float32')
        } else {
            valY = tf.tensor1d(valTargets, 'float32')
        }

        let prevTrainLoss = Infinity
        let prevTrainMetric = 0

        await this.model.fit(trainX, trainY, {
            epochs: config.epochs,
            batchSize: config.batchSize,
            validationData: [valX, valY],
            shuffle: true,
            callbacks: {
                onEpochEnd: async (epoch: number, logs: any) => {
                    const trainLoss = logs?.loss ?? 0
                    const valLoss = logs?.val_loss ?? 0
                    const trainMetric = isClassification
                        ? (logs?.acc ?? logs?.accuracy ?? 0)
                        : Math.sqrt(logs?.mse ?? logs?.loss ?? 0)
                    const valMetric = isClassification
                        ? (logs?.val_acc ?? logs?.val_accuracy ?? 0)
                        : Math.sqrt(logs?.val_mse ?? logs?.val_loss ?? 0)

                    const delta = prevTrainLoss < Infinity
                        ? isClassification
                            ? `accuracy: ${((prevTrainMetric) * 100).toFixed(1)}% → ${((trainMetric) * 100).toFixed(1)}%`
                            : `error: ${prevTrainLoss.toFixed(2)} → ${trainLoss.toFixed(2)}`
                        : `started at ${isClassification ? `${((trainMetric) * 100).toFixed(1)}%` : `loss ${trainLoss.toFixed(2)}`}`

                    prevTrainLoss = trainLoss
                    prevTrainMetric = trainMetric

                    if (onEpochEnd) {
                        onEpochEnd({
                            epoch: epoch + 1,
                            trainLoss,
                            valLoss,
                            trainMetric,
                            valMetric,
                            delta
                        })
                    }

                    await new Promise(r => setTimeout(r, 0))
                }
            }
        })

        trainX.dispose()
        trainY.dispose()
        valX.dispose()
        valY.dispose()

        this.trained = true

        const finalTrainLoss = prevTrainLoss
        const finalValAccuracy = isClassification ? prevTrainMetric : Math.sqrt(prevTrainLoss)
        return { trainLoss: finalTrainLoss, valAccuracy: finalValAccuracy }
    }

    async predict(
        inputValues: number[],
        featureIndices: number[],
        config: TabularConfig
    ): Promise<TabularPrediction> {
        if (!this.model || !this.trained) {
            throw new Error('Model not trained')
        }
        const tf = await ensureTf()

        const featureVals = featureIndices.map(i => inputValues[i])
        const normalized = this.normalizeSingle(featureVals)
        const inputTensor = tf.tensor2d([normalized])

        const output = this.model.predict(inputTensor)
        inputTensor.dispose()

        if (config.taskType === 'classification') {
            const probs = await output.data() as Float32Array
            output.dispose()

            const isMultiClass = this.classLabels.length > 2
            if (isMultiClass) {
                const probRecord: Record<string, number> = {}
                let maxProb = 0
                let maxLabel = ''
                this.classLabels.forEach((label, i) => {
                    const p = probs[i] ?? 0
                    probRecord[label] = p
                    if (p > maxProb) {
                        maxProb = p
                        maxLabel = label
                    }
                })
                return { value: maxLabel, confidence: maxProb, probabilities: probRecord }
            } else {
                const p = probs[0] ?? 0
                const label0 = this.classLabels[0] ?? '0'
                const label1 = this.classLabels[1] ?? '1'
                const probRecord: Record<string, number> = {
                    [label0]: 1 - p,
                    [label1]: p
                }
                return { value: p > 0.5 ? label1 : label0, confidence: Math.max(p, 1 - p), probabilities: probRecord }
            }
        } else {
            const val = (await output.data() as Float32Array)[0]
            output.dispose()
            return { value: val }
        }
    }

    getCorrelations(
        encodedData: number[][],
        featureIndices: number[],
        targetIndex: number
    ): { featureName: string; correlation: number }[] {
        const target = encodedData.map(r => r[targetIndex])
        const targetMean = target.reduce((s, v) => s + v, 0) / target.length
        const targetStd = Math.sqrt(target.reduce((s, v) => s + (v - targetMean) ** 2, 0) / target.length) || 1

        return featureIndices.map(fi => {
            const col = encodedData.map(r => r[fi])
            const colMean = col.reduce((s, v) => s + v, 0) / col.length
            const colStd = Math.sqrt(col.reduce((s, v) => s + (v - colMean) ** 2, 0) / col.length) || 1
            const covariance = col.reduce((s, v, i) => s + (v - colMean) * (target[i] - targetMean), 0) / col.length
            const correlation = covariance / (colStd * targetStd)
            return { featureName: `Feature ${fi}`, correlation }
        })
    }

    getInputWeights(): number[] | null {
        if (!this.model || !this.trained) return null
        const firstLayer = this.model.layers[0]
        if (!firstLayer) return null
        const weights = firstLayer.getWeights()[0]
        if (!weights) return null
        const w = weights.dataSync() as Float32Array
        const numFeatures = weights.shape[0]
        const magnitudes: number[] = new Array(numFeatures).fill(0)
        for (let i = 0; i < numFeatures; i++) {
            let sum = 0
            for (let j = 0; j < weights.shape[1]; j++) {
                sum += Math.abs(w[i * weights.shape[1] + j])
            }
            magnitudes[i] = sum
        }
        const maxMag = Math.max(...magnitudes) || 1
        return magnitudes.map(m => m / maxMag)
    }

    private normalizeFeatures(features: number[][]): number[][] {
        return features.map(row =>
            row.map((val, i) => {
                const min = this.featureMin[i]
                const max = this.featureMax[i]
                if (max === min) return 0
                return (val - min) / (max - min)
            })
        )
    }

    private normalizeSingle(features: number[]): number[] {
        return features.map((val, i) => {
            const min = this.featureMin[i]
            const max = this.featureMax[i]
            if (max === min) return 0
            return (val - min) / (max - min)
        })
    }

    async exportModel(): Promise<TabularModelExport> {
        if (!this.model) throw new Error('No model to export')
        const tf = await ensureTf()
        let modelString = ''
        const saveHandler = tf.io.withSaveHandler(async (artifacts: any) => {
            modelString = JSON.stringify({
                modelTopology: artifacts.modelTopology,
                weightsSpecs: artifacts.weightSpecs,
                weightData: Array.from(new Uint8Array(artifacts.weightData))
            })
            return { modelArtifactsInfo: {} }
        })
        await this.model.save(saveHandler)

        return {
            version: 2,
            taskType: 'classification',
            featureOrder: this.columnInfos.filter(c => c.index !== undefined).map(c => c.name),
            featureMin: [...this.featureMin],
            featureMax: [...this.featureMax],
            classLabels: this.classLabels.length > 0 ? [...this.classLabels] : undefined,
            labelMaps: Object.keys(this.labelMaps).length > 0 ? { ...this.labelMaps } : undefined,
            modelArtifacts: modelString
        }
    }

    isTrained(): boolean {
        return this.trained
    }

    clear(): void {
        if (this.model) {
            this.model.dispose()
            this.model = null
        }
        this.trained = false
        this.featureMin = []
        this.featureMax = []
        this.classLabels = []
        this.labelMaps = {}
    }

    dispose(): void {
        this.clear()
    }
}
