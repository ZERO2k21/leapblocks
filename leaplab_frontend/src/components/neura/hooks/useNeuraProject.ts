import { useState, useCallback, useEffect } from 'react'
import type { NeuraProject, ClassData, Sample, ProjectType } from '../../../types/neura.types'

const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36)

const CLASS_COLORS = [
    '#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#06B6D4', '#8B5CF6', '#F97316', '#14B8A6',
    '#6366F1', '#84CC16', '#E11D48', '#0EA5E9', '#D946EF'
]

function getNextColor(existingColors: string[]): string {
    return CLASS_COLORS.find(c => !existingColors.includes(c)) || CLASS_COLORS[0]
}

export type ClassifierMode = 'collect' | 'train' | 'test'

export interface UseNeuraProjectReturn {
    project: NeuraProject | null
    mode: ClassifierMode
    setMode: (mode: ClassifierMode) => void
    selectedClassId: string | null
    setSelectedClassId: (id: string | null) => void
    accuracy: number | null
    setAccuracy: (acc: number | null) => void
   addClass: (name: string) => void
    removeClass: (classId: string) => void
    renameClass: (classId: string, name: string) => void
    addSample: (classId: string, sample: Omit<Sample, 'id' | 'timestamp'>) => void
    removeSample: (classId: string, sampleId: string) => void
    clearSamples: (classId: string) => void
    resetProject: () => void
    getSelectedClass: () => ClassData | undefined
    getTotalSamples: () => number
}

export function useNeuraProject(
    type: ProjectType,
    projectName?: string
): UseNeuraProjectReturn {
    const [project, setProject] = useState<NeuraProject>(() => {
        // Try to load from localStorage
        const saved = localStorage.getItem(`neura-project-${type}`)
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as NeuraProject
                if (parsed.type === type && parsed.classes) {
                    return parsed
                }
            } catch {
                // Invalid data, create new
            }
        }
        return {
            id: generateId(),
            type,
            name: projectName || getDefaultName(type),
            classes: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            modelTrained: false,
            accuracy: undefined
        }
    })

    const [mode, setMode] = useState<ClassifierMode>('collect')
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
    const [accuracy, setAccuracy] = useState<number | null>(null)

    const addClass = useCallback((name: string) => {
        setProject(prev => {
            const existingColors = prev.classes.map(c => c.color)
            const newClass: ClassData = {
                id: generateId(),
                name,
                color: getNextColor(existingColors),
                samples: []
            }
            return { ...prev, classes: [...prev.classes, newClass], updatedAt: Date.now() }
        })
    }, [])

    const removeClass = useCallback((classId: string) => {
        setProject(prev => ({
            ...prev,
            classes: prev.classes.filter(c => c.id !== classId),
            updatedAt: Date.now()
        }))
    }, [])

    const renameClass = useCallback((classId: string, name: string) => {
        setProject(prev => ({
            ...prev,
            classes: prev.classes.map(c => c.id === classId ? { ...c, name } : c),
            updatedAt: Date.now()
        }))
    }, [])

    const addSample = useCallback((classId: string, sampleData: Omit<Sample, 'id' | 'timestamp'>) => {
        const sample: Sample = {
            ...sampleData,
            id: generateId(),
            timestamp: Date.now()
        }
        setProject(prev => ({
            ...prev,
            classes: prev.classes.map(c =>
                c.id === classId ? { ...c, samples: [...c.samples, sample] } : c
            ),
            updatedAt: Date.now()
        }))
    }, [])

    const removeSample = useCallback((classId: string, sampleId: string) => {
        setProject(prev => ({
            ...prev,
            classes: prev.classes.map(c =>
                c.id === classId ? { ...c, samples: c.samples.filter(s => s.id !== sampleId) } : c
            ),
            updatedAt: Date.now()
        }))
    }, [])

    const clearSamples = useCallback((classId: string) => {
        setProject(prev => ({
            ...prev,
            classes: prev.classes.map(c =>
                c.id === classId ? { ...c, samples: [] } : c
            ),
            updatedAt: Date.now()
        }))
    }, [])

    const resetProject = useCallback(() => {
        setProject(prev => ({
            ...prev,
            classes: [],
            modelTrained: false,
            accuracy: undefined,
            updatedAt: Date.now()
        }))
        setAccuracy(null)
        setMode('collect')
    }, [])

    const getSelectedClass = useCallback(() => {
        return project?.classes.find(c => c.id === selectedClassId)
    }, [project, selectedClassId])

    const getTotalSamples = useCallback(() => {
        if (!project) return 0
        return project.classes.reduce((total, c) => total + c.samples.length, 0)
    }, [project])

    useEffect(() => {
        if (project && project.classes.length > 0 && !selectedClassId) {
            setSelectedClassId(project.classes[0].id)
        }
    }, [project, selectedClassId])

    // Save to localStorage on every project change
    useEffect(() => {
        if (project) {
            localStorage.setItem(`neura-project-${type}`, JSON.stringify(project))
        }
    }, [project, type])

    return {
        project,
        mode,
        setMode,
        selectedClassId,
        setSelectedClassId,
        accuracy,
        setAccuracy,
        addClass,
        removeClass,
        renameClass,
        addSample,
        removeSample,
        clearSamples,
        resetProject,
        getSelectedClass,
        getTotalSamples
    }
}

function getDefaultName(type: ProjectType): string {
    const names: Record<ProjectType, string> = {
        'image-classifier': 'My Image Classifier',
        'audio-classifier': 'My Audio Classifier',
        'pose-classifier': 'My Pose Classifier',
        'text-classifier': 'My Text Classifier',
        'numbers-cr': 'My Number Classifier',
        'object-detection': 'My Object Detector',
        'hand-pose-classifier': 'My Hand Pose Classifier'
    }
    return names[type] || 'My Classifier'
}
