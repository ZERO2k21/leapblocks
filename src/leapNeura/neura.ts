/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 * 
 * LeapNeura Module Entry Point
 * AI/ML Training Platform
 */

// Export main app component
export { default as NeuraApp } from './client/neuraApp';

// Export types
export type { NeuraProject, ProjectType } from './client/types/neura.types';

// Export hooks
export { useTFClassifier } from './client/hooks/useTFClassifier';

// Module metadata
export const NEURA_MODULE = {
    name: 'LeapNeura',
    version: '1.0.0',
    description: 'AI/ML Training Platform for visual machine learning',
    features: [
        'Image Classification',
        'Object Detection',
        'Pose Classification',
        'Hand Pose Recognition',
        'Audio Classification',
        'Text Classification',
        'Number Recognition',
    ],
} as const;
