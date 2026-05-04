/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

'use client';

import React from 'react';
import MLEnvironment from './mlEnvironment';

interface ImageClassifierProps {
    onBack?: () => void;
}

export default function ImageClassifier({ onBack }: ImageClassifierProps) {
    return <MLEnvironment onBack={onBack} />;
}
