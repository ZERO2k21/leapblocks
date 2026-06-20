/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

'use client';

import React from 'react';
import MLEnvironment from './MLEnvironment';

interface ImageClassifierProps {
    project?: any;
    onBack?: () => void;
    onDataChange?: (data: Record<string, any>) => void;
}

export default function ImageClassifier({ project, onBack, onDataChange }: ImageClassifierProps) {
    return <MLEnvironment project={project} onBack={onBack} onDataChange={onDataChange} />;
}
