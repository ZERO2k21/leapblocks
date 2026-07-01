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
    | 'face-detection';

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
    type: 'image' | 'audio' | 'text';
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
