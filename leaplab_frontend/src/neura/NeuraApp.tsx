/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * NeuraApp — ML module with kid-friendly classifier UI.
 */

import React, { useState, useCallback, lazy, Suspense } from 'react'
import type { ProjectType } from './types/neura.types'

const NeuraHome = lazy(() => import('./ui/NeuraHome'))
const ProjectWorkspace = lazy(() => import('./ui/ProjectWorkspace'))
const ImageClassifierPanel = lazy(() => import('./ui/panels/ImageClassifierPanel'))
const AudioClassifierPanel = lazy(() => import('./ui/panels/AudioClassifierPanel'))
const PoseClassifierPanel = lazy(() => import('./ui/panels/PoseClassifierPanel'))
const HandPoseClassifierPanel = lazy(() => import('./ui/panels/HandPoseClassifierPanel'))
const TextClassifierPanel = lazy(() => import('./ui/panels/TextClassifierPanel'))
const NumberClassifierPanel = lazy(() => import('./ui/panels/NumberClassifierPanel'))
const ObjectDetectorPanel = lazy(() => import('./ui/panels/ObjectDetectorPanel'))

interface NeuraAppProps {
    onBack?: () => void
}

type ViewState = { screen: 'home' } | { screen: 'workspace'; type: ProjectType; template?: { name: string; classes: string[] } }

function NeuraLoader() {
    return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400 font-medium">Loading Neura...</p>
            </div>
        </div>
    )
}

function getClassifierPanel(type: ProjectType) {
    switch (type) {
        case 'image-classifier':
            return ImageClassifierPanel
        case 'audio-classifier':
            return AudioClassifierPanel
        case 'pose-classifier':
            return PoseClassifierPanel
        case 'hand-pose-classifier':
            return HandPoseClassifierPanel
        case 'text-classifier':
            return TextClassifierPanel
        case 'numbers-cr':
            return NumberClassifierPanel
        case 'object-detection':
            return ObjectDetectorPanel
        default:
            return ImageClassifierPanel
    }
}

export default function NeuraApp({ onBack }: NeuraAppProps) {
    const [view, setView] = useState<ViewState>({ screen: 'home' })

    const handleSelectType = (type: ProjectType, template?: { name: string; classes: string[] }) => {
        setView({ screen: 'workspace', type, template })
    }

    const handleBackToHome = useCallback(() => {
        setView({ screen: 'home' })
    }, [])

    const handleBack = useCallback(() => {
        if (view.screen === 'workspace') {
            handleBackToHome()
        } else if (onBack) {
            onBack()
        }
    }, [view.screen, onBack, handleBackToHome])

    return (
        <div className="w-full h-screen bg-gray-50">
            <Suspense fallback={<NeuraLoader />}>
                {view.screen === 'home' && (
                    <NeuraHome
                        onSelect={handleSelectType}
                        onBack={onBack || handleBackToHome}
                    />
                )}

                {view.screen === 'workspace' && (
                    <ProjectWorkspace
                        type={view.type}
                        onBack={handleBack}
                        template={view.template}
                    >
                        {({ mode }) => {
                            const Panel = getClassifierPanel(view.type)
                            return <Panel mode={mode} />
                        }}
                    </ProjectWorkspace>
                )}
            </Suspense>
        </div>
    )
}
