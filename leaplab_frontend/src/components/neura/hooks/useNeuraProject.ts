import { useState, useCallback, useEffect } from 'react'
import type { NeuraProject, ClassData, Sample, ProjectType, BoundingBox, Annotation, AnnotationToolType } from '../../../types/neura.types'
import { MAX_SAMPLES_PER_CLASS } from '../../../types/neura.types'

const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36)

const CLASS_COLORS = [
    '#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#06B6D4', '#8B5CF6', '#F97316', '#14B8A6',
    '#6366F1', '#84CC16', '#E11D48', '#0EA5E9', '#D946EF'
]

function getNextColor(existingColors: string[]): string {
    return CLASS_COLORS.find(c => !existingColors.includes(c)) || CLASS_COLORS[0]
}

export type ClassifierMode = 'collect' | 'annotate' | 'train' | 'test'

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
    addSample: (classId: string, sample: Omit<Sample, 'id' | 'timestamp'>) => boolean
    removeSample: (classId: string, sampleId: string) => void
    clearSamples: (classId: string) => void
    resetProject: () => void
    getSelectedClass: () => ClassData | undefined
    getTotalSamples: () => number
    loadProject: (project: NeuraProject) => void
    // Annotation state
    annotations: Annotation[]
    currentAnnotation: Annotation | null
    selectedBoxId: string | null
    activeTool: AnnotationToolType
    zoom: number
    setCurrentAnnotation: (annotation: Annotation | null) => void
    setSelectedBoxId: (id: string | null) => void
    setActiveTool: (tool: AnnotationToolType) => void
    setZoom: (zoom: number) => void
    addBox: (box: Omit<BoundingBox, 'id'>) => void
    removeBox: (boxId: string) => void
    updateBox: (boxId: string, updates: Partial<BoundingBox>) => void
    addAnnotation: (annotation: Omit<Annotation, 'id' | 'timestamp'>) => void
}

export function useNeuraProject(
    type: ProjectType,
    projectName?: string
): UseNeuraProjectReturn {
    const [project, setProject] = useState<NeuraProject>(() => {
        const defaultName = getDefaultName(type)
        const requestedName = projectName || defaultName
        const saved = localStorage.getItem(`neura-project-${type}`)
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as NeuraProject
                const savedMatchesRequest =
                    parsed.type === type &&
                    parsed.classes &&
                    (parsed.name === requestedName || parsed.name === defaultName)
                if (savedMatchesRequest) {
                    if (projectName && parsed.name === defaultName) {
                        return { ...parsed, name: projectName, updatedAt: Date.now() }
                    }
                    return parsed
                }
            } catch {
                // Invalid data, create new
            }
        }
        return {
            id: generateId(),
            type,
            name: requestedName,
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

    // Annotation state
    const [annotations, setAnnotations] = useState<Annotation[]>([])
    const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null)
    const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
    const [activeTool, setActiveTool] = useState<AnnotationToolType>('box')
    const [zoom, setZoom] = useState<number>(100)

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

    const addSample = useCallback((classId: string, sampleData: Omit<Sample, 'id' | 'timestamp'>): boolean => {
        // Check sample limit
        const currentClass = project?.classes.find(c => c.id === classId)
        if (currentClass && currentClass.samples.length >= MAX_SAMPLES_PER_CLASS) {
            return false
        }

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
        return true
    }, [project])

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

    const loadProject = useCallback((importedProject: NeuraProject) => {
        setProject(importedProject)
        setAccuracy(importedProject.accuracy ?? null)
        setMode('collect')
        setSelectedClassId(null)
        setAnnotations([])
        setCurrentAnnotation(null)
    }, [])

    // ── Annotation functions ──

    const addAnnotation = useCallback((annotationData: Omit<Annotation, 'id' | 'timestamp'>) => {
        const newAnnotation: Annotation = {
            ...annotationData,
            id: generateId(),
            timestamp: Date.now()
        }
        setAnnotations(prev => [...prev, newAnnotation])
        setCurrentAnnotation(newAnnotation)
    }, [])

    const addBox = useCallback((boxData: Omit<BoundingBox, 'id'>) => {
        const newBox: BoundingBox = {
            ...boxData,
            id: generateId()
        }
        if (currentAnnotation) {
            const updatedAnnotation = {
                ...currentAnnotation,
                boxes: [...currentAnnotation.boxes, newBox]
            }
            setCurrentAnnotation(updatedAnnotation)
            setAnnotations(prev =>
                prev.map(a => a.id === currentAnnotation.id ? updatedAnnotation : a)
            )
        }
    }, [currentAnnotation])

    const removeBox = useCallback((boxId: string) => {
        if (currentAnnotation) {
            const updatedAnnotation = {
                ...currentAnnotation,
                boxes: currentAnnotation.boxes.filter(b => b.id !== boxId)
            }
            setCurrentAnnotation(updatedAnnotation)
            setAnnotations(prev =>
                prev.map(a => a.id === currentAnnotation.id ? updatedAnnotation : a)
            )
            if (selectedBoxId === boxId) {
                setSelectedBoxId(null)
            }
        }
    }, [currentAnnotation, selectedBoxId])

    const updateBox = useCallback((boxId: string, updates: Partial<BoundingBox>) => {
        if (currentAnnotation) {
            const updatedAnnotation = {
                ...currentAnnotation,
                boxes: currentAnnotation.boxes.map(b =>
                    b.id === boxId ? { ...b, ...updates } : b
                )
            }
            setCurrentAnnotation(updatedAnnotation)
            setAnnotations(prev =>
                prev.map(a => a.id === currentAnnotation.id ? updatedAnnotation : a)
            )
        }
    }, [currentAnnotation])

    useEffect(() => {
        if (project && project.classes.length > 0 && !selectedClassId) {
            setSelectedClassId(project.classes[0].id)
        }
    }, [project, selectedClassId])

    // Save to localStorage on every project change
    useEffect(() => {
        if (project) {
            try {
                localStorage.setItem(`neura-project-${type}`, JSON.stringify(project))
            } catch (e) {
                console.warn('[Neura] Project too large to save locally. Consider downloading your project.')
            }
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
        getTotalSamples,
        loadProject,
        // Annotation state
        annotations,
        currentAnnotation,
        selectedBoxId,
        activeTool,
        zoom,
        setCurrentAnnotation,
        setSelectedBoxId,
        setActiveTool,
        setZoom,
        addBox,
        removeBox,
        updateBox,
        addAnnotation
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
