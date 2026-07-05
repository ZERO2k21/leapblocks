/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 *
 * NeuraApp — ML module with kid-friendly classifier UI.
 */

import React, { useState, lazy, Suspense } from 'react'
import type { ProjectType } from './types/neura.types'

const NeuraHome = lazy(() => import('./components/neura/ui/NeuraHome'))
const ProjectWorkspace = lazy(() => import('./components/neura/ui/ProjectWorkspace'))
const ImageClassifierPanel = lazy(() => import('./components/neura/ui/panels/ImageClassifierPanel'))
const AudioClassifierPanel = lazy(() => import('./components/neura/ui/panels/AudioClassifierPanel'))
const PoseClassifierPanel = lazy(() => import('./components/neura/ui/panels/PoseClassifierPanel'))
const TextClassifierPanel = lazy(() => import('./components/neura/ui/panels/TextClassifierPanel'))
const NumberClassifierPanel = lazy(() => import('./components/neura/ui/panels/NumberClassifierPanel'))

interface NeuraAppProps {
    onBack?: () => void
}

type ViewState = { screen: 'home' } | { screen: 'workspace'; type: ProjectType }

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
        case 'text-classifier':
            return TextClassifierPanel
        case 'numbers-cr':
            return NumberClassifierPanel
        default:
            return ImageClassifierPanel
    }
}

export default function NeuraApp({ onBack }: NeuraAppProps) {
    const [view, setView] = useState<ViewState>({ screen: 'home' })

    const handleSelectType = (type: ProjectType) => {
        setView({ screen: 'workspace', type })
    }

    const handleBackToHome = () => {
        setView({ screen: 'home' })
    }

    const handleBack = () => {
        if (view.screen === 'workspace') {
            handleBackToHome()
        } else if (onBack) {
            onBack()
        }
    }

    return (
        <div className="h-screen bg-gray-50">
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
