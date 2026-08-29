/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

export type ProjectType =
    | 'image-classifier'
    | 'object-detection'
    | 'pose-classifier'
    | 'hand-pose-classifier'
    | 'audio-classifier'
    | 'numbers-cr'
    | 'text-classifier'
    | 'finger-counter'
    | 'virtual-piano'
    | 'drawing-canvas'
    | 'yoga-checker'
    | 'rep-counter'
    | 'dance-pose'
    | 'posture-monitor';

export interface ProjectTypeInfo {
    id: ProjectType;
    name: string;
    icon: string;
    Icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
    color: string;
    description?: string;
}

export interface ClassData {
    id: string;
    name: string;
    color: string;
    samples: Sample[];
}

export interface Sample {
    id: string;
    type: 'image' | 'audio' | 'text' | 'keypoints';
    data: string; // base64 or URL
    timestamp: number;
}

export type DataViewMode = 'guided' | 'dashboard'

export interface NeuraProject {
    id: string;
    type: ProjectType;
    name: string;
    classes: ClassData[];
    createdAt: number;
    updatedAt: number;
    modelTrained: boolean;
    accuracy?: number;
    projectData?: Record<string, any>;
    dataViewMode?: DataViewMode;
    dataModelTrained?: boolean;
    dataAccuracy?: number;
}

export interface TrainingConfig {
    epochs: number;
    batchSize: number;
    learningRate: number;
    numLayers: number;
}

export interface TestResult {
    predictedClass: string;
    confidence: number;
    timestamp: number;
}

/** Maximum samples allowed per class to prevent localStorage quota exceeded */
export const MAX_SAMPLES_PER_CLASS = 20;

// ── Annotation Types ──

export interface BoundingBox {
    id: string
    label: string
    x: number      // percentage (0-100)
    y: number
    width: number
    height: number
    color: string
}

export interface Annotation {
    id: string
    imageId?: string
    imageUrl: string
    boxes: BoundingBox[]
    timestamp: number
    imageName?: string
}

export type AnnotationToolType = 'box' | 'polygon' | 'delete'

export interface AnnotationTool {
    type: AnnotationToolType
    isActive: boolean
}

export interface AnnotateState {
    annotations: Annotation[]
    currentAnnotation: Annotation | null
    selectedBoxId: string | null
    activeTool: AnnotationToolType
    zoom: number
    isDrawing: boolean
    drawStart: { x: number; y: number } | null
}

// ── Tabular / Numbers(C/R) Data Mode Types ──

export type TabularTaskType = 'classification' | 'regression'

export interface TabularConfig {
    epochs: number
    batchSize: number
    learningRate: number
    taskType: TabularTaskType
    valSplit: number
    seed?: number
}

export interface TabularData {
    headers: string[]
    rows: (string | number)[][]
    featureIndices: number[]
    targetIndex: number
    columnTypes: ('numeric' | 'text')[]
}

export interface TabularColumnInfo {
    index: number
    name: string
    type: 'numeric' | 'text'
    uniqueValues: number
    missingCount: number
    isZeroVariance: boolean
    labelMap?: Record<string, number>
    reverseLabelMap?: Record<number, string>
}

export interface TabularTrainMetrics {
    epoch: number
    trainLoss: number
    valLoss: number
    trainMetric: number
    valMetric: number
    delta: string
}

export interface TabularModelExport {
    version: number
    taskType: TabularTaskType
    featureOrder: string[]
    featureMin: number[]
    featureMax: number[]
    classLabels?: string[]
    labelMaps?: Record<string, Record<string, number>>
    modelArtifacts: string
}
