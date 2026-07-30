import type { NeuraProject } from '../types/neura.types'
import type { DetectionTrainingState } from './ObjectDetectionTrainer'

export interface ModelExportData {
    projectName: string
    projectType: string
    exportedAt: string
    version: string
    classes: { name: string; color: string; sampleCount: number }[]
    training: {
        totalRegions: number
        totalClasses: number
        classCounts: Record<string, number>
    }
    model: {
        backbone: string
        classifier: string
        inputShape: number[]
    }
}

function createBaseExport(project: NeuraProject, trainingState: DetectionTrainingState): ModelExportData {
    return {
        projectName: project.name,
        projectType: project.type,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        classes: project.classes.map(c => ({
            name: c.name,
            color: c.color,
            sampleCount: c.samples.length
        })),
        training: {
            totalRegions: trainingState.metrics.totalRegions,
            totalClasses: trainingState.metrics.totalClasses,
            classCounts: trainingState.metrics.classCounts
        },
        model: {
            backbone: 'MobileNetV2',
            classifier: 'KNN (k=3, cosine similarity)',
            inputShape: [1, 224, 224, 3]
        }
    }
}

function triggerDownload(data: string, filename: string, mimeType: string) {
    const blob = new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

export function exportJSON(project: NeuraProject, trainingState: DetectionTrainingState): void {
    const data = createBaseExport(project, trainingState)
    const json = JSON.stringify(data, null, 2)
    const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_model.json`
    triggerDownload(json, filename, 'application/json')
}

export function getExportSizeEstimate(project: NeuraProject): Record<string, string> {
    const classCount = project.classes.length
    const paramSize = classCount * 1280 * 4
    const baseSize = 50000
    const totalBytes = baseSize + paramSize
    return { 'JSON': formatSize(totalBytes) }
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
