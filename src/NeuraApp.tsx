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
                    {/* Top bar */}
                    <div className="bg-[#6b21a8] text-white px-6 py-4 flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onBack}
                                className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                            >
                                ← Back
                            </button>
                            <span className="text-2xl">🧠</span>
                            <h1 className="font-semibold text-xl">Neura ML Studio</h1>
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
