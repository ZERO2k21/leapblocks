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
    | 'text-classifier';

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
}

export interface TrainingConfig {
    epochs: number;
    batchSize: number;
    learningRate: number;
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
