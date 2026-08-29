export class NumbersAnalysisRuntime {
    private inputs: Record<string, number> = {}
    private lastPrediction: string = ''
    private lastConfidence: number = 0
    private trained = false
    private predictCallback: ((values: number[]) => Promise<{ value: string | number; confidence?: number }>) | null = null

    setPredictCallback(cb: (values: number[]) => Promise<{ value: string | number; confidence?: number }>) {
        this.predictCallback = cb
    }

    setValue(name: string, value: number) {
        this.inputs[name] = value
    }

    setInput(name: string, value: number) {
        this.inputs[name] = value
    }

    async analyse(): Promise<string> {
        if (!this.predictCallback) return 'no model'
        const values = Object.values(this.inputs)
        if (values.length === 0) return 'no inputs'
        try {
            const result = await this.predictCallback(values)
            this.lastPrediction = String(result.value)
            this.lastConfidence = result.confidence ?? 0
            this.trained = true
            return this.lastPrediction
        } catch {
            return 'prediction failed'
        }
    }

    getPrediction(): string {
        return this.lastPrediction
    }

    getConfidence(): number {
        return this.lastConfidence
    }

    isTrained(): boolean {
        return this.trained
    }

    getOutput(_name: string): string {
        return this.lastPrediction
    }

    clear() {
        this.inputs = {}
        this.lastPrediction = ''
        this.lastConfidence = 0
    }
}

export const numbersAnalysisRuntime = new NumbersAnalysisRuntime()
