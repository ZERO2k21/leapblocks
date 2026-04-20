/**
 * Copyright (c) 2026 Creoleap Technologies Pvt. Ltd.
 * All rights reserved. Proprietary and confidential.
 */

import React, { useState } from 'react';
import MyProjectsHeader from './components/neura/dashboard/MyProjectsHeader';
import EmptyStateIllustration from './components/neura/dashboard/EmptyStateIllustration';
import ProjectCard from './components/neura/dashboard/ProjectCard';
import CreateProjectModal from './components/neura/create-project/CreateProjectModal';
import ImageClassifier from './components/neura/project-types/image-classifier/ImageClassifier';
import ObjectDetection from './components/neura/project-types/object-detection/ObjectDetection';
import PoseClassifier from './components/neura/project-types/pose-classifier/PoseClassifier';
import HandPoseClassifier from './components/neura/project-types/hand-pose-classifier/HandPoseClassifier';
import AudioClassifier from './components/neura/project-types/audio-classifier/AudioClassifier';
import NumbersCR from './components/neura/project-types/numbers-cr/NumbersCR';
import TextClassifier from './components/neura/project-types/text-classifier/TextClassifier';
import { NeuraProject, ProjectType } from './types/neura.types';
import './styles/neura-theme.css';

interface NeuraAppProps {
    onBack?: () => void;
}

type NeuraView = 'dashboard' | 'create' | 'project';

export default function NeuraApp({ onBack }: NeuraAppProps) {
    const [view, setView] = useState<NeuraView>('dashboard');
    const [projects, setProjects] = useState<NeuraProject[]>([]);
    const [currentProjectType, setCurrentProjectType] = useState<ProjectType | null>(null);
    const [currentProject, setCurrentProject] = useState<NeuraProject | null>(null);

    const handleCreateNew = () => {
        setView('create');
    };

    const handleSelectType = (typeId: string) => {
        setCurrentProjectType(typeId as ProjectType);
        setView('project');
    };

    const handleBackToDashboard = () => {
        setView('dashboard');
        setCurrentProjectType(null);
        setCurrentProject(null);
    };

    const handleOpenProject = (project: NeuraProject) => {
        setCurrentProject(project);
        setCurrentProjectType(project.type);
        setView('project');
    };

    // Render project component based on type
    const renderProjectComponent = () => {
        switch (currentProjectType) {
            case 'image-classifier':
                return <ImageClassifier onBack={handleBackToDashboard} />;
            case 'object-detection':
                return <ObjectDetection onBack={handleBackToDashboard} />;
            case 'pose-classifier':
                return <PoseClassifier onBack={handleBackToDashboard} />;
            case 'hand-pose-classifier':
                return <HandPoseClassifier onBack={handleBackToDashboard} />;
            case 'audio-classifier':
                return <AudioClassifier onBack={handleBackToDashboard} />;
            case 'numbers-cr':
                return <NumbersCR onBack={handleBackToDashboard} />;
            case 'text-classifier':
                return <TextClassifier onBack={handleBackToDashboard} />;
            default:
                return null;
        }
    };

    return (
        <div className="h-screen bg-gray-50 overflow-hidden">
            {/* Dashboard view */}
            {view === 'dashboard' && (
                <div className="h-full flex flex-col">
                    {/* Top bar - Updated to match new design */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: '64px',
                        padding: '0px 18px',
                        background: 'linear-gradient(135deg, #0a015a 0%, #080a25 100%)',
                        boxShadow: 'rgba(8, 10, 37, 0.45) 0px 4px 20px, rgba(255, 255, 255, 0.06) 0px -1px 0px inset',
                        zIndex: 100,
                        borderBottom: '1px solid rgba(100, 180, 255, 0.1)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {onBack && (
                                <button
                                    onClick={onBack}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '40px',
                                        height: '40px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        transition: '0.2s',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                                >
                                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </button>
                            )}
                            <div style={{ height: '32px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                            <img src="assets/leaplab_logo_transparent.png" alt="LeapLab" style={{ height: '52px' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '10px', lineHeight: '1.1' }}>
                                <span style={{ color: '#FFD500', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em' }}>LEAPLAB</span>
                                <span style={{ color: '#fff', fontSize: '16px', fontWeight: 900, letterSpacing: '0.08em' }}>NEURA ML</span>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard content */}
                    <div className="flex-1 overflow-auto p-8">
                        <MyProjectsHeader onCreateNew={handleCreateNew} />

                        {projects.length === 0 ? (
                            <EmptyStateIllustration />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {projects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onClick={() => handleOpenProject(project)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create project modal */}
            {view === 'create' && (
                <CreateProjectModal
                    onClose={handleBackToDashboard}
                    onSelectType={handleSelectType}
                />
            )}

            {/* Project view */}
            {view === 'project' && renderProjectComponent()}
        </div>
    );
}
